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

// ✅ IMPORTANT: Render dynamic port
const PORT = process.env.PORT || 4000;

// ================= MIDDLEWARE =================
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));

app.use(json({ limit: '10mb' }));
app.use(urlencoded({ extended: true }));
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
    // ✅ DB try karo, fail ho toh bhi server chale
    try {
      await initDB();
      console.log('✅ Database initialized');
    } catch (err) {
      console.error('⚠️ DB connection failed, but continuing...');
      console.error(err);
    }

    // ✅ ALWAYS start server
    app.listen(PORT, () => {
      console.log(`🚀 AppForge backend running on port ${PORT}`);
    });

  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

main();