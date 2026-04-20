// routes/auth.js
// Agent 7 — Chef Authentication Routes
// POST /api/auth/register   — create a chef account
// POST /api/auth/login      — log in and receive a JWT
// GET  /api/auth/me         — get current chef info (auth required)

const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const Chef    = require('../models/Chef');
const authGuard = require('../middleware/auth');

// ── POST register ─────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const exists = await Chef.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ error: 'An account with this email already exists.' });

    const chef = await Chef.create({ name, email, password });

    const token = jwt.sign(
      { id: chef._id, email: chef.email, role: chef.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      chef: { id: chef._id, name: chef.name, email: chef.email, role: chef.role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST login ────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const chef = await Chef.findOne({ email: email.toLowerCase() });
    if (!chef) return res.status(401).json({ error: 'Invalid email or password.' });

    const valid = await chef.comparePassword(password);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });

    const token = jwt.sign(
      { id: chef._id, email: chef.email, role: chef.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Logged in successfully.',
      token,
      chef: { id: chef._id, name: chef.name, email: chef.email, role: chef.role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET current chef (auth required) ─────────────────────────────────────────
router.get('/me', authGuard, async (req, res) => {
  try {
    const chef = await Chef.findById(req.chef.id).select('-password');
    if (!chef) return res.status(404).json({ error: 'Chef not found.' });
    res.json(chef);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
