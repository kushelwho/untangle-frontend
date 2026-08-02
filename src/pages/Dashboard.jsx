import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { groups, balances } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [myGroups, setMyGroups] = useState([]);
  const [myBalance, setMyBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const [newGroupName, setNewGroupName] = useState('');
  const [joinGroupId, setJoinGroupId] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Fetch user balances — this returns all groups the user is a member of
      const bal = await balances.me().catch(() => null);
      setMyBalance(bal);

      if (bal && bal.groupBalances && bal.groupBalances.length > 0) {
        // Fetch full group details for each group the user belongs to
        const groupPromises = bal.groupBalances.map((gb) =>
          groups.get(gb.groupId).catch(() => null)
        );
        const results = await Promise.all(groupPromises);
        setMyGroups(results.filter(Boolean));
      } else {
        setMyGroups([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateGroup(e) {
    e.preventDefault();
    setError('');
    setCreateLoading(true);
    try {
      const group = await groups.create({ name: newGroupName });
      setNewGroupName('');
      setShowCreateModal(false);
      // Reload everything so the new group shows up
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleJoinGroup(e) {
    e.preventDefault();
    setError('');
    setJoinLoading(true);
    try {
      const group = await groups.get(joinGroupId.trim());
      setJoinGroupId('');
      setShowJoinModal(false);
      // Navigate directly to the group
      navigate(`/groups/${group.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setJoinLoading(false);
    }
  }

  function formatAmount(val) {
    if (val === null || val === undefined) return '₹0.00';
    return `₹${Math.abs(parseFloat(val)).toFixed(2)}`;
  }

  function balanceClass(val) {
    const num = parseFloat(val || 0);
    if (num > 0) return 'positive';
    if (num < 0) return 'negative';
    return 'neutral';
  }

  function getGroupNetBalance(groupId) {
    if (!myBalance || !myBalance.groupBalances) return null;
    const gb = myBalance.groupBalances.find((g) => g.groupId === groupId);
    return gb ? gb.netBalanceInGroup : null;
  }

  if (loading) {
    return (
      <div className="loading-page">
        <span className="spinner" /> Loading...
      </div>
    );
  }

  return (
    <div className="page fade-in">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => { setError(''); setShowJoinModal(true); }}>
            Open Group by ID
          </button>
          <button className="btn btn-primary" onClick={() => { setError(''); setShowCreateModal(true); }}>
            + Create Group
          </button>
        </div>
      </div>

      {/* Balance Overview */}
      {myBalance && (
        <div className="card" style={{ marginBottom: 32 }}>
          <div className="card-title" style={{ marginBottom: 16 }}>My Overall Balance</div>
          <div className="balance-overview">
            <div className="balance-stat">
              <div className="balance-stat-label">You are owed</div>
              <div className={`balance-stat-value positive`}>
                {formatAmount(myBalance.totalOwedToUser)}
              </div>
            </div>
            <div className="balance-stat">
              <div className="balance-stat-label">You owe</div>
              <div className={`balance-stat-value negative`}>
                {formatAmount(myBalance.totalUserOwes)}
              </div>
            </div>
            <div className="balance-stat">
              <div className="balance-stat-label">Net balance</div>
              <div className={`balance-stat-value ${balanceClass(myBalance.netBalance)}`}>
                {parseFloat(myBalance.netBalance || 0) >= 0 ? '+' : '-'}
                {formatAmount(myBalance.netBalance)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Groups */}
      <div className="card-title" style={{ marginBottom: 16 }}>My Groups</div>
      {myGroups.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <p>No groups yet. Create one or open an existing group by ID.</p>
        </div>
      ) : (
        <div className="groups-grid">
          {myGroups.map((g) => {
            const netBal = getGroupNetBalance(g.id);
            return (
              <div
                key={g.id}
                className="card card-hover group-card"
                onClick={() => navigate(`/groups/${g.id}`)}
              >
                <div className="group-card-name">{g.name}</div>
                <div className="group-card-meta">
                  {g.members?.length || 0} member{(g.members?.length || 0) !== 1 ? 's' : ''}
                </div>
                {netBal !== null && (
                  <div className={`group-card-balance ${balanceClass(netBal)}`}>
                    {parseFloat(netBal) > 0
                      ? `you get back ${formatAmount(netBal)}`
                      : parseFloat(netBal) < 0
                        ? `you owe ${formatAmount(netBal)}`
                        : 'settled up ✓'}
                  </div>
                )}
                <div className="group-card-meta" style={{ fontSize: '0.7rem', marginTop: 4, opacity: 0.6 }}>
                  {g.id}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <Modal title="Create Group" onClose={() => setShowCreateModal(false)}>
          <form className="auth-form" onSubmit={handleCreateGroup}>
            <div className="input-group">
              <label>Group Name</label>
              <input
                className="input"
                placeholder="e.g. Goa Trip 2026"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                required
                autoFocus
              />
            </div>
            {error && <div className="error-msg">{error}</div>}
            <button className="btn btn-primary btn-block" type="submit" disabled={createLoading}>
              {createLoading ? <span className="spinner" /> : 'Create Group'}
            </button>
          </form>
        </Modal>
      )}

      {/* Join Group Modal */}
      {showJoinModal && (
        <Modal title="Open Group by ID" onClose={() => setShowJoinModal(false)}>
          <form className="auth-form" onSubmit={handleJoinGroup}>
            <div className="input-group">
              <label>Group UUID</label>
              <input
                className="input"
                placeholder="e.g. 9e1d0e2c-f74f-4a08-..."
                value={joinGroupId}
                onChange={(e) => setJoinGroupId(e.target.value)}
                required
                autoFocus
              />
            </div>
            {error && <div className="error-msg">{error}</div>}
            <button className="btn btn-primary btn-block" type="submit" disabled={joinLoading}>
              {joinLoading ? <span className="spinner" /> : 'Open Group'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
