import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
import healthRouter from './routes/health';
import { errorHandler, notFound } from './middleware/errorHandler';

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: config.clientOrigin, credentials: true }));
// Trust Render's reverse proxy so req.secure works correctly
app.set('trust proxy', 1);

// ── Rate limiting ─────────────────────────────────────────────────────────────
const authLimiter    = rateLimit({ windowMs: 15*60*1000, max: 20, message: { success: false, message: 'Too many requests.' } });
const generalLimiter = rateLimit({ windowMs: 15*60*1000, max: 200 });
app.use('/api/', generalLimiter);
app.use('/api/v1/auth/', authLimiter);

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ── Session ───────────────────────────────────────────────────────────────────
const isProd = config.nodeEnv === 'production';
app.use(session({
  secret:            config.sessionSecret,
  resave:            false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure:   isProd,           // HTTPS only in production
    sameSite: isProd ? 'none' : 'lax', // 'none' required for cross-domain (Netlify → Render)
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
  },
}));

// ── Always-available routes ───────────────────────────────────────────────────
app.use('/api/v1', healthRouter);

// ── DB-dependent routes (loaded dynamically when DATABASE_URL is present) ─────
async function loadDbRoutes() {
  if (!config.databaseUrl) {
    console.log('⚠️  DATABASE_URL not set — auth/video/profile/reports routes disabled.');
    const stub = (_req: express.Request, res: express.Response) =>
      res.status(503).json({ success: false, message: 'Database not configured. Add DATABASE_URL to .env and restart.' });
    app.use('/api/v1/auth',       stub);
    app.use('/api/v1/profile',    stub);
    app.use('/api/v1/videos',     stub);
    app.use('/api/v1/categories', stub);
    app.use('/api/v1/reports',    stub);
    return;
  }

  try {
    const [authR, profileR, videosR, categoriesR, reportsR, uploadR, analyticsR] = await Promise.all([
      import('./routes/auth').then(m => m.default),
      import('./routes/profile').then(m => m.default),
      import('./routes/videos').then(m => m.default),
      import('./routes/categories').then(m => m.default),
      import('./routes/reports').then(m => m.default),
      import('./routes/upload').then(m => m.default),
      import('./routes/analytics').then(m => m.default),
    ]);
    app.use('/api/v1/auth',       authR);
    app.use('/api/v1/profile',    profileR);
    app.use('/api/v1/videos',     videosR);
    app.use('/api/v1/categories', categoriesR);
    app.use('/api/v1/reports',    reportsR);
    app.use('/api/v1/upload',     uploadR);
    app.use('/api/v1/analytics',  analyticsR);
    console.log('✅  All DB routes loaded.');
  } catch (err) {
    console.error('❌  Failed to load DB routes — check DATABASE_URL and run: npx prisma generate');
    const stub = (_req: express.Request, res: express.Response) =>
      res.status(503).json({ success: false, message: 'Database error. Run: npx prisma generate && npx prisma db push' });
    app.use('/api/v1/auth',       stub);
    app.use('/api/v1/profile',    stub);
    app.use('/api/v1/videos',     stub);
    app.use('/api/v1/categories', stub);
    app.use('/api/v1/reports',    stub);
  }
}

loadDbRoutes().then(() => {
  app.use(notFound);
  app.use(errorHandler);

  app.listen(config.port, () => {
    console.log(`🎬  ReelFolio API  →  http://localhost:${config.port}`);
    console.log(`    Environment   :  ${config.nodeEnv}`);
    if (!config.databaseUrl) {
      console.log(`\n    👉  Next step: add DATABASE_URL to your .env file`);
      console.log(`    👉  Then run: npx prisma generate && npx prisma db push && npm run seed`);
    }
  });
});

export default app;
