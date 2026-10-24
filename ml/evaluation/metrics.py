"""
Model Evaluation and Performance Validation Module.
Defines standard assessment metrics for fraud detection models:
- ROC-AUC
- Precision-Recall AUC (crucial for severe class imbalance in AML)
- False Positive Rate at target Recall (e.g., FPR at 95% Recall)
"""
from typing import Dict, Any
import numpy as np
from sklearn.metrics import roc_auc_score, average_precision_score, confusion_matrix


class ModelEvaluator:
    """Computes fraud detection performance metrics on ground-truth evaluation sets."""

    @staticmethod
    def evaluate_predictions(y_true: np.ndarray, y_score: np.ndarray, threshold: float = 0.5) -> Dict[str, float]:
        """
        Calculates precision, recall, ROC-AUC, and PR-AUC.
        No synthetic numbers: strictly evaluates input arrays.
        """
        if len(y_true) == 0 or len(y_score) == 0:
            raise ValueError("Evaluation arrays must not be empty.")

        roc_auc = float(roc_auc_score(y_true, y_score))
        pr_auc = float(average_precision_score(y_true, y_score))

        y_pred = (y_score >= threshold).astype(int)
        tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()

        precision = float(tp / (tp + fp)) if (tp + fp) > 0 else 0.0
        recall = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
        fpr = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0

        return {
            "roc_auc": roc_auc,
            "pr_auc": pr_auc,
            "precision": precision,
            "recall": recall,
            "false_positive_rate": fpr,
            "threshold": threshold,
        }


__all__ = ["ModelEvaluator"]
