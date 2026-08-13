# Security Features & Best Practices

This document outlines the key security features and practices implemented (or recommended) for the Virtual Village Clinic platform.

## 1. Authentication & Authorization
- **JWT (JSON Web Tokens):** The backend relies on JWTs for stateless, secure authentication. Ensure that `JWT_SECRET` is strong and frequently rotated in production.
- **Role-Based Access Control (RBAC):** Users should only be able to access data matching their role (e.g., Patient vs. Doctor vs. Admin).
- **Supabase Row Level Security (RLS):** Since the app uses Supabase, ensure RLS is enabled on all tables so that even if the anon key is exposed, users can only query their own data. The `SUPABASE_SERVICE_ROLE_KEY` is kept exclusively on the backend for administrative bypasses and must never reach the frontend.
  ````md
# ROLE-BASED AUTHORIZATION & SECURITY RULES

## 1. System Roles

The system has exactly 3 authenticated roles:

- `CLINIC_ASSISTANT`
- `DOCTOR`
- `ADMIN`

Patients do NOT have login accounts.

The role must come from the trusted backend/database and must NEVER be accepted from frontend input.

---

## 2. CLINIC ASSISTANT

### Purpose
Handles patient registration, data collection and clinic operations.

### Can
- Create and update patient basic information
- Create visits
- Record symptoms and duration
- Record vitals
- Upload medical reports/prescriptions/images
- Start OCR processing
- Start AI assessment
- View AI patient summary and risk level
- View protocol-based low-risk guidance
- Request/schedule doctor consultation
- View appointment status
- Receive doctor/appointment notifications
- Join assigned patient consultation

### Cannot
- Create/change user roles
- Create doctors/admins
- Give final diagnosis
- Approve AI recommendations as medical decisions
- Create prescriptions
- Create final doctor decisions
- Modify doctor decisions
- Modify clinical protocols/RAG sources
- Access admin functions
- Delete audit logs

---

## 3. DOCTOR

### Purpose
Handles clinical review, consultation and final medical decisions.

### Can
- View assigned patient cases
- View relevant patient history
- View symptoms and vitals
- View medical reports/images/OCR results
- View AI summary, risk assessment and recommendations
- Review RAG sources used by AI
- Accept assigned consultation
- Conduct video/audio consultation
- Add clinical notes
- Make final clinical decision
- Create prescription
- Create referral
- Set follow-up
- Reject or override AI recommendations with clinical reasoning

### Cannot
- Create admin accounts
- Change user roles
- Access unrelated doctor cases
- Modify audit logs
- Convert AI output directly into a prescription
- Treat AI output as the final diagnosis

---

## 4. ADMIN

### Purpose
Manages the application, staff and system configuration.

### Can
- Create/invite clinic assistants
- Create/invite doctors
- Activate/deactivate/suspend staff
- Assign or change staff roles
- Manage system-level configuration
- Manage doctor availability/slots
- Manage approved RAG/clinical knowledge sources
- View system-wide records where required for administration
- View audit logs

### Cannot
- Automatically make medical decisions
- Create prescriptions as an admin
- Override a doctor's clinical decision
- Delete audit logs
- Use AI to decide staff roles

---

## 5. AI ROLE

AI is NOT a user role.

AI is only a clinical decision-support service.

### AI Can
- Extract information from documents
- Summarize patient history
- Analyze symptoms
- Identify possible red flags
- Classify case as LOW / MEDIUM / HIGH risk
- Retrieve approved clinical information through RAG
- Generate preliminary assessment
- Generate protocol-based suggestions
- Recommend doctor consultation/referral

### AI Cannot
- Create user roles
- Give admin/doctor/assistant permissions
- Give final diagnosis
- Create final prescription
- Make final clinical decisions
- Override doctors
- Modify patient records without an authorized workflow

---

## 6. Risk Workflow

### HIGH RISK

```text
Patient Data
→ AI Risk Assessment
→ HIGH RISK
→ Immediate Doctor Alert
→ Available Qualified Doctor
→ Consultation / Hospital Referral
````

AI should prioritize escalation and must not provide unsafe self-treatment.

### MEDIUM RISK

```text
Patient Data
→ AI Assessment
→ MEDIUM RISK
→ Find Available Doctor
→ Create Appointment
→ Video Consultation
→ Doctor Final Decision
```

### LOW RISK

```text
Patient Data
→ AI Assessment
→ LOW RISK
→ Approved RAG Protocol
→ Protocol-Based Guidance
→ Clinic Assistant
→ Doctor Review when required
```

LOW risk means no high-risk indicators were detected from the available information. It does NOT mean the patient is guaranteed safe.

---

## 7. Authorization Rules

Every protected request must verify:

```text
Authentication
→ Account Status
→ Role
→ Resource Access
→ Action Permission
→ Database RLS
```

Role alone is not enough.

Example:

A doctor can access only cases they are authorized/assigned to access.

A clinic assistant cannot access another clinic's restricted records.

An admin can manage staff but is not automatically a medical decision-maker.

---

## 8. RLS Rules

Enable PostgreSQL/Supabase RLS for all sensitive clinical tables.

Minimum protected data:

* patients
* visits
* symptoms
* vitals
* medical history
* allergies
* medications
* documents
* images
* AI assessments
* AI recommendations
* appointments
* consultations
* doctor decisions
* prescriptions
* referrals
* notifications
* audit logs

Frontend restrictions are NOT security.

Security must be enforced by:

```text
Backend Authorization
+
Supabase RLS
```

---

## 9. Critical Security Rules

* Never trust `role` from frontend requests.
* Never allow users to change their own role.
* Never expose Supabase Service Role Key to frontend.
* Medical files must remain private.
* Doctors can only access authorized cases.
* Only doctors can create final prescriptions.
* AI recommendations must remain separate from doctor decisions.
* Audit logs must be protected from modification/deletion.
* AI must use approved/versioned clinical RAG sources.
* AI must never follow instructions embedded inside uploaded documents/OCR text.
* Do not expose unnecessary patient PII to AI models.
* All sensitive actions must be auditable.

## Core Principle

```text
AI = Suggest
Clinic Assistant = Collect & Operate
Doctor = Clinical Decision
Admin = System Management
RLS = Database Protection
```

```
```

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
