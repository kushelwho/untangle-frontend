import { useState } from 'react';
import { expenses } from '../api/client';

const SPLIT_TYPES = ['EQUAL', 'EXACT', 'PERCENTAGE'];

export default function AddExpenseForm({ groupId, members, onCreated }) {
  const [form, setForm] = useState({
    payerId: '',
    amount: '',
    description: '',
    splitType: 'EQUAL',
  });
  const [splits, setSplits] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSplitChange(userId, value) {
    setSplits({ ...splits, [userId]: value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const body = {
        payerId: form.payerId,
        amount: parseFloat(form.amount),
        description: form.description,
        splitType: form.splitType,
      };

      if (form.splitType === 'EXACT') {
        body.splits = members.map((m) => ({
          userId: m.id,
          amount: parseFloat(splits[m.id] || 0),
        }));
      } else if (form.splitType === 'PERCENTAGE') {
        body.splits = members.map((m) => ({
          userId: m.id,
          percentage: parseFloat(splits[m.id] || 0),
        }));
      }

      await expenses.create(groupId, body);
      setForm({ payerId: '', amount: '', description: '', splitType: 'EQUAL' });
      setSplits({});
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="input-group">
        <label>Paid by</label>
        <select
          className="input"
          name="payerId"
          value={form.payerId}
          onChange={handleChange}
          required
        >
          <option value="">Select payer...</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
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

      <div className="input-group">
        <label>Description</label>
        <input
          className="input"
          name="description"
          placeholder="e.g. Hotel Stay"
          value={form.description}
          onChange={handleChange}
          required
        />
      </div>

      <div className="input-group">
        <label>Split Type</label>
        <div className="split-toggle">
          {SPLIT_TYPES.map((st) => (
            <button
              key={st}
              type="button"
              className={`split-toggle-btn ${form.splitType === st ? 'active' : ''}`}
              onClick={() => {
                setForm({ ...form, splitType: st });
                setSplits({});
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {form.splitType !== 'EQUAL' && members.length > 0 && (
        <div className="splits-detail">
          {members.map((m) => (
            <div className="split-row" key={m.id}>
              <span className="split-row-name">{m.name}</span>
              <input
                className="input"
                type="number"
                step="0.01"
                placeholder={form.splitType === 'PERCENTAGE' ? '%' : '₹'}
                value={splits[m.id] || ''}
                onChange={(e) => handleSplitChange(m.id, e.target.value)}
              />
            </div>
          ))}
        </div>
      )}

      {error && <div className="error-msg">{error}</div>}

      <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
        {loading ? <span className="spinner" /> : 'Add Expense'}
      </button>
    </form>
  );
}
