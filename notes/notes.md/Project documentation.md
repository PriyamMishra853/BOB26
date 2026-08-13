# Project Documentation

## What it is
**AI-Assisted Virtual Village Clinic Platform** — a platform for trained village health assistants across rural India to:
- Digitally capture patient demographics
- Record symptoms & vitals
- Digitize paper prescriptions via OCR
- Analyze injury photos
- Receive AI-assisted preliminary risk classification based on Ministry of Health & Family Welfare (MoHFW) approved clinical protocols
- Connect patients with remote qualified doctors via HD video teleconsultation

**Central product principle:** "AI prepares the case. The doctor makes the medical decision."

## Key features
- **Multilingual speech input with auto-language detection** — Hindi, Tamil, Telugu, Marathi, Bengali, English, transcribed via Groq Whisper AI into structured medical data
- **Prescription & lab report OCR** (Tesseract OCR + Groq Multimodal Vision) with mandatory human verification before saving
- **Groq LLM + Qdrant Cloud RAG clinical protocol engine** — queries approved MoHFW Standard Treatment Guidelines to produce structured summaries and first-aid guidance
- **Rule-based safety triage engine** — LOW (Green), MODERATE (Yellow), HIGH (Orange), EMERGENCY (Red) risk levels with automated red-flag detection
- **ZegoCloud 1-on-1 video teleconsultation** between clinic assistant and remote doctor
- **India-level rural health admin analytics** — real-time metrics across 142 tele-clinics in 12 states, risk distribution, doctor roster management
- **Light & dark minimalist UI** with a cursor-following radial mesh gradient shader
- **Printable clinical summary PDF export** of the complete patient case file

## Architecture
```
        React (Vite) + Tailwind CSS SPA
   (3D WebGL Globe via Three.js, Light/Dark theme)
                    │ HTTP / REST
                    ▼
        Node.js Express API Server
        │              │              │
        ▼              ▼              ▼
  Hosted Supabase   Groq Cloud AI   Qdrant Vector Cloud
  (PostgreSQL,       (Whisper/LLM)   (MoHFW approved
   19+ tables)                        protocols)
```

## Implementation breakdown

### 1. Database (`/database`)
- `schema.sql`: relational tables including `staff_profiles`, `doctor_profiles`, `patients`, `patient_medical_history`, `visits`, `visit_symptoms`, `visit_vitals`, `patient_documents`, `document_extractions`, `patient_images`, `ai_assessments`, `clinical_protocols`, `rag_documents`, `appointments`, `consultations`, `prescriptions`, `referrals`, `notifications`, `audit_logs`, and more.
- `seed.sql`: seed data for 142 rural clinics, 5 qualified doctor accounts, MoHFW-approved clinical protocols, and 4 sample patient cases across UP, Bihar, MP, and West Bengal.

### 2. Backend (`/backend`)
- **Auth controller** — JWT token issuance with role-based authorization (`CLINIC_ASSISTANT`, `DOCTOR`, `ADMIN`)
- **Patient & visit controller** — patient registration, ABHA number linking, visit initiation, vitals recording with empty-value safety checks
- **AI & RAG orchestrator** (`aiOrchestrator.js`, `ragEngine.js`) — rule-based triage, Qdrant queries for approved protocols, Groq LLM calls for clinical handoff summaries and supportive medication guidance
- **OCR service** (`ocrService.js`) — multimodal document reading with mandatory human confirmation modal
- **Speech service** (`speechService.js`) — multilingual Whisper transcription with automatic language ID

### 3. Frontend (`/frontend`)
- **Landing page** (`/`) — product vision, safety notice, 6-step workflow, 3D WebGL interactive node canvas
- **Clinic Assistant Workspace** (`/assistant/dashboard`) — real-time village patient directory, register-patient modal, 5-step visit assessment wizard
- **Remote Doctor Workspace** (`/doctor/queue`) — triage queue sorted by risk level, AI-vs-doctor decision separation, ZegoCloud video calls, signed digital prescription submission
- **Admin Panel** (`/admin/dashboard`) — India-level village analytics, state coverage breakdown, doctor roster provisioning, protocol ingestion into Qdrant, compliance audit logs

## Safety & legal notice
AI assistance does not replace professional medical diagnosis or treatment. All clinical decisions, prescriptions, and referrals are made strictly by qualified healthcare professionals registered under the National Medical Commission (NMC) of India.
