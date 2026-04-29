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

// ✅ Render dynamic port
const PORT = process.env.PORT || 4000;

// ================= CORS FIX =================
const allowedOrigins = [
  'http://localhost:3000',
  'https://appforge-green.vercel.app', // 👈 apna Vercel URL
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (Postman, curl, mobile apps)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('CORS not allowed'), false);
    }
  },
  credentials: true,
}));

// ✅ Preflight requests fix (VERY IMPORTANT)
app.options('*', cors());

// ================= BODY PARSER =================
app.use(json({ limit: '10mb' }));
app.use(urlencoded({ extended: true }));

// ================= LOGGER =================
app.use(requestLogger);

// ================= HEALTH CHECK =================
app.get('/', (_req, res) => {
  res.json({ message: 'AppForge backend is running 🚀' });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ================= ROUTES =================
app.use('/api/auth', authRouter);
app.use('/api/apps', appsRouter);
app.use('/api/dynamic', dynamicRouter);
app.use('/api/csv', csvRouter);
app.use('/api/notifications', notificationsRouter);

// ================= ERROR HANDLER =================
app.use(errorHandler);

// ================= SERVER START =================
async function main() {
  try {
    // ✅ DB init (fail hone par bhi server chalega)
    try {
      await initDB();
      console.log('✅ Database initialized');
    } catch (err) {
      console.error('⚠️ DB connection failed, but continuing...');
      console.error(err);
    }

    app.listen(PORT, () => {
      console.log(`🚀 AppForge backend running on port ${PORT}`);
    });

  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

main();