# 🍁 MapleStorage

A cash item tracker for MapleStory — keep track of your entire cash shop collection across all class storages.

## Features

- 🔍 **Live item search** powered by maplestory.io (GMS data)
- 📦 **Class storage assignment** — assign items to any of the 12 class storages
- 🔢 **Quantity tracking** — track how many of each item you own
- 📂 **Grouped by item type** — storage view organized by Eye Decoration, Face, Hat, Pet, Chair, etc.
- 🧍 **Sim tab** — preview your character with any cash items equipped live
- 💾 **Persists in browser** via localStorage

---

## Deploy to Vercel (free, ~2 minutes)

Vercel is needed (not GitHub Pages) because the app proxies requests to maplestory.io to get around browser CORS restrictions.

### Option A — Drag and drop (easiest)

1. Go to [vercel.com](https://vercel.com) and sign up for free (GitHub login works)
2. From the dashboard click **Add New → Project**
3. Click **"deploy without a Git repository"** / use the drag & drop option
4. Drag the entire `maplestorage` folder in
5. Click **Deploy**
6. Your site is live at `https://maplestorage-xxxx.vercel.app` in ~30 seconds

### Option B — Via GitHub (recommended for updates)

1. Push the `maplestorage` folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **Add New → Project**
3. Import your GitHub repository
4. Click **Deploy** — no build settings needed
5. Every time you push to GitHub, Vercel auto-redeploys

---

## File structure

```
maplestorage/
├── index.html    ← Page structure
├── style.css     ← All styles
├── app.js        ← All logic + API calls
├── vercel.json   ← Proxy config (routes /api/maplestory/* → maplestory.io)
└── README.md     ← This file
```

## How the proxy works

vercel.json tells Vercel to forward any request to /api/maplestory/* over to https://maplestory.io/api/* server-side. This sidesteps the browser CORS restriction since the request originates from Vercel's servers, not the user's browser.

## API

Item data and character renders are fetched from maplestory.io — an unofficial community-run MapleStory API. No API key required.
