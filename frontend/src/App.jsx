import { useState } from "react";
import axios from "axios";
import "./App.css";

const TXN_TYPES = ["CASH_IN", "CASH_OUT", "DEBIT", "PAYMENT", "TRANSFER"];

const TXN_ICONS = {
  CASH_IN: "💰", CASH_OUT: "💸", DEBIT: "🏧", PAYMENT: "📲", TRANSFER: "🔄"
};

const defaultForm = {
  txn_type: "PAYMENT", amount: "", step: "",
  old_balance_orig: "", new_balance_orig: "",
  old_balance_dest: "", new_balance_dest: "",
};

export default function App() {
  const [form, setForm] = useState(defaultForm);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setResult(null); setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setResult(null); setError("");
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || ""}/.netlify/functions/predict`, {
        txn_type: form.txn_type,
        amount: parseFloat(form.amount),
        step: parseInt(form.step),
        old_balance_orig: parseFloat(form.old_balance_orig),
        new_balance_orig: parseFloat(form.new_balance_orig),
        old_balance_dest: parseFloat(form.old_balance_dest),
        new_balance_dest: parseFloat(form.new_balance_dest),
      });
      setResult(res.data);
    } catch {
      setError("Cannot connect to server. Make sure server.py is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => { setForm(defaultForm); setResult(null); setError(""); };

  const prob = result?.fraud_probability ?? 0;
  const isFraud = result?.is_fraud;

  return (
    <div className="page">
      {/* Animated background blobs */}
      <div className="blob blob1" />
      <div className="blob blob2" />
      <div className="blob blob3" />

      <div className="wrapper">
        {/* Header */}
        <div className="top-bar">
          <div className="logo">
            <span className="logo-icon">🛡️</span>
            <span className="logo-text">FraudShield</span>
          </div>
          <span className="badge">AI Powered</span>
        </div>

        <div className="hero">
          <h1>UPI Fraud <span className="gradient-text">Detection</span></h1>

        </div>

        <div className="main-grid">
          {/* Form card */}
          <div className="card form-card">
            <div className="card-title">
              <span>📋</span> Transaction Details
            </div>

            <form onSubmit={handleSubmit}>
              {/* Transaction type pills */}
              <div className="field">
                <label>Transaction Type</label>
                <div className="pill-group">
                  {TXN_TYPES.map((t) => (
                    <button
                      key={t} type="button"
                      className={`pill ${form.txn_type === t ? "pill-active" : ""}`}
                      onClick={() => { setForm({ ...form, txn_type: t }); setResult(null); }}
                    >
                      {TXN_ICONS[t]} {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-grid">
                <div className="field">
                  <label>Amount (₹)</label>
                  <div className="input-wrap">
                    <span className="input-prefix">₹</span>
                    <input type="number" name="amount" placeholder="0.00"
                      value={form.amount} onChange={handleChange} required min="0" />
                  </div>
                </div>

                <div className="field">
                  <label>Time Step</label>
                  <div className="input-wrap">
                    <span className="input-prefix">⏱</span>
                    <input type="number" name="step" placeholder="1 – 743"
                      value={form.step} onChange={handleChange} required min="1" max="743" />
                  </div>
                </div>
              </div>

              <div className="section-label">Sender Account</div>
              <div className="form-grid">
                <div className="field">
                  <label>Old Balance (₹)</label>
                  <div className="input-wrap">
                    <span className="input-prefix">₹</span>
                    <input type="number" name="old_balance_orig" placeholder="0.00"
                      value={form.old_balance_orig} onChange={handleChange} required min="0" />
                  </div>
                </div>
                <div className="field">
                  <label>New Balance (₹)</label>
                  <div className="input-wrap">
                    <span className="input-prefix">₹</span>
                    <input type="number" name="new_balance_orig" placeholder="0.00"
                      value={form.new_balance_orig} onChange={handleChange} required min="0" />
                  </div>
                </div>
              </div>

              <div className="section-label">Receiver Account</div>
              <div className="form-grid">
                <div className="field">
                  <label>Old Balance (₹)</label>
                  <div className="input-wrap">
                    <span className="input-prefix">₹</span>
                    <input type="number" name="old_balance_dest" placeholder="0.00"
                      value={form.old_balance_dest} onChange={handleChange} required min="0" />
                  </div>
                </div>
                <div className="field">
                  <label>New Balance (₹)</label>
                  <div className="input-wrap">
                    <span className="input-prefix">₹</span>
                    <input type="number" name="new_balance_dest" placeholder="0.00"
                      value={form.new_balance_dest} onChange={handleChange} required min="0" />
                  </div>
                </div>
              </div>

              {error && <div className="alert">{error}</div>}

              <div className="btn-row">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading
                    ? <><span className="spinner" /> Analyzing…</>
                    : <><span>🔍</span> Analyze Transaction</>}
                </button>
                <button type="button" className="btn-ghost" onClick={handleReset}>Reset</button>
              </div>
            </form>
          </div>

          {/* Result card */}
          <div className="card result-card">
            <div className="card-title"><span>📊</span> Analysis Result</div>

            {!result && !loading && (
              <div className="empty-state">
                <div className="empty-icon">🔐</div>
                <p>Fill in the transaction details and click Analyze to get the fraud prediction.</p>
              </div>
            )}

            {loading && (
              <div className="empty-state">
                <div className="pulse-ring" />
                <p>Running AI analysis…</p>
              </div>
            )}

            {result && (
              <div className={`verdict ${isFraud ? "verdict-fraud" : "verdict-safe"}`}>
                <div className="verdict-icon">{isFraud ? "🚨" : "✅"}</div>
                <div className="verdict-title">
                  {isFraud ? "Fraudulent Transaction" : "Legitimate Transaction"}
                </div>
                <div className="verdict-sub">
                  {isFraud
                    ? "This transaction shows signs of fraud."
                    : "This transaction appears to be safe."}
                </div>

                {/* Gauge */}
                <div className="gauge-wrap">
                  <svg viewBox="0 0 200 110" className="gauge-svg">
                    <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#1e293b" strokeWidth="16" strokeLinecap="round" />
                    <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none"
                      stroke="url(#gaugeGrad)" strokeWidth="16" strokeLinecap="round"
                      strokeDasharray={`${(prob / 100) * 251.2} 251.2`} />
                    <defs>
                      <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#22c55e" />
                        <stop offset="50%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#ef4444" />
                      </linearGradient>
                    </defs>
                    <text x="100" y="95" textAnchor="middle" className="gauge-text">{prob}%</text>
                    <text x="100" y="110" textAnchor="middle" className="gauge-label">Fraud Probability</text>
                  </svg>
                </div>

                {/* Risk level */}
                <div className="risk-chips">
                  {[["Low", 33, "chip-green"], ["Medium", 66, "chip-yellow"], ["High", 100, "chip-red"]].map(([label, max, cls]) => (
                    <div key={label} className={`chip ${prob <= max && (label === "Low" ? true : prob > (label === "Medium" ? 33 : 66)) ? cls : "chip-dim"}`}>
                      {label} Risk
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="stats-grid">
                  <div className="stat">
                    <div className="stat-val">{form.txn_type}</div>
                    <div className="stat-key">Type</div>
                  </div>
                  <div className="stat">
                    <div className="stat-val">₹{parseFloat(form.amount || 0).toLocaleString("en-IN")}</div>
                    <div className="stat-key">Amount</div>
                  </div>
                  <div className="stat">
                    <div className="stat-val">{result.label}</div>
                    <div className="stat-key">Verdict</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="footer">Built with React + Python ML · FraudShield 2025</div>
      </div>
    </div>
  );
}
