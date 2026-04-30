import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { pool } from '../db/init';

export const emailRouter = Router();

// POST /api/email/send
// Sends a real transactional email via Resend (free tier - 3000/month)
emailRouter.post('/send', requireAuth, async (req: Request, res: Response) => {
  const { to, appId, subject, body } = req.body;

  if (!to || !to.includes('@')) throw new AppError(400, 'Valid recipient email is required');

  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  // If no API key configured, fall back to mock but still store notification
  if (!RESEND_API_KEY) {
    // Store notification in DB
    await pool.query(
      `INSERT INTO notifications (user_id, app_id, title, message, type)
       VALUES ($1, $2, $3, $4, 'info')`,
      [
        req.user!.userId,
        appId || null,
        `Email sent to ${to}`,
        subject || 'Notification sent',
      ]
    );
    return res.json({ success: true, mode: 'mock', message: 'No RESEND_API_KEY set — stored as notification only' });
  }

  // Call Resend API
  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'AppForge <notifications@resend.dev>',
      to: [to],
      subject: subject || 'Notification from AppForge',
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#4F46E5;">AppForge Notification</h2>
        <p>${body || 'Your app has been updated successfully.'}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
        <p style="color:#999;font-size:12px;">Sent via AppForge</p>
      </div>`,
    }),
  });

  if (!resendRes.ok) {
    const errBody = await resendRes.json().catch(() => ({}));
    console.error('Resend error:', errBody);
    throw new AppError(502, 'Email delivery failed', errBody);
  }

  const result = await resendRes.json();

  // Store in notifications table so it shows in the bell
  await pool.query(
    `INSERT INTO notifications (user_id, app_id, title, message, type)
     VALUES ($1, $2, $3, $4, 'success')`,
    [
      req.user!.userId,
      appId || null,
      `Email sent to ${to}`,
      subject || 'Notification sent',
    ]
  );

  res.json({ success: true, mode: 'real', emailId: result.id });
});