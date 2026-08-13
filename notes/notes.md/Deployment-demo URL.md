# Deployment / Demo URL

- **Live frontend (demo):** https://ruralai.vercel.app — listed as the project website in the GitHub repo's "About" section. Deployed on Vercel.
- **Backend API (Railway):** https://bob-production-4e27.up.railway.app — referenced as the production API target in `frontend/vercel.json`'s rewrite rule (`/api/(.*)` → `https://bob-production-4e27.up.railway.app/api/$1`).

## Hosting setup
- **Frontend:** Vercel — build via `npm run build` (Vite), output directory `dist`, with `/api/*` requests proxied to the Railway backend and all other routes rewritten to `index.html` (SPA routing).
- **Backend:** Railway — built with Nixpacks (`cd backend && npm install`), started with `cd backend && node src/server.js`, restart policy `ON_FAILURE` with up to 10 retries. A `Procfile` (`web: node src/server.js`) is also present, suggesting Heroku-style deployment is possible as an alternative.
