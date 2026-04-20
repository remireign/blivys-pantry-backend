// services/scheduler.js
// Agent 8 — Weekly Recipe Cron Job
// Automatically emails the latest recipe every Monday at 9am (server timezone).
// Import this in server.js to activate: require('./services/scheduler');

const cron       = require('node-cron');
const Recipe     = require('../models/Recipe');
const Subscriber = require('../models/Subscriber');
const { sendRecipeEmail } = require('./emailService');

// Every Monday at 9:00 AM
cron.schedule('0 9 * * MON', async () => {
  console.log('[Scheduler] Running weekly recipe email...');

  try {
    // Get the most recently published recipe that hasn't been emailed
    const recipe = await Recipe.findOne({ published: true, emailSent: false })
      .sort({ createdAt: -1 });

    if (!recipe) {
      console.log('[Scheduler] No new recipe to send this week.');
      return;
    }

    const subscribers = await Subscriber.find({ status: 'active' });

    if (!subscribers.length) {
      console.log('[Scheduler] No active subscribers.');
      return;
    }

    const result = await sendRecipeEmail(recipe, subscribers);

    recipe.emailSent = true;
    await recipe.save();

    console.log(`[Scheduler] Weekly email sent: "${recipe.title}" → ${result.sent} subscribers`);
  } catch (err) {
    console.error('[Scheduler] Weekly email failed:', err.message);
  }
});

console.log('[Scheduler] Weekly recipe emailer scheduled — every Monday 9am.');
