import { Router, Request, Response } from 'express';
import { pool } from '../db/init';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { sanitizeConfig } from '../types/config';
import { v4 as uuidv4 } from 'uuid';

export const appsRouter = Router();

// GET /api/apps - list user's apps
appsRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT id, name, slug, is_published, created_at, updated_at,
            config->>'description' as description
     FROM apps WHERE user_id = $1 ORDER BY updated_at DESC`,
    [req.user!.userId]
  );
  res.json(result.rows);
});

// POST /api/apps - create app from config
appsRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  const rawConfig = req.body;
  const config = sanitizeConfig(rawConfig);

  // Ensure unique slug
  let slug = config.slug!;
  const existing = await pool.query('SELECT id FROM apps WHERE slug = $1', [slug]);
  if (existing.rows.length > 0) {
    slug = `${slug}-${uuidv4().slice(0, 6)}`;
    config.slug = slug;
  }

  const result = await pool.query(
    `INSERT INTO apps (user_id, name, slug, config)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, slug, is_published, created_at, config`,
    [req.user!.userId, config.name, slug, JSON.stringify(config)]
  );

  res.status(201).json(result.rows[0]);
});

// GET /api/apps/:id - get single app
appsRouter.get('/:id', requireAuth, async (req: Request, res: Response) => {
  const result = await pool.query(
    'SELECT * FROM apps WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user!.userId]
  );
  if (!result.rows[0]) throw new AppError(404, 'App not found');
  res.json(result.rows[0]);
});

// GET /api/apps/slug/:slug - get by slug (public if published)
appsRouter.get('/slug/:slug', async (req: Request, res: Response) => {
  const result = await pool.query(
    'SELECT id, name, slug, config, is_published FROM apps WHERE slug = $1',
    [req.params.slug]
  );
  if (!result.rows[0]) throw new AppError(404, 'App not found');
  const app = result.rows[0];
  if (!app.is_published) {
    throw new AppError(403, 'App is not published');
  }
  res.json(app);
});

// PUT /api/apps/:id - update app config
appsRouter.put('/:id', requireAuth, async (req: Request, res: Response) => {
  const existing = await pool.query(
    'SELECT id FROM apps WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user!.userId]
  );
  if (!existing.rows[0]) throw new AppError(404, 'App not found');

  const config = sanitizeConfig(req.body);
  const result = await pool.query(
    `UPDATE apps SET name = $1, config = $2, updated_at = NOW()
     WHERE id = $3 AND user_id = $4
     RETURNING id, name, slug, is_published, updated_at, config`,
    [config.name, JSON.stringify(config), req.params.id, req.user!.userId]
  );
  res.json(result.rows[0]);
});

// PATCH /api/apps/:id/publish - toggle publish
appsRouter.patch('/:id/publish', requireAuth, async (req: Request, res: Response) => {
  const { published } = req.body;
  const result = await pool.query(
    `UPDATE apps SET is_published = $1, updated_at = NOW()
     WHERE id = $2 AND user_id = $3
     RETURNING id, name, slug, is_published`,
    [!!published, req.params.id, req.user!.userId]
  );
  if (!result.rows[0]) throw new AppError(404, 'App not found');
  res.json(result.rows[0]);
});

// DELETE /api/apps/:id
appsRouter.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const result = await pool.query(
    'DELETE FROM apps WHERE id = $1 AND user_id = $2 RETURNING id',
    [req.params.id, req.user!.userId]
  );
  if (!result.rows[0]) throw new AppError(404, 'App not found');
  res.json({ deleted: true });
});
