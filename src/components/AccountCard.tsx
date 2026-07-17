import type { Account } from '../types';
import { ACCOUNT_TYPE_LABELS } from '../data/accounts';
import { formatCurrency } from '../utils/format';

interface AccountCardProps {
  account: Account;
  onView: (accountId: string) => void;
}

/** Label describing the balance meaning for this account type. */
export function balanceLabel(account: Account): string {
  return account.type === 'credit' ? 'Outstanding balance' : 'Available balance';
}

export function AccountCard({ account, onView }: AccountCardProps) {
  const isCredit = account.type === 'credit';

  return (
    <article
      className="account-card"
      data-testid="account-card"
      data-account-id={account.id}
      data-account-type={account.type}
    >
      <button
        type="button"
        className="account-card__view"
        data-testid="view-account"
        onClick={() => onView(account.id)}
        aria-label={`View ${account.name} details`}
      >
        <div className="account-card__top">
          <span className="account-card__type" data-testid="account-type">
            {ACCOUNT_TYPE_LABELS[account.type]}
          </span>
          <span className="account-card__number" data-testid="account-number">
            {account.maskedNumber}
          </span>
        </div>
        <h3 className="account-card__name" data-testid="account-name">
          {account.name}
        </h3>
        <p
          className={`account-card__balance${isCredit ? ' account-card__balance--credit' : ''}`}
          data-testid="account-balance"
        >
          {formatCurrency(account.balance)}
        </p>
        <p className="account-card__balance-label" data-testid="account-balance-label">
          {balanceLabel(account)}
        </p>
      </button>
    </article>
  );
}
