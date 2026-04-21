require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');

const app = express();

// ── CORS — allow both old and new Netlify URLs ──
const allowedOrigins = [
  'https://blivvyspantry.netlify.app',
  'https://blivyspantry.netlify.app',
  'http://localhost:3000',
  'http://127.0.0.1:5500',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (Postman, curl, same-origin)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Also allow any netlify.app subdomain
    if (origin.endsWith('.netlify.app')) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ──
app.use('/api/recipes',     require('./routes/recipes'));
app.use('/api/subscribers', require('./routes/subscribers'));
app.use('/api/auth',        require('./routes/auth'));

// ── Health check (keeps Render awake + frontend can ping this) ──
app.get('/health', (req, res) => {
  res.json({ status: 'ok', name: "Blivvy's Pantry API", time: new Date() });
});

// ── Root route (so browser doesn't see "Cannot GET /") ──
app.get('/', (req, res) => {
  res.json({ message: "Blivvy's Pantry API is running 🍳", version: '1.0.0' });
});

// ── Global error handler ──
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── Connect DB + Start server ──
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`🚀 Blivvy's Pantry API running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ DB connection failed:', err.message);
    process.exit(1);
  });
