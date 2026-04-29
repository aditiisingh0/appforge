import { Router, Request, Response } from 'express';
import { pool } from '../db/init';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { sanitizeConfig, CollectionConfig } from '../types/config';

export const dynamicRouter = Router();

// Helper: get app + verify access
async function getApp(appId: string, userId?: string) {
  const result = await pool.query(
    'SELECT * FROM apps WHERE id = $1',
    [appId]
  );
  const app = result.rows[0];
  if (!app) throw new AppError(404, 'App not found');

  const config = sanitizeConfig(app.config);

  // Check ownership for write, allow read if published
  if (userId && app.user_id === userId) return { app, config, isOwner: true };
  if (app.is_published) return { app, config, isOwner: false };
  throw new AppError(403, 'Access denied');
}

// Helper: get collection config
function getCollection(config: ReturnType<typeof sanitizeConfig>, name: string): CollectionConfig {
  const col = config.collections.find(c => c.name === name);
  if (!col) throw new AppError(404, `Collection '${name}' not found in app config`);
  return col;
}

// Helper: sanitize record data against collection fields
function sanitizeRecord(data: Record<string, unknown>, collection: CollectionConfig): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const field of collection.fields) {
    if (field.name in data) {
      const val = data[field.name];
      // Type coercion
      switch (field.type) {
        case 'number':
          result[field.name] = val !== '' && val !== null ? Number(val) : null;
          break;
        case 'boolean':
          result[field.name] = val === true || val === 'true' || val === 1;
          break;
        default:
          result[field.name] = val === '' ? null : val;
      }
    } else if (field.default !== undefined) {
      result[field.name] = field.default;
    }
  }
  return result;
}

// Helper: validate required fields
function validateRequired(data: Record<string, unknown>, collection: CollectionConfig): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of collection.fields) {
    if (field.required && (data[field.name] === undefined || data[field.name] === null || data[field.name] === '')) {
      errors[field.name] = `${field.label || field.name} is required`;
    }
  }
  return errors;
}

// GET /api/dynamic/:appId/:collection - list records
dynamicRouter.get('/:appId/:collection', optionalAuth, async (req: Request, res: Response) => {
  const { appId, collection } = req.params;
  const { page = '1', pageSize = '20', sortBy, sortDir = 'desc', ...filters } = req.query;

  const { config, isOwner } = await getApp(appId, req.user?.userId);
  const col = getCollection(config, collection);

  // Permissions check
  const readPerm = col.permissions?.read || 'authenticated';
  if (readPerm === 'authenticated' && !req.user) {
    throw new AppError(401, 'Authentication required');
  }

  const pageNum = Math.max(1, parseInt(String(page)));
  const size = Math.min(100, Math.max(1, parseInt(String(pageSize))));
  const offset = (pageNum - 1) * size;

  let whereClause = 'app_id = $1 AND collection = $2';
  const params: unknown[] = [appId, collection];
  let paramIdx = 3;

  // Owner-only data
  if (readPerm === 'owner' && req.user && !isOwner) {
    whereClause += ` AND created_by = $${paramIdx++}`;
    params.push(req.user.userId);
  }

  // Apply filters
  const validFields = col.fields.map(f => f.name);
  for (const [key, val] of Object.entries(filters)) {
    if (validFields.includes(key) && val !== undefined) {
      whereClause += ` AND data->>'${key}' = $${paramIdx++}`;
      params.push(String(val));
    }
  }

  const orderField = sortBy && validFields.includes(String(sortBy))
    ? `data->>'${sortBy}'`
    : 'created_at';
  const orderDir = sortDir === 'asc' ? 'ASC' : 'DESC';

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM app_data WHERE ${whereClause}`,
    params
  );

  const dataResult = await pool.query(
    `SELECT id, data, created_by, created_at, updated_at
     FROM app_data WHERE ${whereClause}
     ORDER BY ${orderField} ${orderDir}
     LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
    [...params, size, offset]
  );

  res.json({
    data: dataResult.rows.map(r => ({ id: r.id, ...r.data, _meta: { createdAt: r.created_at, updatedAt: r.updated_at, createdBy: r.created_by } })),
    pagination: {
      page: pageNum,
      pageSize: size,
      total: parseInt(countResult.rows[0].count),
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / size),
    },
  });
});

