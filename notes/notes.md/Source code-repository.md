# Source Code / Repository

- **Repository:** https://github.com/Ashish42-droid/BOB
- **Owner:** Ashish42-droid
- **Default branch:** main (36 commits at time of writing)
- **Project name:** AI-Assisted Virtual Village Clinic Platform

## Repo structure
```
BOB/
├── .claude/            # Claude Code project config
├── backend/            # Node.js + Express API server
│   ├── src/
│   │   ├── controllers/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── scripts/
│   │   └── routes/
│   ├── package.json
│   └── Procfile
├── database/
│   ├── schema.sql
│   └── seed.sql
├── frontend/            # React (Vite) + Tailwind SPA
│   ├── src/
│   │   ├── components/
│   │   ├── config/
│   │   ├── services/
│   │   ├── pages/
│   │   └── context/
│   ├── package.json
│   └── vercel.json
├── nixpacks.toml
├── railway.json
└── README.md
```

## Tech stack
- **Frontend:** React 18, Vite, Tailwind CSS, Three.js (3D WebGL globe), Lucide Icons, Framer Motion, `@zegocloud/zego-uikit-prebuilt`
- **Backend:** Node.js (>=22), Express.js, JWT auth, Multer file upload
- **Database & storage:** PostgreSQL via hosted Supabase (`supabase-js`)
- **AI / RAG:** Groq Cloud (`llama-3.3-70b-versatile`, `llama-3.2-11b-vision-preview`, `whisper-large-v3-turbo`), Qdrant Cloud Vector DB (`@qdrant/js-client-rest`)
- **OCR:** Tesseract.js & Groq Multimodal Vision
- **Video:** ZegoCloud (WebRTC 1-on-1 teleconsultation)

## Core backend dependencies (backend/package.json)
`@google/generative-ai`, `@qdrant/js-client-rest`, `@supabase/supabase-js`, `cors`, `dotenv`, `express`, `groq-sdk`, `jsonwebtoken`, `multer`, `pg`, `resend`, `tesseract.js`, `ws`, `zod`

## Core frontend dependencies (frontend/package.json)
`@supabase/supabase-js`, `@zegocloud/zego-uikit-prebuilt`, `axios`, `clsx`, `framer-motion`, `lucide-react`, `react`, `react-dom`, `react-router-dom`, `tailwind-merge`, `three`, `vite`

## License
README states the project is distributed under the MIT License ("See LICENSE for details"), but no `LICENSE` file currently exists in the repo root — worth adding if you want that to be accurate.
