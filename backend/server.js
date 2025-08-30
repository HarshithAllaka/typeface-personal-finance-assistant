const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');


const connectDB = require('./src/utils/db');

const app = express();

// security & middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));
app.use(cors({
  origin: process.env.FRONTEND_URL?.split(',') || ['http://localhost:5173'],
  credentials: true
}));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// health check
app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);

const txnRoutes = require('./src/routes/transactions');
app.use('/api/transactions', txnRoutes);


const PORT = process.env.PORT || 5000;

// connect DB then start server
connectDB(process.env.MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 API running on http://localhost:${PORT}`));
  })
  .catch((e) => {
    console.error('❌ Database connection failed:', e.message);
    process.exit(1);
  });
