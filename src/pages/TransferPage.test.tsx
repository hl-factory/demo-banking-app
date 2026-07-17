import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { ACCOUNTS } from '../data/accounts';
import { TRANSFER_LIMIT } from '../transfers/transfer';
import { formatCurrency } from '../utils/format';

/**
 * Helper to open the transfer view from the home/accounts page via the UI
 * (header nav), then return the form element.
 */
async function openTransfer(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId('nav-transfer'));
  expect(screen.getByTestId('transfer-form')).toBeInTheDocument();
  return screen.getByTestId('transfer-form');
}

/** Read the displayed balance for an account id from the accounts list. */
function balanceFor(accountId: string): string | undefined {
  const card = screen.getAllByTestId('account-card').find(
    (c) => c.getAttribute('data-account-id') === accountId,
  );
  if (!card) return undefined;
  return within(card).getByTestId('account-balance').textContent ?? undefined;
}

const checking = ACCOUNTS.find((a) => a.type === 'checking')!;
const savings = ACCOUNTS.find((a) => a.type === 'savings')!;

describe('TransferPage — form presence and limit visibility', () => {
  it('renders the transfer form with source, destination, amount, and submit', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openTransfer(user);
    expect(screen.getByTestId('transfer-source')).toBeInTheDocument();
    expect(screen.getByTestId('transfer-destination')).toBeInTheDocument();
    expect(screen.getByTestId('transfer-amount')).toBeInTheDocument();
    expect(screen.getByTestId('transfer-submit')).toBeInTheDocument();
  });

  it('surfaces the per-transfer limit in the UI', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openTransfer(user);
    const limitEl = screen.getByTestId('transfer-limit');
    expect(limitEl.textContent).toContain(formatCurrency(TRANSFER_LIMIT));
  });

  it('the primary submit button has a stable selector and the primary-action class', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openTransfer(user);
    const btn = screen.getByTestId('transfer-submit');
    expect(btn.tagName).toBe('BUTTON');
    expect(btn.className).toContain('primary-action');
  });

  it('is reachable from the accounts list via UI nav (Transfer link)', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByText('Your accounts')).toBeInTheDocument();
    await user.click(screen.getByTestId('nav-transfer'));
    expect(screen.getByText('Make a transfer')).toBeInTheDocument();
  });
});

describe('TransferPage — valid transfer updates balances and creates a transaction', () => {
  it('decrements source, increments destination, and records a transaction', async () => {
    const user = userEvent.setup();
    render(<App />);

    const checkingBefore = checking.balance;
    const savingsBefore = savings.balance;
    const transferAmount = '250.00';

    await openTransfer(user);
    await user.selectOptions(screen.getByTestId('transfer-source'), checking.id);
    await user.selectOptions(screen.getByTestId('transfer-destination'), savings.id);
    await user.type(screen.getByTestId('transfer-amount'), transferAmount);
    await user.click(screen.getByTestId('transfer-submit'));

    // Success message
    expect(screen.getByTestId('transfer-success')).toBeInTheDocument();

    // Navigate to accounts and verify balances changed by exactly A.
    await user.click(screen.getByTestId('nav-accounts'));
    const checkingAfter = Number(
      (balanceFor(checking.id) ?? '').replace(/[$,]/g, ''),
    );
    const savingsAfter = Number(
      (balanceFor(savings.id) ?? '').replace(/[$,]/g, ''),
    );
    expect(checkingAfter).toBeCloseTo(checkingBefore - 250, 2);
    expect(savingsAfter).toBeCloseTo(savingsBefore + 250, 2);

    // Navigate to the source account detail and confirm a new debit tx.
    await user.click(screen.getAllByTestId('view-account').find(
      (b) => b.closest('[data-account-id]')?.getAttribute('data-account-id') === checking.id,
    ) as HTMLElement);
    const rows = screen.getAllByTestId('transaction-row');
    const transferRow = rows.find((r) => {
      const desc = within(r).getByTestId('tx-description').textContent ?? '';
      return /transfer to/i.test(desc);
    });
    expect(transferRow).toBeDefined();
    expect(transferRow!.getAttribute('data-direction')).toBe('debit');
  });
});

