import type { KeyboardEvent } from 'react';
import type { Transaction } from '../types';
import { formatCurrency, formatDate } from '../utils/format';

interface TransactionRowProps {
  transaction: Transaction;
  showAccount?: boolean;
  accountName?: string;
  /**
   * Optional interactivity. When `onClick` is provided the row's <li> becomes
   * a keyboard-activable button (role="button", tabIndex=0) so the list keeps
   * valid semantics — the interactive element IS the list item, never a <div>
   * nested directly under a <ul>.
   */
  onClick?: () => void;
  onKeyDown?: (e: KeyboardEvent) => void;
}

export function TransactionRow({ transaction, showAccount, accountName, onClick, onKeyDown }: TransactionRowProps) {
  const isCredit = transaction.amount >= 0;
  const interactive = typeof onClick === 'function';

  return (
    <li
      className="tx-row"
      data-testid="transaction-row"
      data-tx-id={transaction.id}
      data-direction={isCredit ? 'credit' : 'debit'}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      <div className="tx-row__main">
        <p className="tx-row__description" data-testid="tx-description">
          {transaction.description}
        </p>
        <p className="tx-row__meta" data-testid="tx-meta">
          <span className="tx-row__date" data-testid="tx-date">
            {formatDate(transaction.date)}
          </span>
          <span className="tx-row__category" data-testid="tx-category">
            {transaction.category}
          </span>
          {showAccount && accountName && (
            <span className="tx-row__account" data-testid="tx-account">
              {accountName}
            </span>
          )}
        </p>
      </div>
      <div className="tx-row__right">
        <span
          className={`tx-row__amount${isCredit ? ' tx-row__amount--credit' : ' tx-row__amount--debit'}`}
          data-testid="tx-amount"
        >
          {formatCurrency(transaction.amount)}
        </span>
        <span
          className={`tx-row__badge${isCredit ? ' tx-row__badge--credit' : ' tx-row__badge--debit'}`}
          data-testid="tx-direction"
        >
          {isCredit ? 'CR' : 'DR'}
        </span>
      </div>
    </li>
  );
}
