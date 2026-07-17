import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { TRANSACTIONS } from '../data/transactions';

/**
 * Defect 3 (product-apps scrutiny round 1): HistoryPage rendered a
 * <div role="button"> directly under a <ul>, with the nested TransactionRow
 * component returning an <li>. That produces invalid list markup (a <div>
 * cannot be a direct child of a <ul>; only <li> / script-supporting elements
 * are permitted). These tests assert valid list semantics.
 */
describe('HistoryPage — valid list markup', () => {
  it('the transaction list is a <ul> whose direct children are all <li> (no div under ul)', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByTestId('nav-history'));

    const list = screen.getByTestId('tx-list');
    expect(list.tagName).toBe('UL');

    // Every DIRECT child of the <ul> must be an <li>. The previous bug wrapped
    // each row in a <div role="button">, placing a <div> directly under <ul>.
    const directChildren = Array.from(list.children);
    expect(directChildren.length).toBe(TRANSACTIONS.length);
    for (const child of directChildren) {
      expect(child.tagName).toBe('LI');
    }

    // The transaction rows themselves are <li> elements (one per transaction).
    const rows = screen.getAllByTestId('transaction-row');
    expect(rows.length).toBe(TRANSACTIONS.length);
    for (const row of rows) {
      expect(row.tagName).toBe('LI');
    }
  });

  it('history rows remain interactive: clicking a row navigates to account detail', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByTestId('nav-history'));

    const rows = screen.getAllByTestId('transaction-row');
    expect(rows.length).toBeGreaterThan(0);

    // The first (most-recent) row is a proper list item and is keyboard-
    // focusable / clickable, preserving the navigate-to-detail affordance.
    const firstRow = rows[0];
    expect(firstRow.tagName).toBe('LI');
    expect(firstRow.getAttribute('role') === 'button' || firstRow.tabIndex >= 0).toBe(true);

    await user.click(firstRow);
    expect(screen.getByTestId('detail-name')).toBeInTheDocument();
  });

  it('history rows are keyboard activatable (Enter navigates to detail)', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByTestId('nav-history'));

    const firstRow = screen.getAllByTestId('transaction-row')[0];
    firstRow.focus();
    expect(firstRow).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByTestId('detail-name')).toBeInTheDocument();
  });
});
