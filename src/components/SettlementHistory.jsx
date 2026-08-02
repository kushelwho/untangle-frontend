import { useState, useEffect } from 'react';
import { settlements } from '../api/client';

export default function SettlementHistory({ groupId, refreshKey }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadHistory();
  }, [groupId, refreshKey]);

  async function loadHistory() {
    setLoading(true);
    setError('');
    try {
      const data = await settlements.history(groupId);
      setHistory(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function formatAmount(val) {
    return `₹${Math.abs(parseFloat(val)).toFixed(2)}`;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  if (loading) {
    return (
      <div className="card fade-in">
        <div className="card-title" style={{ marginBottom: 16 }}>Settlement History</div>
        <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
          <span className="spinner" /> Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="card fade-in">
      <div className="card-header">
        <span className="card-title">Settlement History</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {history.length} record{history.length !== 1 ? 's' : ''}
        </span>
      </div>

      {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}

      {history.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: 16 }}>
          No settlements recorded yet.
        </p>
      ) : (
        <div className="settlement-history-list">
          {history.map((s) => (
            <div key={s.id} className="settlement-history-item">
              <div className="settlement-history-icon">💸</div>
              <div className="settlement-history-info">
                <div className="settlement-history-desc">
                  <strong>{s.payerName}</strong> paid <strong>{s.recipientName}</strong>
                </div>
                <div className="settlement-history-date">{formatDate(s.createdAt)}</div>
              </div>
              <div className="settlement-history-amount">{formatAmount(s.amount)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
