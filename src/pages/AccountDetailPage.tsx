import { useAccounts } from '../accounts/AccountsContext';
import { useNav } from '../nav/NavContext';
import { ACCOUNT_TYPE_LABELS } from '../data/accounts';
import { balanceLabel } from '../components/AccountCard';
import { TransactionRow } from '../components/TransactionRow';
import { formatCurrency } from '../utils/format';

interface AccountDetailPageProps {
  accountId: string | null;
}

export function AccountDetailPage({ accountId }: AccountDetailPageProps) {
  const { getAccountById, getTransactionsByAccount } = useAccounts();
  const { goToAccounts, goToHistory } = useNav();
  const account = accountId ? getAccountById(accountId) : undefined;

  if (!account) {
    return (
      <section className="detail-page">
        <p>Account not found.</p>
        <button type="button" className="link-button" onClick={goToAccounts}>
          Back to accounts
        </button>
      </section>
    );
  }

  const txs = getTransactionsByAccount(account.id);
  const isCredit = account.type === 'credit';

  return (
    <section className="detail-page" aria-labelledby="detail-heading">
      <button
        type="button"
        className="link-button"
        data-testid="back-to-accounts"
        onClick={goToAccounts}
      >
        &larr; Back to accounts
      </button>
      <header className="detail-page__header">
        <div className="detail-page__header-top">
          <span className="detail-page__type" data-testid="detail-type">
            {ACCOUNT_TYPE_LABELS[account.type]}
          </span>
          <span className="detail-page__number" data-testid="detail-number">
            {account.maskedNumber}
          </span>
        </div>
        <h1 id="detail-heading" data-testid="detail-name">
          {account.name}
        </h1>
        <p
          className={`detail-page__balance${isCredit ? ' detail-page__balance--credit' : ''}`}
          data-testid="detail-balance"
        >
          {formatCurrency(account.balance)}
        </p>
        <p className="detail-page__balance-label" data-testid="detail-balance-label">
          {balanceLabel(account)}
        </p>
      </header>

      <div className="detail-page__ledger">
        <div className="ledger__head">
          <h2 className="ledger__title">Recent transactions</h2>
          <button
            type="button"
            className="link-button"
            data-testid="go-to-history"
            onClick={goToHistory}
          >
            View all
          </button>
        </div>
        {txs.length === 0 ? (
          <p className="ledger__empty" data-testid="ledger-empty">
            No transactions for this account.
          </p>
        ) : (
          <ul className="tx-list" data-testid="tx-list">
            {txs.map((tx) => (
              <TransactionRow key={tx.id} transaction={tx} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
