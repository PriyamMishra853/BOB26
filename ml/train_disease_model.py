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
import logging
import argparse
from collections import defaultdict
from typing import Tuple, List, Dict, Set, Any

import kagglehub
import pandas as pd

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_OUTPUT_PATH = os.path.join(REPO_ROOT, "backend", "src", "data", "disease_symptom_model.json")
DEFAULT_ALPHA = 1.0          # Laplace smoothing
DEFAULT_TEST_FRACTION = 0.2
DEFAULT_SEED = 42

def normalize_symptom(raw: str) -> str:
    """Normalize symptom string."""
    return " ".join(str(raw).strip().lower().replace("_", " ").split())

def load_dataset() -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Download and load dataset."""
    logger.info("Downloading dataset from Kaggle...")
    try:
        path = kagglehub.dataset_download("choongqianzheng/disease-and-symptoms-dataset")
    except Exception as e:
        logger.error(f"Failed to download dataset from Kaggle: {e}")
        raise

    try:
        symptoms_df = pd.read_csv(os.path.join(path, "DiseaseAndSymptoms.csv"))
        precautions_df = pd.read_csv(os.path.join(path, "Disease precaution.csv"))
    except FileNotFoundError as e:
        logger.error(f"Dataset files not found: {e}")
        raise
    except Exception as e:
        logger.error(f"Error reading CSV files: {e}")
        raise

    return symptoms_df, precautions_df

def to_records(symptoms_df: pd.DataFrame) -> List[Tuple[str, Set[str]]]:
    """Convert dataframe to a list of disease-symptoms records."""
    if "Disease" not in symptoms_df.columns:
        raise KeyError("Column 'Disease' missing from symptoms dataset.")

    symptom_cols = [c for c in symptoms_df.columns if c.startswith("Symptom_")]
    records = []
    
    for _, row in symptoms_df.iterrows():
        disease = str(row["Disease"]).strip()
        if not disease or disease.lower() == 'nan':
            continue
            
        symptoms = {
            normalize_symptom(row[c])
            for c in symptom_cols
            if pd.notna(row[c]) and normalize_symptom(row[c])
        }
        if disease and symptoms:
            records.append((disease, symptoms))
    return records

def train(records: List[Tuple[str, Set[str]]], alpha: float) -> Tuple[Dict[str, Any], List[str]]:
    """Bernoulli NB: per-disease symptom probabilities + priors."""
    disease_counts: Dict[str, int] = defaultdict(int)
    symptom_counts: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
    vocabulary: Set[str] = set()

    for disease, symptoms in records:
        disease_counts[disease] += 1
        for s in symptoms:
            symptom_counts[disease][s] += 1
            vocabulary.add(s)

    total = sum(disease_counts.values())
    model = {}
    for disease, n in disease_counts.items():
        probs = {
            s: (symptom_counts[disease][s] + alpha) / (n + 2 * alpha)
            for s in symptom_counts[disease]
        }
        model[disease] = {
            "prior": n / total,
            "record_count": n,
            "symptom_probs": probs,
        }
    return model, sorted(vocabulary)

def predict(model: Dict[str, Any], vocabulary: List[str], symptoms: Set[str], alpha: float) -> List[Tuple[str, float]]:
    """Return diseases ranked by log-posterior."""
    scores = {}
    vocab_set = set(vocabulary)
    present = {s for s in symptoms if s in vocab_set}
    
    for disease, params in model.items():
        logp = math.log(params["prior"])
        n = params["record_count"]
        absent_prob = alpha / (n + 2 * alpha)  # unseen symptom for this disease
        for s in present:
            logp += math.log(params["symptom_probs"].get(s, absent_prob))
        scores[disease] = logp
        
    return sorted(scores.items(), key=lambda kv: kv[1], reverse=True)

def evaluate(model: Dict[str, Any], vocabulary: List[str], test_records: List[Tuple[str, Set[str]]], alpha: float) -> Tuple[float, float]:
    """Evaluate top-1 and top-3 accuracy on the test set."""
    top1 = top3 = 0
    for disease, symptoms in test_records:
        ranking = [d for d, _ in predict(model, vocabulary, symptoms, alpha)[:3]]
        if ranking and ranking[0] == disease:
            top1 += 1
        if disease in ranking:
            top3 += 1
    n = len(test_records) or 1
    return top1 / n, top3 / n

def main():
    parser = argparse.ArgumentParser(description="Train Disease & Symptom Model")
    parser.add_argument("--output", type=str, default=DEFAULT_OUTPUT_PATH, help="Output path for the JSON model")
    parser.add_argument("--alpha", type=float, default=DEFAULT_ALPHA, help="Laplace smoothing parameter")
    parser.add_argument("--test-fraction", type=float, default=DEFAULT_TEST_FRACTION, help="Fraction of data to use for testing")
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED, help="Random seed for data splitting")
    
    args = parser.parse_args()

    logger.info("Step 1/5: Loading dataset")
    try:
        symptoms_df, precautions_df = load_dataset()
    except Exception:
        logger.critical("Failed to load dataset. Exiting.")
        return

    try:
        records = to_records(symptoms_df)
    except Exception as e:
        logger.critical(f"Failed to parse records: {e}")
        return

    logger.info(f"Loaded {len(records)} records for {symptoms_df.get('Disease', pd.Series()).nunique()} diseases")

    logger.info("Step 2/5: Splitting train/test")
    random.Random(args.seed).shuffle(records)
    split = int(len(records) * (1 - args.test_fraction))
    train_records, test_records = records[:split], records[split:]
    logger.info(f"Train size: {len(train_records)}, Test size: {len(test_records)}")

    logger.info("Step 3/5: Training Bernoulli Naive Bayes")
    model, vocabulary = train(train_records, args.alpha)

    logger.info("Step 4/5: Evaluating on held-out split")
    top1, top3 = evaluate(model, vocabulary, test_records, args.alpha)
    logger.info(f"Top-1 accuracy: {top1:.3f} | Top-3 accuracy: {top3:.3f}")

    logger.info("Step 5/5: Exporting JSON model for the Node backend")
    precautions = {}
    if "Disease" in precautions_df.columns:
        for _, row in precautions_df.iterrows():
            disease = str(row["Disease"]).strip()
            if not disease or disease.lower() == 'nan':
                continue
            precautions[disease] = [
                str(row[c]).strip()
                for c in precautions_df.columns
                if c.startswith("Precaution_") and pd.notna(row[c]) and str(row[c]).strip()
            ]

    # Retrain on the FULL dataset for the shipped model
    full_model, full_vocab = train(records, args.alpha)
    export = {
        "meta": {
            "source": "kaggle:choongqianzheng/disease-and-symptoms-dataset",
            "algorithm": "bernoulli-naive-bayes",
            "alpha": args.alpha,
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

    try:
        os.makedirs(os.path.dirname(args.output), exist_ok=True)
        with open(args.output, "w") as f:
            json.dump(export, f, indent=1)
        logger.info(f"Successfully wrote {args.output} ({os.path.getsize(args.output) // 1024} KB)")
    except Exception as e:
        logger.error(f"Failed to save model JSON: {e}")

if __name__ == "__main__":
    main()
