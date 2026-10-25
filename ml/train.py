"""
Standalone Training & Evaluation CLI for Sentinel Fraud Detection Pipeline.
Usage:
    python ml/train.py [--data-path ml/data/raw/PS_log.csv] [--limit 100000] [--test-size 0.2]
    python ml/train.py --fraud-enriched --limit 50000
"""
import os
import sys
import argparse
import logging
import json

# Ensure repository root is on sys.path
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from ml.data.loader import DataLoader
from ml.features.engineer import FeatureEngineer
from ml.models.baseline import FraudModelBaseline
from ml.evaluation.metrics import ModelEvaluator

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("sentinel.ml.train")


def run_training_pipeline(
    data_path: str | None = None,
    limit: int | None = None,
    train_ratio: float = 0.6,
    val_ratio: float = 0.2,
    test_ratio: float = 0.2,
    output_model_path: str | None = None,
    fraud_ratio: float = 0.05,
    stride: int = 1,
    include_behavioral: bool = False,
    legacy_enriched: bool = False,
    n_estimators: int = 200,
    max_depth: int = 16,
) -> dict:
    """
    Executes end-to-end dataset loading, zero-lookahead feature extraction,
    chronological splitting, baseline model training, and performance evaluation.

    Phase 2C/3 Architecture:
    1. Chronological 3-way split (Train / Validation / Test) strictly by time.
    2. Negative downsampling is applied strictly to Train; Validation & Test have NATURAL distribution.
    3. Zero-lookahead feature extraction without data leakage.
    4. Optional Behavioral Fingerprinting integration for candidate model benchmarking.
    5. Decision threshold is tuned on held-out Validation, NOT training in-sample or test set.
    6. Final evaluation is conducted on Test set with frozen validation threshold.
    """
    loader = DataLoader()
    engineer = FeatureEngineer(include_behavioral=include_behavioral)

    # Resolve output path: preserve validated baseline unless explicitly specified
    if output_model_path is None:
        output_model_path = (
            "ml/models/saved/candidate_behavioral_rf.joblib"
            if include_behavioral
            else "ml/models/saved/baseline_rf.joblib"
        )

    # 1. Check dataset availability
    resolved_path = data_path or DataLoader.check_dataset_availability("ml/data/raw")
    if not resolved_path or not os.path.exists(resolved_path):
        logger.warning(
            "No real transaction dataset found in 'ml/data/raw/'.\n"
            "To train a production model, place PaySim ('PS_20174392719_1491204439457_log.csv') "
            "or a canonical Sentinel CSV into 'ml/data/raw/'."
        )
        return {
            "status": "dataset_unavailable",
            "message": "Real training aborted: ml/data/raw/ contains no dataset files.",
            "expected_directory": "ml/data/raw/",
        }

    if legacy_enriched:
        # Legacy Phase 2B execution path (for ablation / comparative reference)
        logger.info(f"[LEGACY MODE] Loading fraud-enriched dataset from: {resolved_path} (limit={limit}, fraud_ratio={fraud_ratio})")
        df = loader.load_fraud_enriched(resolved_path, limit=limit, fraud_ratio=fraud_ratio)
        X_raw, y, metadata = loader.separate_features_and_labels(df)
        X_features = engineer.transform_chronological(df)
        X_train, X_test, y_train, y_test = FraudModelBaseline.chronological_train_test_split(
            X_features, y, test_size=test_ratio
        )
        model = FraudModelBaseline(model_version="v2.0-rf-legacy-enriched", n_estimators=n_estimators, max_depth=max_depth)
        model.fit(X_train, y_train)

        y_test_scores = model.predict_proba(X_test)
        eval_metrics = ModelEvaluator.evaluate_predictions(y_test, y_test_scores, threshold=model.optimal_threshold)
        eval_metrics["methodology"] = "legacy_fraud_enriched_pre_split"
        split_meta = {"mode": "legacy_enriched", "train_size": len(X_train), "test_size": len(X_test)}
        X_val, y_val = None, None
    else:
        # Phase 2C/3 Leak-Free Rigorous Pipeline
        mode_label = "CANDIDATE BEHAVIORAL" if include_behavioral else "VALIDATED BASELINE"
        logger.info(f"[{mode_label} CHRONOLOGICAL 3-WAY PIPELINE] Loading: {resolved_path} (limit={limit}, stride={stride})")
        df_train, df_val, df_test, split_meta = loader.load_chronological_splits(
            resolved_path,
            limit=limit,
            train_ratio=train_ratio,
            val_ratio=val_ratio,
            test_ratio=test_ratio,
            target_train_fraud_ratio=fraud_ratio,
            stride=stride,
        )

        logger.info("Computing zero-lookahead chronological features across partitions...")
        X_train = engineer.transform_chronological(df_train)
        X_val = engineer.transform_chronological(df_val)
        X_test = engineer.transform_chronological(df_test)

        y_train = df_train["is_fraud"].copy()
        y_val = df_val["is_fraud"].copy()
        y_test = df_test["is_fraud"].copy()

        version_tag = "v3.0-rf-behavioral-candidate" if include_behavioral else "v2.1-rf-chronological-validated"
        logger.info(f"Feature extraction complete ({len(engineer.engineered_feature_names)} features per event).")
        logger.info(f"Fitting FraudModelBaseline ({version_tag}, n_estimators={n_estimators}, max_depth={max_depth})...")
        model = FraudModelBaseline(
            model_version=version_tag,
            n_estimators=n_estimators,
            max_depth=max_depth,
        )
        model.fit(X_train, y_train)

        # Tune decision threshold on held-out validation set (NATURAL prevalence)
        logger.info("Tuning decision threshold on held-out VALIDATION partition (natural prevalence)...")
        opt_thresh = model.tune_threshold(X_val, y_val, beta=2.0)
        logger.info(f"Validation F2-optimal decision threshold: {opt_thresh:.4f}")

        # Evaluate on validation set
        y_val_scores = model.predict_proba(X_val)
        val_eval = ModelEvaluator.evaluate_predictions(y_val, y_val_scores, threshold=opt_thresh)
        logger.info("--- Validation Set Performance (Natural Prevalence) ---")
        _log_metrics(val_eval)

        # Evaluate on held-out test set (NATURAL prevalence, frozen threshold)
        logger.info("Evaluating on strictly held-out TEST partition (natural prevalence, frozen threshold)...")
        y_test_scores = model.predict_proba(X_test)

        eval_05 = ModelEvaluator.evaluate_predictions(
            y_test, y_test_scores, threshold=0.5,
            target_recall_benchmarks=[0.80, 0.90, 0.95],
        )
        logger.info("--- Test Set Performance at default threshold=0.5 ---")
        _log_metrics(eval_05)

        eval_optimal = ModelEvaluator.evaluate_predictions(
            y_test, y_test_scores, threshold=opt_thresh,
            target_recall_benchmarks=[0.80, 0.90, 0.95],
        )
        logger.info(f"--- Test Set Performance at validation-tuned threshold={opt_thresh:.4f} ---")
        _log_metrics(eval_optimal)

        eval_metrics = eval_optimal
        eval_metrics["methodology"] = "chronological_3way_leak_free_natural_eval"
        eval_metrics["optimal_threshold"] = opt_thresh
        eval_metrics["validation_metrics"] = val_eval
        eval_metrics["threshold_0.5_results"] = {
            "precision": eval_05["precision"],
            "recall": eval_05["recall"],
            "f1_score": eval_05["f1_score"],
            "confusion_matrix": eval_05["confusion_matrix"],
        }
        eval_metrics["split_metadata"] = split_meta

    # Log top feature importances
    sorted_feats = sorted(model.feature_importances_.items(), key=lambda x: x[1], reverse=True)
    logger.info("Top feature importances:")
    for feat_name, importance in sorted_feats[:10]:
        logger.info(f"  {feat_name}: {importance:.4f}")

    eval_metrics["feature_importances"] = dict(sorted_feats)

    # Persist Artifacts
    os.makedirs(os.path.dirname(output_model_path), exist_ok=True)
    model.save(output_model_path)
    logger.info(f"Saved model artifact to {output_model_path}")

    metrics_path = os.path.splitext(output_model_path)[0] + "_metrics.json"
    with open(metrics_path, "w") as f:
        json.dump(eval_metrics, f, indent=2)
    logger.info(f"Saved evaluation metrics to {metrics_path}")

    return {
        "status": "success",
        "data_path": resolved_path,
        "metrics": eval_metrics,
        "model_artifact": output_model_path,
        "split_metadata": split_meta,
    }


