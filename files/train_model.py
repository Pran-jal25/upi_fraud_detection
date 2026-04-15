import pandas as pd
import numpy as np
import joblib
import os
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from imblearn.over_sampling import SMOTE

script_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(script_dir, "UPI payment fraud detection.csv")

print("Loading data...")
df = pd.read_csv(csv_path)
df.dropna(inplace=True)
df.drop_duplicates(inplace=True)

# Feature engineering
df["type_encoded"] = df["type"].astype("category").cat.codes
df["orig_balance_diff"] = df["oldbalanceOrg"] - df["newbalanceOrig"]
df["dest_balance_diff"] = df["newbalanceDest"] - df["oldbalanceDest"]
df["amount_matches_orig_diff"] = (df["amount"] == df["orig_balance_diff"]).astype(int)
df.drop(columns=["nameOrig", "nameDest", "isFlaggedFraud", "type"], inplace=True)

X = df.drop(columns=["isFraud"])
y = df["isFraud"]

# Use only 20% of data for speed (still ~1.2M rows, plenty)
X_train, _, y_train, _ = train_test_split(X, y, test_size=0.8, random_state=42, stratify=y)
print(f"Training on {len(X_train)} rows...")

# SMOTE with sampling_strategy to limit synthetic samples
smote = SMOTE(random_state=42, sampling_strategy=0.1)
X_res, y_res = smote.fit_resample(X_train, y_train)
print(f"After SMOTE: {len(X_res)} rows")

# Fewer trees = much faster, still accurate
pipeline = Pipeline([
    ("scaler", StandardScaler()),
    ("model", RandomForestClassifier(n_estimators=50, random_state=42, n_jobs=-1, max_depth=15))
])

print("Training model...")
pipeline.fit(X_res, y_res)
pkl_path = os.path.join(script_dir, "fraud_pipeline.pkl")
joblib.dump(pipeline, pkl_path)
print(f"Done! Saved {pkl_path}")
