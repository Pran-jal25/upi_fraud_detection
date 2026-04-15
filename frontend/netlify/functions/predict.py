import json
import os
import sys

# Add the files directory to path so we can load the model
FILES_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "files")
sys.path.insert(0, FILES_DIR)

import joblib
import pandas as pd

MODEL_PATH = os.path.join(FILES_DIR, "fraud_pipeline.pkl")
TYPE_MAP = {"CASH_IN": 0, "CASH_OUT": 1, "DEBIT": 2, "PAYMENT": 3, "TRANSFER": 4}

# Load model once (cached across warm invocations)
model = joblib.load(MODEL_PATH)


def handler(event, context):
    # Handle CORS preflight
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
            "body": "",
        }

    if event.get("httpMethod") != "POST":
        return {"statusCode": 405, "body": json.dumps({"error": "Method not allowed"})}

    try:
        body = json.loads(event.get("body", "{}"))

        type_encoded = TYPE_MAP.get(body["txn_type"], 3)
        orig_diff = body["old_balance_orig"] - body["new_balance_orig"]
        dest_diff = body["new_balance_dest"] - body["old_balance_dest"]
        amount_matches = int(body["amount"] == orig_diff)

        input_df = pd.DataFrame([{
            "step": body["step"],
            "amount": body["amount"],
            "oldbalanceOrg": body["old_balance_orig"],
            "newbalanceOrig": body["new_balance_orig"],
            "oldbalanceDest": body["old_balance_dest"],
            "newbalanceDest": body["new_balance_dest"],
            "type_encoded": type_encoded,
            "orig_balance_diff": orig_diff,
            "dest_balance_diff": dest_diff,
            "amount_matches_orig_diff": amount_matches,
        }])

        prob = float(model.predict_proba(input_df)[0][1])
        prediction = int(model.predict(input_df)[0])

        response = {
            "is_fraud": prediction,
            "fraud_probability": round(prob * 100, 2),
            "label": "Fraudulent" if prediction == 1 else "Legitimate",
        }

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps(response),
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": str(e)}),
        }
