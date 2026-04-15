---
title: UPI Fraud Detection API
emoji: 🛡️
colorFrom: blue
colorTo: red
sdk: docker
pinned: false
---

# UPI Fraud Detection API

FastAPI backend for UPI transaction fraud detection using a trained ML model.

## Endpoint

`POST /predict`

```json
{
  "txn_type": "PAYMENT",
  "amount": 5000,
  "step": 1,
  "old_balance_orig": 10000,
  "new_balance_orig": 5000,
  "old_balance_dest": 0,
  "new_balance_dest": 5000
}
```
