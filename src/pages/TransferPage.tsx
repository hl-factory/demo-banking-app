import { useMemo, useState, type FormEvent } from 'react';
import { useAccounts } from '../accounts/AccountsContext';
import { useNav } from '../nav/NavContext';
import { ACCOUNT_TYPE_LABELS } from '../data/accounts';
import { formatCurrency } from '../utils/format';
import { TRANSFER_LIMIT } from '../transfers/transfer';

export function TransferPage() {
  const { accounts, transfer } = useAccounts();
  const { goToAccounts, goToDetail, selectedAccountId } = useNav();

  // Default source to the selected account (when navigated from a detail view)
  // or the first non-credit account; default destination to a different account.
  const defaultSourceId = useMemo(() => {
    if (selectedAccountId && accounts.some((a) => a.id === selectedAccountId)) {
      return selectedAccountId;
    }
    const firstNonCredit = accounts.find((a) => a.type !== 'credit');
    return firstNonCredit ? firstNonCredit.id : '';
  }, [accounts, selectedAccountId]);

  const defaultDestinationId = useMemo(() => {
    const candidate = accounts.find(
      (a) => a.id !== defaultSourceId && a.type !== 'credit',
    );
    return candidate ? candidate.id : '';
  }, [accounts, defaultSourceId]);

  const [sourceId, setSourceId] = useState<string>(defaultSourceId);
  const [destinationId, setDestinationId] = useState<string>(
    defaultDestinationId && defaultDestinationId !== defaultSourceId
      ? defaultDestinationId
      : '',
  );
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const source = accounts.find((a) => a.id === sourceId);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const result = transfer({ sourceId, destinationId, amount });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const dest = accounts.find((a) => a.id === destinationId);
    setSuccess(
      `Transfer of ${formatCurrency(result.amountDollars)} to ${dest?.name ?? 'destination'} completed.`,
    );
    setAmount('');
  }

  return (
    <section className="transfer-page" aria-labelledby="transfer-heading">
      <button
        type="button"
        className="link-button"
        data-testid="back-to-accounts"
        onClick={goToAccounts}
      >
        &larr; Back to accounts
      </button>

      <div className="transfer-page__intro">
        <h1 id="transfer-heading">Make a transfer</h1>
        <p className="transfer-page__limit" data-testid="transfer-limit">
          Per-transfer limit: <strong>{formatCurrency(TRANSFER_LIMIT)}</strong>
        </p>
      </div>

      <form className="transfer-form" data-testid="transfer-form" onSubmit={handleSubmit} noValidate>
        <label className="transfer-form__field">
          <span className="transfer-form__label">From account</span>
          <select
            className="transfer-form__select"
            data-testid="transfer-source"
            value={sourceId}
            onChange={(e) => {
              setSourceId(e.target.value);
              setError(null);
              setSuccess(null);
            }}
            required
          >
            <option value="" disabled>
              Select source account
            </option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({ACCOUNT_TYPE_LABELS[a.type]}) — {formatCurrency(a.balance)}
              </option>
            ))}
          </select>
        </label>

        <label className="transfer-form__field">
          <span className="transfer-form__label">To account</span>
          <select
            className="transfer-form__select"
            data-testid="transfer-destination"
            value={destinationId}
            onChange={(e) => {
              setDestinationId(e.target.value);
              setError(null);
              setSuccess(null);
            }}
            required
          >
            <option value="" disabled>
              Select destination account
            </option>
            {accounts.map((a) => (
              <option
                key={a.id}
                value={a.id}
                disabled={a.id === sourceId}
              >
                {a.name} ({ACCOUNT_TYPE_LABELS[a.type]})
                {a.id === sourceId ? ' (same as source)' : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="transfer-form__field">
          <span className="transfer-form__label">Amount (USD)</span>
          <input
            className="transfer-form__input"
            data-testid="transfer-amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError(null);
              setSuccess(null);
            }}
            required
          />
        </label>

        {source && (
          <p className="transfer-form__available" data-testid="transfer-available">
            Available balance: {formatCurrency(source.balance)}
          </p>
        )}

        {error && (
          <p className="transfer-form__error" role="alert" data-testid="transfer-error">
            {error}
          </p>
        )}
        {success && (
          <p className="transfer-form__success" role="status" data-testid="transfer-success">
            {success}
          </p>
        )}

        <button
          type="submit"
          className="primary-action"
          data-testid="transfer-submit"
          title="Send this transfer"
        >
          Send Transfer
        </button>
      </form>

      {source && (
        <p className="transfer-page__hint">
          <button
            type="button"
            className="link-button"
            data-testid="go-to-detail"
            onClick={() => goToDetail(source.id)}
          >
            View source account details
          </button>
        </p>
      )}
    </section>
  );
}
