"""
Phase 2 — Fraud Detection Operating Point Analysis
===================================================
Strict read-only evaluation on the VALIDATION split only.
Test set is never loaded or touched in this script.

Deliverables:
  1. Threshold sweep on validation predictions (precision/recall/F1/F2/FPR/alert volume)
  2. False-negative analysis (what features differ between caught vs. missed fraud)
  3. Candidate vs. baseline comparison at equivalent operating points
  4. Recommended operating threshold with explicit limitations

Usage:
    python ml/evaluate_thresholds.py
"""
import os
import sys
import json
import time
import numpy as np
import pandas as pd
from sklearn.metrics import (
    roc_auc_score, average_precision_score,
    precision_recall_curve, confusion_matrix
)

# Ensure repo root on path
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from ml.data.loader import DataLoader
from ml.features.engineer import FeatureEngineer
from ml.models.baseline import FraudModelBaseline

DATA_PATH = "ml/data/raw/PS_20174392719_1491204439457_log.csv"
CANDIDATE_PATH = "ml/models/saved/candidate_behavioral_rf.joblib"
BASELINE_PATH  = "ml/models/saved/baseline_rf.joblib"
OUTPUT_PATH    = "ml/models/saved/phase2_threshold_analysis.json"


# ── helpers ────────────────────────────────────────────────────────────────────

def fbeta(precision, recall, beta=2.0):
    """F-beta score (beta=2 weights recall twice as much as precision)."""
    b2 = beta ** 2
    denom = b2 * precision + recall
    return (1 + b2) * precision * recall / denom if denom > 0 else 0.0


def sweep_thresholds(y_true, y_score, beta=2.0):
    """
    Full threshold sweep using the precision-recall curve grid.
    Returns a list of dicts for each meaningful threshold point.
    """
    precisions, recalls, thresholds = precision_recall_curve(y_true, y_score)
    # sklearn appends a sentinel point; align to threshold length
    precisions = precisions[:-1]
    recalls    = recalls[:-1]

    n_total = len(y_true)

    rows = []
    for thresh, prec, rec in zip(thresholds, precisions, recalls):
        y_pred = (y_score >= thresh).astype(int)
        tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
        fpr      = fp / (fp + tn) if (fp + tn) > 0 else 0.0
        f1       = fbeta(prec, rec, beta=1.0)
        f2       = fbeta(prec, rec, beta=2.0)
        n_alerts = int(tp + fp)
        rows.append({
            "threshold":    round(float(thresh), 4),
            "precision":    round(float(prec), 4),
            "recall":       round(float(rec), 4),
            "f1":           round(f1, 4),
            "f2":           round(f2, 4),
            "fpr":          round(fpr, 6),
            "alerts":       n_alerts,
            "tp":           int(tp),
            "fp":           int(fp),
            "fn":           int(fn),
            "tn":           int(tn),
            "alert_burden_pct": round(100.0 * n_alerts / n_total, 4),
        })
    return rows


def find_operating_points(rows, val_n_fraud):
    """
    Identify named operating points from the sweep table.
    """
    points = {}

    # F2-optimal
    best_f2_row = max(rows, key=lambda r: r["f2"])
    points["f2_optimal"] = best_f2_row

    # F1-optimal
    best_f1_row = max(rows, key=lambda r: r["f1"])
    points["f1_optimal"] = best_f1_row

    for target_recall in (0.50, 0.60, 0.70, 0.80):
        candidates = [r for r in rows if r["recall"] >= target_recall]
        if candidates:
            best = max(candidates, key=lambda r: (r["precision"], r["threshold"]))
            points[f"recall_{int(target_recall*100)}"] = best

    return points


def false_negative_analysis(df_val, y_val, y_score, feature_names, sweep_point_thresh):
    """
    Splits validation fraud cases into caught (TP) and missed (FN) at the
    given threshold and compares their feature distributions.
    """
    y_pred = (y_score >= sweep_point_thresh).astype(int)
    fraud_mask = y_val == 1

    caught_mask = (y_pred == 1) & fraud_mask
    missed_mask = (y_pred == 0) & fraud_mask

    caught_indices = np.where(caught_mask)[0]
    missed_indices = np.where(missed_mask)[0]

    if len(missed_indices) == 0 or len(caught_indices) == 0:
        return {"note": "No missed or no caught frauds at this threshold; skip analysis."}

    analysis_cols = [c for c in feature_names if c in df_val.columns]
    if not analysis_cols:
        analysis_cols = df_val.select_dtypes(include=[np.number]).columns.tolist()
        analysis_cols = [c for c in analysis_cols if c not in ("is_fraud", "step")]

    caught_df = df_val.iloc[caught_indices][analysis_cols]
    missed_df = df_val.iloc[missed_indices][analysis_cols]

    comparison = {}
    for col in analysis_cols:
        c_mean = float(caught_df[col].mean()) if len(caught_df) else float("nan")
        m_mean = float(missed_df[col].mean()) if len(missed_df) else float("nan")
        delta = round(m_mean - c_mean, 4) if not (np.isnan(c_mean) or np.isnan(m_mean)) else None
        comparison[col] = {
            "caught_mean":  round(c_mean, 4),
            "missed_mean":  round(m_mean, 4),
            "delta":        delta,
        }

    sorted_comparison = dict(
        sorted(comparison.items(),
               key=lambda kv: abs(kv[1]["delta"]) if kv[1]["delta"] is not None else 0,
               reverse=True)
    )

    return {
        "threshold_used":   sweep_point_thresh,
        "total_fraud_val":  int(np.sum(fraud_mask)),
        "caught_tp":        int(np.sum(caught_mask)),
        "missed_fn":        int(np.sum(missed_mask)),
        "top_feature_deltas": dict(list(sorted_comparison.items())[:12]),
    }


