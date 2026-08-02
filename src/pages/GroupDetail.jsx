import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groups, expenses as expensesApi, balances } from '../api/client';
import Modal from '../components/Modal';
import ExpenseList from '../components/ExpenseList';
import AddExpenseForm from '../components/AddExpenseForm';
import BalancePanel from '../components/BalancePanel';
import SettlementPlan from '../components/SettlementPlan';
import SettleUpForm from '../components/SettleUpForm';
import SettlementHistory from '../components/SettlementHistory';

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
  const [showSettleUp, setShowSettleUp] = useState(false);
  const [memberUserId, setMemberUserId] = useState('');
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [addMemberError, setAddMemberError] = useState('');
  const [addMemberSuccess, setAddMemberSuccess] = useState('');

  // Key to force re-mount of child components when data changes
  const [refreshKey, setRefreshKey] = useState(0);

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
      const val = memberUserId.trim();
      const payload = val.includes('@') ? { email: val } : { userId: val, email: val };
      await groups.addMember(groupId, payload);
      setAddMemberSuccess('Member added!');
      setMemberUserId('');
      const g = await groups.get(groupId);
      setGroup(g);
    } catch (err) {
      setAddMemberError(err.message);
    } finally {
      setAddMemberLoading(false);
    }
  }

  function refreshAll() {
    loadAll();
    setRefreshKey((k) => k + 1);
  }

  function handleExpenseCreated() {
    setShowAddExpense(false);
    refreshAll();
  }

  function handleExpenseDeleted() {
    refreshAll();
  }

  function handleSettled() {
    refreshAll();
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
            + Member
          </button>
          <button className="btn btn-secondary" onClick={() => setShowSettleUp(true)}>
            💸 Settle Up
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddExpense(true)}>
            + Expense
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

      {/* Two-column layout: Expenses + History | Balances + Settlement Plan */}
      <div className="detail-grid">
        {/* Left: Expenses + Settlement History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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

          <SettlementHistory groupId={groupId} refreshKey={refreshKey} />
        </div>

        {/* Right: Balances + Settlement Plan */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <BalancePanel balanceData={balanceData} />
          <SettlementPlan key={refreshKey} groupId={groupId} members={members} />
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <Modal title="Add Member" onClose={() => setShowAddMember(false)}>
          <form className="auth-form" onSubmit={handleAddMember}>
            <div className="input-group">
              <label>User Email (or UUID)</label>
              <input
                className="input"
                type="text"
                placeholder="Enter user's email address (e.g. alice@example.com)"
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

      {/* Settle Up Modal */}
      {showSettleUp && (
        <Modal title="Settle Up" onClose={() => setShowSettleUp(false)}>
          <SettleUpForm
            groupId={groupId}
            members={members}
            onSettled={handleSettled}
          />
        </Modal>
      )}
    </div>
  );
}
