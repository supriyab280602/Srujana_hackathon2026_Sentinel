"""
Model Evaluation and Performance Validation Module for Sentinel.
Computes comprehensive metrics tailored for severely imbalanced fraud detection:
- ROC-AUC and Precision-Recall AUC (Average Precision)
- Precision, Recall, and F1 at specified decision threshold
- Confusion Matrix (TN, FP, FN, TP)
- False Positive Rate at target recall levels (e.g., FPR @ 90% Recall)
- Class distribution statistics and evaluation sample size
"""
from typing import Dict, Any, Optional
import numpy as np
from sklearn.metrics import (
    roc_auc_score,
    average_precision_score,
    confusion_matrix,
    precision_score,
    recall_score,
    f1_score,
    precision_recall_curve,
)


class ModelEvaluator:
    """Computes objective fraud detection performance metrics on evaluation datasets."""

    @staticmethod
    def calculate_fpr_at_target_recall(
        y_true: np.ndarray, y_score: np.ndarray, target_recall: float = 0.90
    ) -> Dict[str, float]:
        """
        Determines the decision threshold required to capture at least `target_recall`
        of fraudulent transactions and computes the resulting False Positive Rate (FPR).
        Crucial metric in AML to measure investigator alert burden at a required catch rate.
        """
        precisions, recalls, thresholds = precision_recall_curve(y_true, y_score)

        # Find threshold where recall >= target_recall
        # Note: recalls in precision_recall_curve are in decreasing order
        valid_indices = np.where(recalls >= target_recall)[0]
        if len(valid_indices) == 0:
            chosen_threshold = float(thresholds[0]) if len(thresholds) > 0 else 0.5
        else:
            chosen_idx = valid_indices[-1]
            chosen_threshold = float(thresholds[min(chosen_idx, len(thresholds) - 1)])

        y_pred = (y_score >= chosen_threshold).astype(int)
        tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()

        actual_recall = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
        fpr = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0

        return {
            "target_recall": target_recall,
            "achieved_recall": round(actual_recall, 4),
            "threshold": round(chosen_threshold, 4),
            "false_positive_rate": round(fpr, 4),
        }

    @classmethod
    def evaluate_predictions(
        cls,
        y_true: np.ndarray,
        y_score: np.ndarray,
        threshold: float = 0.5,
        target_recall_benchmarks: Optional[list] = None,
    ) -> Dict[str, Any]:
        """
        Calculates precision, recall, F1, ROC-AUC, PR-AUC, confusion matrix,
        and FPR at target recall levels.
        """
        y_true = np.asarray(y_true).astype(int)
        y_score = np.asarray(y_score).astype(float)

        if len(y_true) == 0 or len(y_score) == 0:
            raise ValueError("Evaluation arrays must not be empty.")

        n_samples = int(len(y_true))
        pos_count = int(np.sum(y_true == 1))
        neg_count = int(np.sum(y_true == 0))

        # Check for single-class evaluation
        has_both_classes = pos_count > 0 and neg_count > 0

        roc_auc = float(roc_auc_score(y_true, y_score)) if has_both_classes else 0.0
        pr_auc = float(average_precision_score(y_true, y_score)) if has_both_classes else 0.0

        y_pred = (y_score >= threshold).astype(int)
        tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()

        precision = float(precision_score(y_true, y_pred, zero_division=0))
        recall = float(recall_score(y_true, y_pred, zero_division=0))
        f1 = float(f1_score(y_true, y_pred, zero_division=0))
        fpr = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0

        # Optional FPR @ Recall benchmarks (e.g. 90%, 95%)
        fpr_benchmarks = {}
        if has_both_classes:
            benchmarks = target_recall_benchmarks or [0.90]
            for target_rec in benchmarks:
                key = f"fpr_at_{int(target_rec * 100)}_recall"
                fpr_benchmarks[key] = cls.calculate_fpr_at_target_recall(
                    y_true, y_score, target_recall=target_rec
                )

        return {
            "evaluation_sample_size": n_samples,
            "class_distribution": {
                "total": n_samples,
                "fraud_count": pos_count,
                "legitimate_count": neg_count,
                "fraud_prevalence": round(float(pos_count / max(n_samples, 1)), 6),
            },
            "decision_threshold": round(threshold, 4),
            "roc_auc": round(roc_auc, 4),
            "pr_auc": round(pr_auc, 4),
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
            "false_positive_rate": round(fpr, 4),
            "confusion_matrix": {
                "true_negatives": int(tn),
                "false_positives": int(fp),
                "false_negatives": int(fn),
                "true_positives": int(tp),
            },
            "recall_benchmarks": fpr_benchmarks,
        }


__all__ = ["ModelEvaluator"]
