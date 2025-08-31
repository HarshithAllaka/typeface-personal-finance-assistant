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

// behind proxies (Render/Heroku/NGINX) for correct IP + rate limiting
app.set('trust proxy', 1);

// security & middleware
app.use(
  helmet({
    // if you will serve files from /uploads; otherwise you can remove this
    crossOriginResourcePolicy: false,
  })
);
app.use(morgan('dev'));
app.use(compression());
app.use(express.json({ limit: '2mb' }));

// ----- CORS with env list and safe fallback -----
const ALLOWED = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const corsDelegate = (req, cb) => {
  const origin = req.header('Origin');
  // allow same-origin / no-origin (curl, uptime checks) and explicit matches
  const allowed = !origin || ALLOWED.includes(origin);
  cb(null, {
    origin: allowed,
    credentials: true,
  });
};
app.use(cors(corsDelegate));
// ------------------------------------------------

// basic rate limit (tune as needed)
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// health check
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', txnRoutes);
app.use('/api/receipts', receiptRoutes);

// (optional) serve uploaded files if you need to view them later
// app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 5000;

// connect DB then start server
connectDB(process.env.MONGODB_URI)
  .then(() => {
    app.listen(PORT, () =>
      console.log(`🚀 API running on port ${PORT} | CORS allowed: ${ALLOWED.join(', ')}`)
    );
  })
  .catch((e) => {
    console.error('❌ Database connection failed:', e.message);
    process.exit(1);
  });

module.exports = app; // optional for testing
