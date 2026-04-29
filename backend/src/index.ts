import express from 'express';
import cors from 'cors';
import { json, urlencoded } from 'express';

import { authRouter } from './routes/auth';
import { appsRouter } from './routes/apps';
import { dynamicRouter } from './routes/dynamic';
import { csvRouter } from './routes/csv';
import { notificationsRouter } from './routes/notifications';

import { initDB } from './db/init';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

const app = express();
const PORT = process.env.PORT || 4000;

// ================= CORS FIX =================
const allowedOrigins = [
  'http://localhost:3000',
  'https://appforge-green.vercel.app',
];

app.use(cors({
  origin: (origin, callback) => {
    // allow server-to-server / postman
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.error('❌ CORS blocked:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ✅ Proper preflight handling
app.options('*', cors({
  origin: allowedOrigins,
  credentials: true,
}));

// ================= MIDDLEWARE =================
app.use(json({ limit: '10mb' }));
app.use(urlencoded({ extended: true }));
app.use(requestLogger);

// ================= HEALTH =================
app.get('/', (_req, res) => {
  res.json({ message: '🚀 AppForge backend running' });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ================= ROUTES =================
app.use('/api/auth', authRouter);
app.use('/api/apps', appsRouter);
app.use('/api/dynamic', dynamicRouter);
app.use('/api/csv', csvRouter);
app.use('/api/notifications', notificationsRouter);

// ================= ERROR HANDLER =================
app.use(errorHandler);

// ================= START SERVER =================
async function main() {
  try {
    // ✅ Try DB but don't crash server
    try {
      await initDB();
      console.log('✅ Database connected');
    } catch (err) {
      console.error('⚠️ DB connection failed, continuing...');
      console.error(err);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  }
}

main();