describe('TransferPage — validation errors with no state change', () => {
  beforeEach(() => {
    // Each test re-renders App fresh, so balances always start from seed.
  });

  it('blocks insufficient funds with a clear error and no balance change', async () => {
    const user = userEvent.setup();
    render(<App />);
    const checkingBefore = balanceFor(checking.id);

    await openTransfer(user);
    await user.selectOptions(screen.getByTestId('transfer-source'), checking.id);
    await user.selectOptions(screen.getByTestId('transfer-destination'), savings.id);
    // checking balance is 8450.25; request more than that but under the limit.
    await user.type(screen.getByTestId('transfer-amount'), '9000.00');
    await user.click(screen.getByTestId('transfer-submit'));

    const error = screen.getByTestId('transfer-error');
    expect(error.textContent).toMatch(/insufficient funds/i);
    expect(screen.queryByTestId('transfer-success')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('nav-accounts'));
    expect(balanceFor(checking.id)).toBe(checkingBefore);
  });

  it('blocks an amount exceeding the transfer limit', async () => {
    const user = userEvent.setup();
    render(<App />);
    // Savings has 42180, so 15000 is over the limit (10000) but under funds.
    const savingsBefore = balanceFor(savings.id);
    const checkingBefore = balanceFor(checking.id);

    await openTransfer(user);
    await user.selectOptions(screen.getByTestId('transfer-source'), savings.id);
    await user.selectOptions(screen.getByTestId('transfer-destination'), checking.id);
    await user.type(screen.getByTestId('transfer-amount'), '15000.00');
    await user.click(screen.getByTestId('transfer-submit'));

    const error = screen.getByTestId('transfer-error');
    expect(error.textContent).toMatch(/limit/i);
    expect(screen.queryByTestId('transfer-success')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('nav-accounts'));
    expect(balanceFor(savings.id)).toBe(savingsBefore);
    expect(balanceFor(checking.id)).toBe(checkingBefore);
  });

  it('rejects an empty amount', async () => {
    const user = userEvent.setup();
    render(<App />);
    const checkingBefore = balanceFor(checking.id);

    await openTransfer(user);
    await user.selectOptions(screen.getByTestId('transfer-source'), checking.id);
    await user.selectOptions(screen.getByTestId('transfer-destination'), savings.id);
    // leave amount empty
    await user.click(screen.getByTestId('transfer-submit'));

    expect(screen.getByTestId('transfer-error').textContent).toMatch(/enter an amount/i);
    await user.click(screen.getByTestId('nav-accounts'));
    expect(balanceFor(checking.id)).toBe(checkingBefore);
  });

  it('rejects zero amount', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openTransfer(user);
    await user.selectOptions(screen.getByTestId('transfer-source'), checking.id);
    await user.selectOptions(screen.getByTestId('transfer-destination'), savings.id);
    await user.type(screen.getByTestId('transfer-amount'), '0');
    await user.click(screen.getByTestId('transfer-submit'));
    expect(screen.getByTestId('transfer-error').textContent).toMatch(/greater than zero/i);
  });

  it('rejects a negative amount', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openTransfer(user);
    await user.selectOptions(screen.getByTestId('transfer-source'), checking.id);
    await user.selectOptions(screen.getByTestId('transfer-destination'), savings.id);
    await user.type(screen.getByTestId('transfer-amount'), '-50.00');
    await user.click(screen.getByTestId('transfer-submit'));
    expect(screen.getByTestId('transfer-error').textContent).toMatch(/greater than zero/i);
  });

  it('rejects a non-numeric amount', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openTransfer(user);
    await user.selectOptions(screen.getByTestId('transfer-source'), checking.id);
    await user.selectOptions(screen.getByTestId('transfer-destination'), savings.id);
    // type=number inputs can still hold non-numeric via direct value; emulate.
    await user.type(screen.getByTestId('transfer-amount'), 'abc');
    await user.click(screen.getByTestId('transfer-submit'));
    // Either empty or non-numeric path is acceptable; both block with a message.
    expect(screen.getByTestId('transfer-error')).toBeInTheDocument();
    expect(screen.queryByTestId('transfer-success')).not.toBeInTheDocument();
  });

  it('prevents transferring to the same source/destination account (option disabled)', async () => {
    const user = userEvent.setup();
    render(<App />);
    const checkingBefore = balanceFor(checking.id);

    await openTransfer(user);
    await user.selectOptions(screen.getByTestId('transfer-source'), checking.id);

    // The destination option matching the source is disabled in the UI,
    // so an identical destination cannot be selected (VAL-BANKING-013 path A).
    const destSelect = screen.getByTestId('transfer-destination') as HTMLSelectElement;
    const sameOption = Array.from(destSelect.options).find((o) => o.value === checking.id);
    expect(sameOption).toBeDefined();
    expect(sameOption!.disabled).toBe(true);

    // No balances changed by merely selecting the source.
    await user.click(screen.getByTestId('nav-accounts'));
    expect(balanceFor(checking.id)).toBe(checkingBefore);
  });
});

describe('TransferPage — persistence within session', () => {
  it('a completed transfer persists across navigation to detail and back', async () => {
    const user = userEvent.setup();
    render(<App />);

    await openTransfer(user);
    await user.selectOptions(screen.getByTestId('transfer-source'), checking.id);
    await user.selectOptions(screen.getByTestId('transfer-destination'), savings.id);
    await user.type(screen.getByTestId('transfer-amount'), '100.00');
    await user.click(screen.getByTestId('transfer-submit'));
    expect(screen.getByTestId('transfer-success')).toBeInTheDocument();

    // Navigate to accounts, into the source detail, back, to history, back.
    await user.click(screen.getByTestId('nav-accounts'));
    const checkingAfter = balanceFor(checking.id);
    await user.click(screen.getAllByTestId('view-account').find(
      (b) => b.closest('[data-account-id]')?.getAttribute('data-account-id') === checking.id,
    ) as HTMLElement);
    // Detail balance agrees with the list balance.
    expect(screen.getByTestId('detail-balance').textContent).toBe(checkingAfter);
    // Transfer transaction persists in detail ledger.
    const detailRows = screen.getAllByTestId('transaction-row');
    expect(detailRows.some((r) => /transfer to/i.test(within(r).getByTestId('tx-description').textContent ?? ''))).toBe(true);

    // Global history also shows it.
    await user.click(screen.getByTestId('nav-history'));
    const historyRows = screen.getAllByTestId('transaction-row');
    expect(historyRows.some((r) => /transfer to/i.test(within(r).getByTestId('tx-description').textContent ?? ''))).toBe(true);

    // Back to accounts — balance still reflects the transfer.
    await user.click(screen.getByTestId('nav-accounts'));
    expect(balanceFor(checking.id)).toBe(checkingAfter);
  });
});
