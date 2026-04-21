// services/emailService.js
// Agent 3 — Email Service
// Handles all outgoing emails: new recipe broadcasts + welcome emails

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'hello@blivyspantry.com';
const SITE_URL   = process.env.SITE_URL   || 'https://blivyspantry.com';

/**
 * Broadcast a new recipe to all active subscribers.
 * Called automatically when a chef publishes a recipe.
 */
async function sendRecipeEmail(recipe, subscribers) {
  if (!subscribers.length) return { sent: 0 };

  // Build personalised messages so each gets their own unsubscribe link
  const messages = subscribers.map(sub => ({
    to:      sub.email,
    from:    { name: "Blivy's Pantry", email: FROM_EMAIL },
    subject: `New Recipe: ${recipe.title}`,
    html: buildRecipeEmail(recipe, sub),
    text: buildRecipeText(recipe, sub),
  }));

  // Send in batches of 100 (SendGrid free tier limit)
  const BATCH = 100;
  let sent = 0;
  for (let i = 0; i < messages.length; i += BATCH) {
    const batch = messages.slice(i, i + BATCH);
    await sgMail.send(batch);
    sent += batch.length;
  }

  return { sent };
}

/**
 * Send a welcome email to a new subscriber.
 */
async function sendWelcomeEmail(subscriber) {
  const msg = {
    to:      subscriber.email,
    from:    { name: "Blivy's Pantry", email: FROM_EMAIL },
    subject: "Welcome to Blivy's Pantry!",
    html: `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#3B2A1A">
        <div style="background:#E8621A;padding:32px;text-align:center">
          <h1 style="color:#fff;font-size:28px;margin:0">Welcome to Blivy's Pantry</h1>
        </div>
        <div style="padding:32px">
          <p>Hey${subscriber.name ? ' ' + subscriber.name : ''}! 👋</p>
          <p>You're in! Every week you'll get a brand-new follow-along recipe — the kind that makes cooking feel easy and joyful.</p>
          <p>Can't wait? Check out our latest recipes:</p>
          <a href="${SITE_URL}" style="display:inline-block;background:#E8621A;color:#fff;padding:12px 28px;border-radius:99px;text-decoration:none;font-weight:bold;margin:16px 0">
            Visit Blivy's Pantry
          </a>
          <hr style="border:none;border-top:1px solid #F0D8C4;margin:24px 0">
          <p style="font-size:12px;color:#8C6A50">
            You're receiving this because you subscribed at blivyspantry.com.<br>
            <a href="${SITE_URL}/unsubscribe?token=${subscriber.unsubToken}" style="color:#E8621A">Unsubscribe</a>
          </p>
        </div>
      </div>
    `,
  };

  await sgMail.send(msg);
}

// ── HTML Email Template ──────────────────────────────────────────────────────
function buildRecipeEmail(recipe, sub) {
  const unsubUrl = `${SITE_URL}/unsubscribe?token=${sub.unsubToken}`;
  const recipeUrl = `${SITE_URL}/recipe/${recipe._id}`;
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  const ingredients = (recipe.ingredients || [])
    .map(i => `<li style="padding:4px 0;border-bottom:1px solid #F0D8C4">${i}</li>`)
    .join('');

  const steps = (recipe.steps || [])
    .map((s, idx) => `
      <div style="display:flex;gap:12px;margin-bottom:16px;align-items:flex-start">
        <div style="min-width:28px;height:28px;background:#E8621A;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:bold">${idx + 1}</div>
        <p style="margin:0;color:#3B2A1A;line-height:1.6">${s}</p>
      </div>
    `).join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FFFAF5;font-family:Georgia,serif">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">

  <!-- Header -->
  <div style="background:#E8621A;padding:24px 32px;text-align:center">
    <p style="color:rgba(255,255,255,0.8);font-size:12px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 6px">New Follow-Along Recipe</p>
    <h1 style="color:#fff;font-size:26px;margin:0">${recipe.title}</h1>
  </div>

  ${recipe.image ? `<img src="${recipe.image}" alt="${recipe.title}" style="width:100%;height:240px;object-fit:cover">` : ''}

  <!-- Stats -->
  <div style="display:flex;text-align:center;border-bottom:1px solid #F0D8C4">
    <div style="flex:1;padding:16px;border-right:1px solid #F0D8C4">
      <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#8C6A50;margin:0 0 4px">Time</p>
      <p style="font-size:18px;color:#E8621A;font-weight:bold;margin:0">${totalTime} min</p>
    </div>
    <div style="flex:1;padding:16px;border-right:1px solid #F0D8C4">
      <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#8C6A50;margin:0 0 4px">Serves</p>
      <p style="font-size:18px;color:#E8621A;font-weight:bold;margin:0">${recipe.servings}</p>
    </div>
    <div style="flex:1;padding:16px">
      <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#8C6A50;margin:0 0 4px">Difficulty</p>
      <p style="font-size:18px;color:#E8621A;font-weight:bold;margin:0">${recipe.difficulty}</p>
    </div>
  </div>

  <div style="padding:32px">
    <p style="color:#3B2A1A;line-height:1.7;margin:0 0 24px">${recipe.description}</p>

    <!-- Ingredients -->
    <h2 style="font-size:18px;color:#3B1F0A;border-bottom:2px solid #E8621A;padding-bottom:8px">Ingredients</h2>
    <ul style="padding-left:16px;color:#3B2A1A;line-height:1.8">${ingredients}</ul>

    <!-- Steps -->
    <h2 style="font-size:18px;color:#3B1F0A;border-bottom:2px solid #E8621A;padding-bottom:8px;margin-top:28px">Steps</h2>
    ${steps}

    <!-- CTA -->
    <div style="text-align:center;margin-top:32px">
      <a href="${recipeUrl}" style="display:inline-block;background:#E8621A;color:#fff;padding:14px 32px;border-radius:99px;text-decoration:none;font-weight:bold;font-size:15px">
        Follow Along on the Website
      </a>
    </div>
  </div>

  <!-- Footer -->
  <div style="background:#FDF0E8;padding:20px 32px;text-align:center;font-size:12px;color:#8C6A50">
    <p style="margin:0 0 8px">You're getting this because you subscribed to Blivy's Pantry.</p>
    <a href="${unsubUrl}" style="color:#E8621A">Unsubscribe</a>
  </div>
</div>
</body>
</html>
  `;
}

// Plain text fallback
function buildRecipeText(recipe, sub) {
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  const ingredients = (recipe.ingredients || []).map((i, n) => `${n+1}. ${i}`).join('\n');
  const steps = (recipe.steps || []).map((s, n) => `Step ${n+1}: ${s}`).join('\n\n');
  return `
NEW RECIPE: ${recipe.title}
From Blivy's Pantry

Time: ${totalTime} min | Serves: ${recipe.servings} | Difficulty: ${recipe.difficulty}

${recipe.description}

INGREDIENTS
${ingredients}

STEPS
${steps}

View full recipe: ${SITE_URL}/recipe/${recipe._id}

Unsubscribe: ${SITE_URL}/unsubscribe?token=${sub.unsubToken}
  `.trim();
}

module.exports = { sendRecipeEmail, sendWelcomeEmail };
