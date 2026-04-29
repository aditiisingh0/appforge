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

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(json({ limit: '10mb' }));
app.use(urlencoded({ extended: true }));
app.use(requestLogger);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/apps', appsRouter);
app.use('/api/dynamic', dynamicRouter);
app.use('/api/csv', csvRouter);
app.use('/api/notifications', notificationsRouter);

// Error handler (must be last)
app.use(errorHandler);

// Boot
async function main() {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`🚀 AppForge backend running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

main();
