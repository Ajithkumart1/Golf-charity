// server/src/index.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes         = require('./routes/auth');
const userRoutes         = require('./routes/users');
const scoreRoutes        = require('./routes/scores');
const subscriptionRoutes = require('./routes/subscriptions');
const charityRoutes      = require('./routes/charities');
const drawRoutes         = require('./routes/draws');
const winnerRoutes       = require('./routes/winners');
const adminRoutes        = require('./routes/admin');
const stripeRoutes       = require('./routes/stripe');

const app = express();

// ── Security ────────────────────────────────────────────────────────────────
app.use(helmet());

// CORS — allow both the explicit CLIENT_URL AND same-origin requests.
// On Vercel, client and server share the same domain, so same-origin requests
// arrive without an Origin header and must also be allowed.
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Vercel same-domain, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ── Stripe webhook MUST receive raw body ────────────────────────────────────
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

// ── Body parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health check ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/scores',        scoreRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/charities',     charityRoutes);
app.use('/api/draws',         drawRoutes);
app.use('/api/winners',       winnerRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/stripe',        stripeRoutes);

// ── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── Listen only in non-serverless environments ───────────────────────────────
// On Vercel, the module is imported as a serverless function — app.listen()
// must NOT be called or Vercel will fail to boot the function.
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

module.exports = app;
