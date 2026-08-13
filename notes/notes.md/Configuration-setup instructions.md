# Configuration / Setup Instructions

## Prerequisites
- Node.js v18+ (backend `package.json` specifies `engines.node >= 22.0.0`)
- npm or yarn

## 1. Clone the repo
```bash
git clone https://github.com/Ashish42-droid/BOB.git
cd BOB
```

## 2. Backend environment variables
Create `backend/.env`:
```env
PORT=5000
JWT_SECRET=virtual_clinic_jwt_secret_key_2026

# Supabase Credentials
SUPABASE_URL=https://ucivhqksbbwhdwetrkbd.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI API Credentials
GROQ_API_KEY=your_groq_api_key
QDRANT_URL=https://cc6c04a5-4d82-4ada-83db-a20f1cddccb6.sa-east-1-0.aws.cloud.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key

# Video Teleconsultation
ZEGOCLOUD_APP_ID=1586356449
ZEGOCLOUD_SERVER_SECRET=37d7de5083083e70e9d7b6315a428884
```

## 3. Frontend environment variables
Create `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_ZEGOCLOUD_APP_ID=1586356449
VITE_ZEGOCLOUD_SERVER_SECRET=37d7de5083083e70e9d7b6315a428884
```

> Note: the values above (including `JWT_SECRET`, `ZEGOCLOUD_APP_ID`, `ZEGOCLOUD_SERVER_SECRET`, and the Supabase project URL) are the literal example values checked into the README. `.env` files themselves are gitignored, but since these specific values are already committed in plaintext in `README.md`, you may want to rotate the JWT secret and ZegoCloud server secret before/if this goes to production, and swap in your own `GROQ_API_KEY` / `QDRANT_API_KEY` / Supabase keys (marked `your_..._key` — not provided in the repo).

## 4. Install & run backend
```bash
cd backend
npm install
node src/server.js
```
Backend API runs at `http://localhost:5000/api`.

## 5. Install & run frontend
```bash
cd ../frontend
npm install
npm run dev
```
Frontend dev server runs at `http://localhost:3000` (via `npx vite --port 3000 --host`).

## Other useful scripts (backend/package.json)
- `npm run dev` — backend with `--watch` (auto-restart)
- `npm run db:init` — `node src/scripts/initDb.js`
- `npm run rag:seed` — `node src/scripts/seedQdrant.js` (seeds Qdrant vector DB)

## Deployment configuration present in repo
- `railway.json` — Railway deploy config for the backend (Nixpacks builder; build: `cd backend && npm install`; start: `cd backend && node src/server.js`; restarts on failure, max 10 retries)
- `nixpacks.toml` — Nixpacks build plan (Node.js 20, installs backend deps, starts `node src/server.js`)
- `backend/Procfile` — `web: node src/server.js` (Heroku-style)
- `frontend/vercel.json` — Vercel config for the frontend (Vite framework, `npm run build` → `dist/`), with `/api/*` requests rewritten to the deployed Railway backend
