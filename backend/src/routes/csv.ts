import { Router, Request, Response } from 'express';
import multer from 'multer';
import Papa from 'papaparse';
import { pool } from '../db/init';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { sanitizeConfig } from '../types/config';

export const csvRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// POST /api/csv/:appId/:collection/preview
// Returns parsed headers + sample rows without saving
csvRouter.post('/:appId/:collection/preview', requireAuth, upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) throw new AppError(400, 'No file uploaded');

  const csvText = req.file.buffer.toString('utf-8');
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    preview: 5,
  });

  if (parsed.errors.length > 0) {
    throw new AppError(400, 'CSV parse error', parsed.errors.slice(0, 5));
  }

  // Get collection fields for mapping suggestions
  const appResult = await pool.query(
    'SELECT config FROM apps WHERE id = $1 AND user_id = $2',
    [req.params.appId, req.user!.userId]
  );
  if (!appResult.rows[0]) throw new AppError(404, 'App not found');
  const config = sanitizeConfig(appResult.rows[0].config);
  const collection = config.collections.find(c => c.name === req.params.collection);

  // Auto-suggest field mappings
  const csvHeaders = parsed.meta.fields || [];
  const suggestions: Record<string, string | null> = {};
  for (const header of csvHeaders) {
    const normalized = header.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const match = collection?.fields.find(
      f => f.name.toLowerCase() === normalized || (f.label || '').toLowerCase() === header.toLowerCase()
    );
    suggestions[header] = match?.name || null;
  }

  res.json({
    headers: csvHeaders,
    sampleRows: parsed.data.slice(0, 5),
    totalRows: parsed.data.length,
    fieldSuggestions: suggestions,
    collectionFields: collection?.fields.map(f => ({ name: f.name, label: f.label, type: f.type })) || [],
  });
});

// POST /api/csv/:appId/:collection/import
// Actual import with field mapping
csvRouter.post('/:appId/:collection/import', requireAuth, upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) throw new AppError(400, 'No file uploaded');

  const { mapping } = req.body; // { csvHeader: collectionField }
  let fieldMapping: Record<string, string> = {};
  try {
    fieldMapping = typeof mapping === 'string' ? JSON.parse(mapping) : mapping;
  } catch {
    throw new AppError(400, 'Invalid field mapping JSON');
  }

  const appResult = await pool.query(
    'SELECT id, config FROM apps WHERE id = $1 AND user_id = $2',
    [req.params.appId, req.user!.userId]
  );
  if (!appResult.rows[0]) throw new AppError(404, 'App not found');
  const config = sanitizeConfig(appResult.rows[0].config);
  const collection = config.collections.find(c => c.name === req.params.collection);
  if (!collection) throw new AppError(404, `Collection '${req.params.collection}' not found`);

  const csvText = req.file.buffer.toString('utf-8');
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  // Create import log entry
  const importResult = await pool.query(
    `INSERT INTO csv_imports (app_id, user_id, collection, filename, row_count, status)
     VALUES ($1, $2, $3, $4, $5, 'processing')
     RETURNING id`,
    [req.params.appId, req.user!.userId, req.params.collection, req.file.originalname, parsed.data.length]
  );
  const importId = importResult.rows[0].id;

  const errors: Array<{ row: number; error: string }> = [];
  let successCount = 0;

  // Batch insert
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (let i = 0; i < parsed.data.length; i++) {
      const row = parsed.data[i];
      const record: Record<string, unknown> = {};

      // Map CSV headers to collection fields
      for (const [csvHeader, fieldName] of Object.entries(fieldMapping)) {
        if (fieldName && row[csvHeader] !== undefined) {
          const fieldDef = collection.fields.find(f => f.name === fieldName);
          if (fieldDef) {
            const rawVal = row[csvHeader];
            switch (fieldDef.type) {
              case 'number':
                record[fieldName] = rawVal !== '' ? Number(rawVal) : null;
                break;
              case 'boolean':
                record[fieldName] = rawVal === 'true' || rawVal === '1' || rawVal === 'yes';
                break;
              default:
                record[fieldName] = rawVal || null;
            }
          }
        }
      }

      // Check required fields
      const missingRequired = collection.fields.filter(
        f => f.required && (record[f.name] === undefined || record[f.name] === null || record[f.name] === '')
      );
      if (missingRequired.length > 0) {
        errors.push({ row: i + 2, error: `Missing required: ${missingRequired.map(f => f.label || f.name).join(', ')}` });
        continue;
      }

      try {
        await client.query(
          'INSERT INTO app_data (app_id, collection, data, created_by) VALUES ($1, $2, $3, $4)',
          [req.params.appId, req.params.collection, JSON.stringify(record), req.user!.userId]
        );
        successCount++;
      } catch (err) {
        errors.push({ row: i + 2, error: String(err) });
      }
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    await pool.query('UPDATE csv_imports SET status = $1, error_log = $2 WHERE id = $3', ['failed', JSON.stringify([{ error: String(err) }]), importId]);
    throw new AppError(500, 'Import failed', err);
  } finally {
    client.release();
  }

  // Update import log
  await pool.query(
    'UPDATE csv_imports SET status = $1, row_count = $2, error_log = $3 WHERE id = $4',
    [errors.length === parsed.data.length ? 'failed' : 'completed', successCount, JSON.stringify(errors), importId]
  );

  res.json({
    importId,
    total: parsed.data.length,
    succeeded: successCount,
    failed: errors.length,
    errors: errors.slice(0, 20),
  });
});

// GET /api/csv/:appId/imports - list import history
csvRouter.get('/:appId/imports', requireAuth, async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT id, collection, filename, row_count, status, created_at
     FROM csv_imports WHERE app_id = $1 AND user_id = $2
     ORDER BY created_at DESC LIMIT 50`,
    [req.params.appId, req.user!.userId]
  );
  res.json(result.rows);
});
