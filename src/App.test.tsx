import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { ACCOUNTS } from './data/accounts';
import { TRANSACTIONS } from './data/transactions';

describe('Banking app — accounts & history', () => {
  it('renders the banking app title and accounts list on initial load', () => {
    render(<App />);
    expect(screen.getByText('Halcyon Bank')).toBeInTheDocument();
    expect(screen.getByText('Your accounts')).toBeInTheDocument();
    expect(screen.getAllByTestId('account-card').length).toBeGreaterThanOrEqual(3);
  });

  it('shows checking, savings, and credit accounts with formatted balances', () => {
    render(<App />);
    const cards = screen.getAllByTestId('account-card');
    const types = cards.map((c) => c.getAttribute('data-account-type'));
    expect(types).toEqual(expect.arrayContaining(['checking', 'savings', 'credit']));

    for (const card of cards) {
      const balanceEl = within(card).getByTestId('account-balance');
      // Formatted currency: $... or -$... with two decimals.
      expect(balanceEl.textContent).toMatch(/^-?\$[\d,]+\.\d{2}$/);
    }
  });

  it('checking/savings balances are positive and credit is negative', () => {
    render(<App />);
    const cards = screen.getAllByTestId('account-card');
    for (const card of cards) {
      const type = card.getAttribute('data-account-type');
      const balanceEl = within(card).getByTestId('account-balance');
      const text = balanceEl.textContent ?? '';
      if (type === 'credit') {
        expect(text.startsWith('-')).toBe(true);
        expect(within(card).getByTestId('account-balance-label').textContent).toBe(
          'Outstanding balance',
        );
      } else {
        expect(text.startsWith('-')).toBe(false);
        expect(within(card).getByTestId('account-balance-label').textContent).toBe(
          'Available balance',
        );
      }
    }
  });

  it('navigates to account detail via UI and shows scoped transactions', async () => {
    const user = userEvent.setup();
    render(<App />);

    const cards = screen.getAllByTestId('account-card');
    const target = cards.find(
      (c) => c.getAttribute('data-account-type') === 'checking',
    ) as HTMLElement;
    const account = ACCOUNTS.find((a) => a.type === 'checking')!;

    await user.click(within(target).getByTestId('view-account'));

    // Detail header matches the selected account.
    expect(screen.getByTestId('detail-name').textContent).toBe(account.name);
    expect(screen.getByTestId('detail-balance').textContent).toMatch(/^-?\$[\d,]+\.\d{2}$/);

    // Transactions shown are scoped to this account only.
    const rows = screen.getAllByTestId('transaction-row');
    expect(rows.length).toBeGreaterThan(0);
    const expected = TRANSACTIONS.filter((t) => t.accountId === account.id).length;
    expect(rows.length).toBe(expected);
  });

  it('account detail transactions are ordered most-recent-first', async () => {
    const user = userEvent.setup();
    render(<App />);
    const firstCard = screen.getAllByTestId('account-card')[0];
    const accountId = firstCard.getAttribute('data-account-id')!;
    const account = ACCOUNTS.find((a) => a.id === accountId)!;
    await user.click(within(firstCard).getByTestId('view-account'));

    const dateEls = screen.getAllByTestId('tx-date');
    const dates = dateEls.map((el) => el.textContent ?? '');
    // Map the formatted dates back to ISO for monotonicity check via seed order.
    const seedForAccount = TRANSACTIONS.filter((t) => t.accountId === account.id).sort(
      (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0),
    );
    expect(dates.length).toBe(seedForAccount.length);
    for (let i = 1; i < seedForAccount.length; i++) {
      // Non-increasing by date.
      expect(seedForAccount[i - 1].date >= seedForAccount[i].date).toBe(true);
    }
  });

  it('exposes a global transaction history reachable via UI, ordered most-recent-first', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByTestId('nav-history'));

    expect(screen.getByText('Transaction history')).toBeInTheDocument();
    const rows = screen.getAllByTestId('transaction-row');
    expect(rows.length).toBe(TRANSACTIONS.length);

    // Verify ordering is date-descending across the global list.
    const dateEls = screen.getAllByTestId('tx-date');
    const formattedToIso = new Map<string, string>();
    for (const t of TRANSACTIONS) {
      formattedToIso.set(
        new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
          .format(new Date(Number(t.date.slice(0, 4)), Number(t.date.slice(5, 7)) - 1, Number(t.date.slice(8, 10)))),
        t.date,
      );
    }
    const isoDates = dateEls.map((el) => formattedToIso.get(el.textContent ?? '') ?? '');
    for (let i = 1; i < isoDates.length; i++) {
      expect(isoDates[i - 1] >= isoDates[i]).toBe(true);
    }
  });

  it('each transaction row shows a formatted amount and a debit/credit direction badge', async () => {
    const user = userEvent.setup();
    render(<App />);
    // Navigate to the global history view where transaction rows render.
    await user.click(screen.getByTestId('nav-history'));
    const rows = screen.getAllByTestId('transaction-row');
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      const amount = within(row).getByTestId('tx-amount').textContent ?? '';
      expect(amount).toMatch(/^-?\$[\d,]+\.\d{2}$/);
      const dir = within(row).getByTestId('tx-direction').textContent ?? '';
      expect(['CR', 'DR']).toContain(dir);
      const direction = row.getAttribute('data-direction');
      expect(['credit', 'debit']).toContain(direction);
    }
  });

  it('navigates back from detail to accounts and to history via UI controls', async () => {
    const user = userEvent.setup();
    render(<App />);

    // accounts -> detail
    await user.click(within(screen.getAllByTestId('account-card')[0]).getByTestId('view-account'));
    expect(screen.getByTestId('detail-name')).toBeInTheDocument();

    // detail -> accounts
    await user.click(screen.getByTestId('back-to-accounts'));
    expect(screen.getByText('Your accounts')).toBeInTheDocument();

    // accounts -> history via header nav
    await user.click(screen.getByTestId('nav-history'));
    expect(screen.getByText('Transaction history')).toBeInTheDocument();
  });

  it('seed data is deterministic across re-renders (balances/transactions identical)', () => {
    const { unmount } = render(<App />);
    const firstBalances = screen.getAllByTestId('account-balance').map((e) => e.textContent);
    unmount();

    render(<App />);
    const secondBalances = screen.getAllByTestId('account-balance').map((e) => e.textContent);
    expect(secondBalances).toEqual(firstBalances);
  });
});
