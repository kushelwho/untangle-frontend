export default function BalancePanel({ balanceData }) {
  if (!balanceData) return null;

  const { memberBalances = [], pairwiseBalances = [] } = balanceData;

  function formatAmount(val) {
    const num = parseFloat(val);
    return `₹${Math.abs(num).toFixed(2)}`;
  }

  function balanceClass(val) {
    const num = parseFloat(val);
    if (num > 0) return 'positive';
    if (num < 0) return 'negative';
    return 'neutral';
  }

  function balanceLabel(val) {
    const num = parseFloat(val);
    if (num > 0) return `+${formatAmount(val)} (gets back)`;
    if (num < 0) return `-${formatAmount(val)} (owes)`;
    return '₹0.00 (settled)';
  }

  // Only display pairwise debts between members who still have an active net balance (ignoring settled circular loops)
  const activePairwiseBalances = pairwiseBalances.filter((pw) => {
    const borrower = memberBalances.find((m) => m.userId === pw.borrowerId);
    const payer = memberBalances.find((m) => m.userId === pw.payerId);
    if (!borrower || !payer) return true;
    return Math.abs(parseFloat(borrower.netBalance)) >= 0.01 && Math.abs(parseFloat(payer.netBalance)) >= 0.01;
  });

  return (
    <div className="card fade-in">
      <div className="card-title" style={{ marginBottom: 20 }}>Group Balances</div>

      <div className="balance-section">
        <div className="balance-section-title">Net per Member</div>
        {memberBalances.length === 0 && (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No balance data yet.</p>
        )}
        {memberBalances.map((mb) => (
          <div className="balance-row" key={mb.userId}>
            <span className="balance-name">{mb.name}</span>
            <span className={`balance-value ${balanceClass(mb.netBalance)}`}>
              {balanceLabel(mb.netBalance)}
            </span>
          </div>
        ))}
      </div>

      {activePairwiseBalances.length > 0 && (
        <div className="balance-section">
          <div className="balance-section-title">Who Owes Whom</div>
          {activePairwiseBalances.map((pw, i) => (
            <div className="pairwise-row" key={i}>
              <strong>{pw.borrowerName}</strong> owes <strong>{pw.payerName}</strong>{' '}
              <span className="pairwise-amount">{formatAmount(pw.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
