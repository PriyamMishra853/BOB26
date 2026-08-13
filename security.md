# Security Features & Best Practices

This document outlines the key security features and practices implemented (or recommended) for the Virtual Village Clinic platform.

## 1. Authentication & Authorization
- **JWT (JSON Web Tokens):** The backend relies on JWTs for stateless, secure authentication. Ensure that `JWT_SECRET` is strong and frequently rotated in production.
- **Role-Based Access Control (RBAC):** Users should only be able to access data matching their role (e.g., Patient vs. Doctor vs. Admin).
- **Supabase Row Level Security (RLS):** Since the app uses Supabase, ensure RLS is enabled on all tables so that even if the anon key is exposed, users can only query their own data. The `SUPABASE_SERVICE_ROLE_KEY` is kept exclusively on the backend for administrative bypasses and must never reach the frontend.

## 2. API & Network Security
- **CORS Configuration:** The backend explicitly whitelists trusted domains (like the production Vercel/Railway frontend) and drops requests from untrusted origins.
- **Payload Limits:** The Express server restricts incoming JSON and URL-encoded payload sizes to prevent Denial of Service (DoS) via massive memory allocations (`app.use(express.json({ limit: '50mb' }))`).

## 3. Data Privacy
- **Environment Variables:** All secrets (API keys, database URLs) are stored in `.env` and loaded at runtime. The `.env` file is excluded from version control via `.gitignore`.
- **Error Handling:** The global error handler is configured to hide stack traces when `NODE_ENV === 'production'`. This prevents the leakage of sensitive infrastructure paths and library versions.

## 4. API Key Protection
- **Proxy Pattern:** External APIs (Groq, Gemini, Qdrant, Resend) are exclusively called from the Node.js backend. This prevents exposing paid API keys to the client browser.

## 5. WebRTC Signaling Security (ZegoCloud)
- **Token Vending:** The backend vends secure access tokens using the `ZEGOCLOUD_SERVER_SECRET`. The client requests a token before joining a video consultation, preventing unauthorized access to video rooms.

## Recommended Future Enhancements
- **Rate Limiting:** Implement `express-rate-limit` to protect endpoints against brute-force attacks and abuse.
- **Helmet:** Add the `helmet` package to automatically configure secure HTTP headers (e.g., preventing XSS, Clickjacking).
- **Input Validation:** Ensure strict validation (e.g., using `Zod`) is applied to all incoming request bodies before processing.
