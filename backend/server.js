const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');
const txnRoutes = require('./src/routes/transactions');
const receiptRoutes = require('./src/routes/receipts');
const connectDB = require('./src/utils/db');

const app = express();

// If behind a proxy (Render/Heroku/NGINX) for correct IPs in logs/limits
app.set('trust proxy', 1);

// --- Security & core middleware ---
app.use(
  helmet({
    // set to `false` only if you serve static files from another origin
    crossOriginResourcePolicy: { policy: 'same-site' },
  })
);
app.use(morgan('dev'));
app.use(compression());
app.use(express.json({ limit: '2mb' }));

// --- Robust CORS allowlist ---
// Accept CORS_ORIGIN or FRONTEND_URL; allow '*' to mean "all".
const raw = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173';
const ALLOWED = raw
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// Delegate that safely handles: no Origin (curl/healthchecks), exact matches, and '*'
const corsOptionsDelegate = function (req, callback) {
  const origin = req.header('Origin');
  let corsOptions;

  if (!origin) {
    // same-origin or tools like curl/uptime checks
    corsOptions = { origin: true, credentials: true };
  } else if (ALLOWED.includes('*')) {
    corsOptions = { origin: true, credentials: true };
  } else {
    corsOptions = { origin: ALLOWED.includes(origin), credentials: true };
  }

  callback(null, corsOptions);
};
app.use(cors(corsOptionsDelegate));

// Basic rate limit (tune for prod)
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// --- Health check ---
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/transactions', txnRoutes);
app.use('/api/receipts', receiptRoutes);

// (optional) serve uploaded files later
// app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 5000;

// --- Start server after DB ---
connectDB(process.env.MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(
        `🚀 API running on http://localhost:${PORT} | CORS allowed: ${ALLOWED.join(', ')}`
      );
    });
  })
  .catch((e) => {
    console.error('❌ Database connection failed:', e.message);
    process.exit(1);
  });

// Exporting app is optional (only if you run supertest/jest)
module.exports = app;
