# Database / Schema

- **Engine:** PostgreSQL, hosted on Supabase
- **Access:** via `@supabase/supabase-js` (backend) and `supabase-js` (frontend)
- **Files:** `database/schema.sql` (structure) and `database/seed.sql` (seed data)

## Enum types (schema.sql)
- `staff_role`: clinic_assistant, doctor, admin
- `staff_status`: active, inactive, suspended
- `gender_type`: male, female, other, unknown
- `visit_status`: open, ai_processing, awaiting_doctor, consultation_scheduled, under_consultation, completed, referred, cancelled
- `risk_level`: low, medium, high
- `symptom_severity`: mild, moderate, severe
- `document_type`: prescription, medical_report, lab_report, discharge_summary, identity_document, other
- `document_status`: uploaded, processing, extracted, (and further states)

## Tables (schema.sql)
1. `staff_profiles`
2. `doctor_profiles`
3. `patients`
4. `patient_medical_history`
5. `patient_allergies`
6. `patient_medications`
7. `visits`
8. `visit_symptoms`
9. `visit_vitals`
10. `patient_documents`
11. `document_extractions`
12. `patient_images`
13. `ai_assessments`
14. `ai_risk_assessments`
15. `clinical_protocols`
16. `clinical_protocol_steps`
17. `ai_recommendations`
18. `rag_documents`
19. `rag_chunks`
20. `appointment_slots`
21. `appointments`
22. `consultations`
23. `doctor_decisions`
24. `prescriptions`
25. `prescription_items`
26. `referrals`
27. `notifications`
28. `audit_logs`

(README's high-level summary calls this "19 relational tables" and also "29 Tables" in the schema.sql header comment — the actual `CREATE TABLE` count in the current file is 28, listed above.)

## Seed data (seed.sql)
- 142 rural clinics
- 5 qualified doctor accounts
- MoHFW-approved clinical protocols
- 4 sample patient cases across Uttar Pradesh, Bihar, Madhya Pradesh, and West Bengal

## Notes
- Uses the `pgcrypto` Postgres extension.
- Designed to be run directly in the Supabase SQL Editor or via an automated migration script.
- Supabase project URL referenced in setup: `https://ucivhqksbbwhdwetrkbd.supabase.co` (see Configuration/Setup file for env variable details — you'll need your own Supabase anon/service-role keys).
