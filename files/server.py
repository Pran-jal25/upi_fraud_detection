from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import joblib
import pandas as pd
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fraud_pipeline.pkl")
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
TYPE_MAP = {"CASH_IN": 0, "CASH_OUT": 1, "DEBIT": 2, "PAYMENT": 3, "TRANSFER": 4}

print("Loading model...")
model = joblib.load(MODEL_PATH)
print("Model loaded.")


class Transaction(BaseModel):
    txn_type: str
    amount: float
    step: int
    old_balance_orig: float
    new_balance_orig: float
    old_balance_dest: float
    new_balance_dest: float


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict")
def predict(txn: Transaction):
    type_encoded = TYPE_MAP.get(txn.txn_type, 3)
    orig_diff = txn.old_balance_orig - txn.new_balance_orig
    dest_diff = txn.new_balance_dest - txn.old_balance_dest
    amount_matches = int(txn.amount == orig_diff)

    input_df = pd.DataFrame([{
        "step": txn.step,
        "amount": txn.amount,
        "oldbalanceOrg": txn.old_balance_orig,
        "newbalanceOrig": txn.new_balance_orig,
        "oldbalanceDest": txn.old_balance_dest,
        "newbalanceDest": txn.new_balance_dest,
        "type_encoded": type_encoded,
        "orig_balance_diff": orig_diff,
        "dest_balance_diff": dest_diff,
        "amount_matches_orig_diff": amount_matches,
    }])

    prob = float(model.predict_proba(input_df)[0][1])
    prediction = int(model.predict(input_df)[0])

    return {
        "is_fraud": prediction,
        "fraud_probability": round(prob * 100, 2),
        "label": "Fraudulent" if prediction == 1 else "Legitimate",
    }


# Serve React frontend — must be last
if os.path.exists(STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")

    @app.get("/")
    def serve_root():
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        file_path = os.path.join(STATIC_DIR, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
