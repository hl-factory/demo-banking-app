import type { Transaction } from '../types';
import { formatCurrency, formatDate } from '../utils/format';

interface TransactionRowProps {
  transaction: Transaction;
  showAccount?: boolean;
  accountName?: string;
}

export function TransactionRow({ transaction, showAccount, accountName }: TransactionRowProps) {
  const isCredit = transaction.amount >= 0;

  return (
    <li
      className="tx-row"
      data-testid="transaction-row"
      data-tx-id={transaction.id}
      data-direction={isCredit ? 'credit' : 'debit'}
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