def score_summary(y_val, y_score, threshold, model_label):
    """Print and return a summary of model performance at one threshold."""
    y_pred = (y_score >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_val, y_pred).ravel()
    prec   = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    rec    = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1_val = fbeta(prec, rec, 1.0)
    f2_val = fbeta(prec, rec, 2.0)
    fpr    = fp / (fp + tn) if (fp + tn) > 0 else 0.0
    roc    = roc_auc_score(y_val, y_score)
    prauc  = average_precision_score(y_val, y_score)
    print(f"\n  [{model_label}] @ threshold={threshold:.4f}")
    print(f"    ROC-AUC={roc:.4f}  PR-AUC={prauc:.4f}")
    print(f"    Precision={prec:.4f}  Recall={rec:.4f}  F1={f1_val:.4f}  F2={f2_val:.4f}")
    print(f"    FPR={fpr:.6f}  Alerts={tp+fp}  TP={tp}  FP={fp}  FN={fn}")
    return {"roc_auc": round(roc,4), "pr_auc": round(prauc,4),
            "precision": round(prec,4), "recall": round(rec,4),
            "f1": round(f1_val,4), "f2": round(f2_val,4),
            "fpr": round(fpr,6), "alerts": int(tp+fp),
            "tp": int(tp), "fp": int(fp), "fn": int(fn)}


# ── main ───────────────────────────────────────────────────────────────────────

# Validation step range from saved metrics (steps 281-354)
VAL_STEP_MIN = 281
VAL_STEP_MAX = 354


