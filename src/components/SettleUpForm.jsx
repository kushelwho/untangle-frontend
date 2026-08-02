import { useState } from 'react';
import { settlements } from '../api/client';

export default function SettleUpForm({ groupId, members, onSettled }) {
  const [form, setForm] = useState({ payerId: '', recipientId: '', amount: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const body = {
        payerId: form.payerId,
        recipientId: form.recipientId,
        amount: parseFloat(form.amount),
      };

      // Always send an idempotency key to prevent double-submissions
      const idempotencyKey = crypto.randomUUID();
      const res = await settlements.settleUp(groupId, body, idempotencyKey);
      setResult(res);
      setForm({ payerId: '', recipientId: '', amount: '' });
      if (onSettled) onSettled();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function getMemberName(id) {
    const m = members.find((m) => m.id === id);
    return m ? m.name : id?.slice(0, 8);
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="input-group">
        <label>Who is paying</label>
        <select
          className="input"
          name="payerId"
          value={form.payerId}
          onChange={handleChange}
          required
        >
          <option value="">Select payer...</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      <div className="input-group">
        <label>Paying to (recipient)</label>
        <select
          className="input"
          name="recipientId"
          value={form.recipientId}
          onChange={handleChange}
          required
        >
          <option value="">Select recipient...</option>
          {members.filter((m) => m.id !== form.payerId).map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      <div className="input-group">
        <label>Amount (₹)</label>
        <input
          className="input"
          type="number"
          name="amount"
          placeholder="0.00"
          step="0.01"
          min="0.01"
          value={form.amount}
          onChange={handleChange}
          required
        />
      </div>

      {error && <div className="error-msg">{error}</div>}

      {result && (
        <div className="success-msg">
          ✅ {result.message || 'Settlement recorded!'} — {getMemberName(result.payerId)} paid {getMemberName(result.recipientId)} ₹{parseFloat(result.amount).toFixed(2)}
        </div>
      )}

      <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
        {loading ? <span className="spinner" /> : 'Record Settlement'}
      </button>
    </form>
  );
}
