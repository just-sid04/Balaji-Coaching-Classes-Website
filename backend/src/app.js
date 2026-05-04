const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const studentRoutes = require('./routes/student');
const ocrRoutes = require('./routes/ocr');
const uploadRoutes = require('./routes/upload');
const publicRoutes = require('./routes/public');

const app = express();

// ─── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet());

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin (Vercel monorepo) or listed origins
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// ─── Rate Limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
});

app.use(limiter);

// ─── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Logging ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ─── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api', publicRoutes);

// ─── DB Test Endpoint ──────────────────────────────────────────────────────────
app.get('/api/dbtest', async (req, res) => {
  try {
    const prisma = require('./lib/prisma');
    const count = await prisma.user.count();
    res.json({ success: true, userCount: count, dbUrl: process.env.DATABASE_URL?.slice(0, 40) + '...' });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      code: err.code,
      type: err.constructor?.name,
    });
  }
});

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  let dbStatus = 'unknown';
  try {
    const prisma = require('./lib/prisma');
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = 'disconnected';
    console.error('Health check DB error:', err.message);
  }

  res.json({
    status: dbStatus === 'connected' ? 'ok' : 'error',
    database: dbStatus,
    service: 'Balaji Test Portal API',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
