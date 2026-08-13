#!/usr/bin/env python3
"""
Disease & Symptom model training pipeline.

Downloads the Kaggle dataset `choongqianzheng/disease-and-symptoms-dataset`
via kagglehub, trains a Bernoulli Naive Bayes classifier
(P(disease | symptoms)), evaluates it on a held-out split, and exports a
compact JSON model consumed by the Node backend
(backend/src/services/diseasePredictor.js).

Usage:
    python3 ml/train_disease_model.py

Output:
    backend/src/data/disease_symptom_model.json
"""

import json
import math
import os
import random
from collections import defaultdict

import kagglehub
import pandas as pd

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_PATH = os.path.join(REPO_ROOT, "backend", "src", "data", "disease_symptom_model.json")
ALPHA = 1.0          # Laplace smoothing
TEST_FRACTION = 0.2
SEED = 42


def normalize_symptom(raw: str) -> str:
    return " ".join(str(raw).strip().lower().replace("_", " ").split())


def load_dataset():
    path = kagglehub.dataset_download("choongqianzheng/disease-and-symptoms-dataset")
    symptoms_df = pd.read_csv(os.path.join(path, "DiseaseAndSymptoms.csv"))
    precautions_df = pd.read_csv(os.path.join(path, "Disease precaution.csv"))
    return symptoms_df, precautions_df


def to_records(symptoms_df):
    symptom_cols = [c for c in symptoms_df.columns if c.startswith("Symptom_")]
    records = []
    for _, row in symptoms_df.iterrows():
        disease = str(row["Disease"]).strip()
        symptoms = {
            normalize_symptom(row[c])
            for c in symptom_cols
            if pd.notna(row[c]) and normalize_symptom(row[c])
        }
        if disease and symptoms:
            records.append((disease, symptoms))
    return records


def train(records):
    """Bernoulli NB: per-disease symptom probabilities + priors."""
    disease_counts = defaultdict(int)
    symptom_counts = defaultdict(lambda: defaultdict(int))
    vocabulary = set()

    for disease, symptoms in records:
        disease_counts[disease] += 1
        for s in symptoms:
            symptom_counts[disease][s] += 1
            vocabulary.add(s)

    total = sum(disease_counts.values())
    model = {}
    for disease, n in disease_counts.items():
        probs = {
            s: (symptom_counts[disease][s] + ALPHA) / (n + 2 * ALPHA)
            for s in symptom_counts[disease]
        }
        model[disease] = {
            "prior": n / total,
            "record_count": n,
            "symptom_probs": probs,
        }
    return model, sorted(vocabulary)


def predict(model, vocabulary, symptoms, default_prob=None):
    """Return diseases ranked by log-posterior."""
    scores = {}
    vocab_set = set(vocabulary)
    present = {s for s in symptoms if s in vocab_set}
    for disease, params in model.items():
        logp = math.log(params["prior"])
        n = params["record_count"]
        absent_prob = ALPHA / (n + 2 * ALPHA)  # unseen symptom for this disease
        for s in present:
            logp += math.log(params["symptom_probs"].get(s, absent_prob))
        scores[disease] = logp
    return sorted(scores.items(), key=lambda kv: kv[1], reverse=True)


def evaluate(model, vocabulary, test_records):
    top1 = top3 = 0
    for disease, symptoms in test_records:
        ranking = [d for d, _ in predict(model, vocabulary, symptoms)[:3]]
        if ranking and ranking[0] == disease:
            top1 += 1
        if disease in ranking:
            top3 += 1
    n = len(test_records) or 1
    return top1 / n, top3 / n


def main():
    print("1/5 Downloading dataset from Kaggle...")
    symptoms_df, precautions_df = load_dataset()
    records = to_records(symptoms_df)
    print(f"    {len(records)} records, {symptoms_df['Disease'].nunique()} diseases")

    print("2/5 Splitting train/test...")
    random.Random(SEED).shuffle(records)
    split = int(len(records) * (1 - TEST_FRACTION))
    train_records, test_records = records[:split], records[split:]

    print("3/5 Training Bernoulli Naive Bayes...")
    model, vocabulary = train(train_records)

    print("4/5 Evaluating on held-out split...")
    top1, top3 = evaluate(model, vocabulary, test_records)
    print(f"    top-1 accuracy: {top1:.3f} | top-3 accuracy: {top3:.3f} ({len(test_records)} test cases)")

    print("5/5 Exporting JSON model for the Node backend...")
    precautions = {}
    for _, row in precautions_df.iterrows():
        disease = str(row["Disease"]).strip()
        precautions[disease] = [
            str(row[c]).strip()
            for c in precautions_df.columns
            if c.startswith("Precaution_") and pd.notna(row[c]) and str(row[c]).strip()
        ]

    # Retrain on the FULL dataset for the shipped model
    full_model, full_vocab = train(records)
    export = {
        "meta": {
            "source": "kaggle:choongqianzheng/disease-and-symptoms-dataset",
            "algorithm": "bernoulli-naive-bayes",
            "alpha": ALPHA,
            "trained_records": len(records),
            "diseases": len(full_model),
            "vocabulary_size": len(full_vocab),
            "holdout_top1_accuracy": round(top1, 4),
            "holdout_top3_accuracy": round(top3, 4),
        },
        "vocabulary": full_vocab,
        "diseases": {
            d: {
                "prior": round(p["prior"], 6),
                "record_count": p["record_count"],
                "symptom_probs": {s: round(v, 5) for s, v in p["symptom_probs"].items()},
                "precautions": precautions.get(d, []),
            }
            for d, p in full_model.items()
        },
    }

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(export, f, indent=1)
    print(f"    Wrote {OUTPUT_PATH} ({os.path.getsize(OUTPUT_PATH) // 1024} KB)")


if __name__ == "__main__":
    main()
