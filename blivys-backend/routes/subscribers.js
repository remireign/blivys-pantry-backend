// routes/subscribers.js
// Agent 6 — Subscriber Routes
// POST /api/subscribers/subscribe      — add new subscriber + send welcome email
// GET  /api/subscribers/unsubscribe    — one-click unsubscribe via token link
// GET  /api/subscribers                — list all subscribers (chef/admin only)
// DELETE /api/subscribers/:id          — remove subscriber (chef/admin only)

const express    = require('express');
const router     = express.Router();
const Subscriber = require('../models/Subscriber');
const authGuard  = require('../middleware/auth');
const { sendWelcomeEmail } = require('../services/emailService');

// ── POST subscribe ───────────────────────────────────────────────────────────
router.post('/subscribe', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    // Check if already subscribed
    const existing = await Subscriber.findOne({ email: email.toLowerCase() });

    if (existing) {
      if (existing.status === 'unsubscribed') {
        // Re-subscribe
        existing.status = 'active';
        await existing.save();
        return res.json({ message: 'Welcome back! You have been re-subscribed.' });
      }
      return res.status(409).json({ error: 'This email is already subscribed.' });
    }

    const subscriber = await Subscriber.create({ email, name });

    // Send welcome email (non-blocking — don't fail if email fails)
    sendWelcomeEmail(subscriber).catch(err =>
      console.error('Welcome email failed:', err.message)
    );

    res.status(201).json({ message: 'Subscribed successfully! Check your inbox for a welcome email.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET unsubscribe via token link ───────────────────────────────────────────
// This is the URL included in every email footer.
// e.g. GET /api/subscribers/unsubscribe?token=abc123
router.get('/unsubscribe', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).send('Invalid unsubscribe link.');

    const subscriber = await Subscriber.findOne({ unsubToken: token });
    if (!subscriber) return res.status(404).send('Subscriber not found.');

    subscriber.status = 'unsubscribed';
    await subscriber.save();

    // Return a simple HTML confirmation page
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Unsubscribed — Blivy's Pantry</title></head>
        <body style="font-family:Georgia,serif;text-align:center;padding:80px 20px;color:#3B2A1A">
          <h1 style="color:#E8621A">You've been unsubscribed.</h1>
          <p>We're sad to see you go, <strong>${subscriber.email}</strong>!</p>
          <p>You won't receive any more recipe emails from us.</p>
          <a href="${process.env.SITE_URL || '/'}" style="color:#E8621A">← Back to Blivy's Pantry</a>
        </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send('Something went wrong. Please try again.');
  }
});

// ── GET all subscribers (chef/admin only) ────────────────────────────────────
router.get('/', authGuard, async (req, res) => {
  try {
    const { status = 'active' } = req.query;
    const subscribers = await Subscriber.find({ status }).sort({ createdAt: -1 });
    const total = await Subscriber.countDocuments({ status: 'active' });
    res.json({ subscribers, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE subscriber (chef/admin only) ─────────────────────────────────────
router.delete('/:id', authGuard, async (req, res) => {
  try {
    await Subscriber.findByIdAndDelete(req.params.id);
    res.json({ message: 'Subscriber removed.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
