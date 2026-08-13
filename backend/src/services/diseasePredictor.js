/**
 * Disease Predictor — clinical decision-support inference.
 *
 * Loads the Bernoulli Naive Bayes model trained by ml/train_disease_model.py
 * on the Kaggle disease-and-symptoms dataset and ranks POSSIBLE conditions
 * from free-text symptoms. Output is preliminary decision support only —
 * never a diagnosis; the doctor makes the medical decision.
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODEL_PATH = path.join(__dirname, '../data/disease_symptom_model.json');

let MODEL = null;
try {
  MODEL = JSON.parse(readFileSync(MODEL_PATH, 'utf-8'));
  console.log(
    `🧠 Disease model loaded: ${MODEL.meta.diseases} diseases, ` +
    `${MODEL.meta.vocabulary_size} symptoms, holdout top-3 accuracy ${MODEL.meta.holdout_top3_accuracy}`
  );
} catch (err) {
  console.warn('Disease model not found — run `python3 ml/train_disease_model.py` to train it.', err.message);
}

const normalize = (s) => String(s || '').toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Extract known model symptoms from free clinical text.
 * Matches multi-word vocabulary entries first, then token-level entries.
 */
export const extractSymptoms = (freeText) => {
  if (!MODEL) return [];
  const text = ` ${normalize(freeText)} `;
  const found = new Set();

  for (const symptom of MODEL.vocabulary) {
    if (text.includes(` ${symptom} `) || text.includes(symptom)) {
      found.add(symptom);
      continue;
    }
    // Loose match: every significant word of a multi-word symptom appears in the text
    const words = symptom.split(' ').filter((w) => w.length > 3);
    if (words.length >= 2 && words.every((w) => text.includes(w))) {
      found.add(symptom);
    }
  }
  return [...found];
};

const confidenceFor = (probability, matchedCount) => {
  if (matchedCount === 0) return 'Low';
  if (probability >= 0.75 && matchedCount >= 3) return 'High';
  if (probability >= 0.35 && matchedCount >= 2) return 'Moderate';
  return 'Low';
};

/**
 * Rank possible conditions for the given free-text symptoms.
 * Returns { matched_symptoms, possible_conditions[], model_meta }.
 */
export const predictConditions = (freeText, topN = 5) => {
  if (!MODEL) {
    return { matched_symptoms: [], possible_conditions: [], model_meta: null };
  }

  const matched = extractSymptoms(freeText);
  if (matched.length === 0) {
    return {
      matched_symptoms: [],
      possible_conditions: [],
      model_meta: MODEL.meta,
      note: 'No symptoms in the trained vocabulary were recognized — insufficient information for condition ranking.'
    };
  }

  const alpha = MODEL.meta.alpha ?? 1.0;
  const scored = [];

  for (const [disease, params] of Object.entries(MODEL.diseases)) {
    const unseenProb = alpha / (params.record_count + 2 * alpha);
    let logp = Math.log(params.prior);
    const supporting = [];
    const missing = [];

    for (const s of matched) {
      const p = params.symptom_probs[s];
      logp += Math.log(p ?? unseenProb);
      if (p && p > 0.05) supporting.push(s);
    }
    // Hallmark symptoms of this disease the patient did NOT report
    for (const [s, p] of Object.entries(params.symptom_probs)) {
      if (p >= 0.5 && !matched.includes(s)) missing.push(s);
    }

    scored.push({ disease, logp, supporting, missing: missing.slice(0, 5), precautions: params.precautions });
  }

  scored.sort((a, b) => b.logp - a.logp);
  const top = scored.slice(0, topN);

  // Softmax over the top-N log-posteriors → relative probabilities
  const maxLog = top[0].logp;
  const exps = top.map((t) => Math.exp(t.logp - maxLog));
  const sumExp = exps.reduce((a, b) => a + b, 0);

  const possible_conditions = top.map((t, i) => {
    const probability = exps[i] / sumExp;
    return {
      condition: t.disease,
      relative_probability: Number(probability.toFixed(3)),
      confidence: confidenceFor(probability, t.supporting.length),
      supporting_evidence: t.supporting,
      missing_or_contradicting: t.missing,
      general_precautions: t.precautions
    };
  }).filter((c) => c.relative_probability >= 0.01 || c.supporting_evidence.length > 0);

  return { matched_symptoms: matched, possible_conditions, model_meta: MODEL.meta };
};

export const isModelLoaded = () => Boolean(MODEL);