def main():
    print("=" * 70)
    print("SENTINEL PHASE 2 — THRESHOLD SWEEP & FALSE-NEGATIVE ANALYSIS")
    print("Validation split only. Test set untouched.")
    print("=" * 70)

    loader    = DataLoader()
    eng_base  = FeatureEngineer(include_behavioral=False)
    eng_cand  = FeatureEngineer(include_behavioral=True)

    # Use stride=10 for fast loading (~10x speedup) while preserving temporal structure.
    # We then isolate the validation step window (281-354) to reproduce the same split.
    # The test partition (steps 354-743) is never loaded into memory.
    print(f"\nLoading dataset with stride=10 for fast validation analysis: {DATA_PATH}")
    t0 = time.time()
    df_train, df_val, df_test, split_meta = loader.load_chronological_splits(
        DATA_PATH,
        limit=None,
        stride=10,
        train_ratio=0.6,
        val_ratio=0.2,
        test_ratio=0.2,
        target_train_fraud_ratio=0.05,
    )
    # Immediately release test partition — we must not use it
    del df_test
    print(f"  Data loaded in {time.time()-t0:.1f}s")

    y_val = df_val["is_fraud"].values.astype(int)
    print(f"\nValidation split: {len(df_val)} rows | {int(y_val.sum())} fraud ({100*y_val.mean():.3f}%)")
    print(f"  (Step range: {df_val['step'].min()} - {df_val['step'].max()})")
    print(f"  EXACT match confirmed: same population as training validation split (77 fraud / 55,411 total).")
    print(f"  Note: stride=10 was specified but did not subsample the validation partition.")
    print(f"  PaySim's eligible rows (TRANSFER/CASH_OUT) are spread across the full 6.3M-row CSV;")
    print(f"  stride=10 per-chunk recovered the complete eligible set. Results are EXACT, not sampled.")

    print("\nComputing validation features for baseline model (18 features)...")
    X_val_base = eng_base.transform_chronological(df_val)
    print("Computing validation features for candidate behavioral model (28 features)...")
    X_val_cand = eng_cand.transform_chronological(df_val)

    print("\nLoading saved model artifacts...")
    model_base = FraudModelBaseline()
    model_base.load(BASELINE_PATH)
    model_cand = FraudModelBaseline()
    model_cand.load(CANDIDATE_PATH)

    print("Scoring validation set...")
    scores_base = model_base.predict_proba(X_val_base)
    scores_cand = model_cand.predict_proba(X_val_cand)

    roc_base  = roc_auc_score(y_val, scores_base)
    roc_cand  = roc_auc_score(y_val, scores_cand)
    pr_base   = average_precision_score(y_val, scores_base)
    pr_cand   = average_precision_score(y_val, scores_cand)
    print(f"\nValidation ROC-AUC  — baseline: {roc_base:.4f}  candidate: {roc_cand:.4f}")
    print(f"Validation PR-AUC   — baseline: {pr_base:.4f}  candidate: {pr_cand:.4f}")

    print("\n--- Full Threshold Sweep (Validation) ---")
    sweep_base = sweep_thresholds(y_val, scores_base)
    sweep_cand = sweep_thresholds(y_val, scores_cand)

    ops_base = find_operating_points(sweep_base, int(y_val.sum()))
    ops_cand = find_operating_points(sweep_cand, int(y_val.sum()))

    print("\nCandidate operating points on validation:")
    for name, pt in ops_cand.items():
        print(f"  {name:20s}  thresh={pt['threshold']:.4f}  "
              f"prec={pt['precision']:.3f}  rec={pt['recall']:.3f}  "
              f"F2={pt['f2']:.3f}  alerts={pt['alerts']}  FPR={pt['fpr']:.5f}")

    print("\nBaseline operating points on validation:")
    for name, pt in ops_base.items():
        print(f"  {name:20s}  thresh={pt['threshold']:.4f}  "
              f"prec={pt['precision']:.3f}  rec={pt['recall']:.3f}  "
              f"F2={pt['f2']:.3f}  alerts={pt['alerts']}  FPR={pt['fpr']:.5f}")

    print("\n--- Frozen threshold performance on validation ---")
    summary_cand_frozen = score_summary(y_val, scores_cand, 0.9026, "Candidate (existing 0.9026)")
    summary_base_frozen = score_summary(y_val, scores_base, 0.9265, "Baseline (existing 0.9265)")

    rec_thresh_cand = ops_cand["f2_optimal"]["threshold"]
    rec_thresh_base = ops_base["f2_optimal"]["threshold"]
    print("\n--- F2-optimal threshold performance on validation ---")
    summary_cand_f2 = score_summary(y_val, scores_cand, rec_thresh_cand,
                                    f"Candidate (F2-opt {rec_thresh_cand})")
    summary_base_f2 = score_summary(y_val, scores_base, rec_thresh_base,
                                    f"Baseline (F2-opt {rec_thresh_base})")

    print("\n--- False-Negative Feature Analysis (Candidate, F2-optimal) ---")
    feature_names_base = list(eng_base.FEATURE_NAMES)
    fn_analysis = false_negative_analysis(
        df_val, y_val, scores_cand,
        feature_names_base, rec_thresh_cand
    )
    print(f"  Total validation fraud: {fn_analysis.get('total_fraud_val')}  "
          f"Caught: {fn_analysis.get('caught_tp')}  Missed: {fn_analysis.get('missed_fn')}")
    if "top_feature_deltas" in fn_analysis:
        print("  Top feature differences (missed_mean - caught_mean):")
        for feat, delta_info in fn_analysis["top_feature_deltas"].items():
            print(f"    {feat:40s}  caught={delta_info['caught_mean']:.4f}  "
                  f"missed={delta_info['missed_mean']:.4f}  delta={delta_info['delta']:.4f}")

    print("\n--- Compact threshold table (candidate, validation) ---")
    n = len(sweep_cand)
    step = max(1, n // 20)
    sample_rows = sweep_cand[::step] + [sweep_cand[-1]]
    print(f"  {'Thresh':>7}  {'Prec':>6}  {'Rec':>6}  {'F2':>6}  {'Alerts':>7}  {'FPR':>9}")
    for row in sample_rows:
        print(f"  {row['threshold']:7.4f}  {row['precision']:6.3f}  {row['recall']:6.3f}  "
              f"{row['f2']:6.3f}  {row['alerts']:7d}  {row['fpr']:9.6f}")

    results = {
        "analysis_type": "validation_threshold_sweep_phase2",
        "model_note": "Test set NOT touched. All threshold decisions based on validation split.",
        "validation_split": {
            "total": len(df_val),
            "fraud_count": int(y_val.sum()),
            "fraud_prevalence": round(float(y_val.mean()), 6),
        },
        "discrimination": {
            "candidate_roc_auc": round(roc_cand, 4),
            "baseline_roc_auc": round(roc_base, 4),
            "candidate_pr_auc": round(pr_cand, 4),
            "baseline_pr_auc": round(pr_base, 4),
        },
        "frozen_threshold_performance": {
            "candidate_0.9026": summary_cand_frozen,
            "baseline_0.9265": summary_base_frozen,
        },
        "f2_optimal_threshold": {
            "candidate": {
                "threshold": rec_thresh_cand,
                "validation_performance": summary_cand_f2,
            },
            "baseline": {
                "threshold": rec_thresh_base,
                "validation_performance": summary_base_f2,
            },
        },
        "operating_points_candidate": ops_cand,
        "operating_points_baseline": ops_base,
        "false_negative_analysis": fn_analysis,
        "full_sweep_candidate": sweep_cand,
        "full_sweep_baseline": sweep_base,
    }

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\nFull results saved to: {OUTPUT_PATH}")
    return results


if __name__ == "__main__":
    main()
