import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groups, expenses as expensesApi, balances } from '../api/client';
import Modal from '../components/Modal';
import ExpenseList from '../components/ExpenseList';
import AddExpenseForm from '../components/AddExpenseForm';
import BalancePanel from '../components/BalancePanel';

export default function GroupDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [expenseList, setExpenseList] = useState([]);
  const [balanceData, setBalanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [memberUserId, setMemberUserId] = useState('');
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [addMemberError, setAddMemberError] = useState('');
  const [addMemberSuccess, setAddMemberSuccess] = useState('');

  const loadAll = useCallback(async () => {
    try {
      const [g, e, b] = await Promise.all([
        groups.get(groupId),
        expensesApi.list(groupId),
        balances.group(groupId).catch(() => null),
      ]);
      setGroup(g);
      setExpenseList(e || []);
      setBalanceData(b);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleAddMember(e) {
    e.preventDefault();
    setAddMemberError('');
    setAddMemberSuccess('');
    setAddMemberLoading(true);
    try {
      await groups.addMember(groupId, { userId: memberUserId.trim() });
      setAddMemberSuccess('Member added!');
      setMemberUserId('');
      // Refresh group data to show new member
      const g = await groups.get(groupId);
      setGroup(g);
    } catch (err) {
      setAddMemberError(err.message);
    } finally {
      setAddMemberLoading(false);
    }
  }

  function handleExpenseCreated() {
    setShowAddExpense(false);
    loadAll();
  }

  function handleExpenseDeleted() {
    loadAll();
  }

  if (loading) {
    return (
      <div className="loading-page">
        <span className="spinner" /> Loading group...
      </div>
    );
  }

  if (error && !group) {
    return (
      <div className="page">
        <div className="error-msg">{error}</div>
        <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const members = group?.members || [];

  return (
    <div className="page fade-in">
      <button className="back-link" onClick={() => navigate('/dashboard')}>
        ← Back to Dashboard
      </button>

      <div className="group-detail-header">
        <div>
          <h1 className="group-name">{group?.name}</h1>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            ID: {groupId}
          </div>
        </div>
        <div className="group-detail-actions">
          <button className="btn btn-secondary" onClick={() => { setAddMemberError(''); setAddMemberSuccess(''); setShowAddMember(true); }}>
            + Add Member
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddExpense(true)}>
            + Add Expense
          </button>
        </div>
      </div>

      {/* Members Bar */}
      <div className="members-bar">
        <span className="members-label">Members:</span>
        {members.map((m) => (
          <span className="member-chip" key={m.id}>
            <span className="member-chip-avatar">{m.name?.[0]?.toUpperCase()}</span>
            {m.name}
          </span>
        ))}
        {members.length === 0 && (
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No members loaded.</span>
        )}
      </div>

      {/* Two-column layout: Expenses + Balances */}
      <div className="detail-grid">
        {/* Left: Expenses */}
        <div>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Expenses</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {expenseList.length} total
              </span>
            </div>
            <ExpenseList
              expenses={expenseList}
              groupId={groupId}
              members={members}
              onDeleted={handleExpenseDeleted}
            />
          </div>
        </div>

        {/* Right: Balances */}
        <div>
          <BalancePanel balanceData={balanceData} />
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <Modal title="Add Member" onClose={() => setShowAddMember(false)}>
          <form className="auth-form" onSubmit={handleAddMember}>
            <div className="input-group">
              <label>User UUID</label>
              <input
                className="input"
                placeholder="Paste the user's UUID"
                value={memberUserId}
                onChange={(e) => setMemberUserId(e.target.value)}
                required
                autoFocus
              />
            </div>
            {addMemberError && <div className="error-msg">{addMemberError}</div>}
            {addMemberSuccess && <div className="success-msg">{addMemberSuccess}</div>}
            <button className="btn btn-primary btn-block" type="submit" disabled={addMemberLoading}>
              {addMemberLoading ? <span className="spinner" /> : 'Add Member'}
            </button>
          </form>
        </Modal>
      )}

      {/* Add Expense Modal */}
      {showAddExpense && (
        <Modal title="Add Expense" onClose={() => setShowAddExpense(false)}>
          <AddExpenseForm
            groupId={groupId}
            members={members}
            onCreated={handleExpenseCreated}
          />
        </Modal>
      )}
    </div>
  );
}
