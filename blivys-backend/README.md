# Blivy's Pantry — Backend API

A production-ready Node.js backend for the Blivy's Pantry recipe website.
Built with Express, MongoDB, and SendGrid.

## What it does

- Chef logs in securely (JWT authentication)
- Chef uploads a recipe (saved to MongoDB)
- Chef publishes the recipe — all subscribers get an email automatically
- Visitors subscribe via the newsletter form
- Weekly cron job can auto-email the latest recipe every Monday

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
# Open .env and fill in your MongoDB URI, JWT secret, and SendGrid key
```

### 3. Get your services ready

**MongoDB Atlas (free)**
- Go to https://mongodb.com/atlas
- Create a free cluster
- Get your connection string and paste it into `MONGO_URI`

**SendGrid (free — 100 emails/day)**
- Go to https://sendgrid.com
- Create an account and verify your sender email
- Create an API key and paste it into `SENDGRID_API_KEY`

### 4. Run the server
```bash
# Development (auto-restarts on file changes)
npm run dev

# Production
npm start
```

---

## API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Create a chef account |
| POST | `/api/auth/login` | No | Log in, receive JWT token |
| GET | `/api/auth/me` | Yes | Get current chef info |

### Recipes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/recipes` | No | List all published recipes |
| GET | `/api/recipes/:id` | No | Get a single recipe |
| POST | `/api/recipes/upload` | Yes | Upload a new recipe (draft) |
| POST | `/api/recipes/:id/publish` | Yes | Publish + email subscribers |
| PUT | `/api/recipes/:id` | Yes | Update a recipe |
| DELETE | `/api/recipes/:id` | Yes | Delete a recipe |

### Subscribers
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/subscribers/subscribe` | No | Subscribe to newsletter |
| GET | `/api/subscribers/unsubscribe?token=xxx` | No | One-click unsubscribe |
| GET | `/api/subscribers` | Yes | List all subscribers |
| DELETE | `/api/subscribers/:id` | Yes | Remove a subscriber |

---

## Connecting to Your Frontend

Update the newsletter form in `blivys-pantry.html`:

```html
<form class="nl-form" onsubmit="subscribe(event)">
  <input type="email" id="nl-email" placeholder="your@email.com">
  <button>Subscribe</button>
</form>

<script>
const API = 'https://your-backend-url.com'; // or http://localhost:3000

async function subscribe(e) {
  e.preventDefault();
  const email = document.getElementById('nl-email').value;
  const res = await fetch(`${API}/api/subscribers/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  const data = await res.json();
  alert(data.message || data.error);
}
</script>
```

---

## Deploying to Render (free)

1. Push your code to GitHub
2. Go to https://render.com → New Web Service
3. Connect your GitHub repo
4. Set Build Command: `npm install`
5. Set Start Command: `npm start`
6. Add all your environment variables from `.env`
7. Deploy!

Your API will be live at `https://your-app.onrender.com`

---

## Folder Structure

```
backend/
├── models/
│   ├── Recipe.js        — Recipe schema (title, steps, ingredients...)
│   ├── Subscriber.js    — Email subscriber schema
│   └── Chef.js          — Chef account schema (auth)
├── routes/
│   ├── recipes.js       — Recipe CRUD + publish endpoint
│   ├── subscribers.js   — Subscribe + unsubscribe
│   └── auth.js          — Register + login
├── services/
│   ├── emailService.js  — SendGrid email sending
│   └── scheduler.js     — Weekly cron job
├── middleware/
│   └── auth.js          — JWT authentication guard
├── server.js            — Express app entry point
├── package.json
├── .env.example         — Environment variable template
└── README.md
```

---

## Next Steps

- [ ] Add image uploads with Cloudinary
- [ ] Build an admin dashboard UI
- [ ] Add recipe categories / search
- [ ] Stripe integration for paid memberships
