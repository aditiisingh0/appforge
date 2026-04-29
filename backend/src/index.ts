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

// ✅ VERY IMPORTANT (FULL FIX)
const allowedOrigins = [
  "http://localhost:3000",
  "https://appforge-green.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow postman/mobile

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("CORS not allowed"), false);
    }
  },
  credentials: true,
}));

// ✅ HANDLE PREFLIGHT REQUESTS
app.options('*', cors());

// ================= MIDDLEWARE =================
app.use(json({ limit: '10mb' }));
app.use(urlencoded({ extended: true }));
app.use(requestLogger);

// ================= HEALTH =================
app.get('/', (_req, res) => {
  res.json({ message: 'Backend running 🚀' });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ================= ROUTES =================
app.use('/api/auth', authRouter);
app.use('/api/apps', appsRouter);
app.use('/api/dynamic', dynamicRouter);
app.use('/api/csv', csvRouter);
app.use('/api/notifications', notificationsRouter);

// ================= ERROR =================
app.use(errorHandler);

// ================= START =================
async function main() {
  try {
    try {
      await initDB();
      console.log("✅ DB connected");
    } catch (e) {
      console.log("⚠️ DB failed but continuing");
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on ${PORT}`);
    });

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();