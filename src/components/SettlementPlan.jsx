import { useState, useEffect } from 'react';
import { settlements } from '../api/client';

export default function SettlementPlan({ groupId, members }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadPlan() {
    setLoading(true);
    setError('');
    try {
      const data = await settlements.plan(groupId);
      setPlan(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlan();
  }, [groupId]);

  function formatAmount(val) {
    return `₹${Math.abs(parseFloat(val)).toFixed(2)}`;
  }

  if (loading) {
    return (
      <div className="card fade-in">
        <div className="card-title" style={{ marginBottom: 16 }}>Settlement Plan</div>
        <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
          <span className="spinner" /> Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="card fade-in">
      <div className="card-header">
        <span className="card-title">Settlement Plan</span>
        <button className="btn btn-ghost btn-sm" onClick={loadPlan}>↻ Refresh</button>
      </div>

      {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}

      {plan && plan.transactions && plan.transactions.length > 0 ? (
        <>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
            Minimum <strong style={{ color: 'var(--accent-primary)' }}>{plan.totalTransactions}</strong> transaction{plan.totalTransactions !== 1 ? 's' : ''} to settle all debts
          </div>
          <div className="settlement-list">
            {plan.transactions.map((tx, i) => (
              <div key={i} className="settlement-item">
                <div className="settlement-flow">
                  <span className="settlement-user from">{tx.fromUserName}</span>
                  <span className="settlement-arrow">→</span>
                  <span className="settlement-user to">{tx.toUserName}</span>
                </div>
                <span className="settlement-amount">{formatAmount(tx.amount)}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: 16 }}>
          🎉 All settled up! No transactions needed.
        </p>
      )}
    </div>
  );
}