// GET /api/dynamic/:appId/:collection/:id - get single record
dynamicRouter.get('/:appId/:collection/:id', optionalAuth, async (req: Request, res: Response) => {
  const { appId, collection, id } = req.params;
  await getApp(appId, req.user?.userId);

  const result = await pool.query(
    'SELECT id, data, created_by, created_at, updated_at FROM app_data WHERE id = $1 AND app_id = $2 AND collection = $3',
    [id, appId, collection]
  );
  if (!result.rows[0]) throw new AppError(404, 'Record not found');
  const r = result.rows[0];
  res.json({ id: r.id, ...r.data, _meta: { createdAt: r.created_at, updatedAt: r.updated_at, createdBy: r.created_by } });
});

// POST /api/dynamic/:appId/:collection - create record
dynamicRouter.post('/:appId/:collection', requireAuth, async (req: Request, res: Response) => {
  const { appId, collection } = req.params;
  const { config } = await getApp(appId, req.user!.userId);
  const col = getCollection(config, collection);

  const sanitized = sanitizeRecord(req.body, col);
  const errors = validateRequired(sanitized, col);
  if (Object.keys(errors).length > 0) {
    throw new AppError(422, 'Validation failed', errors);
  }

  const result = await pool.query(
    `INSERT INTO app_data (app_id, collection, data, created_by)
     VALUES ($1, $2, $3, $4)
     RETURNING id, data, created_at`,
    [appId, collection, JSON.stringify(sanitized), req.user!.userId]
  );

  const r = result.rows[0];
  res.status(201).json({ id: r.id, ...r.data, _meta: { createdAt: r.created_at } });
});

// PUT /api/dynamic/:appId/:collection/:id - update record
dynamicRouter.put('/:appId/:collection/:id', requireAuth, async (req: Request, res: Response) => {
  const { appId, collection, id } = req.params;
  const { config, isOwner } = await getApp(appId, req.user!.userId);
  const col = getCollection(config, collection);

  // Check record ownership
  const existing = await pool.query(
    'SELECT id, created_by FROM app_data WHERE id = $1 AND app_id = $2 AND collection = $3',
    [id, appId, collection]
  );
  if (!existing.rows[0]) throw new AppError(404, 'Record not found');
  if (!isOwner && existing.rows[0].created_by !== req.user!.userId) {
    throw new AppError(403, 'Cannot edit this record');
  }

  const sanitized = sanitizeRecord(req.body, col);
  const result = await pool.query(
    `UPDATE app_data SET data = $1, updated_at = NOW()
     WHERE id = $2 RETURNING id, data, updated_at`,
    [JSON.stringify(sanitized), id]
  );
  const r = result.rows[0];
  res.json({ id: r.id, ...r.data, _meta: { updatedAt: r.updated_at } });
});

// PATCH /api/dynamic/:appId/:collection/:id - partial update
dynamicRouter.patch('/:appId/:collection/:id', requireAuth, async (req: Request, res: Response) => {
  const { appId, collection, id } = req.params;
  const { isOwner } = await getApp(appId, req.user!.userId);

  const existing = await pool.query(
    'SELECT id, data, created_by FROM app_data WHERE id = $1 AND app_id = $2 AND collection = $3',
    [id, appId, collection]
  );
  if (!existing.rows[0]) throw new AppError(404, 'Record not found');
  if (!isOwner && existing.rows[0].created_by !== req.user!.userId) {
    throw new AppError(403, 'Cannot edit this record');
  }

  const merged = { ...existing.rows[0].data, ...req.body };
  const result = await pool.query(
    `UPDATE app_data SET data = $1, updated_at = NOW()
     WHERE id = $2 RETURNING id, data, updated_at`,
    [JSON.stringify(merged), id]
  );
  const r = result.rows[0];
  res.json({ id: r.id, ...r.data, _meta: { updatedAt: r.updated_at } });
});

// DELETE /api/dynamic/:appId/:collection/:id
dynamicRouter.delete('/:appId/:collection/:id', requireAuth, async (req: Request, res: Response) => {
  const { appId, collection, id } = req.params;
  const { isOwner } = await getApp(appId, req.user!.userId);

  const existing = await pool.query(
    'SELECT id, created_by FROM app_data WHERE id = $1 AND app_id = $2 AND collection = $3',
    [id, appId, collection]
  );
  if (!existing.rows[0]) throw new AppError(404, 'Record not found');
  if (!isOwner && existing.rows[0].created_by !== req.user!.userId) {
    throw new AppError(403, 'Cannot delete this record');
  }

  await pool.query('DELETE FROM app_data WHERE id = $1', [id]);
  res.json({ deleted: true });
});
