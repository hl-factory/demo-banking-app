import { useAccounts } from '../accounts/AccountsContext';
import { useNav } from '../nav/NavContext';
import { TransactionRow } from '../components/TransactionRow';

export function HistoryPage() {
  const { transactions, getAccountById } = useAccounts();
  const { goToAccounts, goToDetail } = useNav();

  return (
    <section className="history-page" aria-labelledby="history-heading">
      <button
        type="button"
        className="link-button"
        data-testid="back-to-accounts"
        onClick={goToAccounts}
      >
        &larr; Back to accounts
      </button>
      <div className="history-page__intro">
        <h1 id="history-heading">Transaction history</h1>
        <p className="history-page__count" data-testid="history-count">
          {transactions.length} transactions
        </p>
      </div>
      {transactions.length === 0 ? (
        <p className="ledger__empty" data-testid="ledger-empty">
          No transactions yet.
        </p>
      ) : (
        <ul className="tx-list" data-testid="tx-list">
          {transactions.map((tx) => {
            const account = getAccountById(tx.accountId);
            return (
              <div
                key={tx.id}
                role="button"
                tabIndex={0}
                className="history-page__row-wrapper"
                data-testid="history-row-wrapper"
                onClick={() => account && goToDetail(account.id)}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && account) {
                    e.preventDefault();
                    goToDetail(account.id);
                  }
                }}
              >
                <TransactionRow
                  transaction={tx}
                  showAccount
                  accountName={account?.name}
                />
              </div>
            );
          })}
        </ul>
      )}
    </section>
  );
}