def _log_metrics(metrics: dict) -> None:
    """Helper to log evaluation metrics consistently."""
    logger.info(
        f"  ROC-AUC: {metrics['roc_auc']}\n"
        f"  PR-AUC:  {metrics['pr_auc']}\n"
        f"  Precision: {metrics['precision']}\n"
        f"  Recall:    {metrics['recall']}\n"
        f"  F1-Score:  {metrics['f1_score']}\n"
        f"  Confusion Matrix: {metrics['confusion_matrix']}"
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sentinel ML Model Training Pipeline")
    parser.add_argument("--data-path", type=str, default=None, help="Path to raw transaction CSV or Parquet")
    parser.add_argument("--limit", type=int, default=None, help="Maximum rows to load for training/evaluation")
    parser.add_argument("--train-ratio", type=float, default=0.6, help="Fraction for train partition (default: 0.6)")
    parser.add_argument("--val-ratio", type=float, default=0.2, help="Fraction for validation partition (default: 0.2)")
    parser.add_argument("--test-ratio", type=float, default=0.2, help="Fraction for test partition (default: 0.2)")
    parser.add_argument("--output", type=str, default=None, help="Output artifact path (defaults by model type)")
    parser.add_argument("--fraud-ratio", type=float, default=0.05,
                        help="Target fraud prevalence for training set downsampling (default: 0.05)")
    parser.add_argument("--stride", type=int, default=1,
                        help="Uniform temporal sampling stride (e.g., 10 to sample across entire multi-week timeline)")
    parser.add_argument("--include-behavioral", action="store_true", default=False,
                        help="Train candidate model with account-level behavioral fingerprint features")
    parser.add_argument("--legacy-enriched", action="store_true", default=False,
                        help="Run legacy Phase 2B pre-split enrichment (for comparison)")
    parser.add_argument("--fraud-enriched", action="store_true", default=False,
                        help="Alias for legacy compatibility")
    args = parser.parse_args()

    use_legacy = args.legacy_enriched or args.fraud_enriched

    result = run_training_pipeline(
        data_path=args.data_path,
        limit=args.limit,
        train_ratio=args.train_ratio,
        val_ratio=args.val_ratio,
        test_ratio=args.test_ratio,
        output_model_path=args.output,
        fraud_ratio=args.fraud_ratio,
        stride=args.stride,
        include_behavioral=args.include_behavioral,
        legacy_enriched=use_legacy,
    )
    if result["status"] == "dataset_unavailable":
        print(f"\n[NOTICE] {result['message']}\n")
        sys.exit(0)
