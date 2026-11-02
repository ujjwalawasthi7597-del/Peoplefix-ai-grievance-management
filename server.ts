import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { initializeDatabase } from './server/db/store.ts';
import { startEscalationWorker } from './server/services/escalation.ts';

// Routes
import authRoutes from './server/routes/auth.ts';
import complaintsRoutes from './server/routes/complaints.ts';
import officerRoutes from './server/routes/officer.ts';
import adminRoutes from './server/routes/admin.ts';
import aiRoutes from './server/routes/ai.ts';
import mapRoutes from './server/routes/map.ts';
import notificationsRoutes from './server/routes/notifications.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Middlewares
  app.use(cors({ origin: true, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Security headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Initialize Database (MongoDB Atlas if URI present, otherwise robust local store)
  await initializeDatabase();

  // Start Background Escalation Service
  startEscalationWorker(60000);

  // Mount API Endpoints
  app.use('/api/auth', authRoutes);
  app.use('/api/complaints', complaintsRoutes);
  app.use('/api/officer', officerRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/map', mapRoutes);
  app.use('/api/notifications', notificationsRoutes);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      app: 'PeopleFix',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Vite integration
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 PeopleFix Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting PeopleFix server:', err);
  process.exit(1);
});
