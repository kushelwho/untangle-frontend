import { expenses as expensesApi } from '../api/client';

const SPLIT_ICONS = {
  EQUAL: '⚖️',
  EXACT: '🎯',
  PERCENTAGE: '📊',
};

export default function ExpenseList({ expenses, groupId, members, onDeleted }) {

  function getMemberName(userId) {
    const m = members.find((m) => m.id === userId);
    return m ? m.name : userId?.slice(0, 8);
  }

  async function handleDelete(expenseId) {
    if (!confirm('Delete this expense? A reversal entry will be recorded.')) return;
    try {
      await expensesApi.delete(groupId, expenseId);
      onDeleted();
    } catch (err) {
      alert(err.message);
    }
  }

  if (!expenses || expenses.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📝</div>
        <p>No expenses yet. Add one to get started.</p>
      </div>
    );
  }

  return (
    <div className="expense-list">
      {expenses.map((exp) => (
        <div className="expense-item fade-in" key={exp.id}>
          <div className="expense-icon">{SPLIT_ICONS[exp.splitType] || '💰'}</div>
          <div className="expense-info">
            <div className="expense-desc">{exp.description}</div>
            <div className="expense-meta">
              Paid by <strong>{getMemberName(exp.payerId)}</strong> · {exp.splitType}
            </div>
          </div>
          <div className="expense-amount">₹{parseFloat(exp.amount).toFixed(2)}</div>
          <button
            className="btn btn-danger btn-sm expense-delete"
            onClick={() => handleDelete(exp.id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
