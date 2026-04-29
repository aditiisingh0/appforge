import { Router, Request, Response } from 'express';
import { pool } from '../db/init';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const notificationsRouter = Router();

// GET /api/notifications - list user notifications
notificationsRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  const { appId, unreadOnly } = req.query;
  let query = `SELECT id, app_id, title, message, type, is_read, metadata, created_at
               FROM notifications WHERE user_id = $1`;
  const params: unknown[] = [req.user!.userId];
  let idx = 2;

  if (appId) {
    query += ` AND app_id = $${idx++}`;
    params.push(appId);
  }
  if (unreadOnly === 'true') {
    query += ` AND is_read = false`;
  }
  query += ` ORDER BY created_at DESC LIMIT 100`;

  const result = await pool.query(query, params);
  res.json(result.rows);
});

// POST /api/notifications - create notification (system/internal use)
notificationsRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  const { userId, appId, title, message, type = 'info', metadata } = req.body;
  if (!title) throw new AppError(400, 'Title is required');

  const result = await pool.query(
    `INSERT INTO notifications (user_id, app_id, title, message, type, metadata)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [userId || req.user!.userId, appId || null, title, message || null, type, metadata ? JSON.stringify(metadata) : null]
  );
  res.status(201).json(result.rows[0]);
});

// PATCH /api/notifications/:id/read - mark as read
notificationsRouter.patch('/:id/read', requireAuth, async (req: Request, res: Response) => {
  const result = await pool.query(
    'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING id',
    [req.params.id, req.user!.userId]
  );
  if (!result.rows[0]) throw new AppError(404, 'Notification not found');
  res.json({ success: true });
});

// POST /api/notifications/read-all
notificationsRouter.post('/read-all', requireAuth, async (req: Request, res: Response) => {
  await pool.query(
    'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
    [req.user!.userId]
  );
  res.json({ success: true });
});

// GET /api/notifications/unread-count
notificationsRouter.get('/unread-count', requireAuth, async (req: Request, res: Response) => {
  const result = await pool.query(
    'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
    [req.user!.userId]
  );
  res.json({ count: parseInt(result.rows[0].count) });
});
