import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db/init';
import { requireAuth, signToken } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const authRouter = Router();

// ================= REGISTER =================
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, locale } = req.body;

    if (!email || !password) {
      throw new AppError(400, 'Email and password are required');
    }

    if (password.length < 6) {
      throw new AppError(400, 'Password must be at least 6 characters');
    }

    const hash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, locale)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, locale`,
      [email.toLowerCase().trim(), hash, name || null, locale || 'en']
    );

    const user = result.rows[0];
    const token = signToken({ userId: user.id, email: user.email });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        locale: user.locale,
      },
    });

  } catch (err: any) {
    console.error('REGISTER ERROR:', err.message);
    res.status(500).json({ error: 'Register failed (DB issue)' });
  }
});


// ================= LOGIN =================
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    console.log("LOGIN HIT");

    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError(400, 'Email and password are required');
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (!result.rows[0]) {
      throw new AppError(401, 'Invalid credentials');
    }

    const user = result.rows[0];

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new AppError(401, 'Invalid credentials');
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        locale: user.locale,
      },
    });

  } catch (err: any) {
    console.error('LOGIN ERROR:', err.message);
    res.status(500).json({ error: 'Login failed (DB issue)' });
  }
});


// ================= ME =================
authRouter.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, locale FROM users WHERE id = $1',
      [req.user!.userId]
    );

    if (!result.rows[0]) {
      throw new AppError(404, 'User not found');
    }

    res.json(result.rows[0]);

  } catch (err: any) {
    console.error('ME ERROR:', err.message);
    res.status(500).json({ error: 'Fetch user failed' });
  }
});


// ================= UPDATE =================
authRouter.patch('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, locale } = req.body;

    const result = await pool.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           locale = COALESCE($2, locale),
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, email, name, locale`,
      [name, locale, req.user!.userId]
    );

    res.json(result.rows[0]);

  } catch (err: any) {
    console.error('UPDATE ERROR:', err.message);
    res.status(500).json({ error: 'Update failed' });
  }
});