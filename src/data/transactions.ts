import type { Transaction } from '../types';

/**
 * DETERMINISTIC seed transaction ledger.
 * No random/Date.now-based values. Every date is a valid ISO calendar date
 * (YYYY-MM-DD). Amounts are signed: positive = credit/inflow, negative =
 * debit/outflow. The seed array is listed most-recent-first (date descending,
 * globally across all accounts); selectors also sort by date descending at
 * runtime so ordering is guaranteed regardless of insertion order.
 */
export const TRANSACTIONS: Transaction[] = [
  { id: 'tx-c1', accountId: 'acc-checking', date: '2026-07-10', description: 'Payroll Deposit - Acme Corp', amount: 3200.0, category: 'Deposit' },
  { id: 'tx-r1', accountId: 'acc-credit', date: '2026-07-09', description: 'Amazon - Electronics Order', amount: -129.99, category: 'Shopping' },
  { id: 'tx-c2', accountId: 'acc-checking', date: '2026-07-08', description: 'Whole Foods Market', amount: -86.4, category: 'Groceries' },
  { id: 'tx-r2', accountId: 'acc-credit', date: '2026-07-06', description: 'Netflix Subscription', amount: -15.99, category: 'Entertainment' },
  { id: 'tx-c3', accountId: 'acc-checking', date: '2026-07-05', description: 'Con Edison - Electric Bill', amount: -124.55, category: 'Utilities' },
  { id: 'tx-s1', accountId: 'acc-savings', date: '2026-07-01', description: 'Interest Payment', amount: 78.65, category: 'Interest' },
  { id: 'tx-r3', accountId: 'acc-credit', date: '2026-06-30', description: 'Payment Received - Thank You', amount: 500.0, category: 'Payment' },
  { id: 'tx-c4', accountId: 'acc-checking', date: '2026-06-28', description: 'Starbucks Coffee', amount: -6.75, category: 'Dining' },
  { id: 'tx-r4', accountId: 'acc-credit', date: '2026-06-22', description: 'Delta Airlines - Flight JFK to SFO', amount: -342.1, category: 'Travel' },
  { id: 'tx-c5', accountId: 'acc-checking', date: '2026-06-20', description: 'ATM Withdrawal - 5th Ave', amount: -200.0, category: 'Cash' },
  { id: 'tx-s2', accountId: 'acc-savings', date: '2026-06-17', description: 'Transfer from Everyday Checking', amount: 1000.0, category: 'Transfer' },
  { id: 'tx-c6', accountId: 'acc-checking', date: '2026-06-15', description: 'Payroll Deposit - Acme Corp', amount: 3200.0, category: 'Deposit' },
  { id: 'tx-r5', accountId: 'acc-credit', date: '2026-06-10', description: 'Shell Gas Station', amount: -58.25, category: 'Transport' },
  { id: 'tx-c7', accountId: 'acc-checking', date: '2026-06-02', description: 'Rent Payment - June', amount: -1850.0, category: 'Housing' },
  { id: 'tx-s3', accountId: 'acc-savings', date: '2026-06-01', description: 'Interest Payment', amount: 74.2, category: 'Interest' },
  { id: 'tx-s4', accountId: 'acc-savings', date: '2026-05-15', description: 'Opening Deposit', amount: 40000.0, category: 'Deposit' },
];

export const ALL_TRANSACTIONS: readonly Transaction[] = TRANSACTIONS;

/** Total count of seed transactions (used by tests/UI). */
export const SEED_TX_COUNT = TRANSACTIONS.length;
