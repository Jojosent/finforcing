"""
Complete ML Training, Model Comparison, and Explainable AI (SHAP) Pipeline
for Banking Fraud Detection System.

Trains:
1. Logistic Regression
2. Random Forest
3. LightGBM
4. XGBoost

Evaluates Precision, Recall, F1, ROC-AUC, Confusion Matrix.
Calculates SHAP values and exports JSON artifacts for the Web MVP.
"""

import os
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    precision_score, recall_score, f1_score, roc_auc_score,
    confusion_matrix, classification_report
)
import lightgbm as lgb
import xgboost as xgb
import shap

def run_pipeline():
    print("=" * 60)
    print("AI FOR FINANCE: FRAUD DETECTION & EXPLAINABLE AI PIPELINE")
    print("=" * 60)

    # 1. Load Dataset
    data_path = "ml_pipeline/data/bank_transactions_dataset.csv"
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at {data_path}")
    
    df = pd.read_csv(data_path, encoding="utf-8")
    overall_fraud_rate = float(df['is_fraud'].mean())
    print(f"Loaded {len(df)} transactions. Fraud rate: {overall_fraud_rate * 100:.2f}% ({df['is_fraud'].sum()} fraud cases)")

    # 2. Hourly Risk Analysis (Answering: "в каком времени больше всего отправить будет подозрительно")
    hourly_stats = []
    
    for h in range(24):
        h_df = df[df['hour'] == h]
        total = len(h_df)
        frauds = int(h_df['is_fraud'].sum())
        rate = (frauds / total * 100) if total > 0 else 0.0
        risk_multiplier = round(rate / (overall_fraud_rate * 100), 2) if overall_fraud_rate > 0 else 1.0
        
        if 1 <= h <= 5:
            risk_tier = "CRITICAL_NIGHT_HOURS"
            explanation = "Период максимальной уязвимости (ночь 01:00-05:00): активность социальной инженерии, кража сессий и вывод средств на дроп-счета, пока владелец спит."
        elif h in [0, 6, 23]:
            risk_tier = "ELEVATED_RISK"
            explanation = "Пограничное ночное время со сниженной активностью легитимных клиентов и повышенным риском несанкционированного доступа."
        elif 9 <= h <= 18:
            risk_tier = "LOW_RISK_BUSINESS_HOURS"
            explanation = "Пик естественной активности: рабочие часы, стандартные платежи, оплата покупок и привычные переводы с минимальной долей аномалий."
        else:
            risk_tier = "MODERATE_EVENING"
            explanation = "Вечерний бытовой трафик с умеренным стандартным уровнем мониторинга."

        hourly_stats.append({
            "hour": h,
            "hour_label": f"{h:02d}:00 - {h:02d}:59",
            "total_transactions": total,
            "fraud_count": frauds,
            "fraud_rate_pct": round(rate, 2),
            "risk_multiplier": risk_multiplier,
            "risk_tier": risk_tier,
            "explanation": explanation
        })

    os.makedirs("ml_pipeline/reports", exist_ok=True)
    with open("ml_pipeline/reports/hourly_risk_analysis.json", "w", encoding="utf-8") as f:
        json.dump(hourly_stats, f, ensure_ascii=False, indent=2)
    print("Hourly fraud risk analysis exported to ml_pipeline/reports/hourly_risk_analysis.json")

    # 3. Vectorization Pipeline (Numerical, Categorical & Text TF-IDF)
    print("\nVectorizing features (Numeric + Categorical + Text TF-IDF)...")
    
    # Numerical features
    num_cols = ["amount", "hour", "amount_deviation_ratio", "balance_empty_ratio", "velocity_last_24h"]
    scaler = StandardScaler()
    X_num = scaler.fit_transform(df[num_cols])
    
    # Binary features
    binary_cols = ["is_new_recipient", "is_new_device", "is_foreign_ip"]
    X_bin = df[binary_cols].values
    
    # Categorical features
    cat_cols = ["transaction_type"]
    ohe = OneHotEncoder(sparse_output=False, handle_unknown="ignore")
    X_cat = ohe.fit_transform(df[cat_cols])
    cat_feature_names = ohe.get_feature_names_out(cat_cols).tolist()

    # Text Vectorizer for transaction memo (Cyrillic-friendly token_pattern)
    tfidf = TfidfVectorizer(token_pattern=r'(?u)\b\w+\b', max_features=16, lowercase=True)
    X_text = tfidf.fit_transform(df["memo_text"]).toarray()
    text_feature_names = [f"memo_{word}" for word in tfidf.get_feature_names_out()]

    # Combine all feature vectors
    X = np.hstack([X_num, X_bin, X_cat, X_text])
    feature_names = num_cols + binary_cols + cat_feature_names + text_feature_names
    y = df["is_fraud"].values

    print(f"Total vectorized features: {len(feature_names)}")
    print("Feature names:", feature_names)

    # Save vectorizer metadata for Frontend inspection & demo
    vectorizer_info = {
        "num_cols": num_cols,
        "scaler_means": {col: round(float(m), 4) for col, m in zip(num_cols, scaler.mean_)},
        "scaler_scales": {col: round(float(s), 4) for col, s in zip(num_cols, scaler.scale_)},
        "binary_cols": binary_cols,
        "categorical_cols": cat_cols,
        "categorical_categories": {col: cats.tolist() for col, cats in zip(cat_cols, ohe.categories_)},
        "text_vocabulary": {word: int(idx) for word, idx in tfidf.vocabulary_.items()},
        "text_idf": {word: round(float(idf), 4) for word, idf in zip(tfidf.get_feature_names_out(), tfidf.idf_)},
        "all_feature_names": feature_names
    }
    with open("ml_pipeline/reports/vectorizer_meta.json", "w", encoding="utf-8") as f:
        json.dump(vectorizer_info, f, ensure_ascii=False, indent=2)

    # 4. Train / Test Split (Stratified)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )
    print(f"Train set: {len(y_train)} samples ({y_train.sum()} frauds)")
    print(f"Test set:  {len(y_test)} samples ({y_test.sum()} frauds)")

    # 5. Train & Evaluate 4 Models
    models = {
        "Logistic Regression": LogisticRegression(
            class_weight="balanced", max_iter=1000, C=0.5, random_state=42
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=120, max_depth=10, min_samples_split=5,
            class_weight="balanced", random_state=42, n_jobs=-1
        ),
        "LightGBM": lgb.LGBMClassifier(
            n_estimators=140, learning_rate=0.04, num_leaves=31, max_depth=6,
            scale_pos_weight=15, random_state=42, n_jobs=-1, verbose=-1
        ),
        "XGBoost": xgb.XGBClassifier(
            n_estimators=130, learning_rate=0.04, max_depth=5,
            scale_pos_weight=15, random_state=42, eval_metric="logloss", n_jobs=-1
        )
    }

    results = {}
    fitted_models = {}

    for name, model in models.items():
        print(f"\nTraining {name}...")
        model.fit(X_train, y_train)
        fitted_models[name] = model

        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)[:, 1]

        precision_fraud = precision_score(y_test, y_pred, pos_label=1, zero_division=0)
        recall_fraud = recall_score(y_test, y_pred, pos_label=1)
        f1_fraud = f1_score(y_test, y_pred, pos_label=1)
        roc_auc = roc_auc_score(y_test, y_prob)

        cm = confusion_matrix(y_test, y_pred)
        tn, fp, fn, tp = cm.ravel()

        results[name] = {
            "model_name": name,
            "precision_fraud": round(float(precision_fraud), 4),
            "recall_fraud": round(float(recall_fraud), 4),
            "f1_fraud": round(float(f1_fraud), 4),
            "roc_auc": round(float(roc_auc), 4),
            "accuracy": round(float((tp + tn) / len(y_test)), 4),
            "confusion_matrix": {
                "true_negative": int(tn),
                "false_positive": int(fp),
                "false_negative": int(fn),
                "true_positive": int(tp)
            },
            "summary": (
                f"Recall: {recall_fraud*100:.1f}%, Precision: {precision_fraud*100:.1f}%, "
                f"ROC-AUC: {roc_auc:.4f} (Обнаружено {tp} из {tp+fn} мошенничеств, ложных тревог: {fp})"
            )
        }
        print(f"Results for {name}:")
        print(f"  Recall (Fraud):    {recall_fraud*100:.2f}%")
        print(f"  Precision (Fraud): {precision_fraud*100:.2f}%")
        print(f"  F1-Score (Fraud):  {f1_fraud:.4f}")
        print(f"  ROC-AUC:           {roc_auc:.4f}")
        print(f"  TP: {tp}, FP: {fp}, FN: {fn}, TN: {tn}")

    with open("ml_pipeline/reports/model_metrics.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    # 6. Explainable AI with SHAP
    champion_name = "LightGBM"
    champion_model = fitted_models[champion_name]
    print(f"\nComputing SHAP values on champion model ({champion_name})...")
    
    explainer = shap.TreeExplainer(champion_model)
    sample_indices = np.random.choice(len(X_test), size=min(1200, len(X_test)), replace=False)
    X_sample = X_test[sample_indices]
    shap_raw = explainer.shap_values(X_sample)

    if isinstance(shap_raw, list) and len(shap_raw) == 2:
        shap_vals = shap_raw[1]
    elif len(shap_raw.shape) == 3:
        shap_vals = shap_raw[:, :, 1]
    else:
        shap_vals = shap_raw

    mean_abs_shap = np.abs(shap_vals).mean(axis=0)
    sorted_indices = np.argsort(mean_abs_shap)[::-1]

    feature_importance_list = []
    human_labels = {
        "amount": "Сумма транзакции",
        "hour": "Время суток (час)",
        "amount_deviation_ratio": "Отклонение от обычного чека клиента",
        "balance_empty_ratio": "Доля опустошения счета",
        "velocity_last_24h": "Частота переводов за 24 часа",
        "is_new_recipient": "Новый (неизвестный) получатель",
        "is_new_device": "Новое неопознанное устройство",
        "is_foreign_ip": "Иностранный IP / VPN соединение",
        "transaction_type_CASH_OUT": "Тип: Снятие наличных",
        "transaction_type_P2P_TRANSFER": "Тип: P2P перевод",
        "transaction_type_PAYMENT": "Тип: Платеж",
        "transaction_type_MERCHANT": "Тип: Мерчант"
    }

    for rank, idx in enumerate(sorted_indices, 1):
        feat = feature_names[idx]
        label = human_labels.get(feat, feat)
        feature_importance_list.append({
            "rank": rank,
            "feature": feat,
            "label_ru": label,
            "shap_importance": round(float(mean_abs_shap[idx]), 4)
        })

    with open("ml_pipeline/reports/feature_importance.json", "w", encoding="utf-8") as f:
        json.dump(feature_importance_list, f, ensure_ascii=False, indent=2)

    # 7. Calibrated Engine Export
    expected_value = float(explainer.expected_value[1] if hasattr(explainer.expected_value, "__len__") else explainer.expected_value)
    
    engine_export = {
        "champion_model": champion_name,
        "base_expected_value": expected_value,
        "base_fraud_rate": overall_fraud_rate,
        "metrics_summary": results[champion_name],
        "thresholds": {
            "low_risk_max": 30,
            "medium_risk_max": 70,
            "high_risk_min": 71
        },
        "feature_names": feature_names,
        "top_features": feature_importance_list[:12],
        "hourly_risk_factors": {h["hour"]: h["risk_multiplier"] for h in hourly_stats}
    }

    with open("ml_pipeline/reports/calibrated_engine.json", "w", encoding="utf-8") as f:
        json.dump(engine_export, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 60)
    print("TRAINING & EVALUATION COMPLETE!")
    print("Saved all reports to ml_pipeline/reports/")
    print("=" * 60)

if __name__ == "__main__":
    run_pipeline()
