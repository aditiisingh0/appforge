import express from 'express';
import cors from 'cors';
import { json, urlencoded } from 'express';

import { authRouter } from './routes/auth';
import { appsRouter } from './routes/apps';
import { dynamicRouter } from './routes/dynamic';
import { csvRouter } from './routes/csv';
import { notificationsRouter } from './routes/notifications';
import { emailRouter } from './routes/email'; // ✅ NEW

import { initDB } from './db/init';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://appforge-green.vercel.app"
  ],
  credentials: true,
}));

app.use(json({ limit: '10mb' }));
app.use(urlencoded({ extended: true }));
app.use(requestLogger);

app.get('/', (_req, res) => {
  res.json({ message: '🚀 AppForge backend running' });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/apps', appsRouter);
app.use('/api/dynamic', dynamicRouter);
app.use('/api/csv', csvRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/email', emailRouter); // ✅ NEW

app.use(errorHandler);

async function main() {
  try {
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