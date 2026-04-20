// routes/recipes.js
// Agent 5 — Recipe Routes
// POST /api/recipes/upload   — chef uploads a new recipe (auth required)
// POST /api/recipes/:id/publish — publish + auto-email all subscribers
// GET  /api/recipes          — list all published recipes (public)
// GET  /api/recipes/:id      — get single recipe (public)
// PUT  /api/recipes/:id      — update recipe (auth required)
// DELETE /api/recipes/:id    — delete recipe (auth required)

const express    = require('express');
const router     = express.Router();
const Recipe     = require('../models/Recipe');
const Subscriber = require('../models/Subscriber');
const authGuard  = require('../middleware/auth');
const { sendRecipeEmail } = require('../services/emailService');

// ── GET all published recipes (public) ──────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category, difficulty, limit = 20, page = 1 } = req.query;
    const filter = { published: true };
    if (category)   filter.category   = category;
    if (difficulty) filter.difficulty = difficulty;

    const skip    = (parseInt(page) - 1) * parseInt(limit);
    const recipes = await Recipe.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-steps -ingredients -tips'); // summary only for list view

    const total = await Recipe.countDocuments(filter);
    res.json({ recipes, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET single recipe (public) ───────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
    res.json(recipe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST upload new recipe (chef only) ───────────────────────────────────────
router.post('/upload', authGuard, async (req, res) => {
  try {
    const {
      title, description, category, difficulty,
      prepTime, cookTime, servings,
      ingredients, steps, tips, image, tags
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required.' });
    }

    const recipe = await Recipe.create({
      title, description, category, difficulty,
      prepTime, cookTime, servings,
      ingredients: ingredients || [],
      steps:       steps       || [],
      tips:        tips        || [],
      image, tags: tags || [],
      published: false,
      emailSent: false
    });

    res.status(201).json({
      message: 'Recipe saved as draft.',
      recipe
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST publish recipe + send emails (chef only) ────────────────────────────
router.post('/:id/publish', authGuard, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });

    // Mark as published
    recipe.published = true;
    await recipe.save();

    // Only send email once
    if (!recipe.emailSent) {
      const subscribers = await Subscriber.find({ status: 'active' });

      if (subscribers.length > 0) {
        const { sendRecipeEmail } = require('../services/emailService');
        const result = await sendRecipeEmail(recipe, subscribers);

        recipe.emailSent = true;
        await recipe.save();

        return res.json({
          message: `Recipe published! Emails sent to ${result.sent} subscribers.`,
          recipe
        });
      }
    }

    res.json({ message: 'Recipe published. No subscribers to email yet.', recipe });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT update recipe (chef only) ────────────────────────────────────────────
router.put('/:id', authGuard, async (req, res) => {
  try {
    const recipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
    res.json({ message: 'Recipe updated.', recipe });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE recipe (chef only) ────────────────────────────────────────────────
router.delete('/:id', authGuard, async (req, res) => {
  try {
    const recipe = await Recipe.findByIdAndDelete(req.params.id);
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
    res.json({ message: 'Recipe deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
