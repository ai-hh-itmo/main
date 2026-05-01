from pathlib import Path

import numpy as np
import pandas as pd
from catboost import CatBoostClassifier
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score


def make_target(df: pd.DataFrame, seed: int = 42) -> pd.Series:
    rng = np.random.default_rng(seed)

    # Probability depends only on tabular features plus light random noise.
    linear_score = (
        -1.6
        + 0.85 * df["has_replied"]
        + 0.45 * df["has_contacted"]
        + 0.30 * df["history_appearances"]
        + 0.22 * df["exp_years"]
    )
    noisy_score = linear_score + rng.normal(loc=0.0, scale=0.35, size=len(df))
    prob = 1.0 / (1.0 + np.exp(-noisy_score))
    return pd.Series(rng.binomial(1, prob), index=df.index, name="target")


def main() -> None:
    data_path = "candidates_features.csv"
    model_path = "catboost_model.cbm"

    df = pd.read_csv(data_path)
    df["target"] = make_target(df)

    feature_cols = ["has_contacted", "has_replied", "history_appearances", "exp_years"]
    X = df[feature_cols]
    y = df["target"]

    model = CatBoostClassifier(iterations=100, silent=True)
    model.fit(X, y)
    model.save_model(str(model_path))

    train_probs = model.predict_proba(X)[:, 1]
    train_preds = (train_probs >= 0.5).astype(int)

    print(f"Rows: {len(df)}")
    print(f"Target positive rate: {y.mean():.3f}")
    print(f"Train Accuracy: {accuracy_score(y, train_preds):.4f}")
    print(f"Train F1: {f1_score(y, train_preds):.4f}")
    print(f"Train ROC-AUC: {roc_auc_score(y, train_probs):.4f}")
    print("\nFeature importances:")
    for feature_name, importance in zip(feature_cols, model.get_feature_importance()):
        print(f"- {feature_name}: {importance:.4f}")

    print(f"\nModel saved to: {model_path}")


if __name__ == "__main__":
    main()
