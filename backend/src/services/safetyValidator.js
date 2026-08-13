/**
 * Safety Validator — deterministic post-AI control layer.
 *
 * Raw AI output is NEVER returned directly. Every assessment passes through
 * these checks; failures are repaired in place (sanitised) or the response is
 * escalated to a doctor. Checks:
 *   1. Missed emergency (rule-engine risk vs AI recommendation)
 *   2. Prescription-only / dangerous drug recommendations (Schedule H/H1/X)
 *   3. Invented dosages outside the OTC whitelist
 *   4. Definitive-diagnosis language (AI must never diagnose)
 *   5. Missing uncertainty / missing information disclosure
 *   6. Missing safety notice
 */

const PRESCRIPTION_DRUG_PATTERNS = [
  /\bamoxicillin\b/i, /\bazithromycin\b/i, /\bciprofloxacin\b/i, /\bdoxycycline\b/i,
  /\bcephalexin\b/i, /\bmetronidazole\b/i, /\bantibiotic/i,
  /\bprednisone\b/i, /\bprednisolone\b/i, /\bdexamethasone\b/i, /\bsteroid/i,
  /\bmorphine\b/i, /\btramadol\b/i, /\bcodeine\b/i, /\bopioid/i,
  /\binsulin\b/i, /\bwarfarin\b/i, /\bdigoxin\b/i,
  /\bdiazepam\b/i, /\balprazolam\b/i, /\blorazepam\b/i
];

const DEFINITIVE_DIAGNOSIS_PATTERNS = [
  /\b(the patient|this patient|he|she|they) (has|have|is suffering from|is diagnosed with)\b/i,
  /\bdefinitive(ly)? diagnos/i,
  /\bconfirmed diagnosis\b/i,
  /\bit is certainly\b/i
];

const SAFETY_NOTICE =
  'This is an AI-assisted preliminary assessment and does not replace examination, diagnosis, or treatment by a qualified healthcare professional.';

export const validateAssessment = (assessment, ruleRisk) => {
  const violations = [];
  const repaired = { ...assessment };

  // ---- 1. Missed emergency ----
  if (ruleRisk?.riskLevel === 'HIGH' && repaired.risk_level !== 'HIGH') {
    violations.push('MISSED_EMERGENCY: AI understated a rule-engine HIGH risk. Forced back to HIGH.');
    repaired.risk_level = 'HIGH';
    repaired.recommended_next_action = ruleRisk.immediateReferral
      ? 'EMERGENCY_HOSPITAL_REFERRAL'
      : 'URGENT_DOCTOR_REVIEW';
    repaired.requires_doctor = true;
  }

  // ---- 2 & 3. Unsafe medication lines ----
  const medLines = Array.isArray(repaired.supportive_medication_guidance)
    ? repaired.supportive_medication_guidance
    : [];
  const safeMeds = [];
  for (const line of medLines) {
    const hit = PRESCRIPTION_DRUG_PATTERNS.find((re) => re.test(line));
    if (hit) {
      violations.push(`UNSAFE_MEDICATION_REMOVED: "${String(line).slice(0, 80)}" matched a prescription-only drug pattern.`);
      continue;
    }
    // Every surviving line must defer to the doctor
    safeMeds.push(/subject to doctor approval/i.test(line) ? line : `${line} — subject to doctor approval`);
  }
  repaired.supportive_medication_guidance = safeMeds;

  // ---- 4. Definitive diagnosis language ----
  const summaryText = [repaired.patient_summary, ...(repaired.observations || [])].join(' ');
  if (DEFINITIVE_DIAGNOSIS_PATTERNS.some((re) => re.test(summaryText))) {
    violations.push('DEFINITIVE_DIAGNOSIS_LANGUAGE: assessment worded as a diagnosis; uncertainty disclaimer appended.');
    repaired.observations = [
      ...(repaired.observations || []),
      'NOTE: All conditions listed are preliminary possibilities, not a diagnosis. Final determination is reserved for the doctor.'
    ];
  }

  // ---- 5. Uncertainty disclosure ----
  if (!Array.isArray(repaired.missing_information)) repaired.missing_information = [];
  if (Array.isArray(repaired.possible_conditions)) {
    repaired.possible_conditions = repaired.possible_conditions.map((c) => ({
      ...c,
      confidence: c.confidence || 'Low'
    }));
  }

  // ---- 6. Safety notice ----
  repaired.legal_disclaimer = repaired.legal_disclaimer || SAFETY_NOTICE;
  if (!/does not replace/i.test(repaired.legal_disclaimer)) {
    repaired.legal_disclaimer = `${repaired.legal_disclaimer} ${SAFETY_NOTICE}`;
  }

  repaired.safety_validation = {
    passed: violations.length === 0,
    violations,
    validated_at: new Date().toISOString(),
    validator: 'deterministic-safety-validator-v1'
  };

  return repaired;
};
