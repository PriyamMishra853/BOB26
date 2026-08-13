/**
 * ROLE-BASED AUTHORIZATION MATRIX — single source of truth.
 *
 * Exactly 3 authenticated roles. Patients never log in.
 * A user's role always comes from the staff_profiles table (trusted DB),
 * never from frontend input. AI is NOT a role — it is a decision-support
 * service and can never mint permissions.
 */

export const ROLES = Object.freeze({
  CLINIC_ASSISTANT: 'CLINIC_ASSISTANT',
  DOCTOR: 'DOCTOR',
  ADMIN: 'ADMIN'
});

export const PERMISSIONS = Object.freeze({
  // Patient & visit workflow
  PATIENT_CREATE: 'patient:create',
  PATIENT_UPDATE: 'patient:update',
  PATIENT_VIEW: 'patient:view',
  VISIT_CREATE: 'visit:create',
  VITALS_RECORD: 'vitals:record',
  DOCUMENT_UPLOAD: 'document:upload',
  OCR_START: 'ocr:start',

  // AI assistance (support only — never a medical decision)
  AI_ASSESS_START: 'ai:assess',
  AI_SUMMARY_VIEW: 'ai:summary:view',
  AI_RAG_SOURCES_VIEW: 'ai:rag:view',

  // Consultation
  CONSULT_REQUEST: 'consult:request',
  CONSULT_ACCEPT: 'consult:accept',
  CONSULT_JOIN: 'consult:join',

  // Clinical decisions (DOCTOR only)
  CASE_VIEW_ASSIGNED: 'case:view-assigned',
  CLINICAL_NOTES_ADD: 'clinical:notes',
  CLINICAL_DECISION_FINAL: 'clinical:decision',
  PRESCRIPTION_CREATE: 'prescription:create',
  REFERRAL_CREATE: 'referral:create',
  FOLLOWUP_SET: 'followup:set',
  AI_OVERRIDE: 'ai:override',

  // Administration (ADMIN only)
  STAFF_MANAGE: 'staff:manage',
  ROLE_ASSIGN: 'role:assign',
  SYSTEM_CONFIG: 'system:config',
  DOCTOR_SLOTS_MANAGE: 'slots:manage',
  RAG_SOURCES_MANAGE: 'rag:manage',
  AUDIT_VIEW: 'audit:view',
  ANALYTICS_VIEW: 'analytics:view'
});

const P = PERMISSIONS;

export const ROLE_PERMISSIONS = Object.freeze({
  CLINIC_ASSISTANT: [
    P.PATIENT_CREATE, P.PATIENT_UPDATE, P.PATIENT_VIEW,
    P.VISIT_CREATE, P.VITALS_RECORD,
    P.DOCUMENT_UPLOAD, P.OCR_START,
    P.AI_ASSESS_START, P.AI_SUMMARY_VIEW,
    P.CONSULT_REQUEST, P.CONSULT_JOIN
  ],
  DOCTOR: [
    P.PATIENT_VIEW,
    P.CASE_VIEW_ASSIGNED,
    P.AI_SUMMARY_VIEW, P.AI_RAG_SOURCES_VIEW, P.AI_OVERRIDE,
    P.CONSULT_ACCEPT, P.CONSULT_JOIN,
    P.CLINICAL_NOTES_ADD, P.CLINICAL_DECISION_FINAL,
    P.PRESCRIPTION_CREATE, P.REFERRAL_CREATE, P.FOLLOWUP_SET
  ],
  ADMIN: [
    P.STAFF_MANAGE, P.ROLE_ASSIGN, P.SYSTEM_CONFIG,
    P.DOCTOR_SLOTS_MANAGE, P.RAG_SOURCES_MANAGE,
    P.AUDIT_VIEW, P.ANALYTICS_VIEW,
    P.PATIENT_VIEW, P.AI_SUMMARY_VIEW, P.AI_RAG_SOURCES_VIEW
  ]
});

export const roleHasPermission = (role, permission) =>
  (ROLE_PERMISSIONS[role] || []).includes(permission);

/**
 * Explicit denials that hold even for ADMIN — admins manage the system,
 * they never make medical decisions or touch audit history.
 */
export const HARD_DENIALS = Object.freeze({
  ADMIN: [P.PRESCRIPTION_CREATE, P.CLINICAL_DECISION_FINAL],
  CLINIC_ASSISTANT: [P.PRESCRIPTION_CREATE, P.CLINICAL_DECISION_FINAL, P.ROLE_ASSIGN, P.RAG_SOURCES_MANAGE],
  DOCTOR: [P.ROLE_ASSIGN, P.STAFF_MANAGE, P.RAG_SOURCES_MANAGE]
});

export const isHardDenied = (role, permission) =>
  (HARD_DENIALS[role] || []).includes(permission);
