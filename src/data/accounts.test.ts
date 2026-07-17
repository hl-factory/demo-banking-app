import { describe, expect, it } from 'vitest';
import { ACCOUNTS, ACCOUNT_TYPE_LABELS, getAccountById } from './accounts';
import { TRANSACTIONS } from './transactions';
import { isValidIsoDate } from '../utils/format';

describe('seed accounts (determinism + shape)', () => {
  it('has at least three accounts', () => {
    expect(ACCOUNTS.length).toBeGreaterThanOrEqual(3);
  });

  it('includes checking, savings, and credit account types', () => {
    const types = new Set(ACCOUNTS.map((a) => a.type));
    expect(types.has('checking')).toBe(true);
    expect(types.has('savings')).toBe(true);
    expect(types.has('credit')).toBe(true);
  });

  it('every account has a unique id, non-empty name, and masked number', () => {
    const ids = ACCOUNTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const a of ACCOUNTS) {
      expect(a.name.length).toBeGreaterThan(0);
      expect(a.maskedNumber.length).toBeGreaterThan(0);
    }
  });

  it('checking/savings balances are positive; credit balance is negative (owed)', () => {
    for (const a of ACCOUNTS) {
      expect(Number.isFinite(a.balance)).toBe(true);
      if (a.type === 'credit') {
        expect(a.balance).toBeLessThan(0);
      } else {
        expect(a.balance).toBeGreaterThan(0);
      }
    }
  });

  it('balances have at most two decimal places (valid currency)', () => {
    for (const a of ACCOUNTS) {
      const rounded = Math.round(a.balance * 100) / 100;
      expect(a.balance).toBeCloseTo(rounded, 10);
    }
  });

  it('account type labels cover all types', () => {
    for (const a of ACCOUNTS) {
      expect(ACCOUNT_TYPE_LABELS[a.type].length).toBeGreaterThan(0);
    }
  });

  it('getAccountById resolves a known id and rejects unknown', () => {
    expect(getAccountById(ACCOUNTS[0].id)).toBeDefined();
    expect(getAccountById('does-not-exist')).toBeUndefined();
  });

  it('account ordering is stable across reads (deterministic)', () => {
    const ids = ACCOUNTS.map((a) => a.id);
    expect(ACCOUNTS.map((a) => a.id)).toEqual(ids);
  });
});

describe('seed transactions (determinism + shape)', () => {
  it('ledger is pre-populated with at least 5 transactions', () => {
    expect(TRANSACTIONS.length).toBeGreaterThanOrEqual(5);
  });

  it('every transaction has a unique id and non-placeholder description', () => {
    const ids = TRANSACTIONS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    // Placeholder check uses word boundaries so legitimate words like "Foods"
    // (containing "foo") are not flagged.
    const placeholderPattern = /\b(lorem|test|todo|placeholder|dummy|foobar|asdf|xyzzy)\b/i;
    for (const t of TRANSACTIONS) {
      expect(t.description.length).toBeGreaterThan(0);
      expect(placeholderPattern.test(t.description)).toBe(false);
    }
  });

  it('every transaction references an existing account', () => {
    const accountIds = new Set(ACCOUNTS.map((a) => a.id));
    for (const t of TRANSACTIONS) {
      expect(accountIds.has(t.accountId)).toBe(true);
    }
  });

  it('every date is a valid ISO calendar date (YYYY-MM-DD)', () => {
    for (const t of TRANSACTIONS) {
      expect(t.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(isValidIsoDate(t.date)).toBe(true);
    }
  });

  it('every amount is a finite number with at most two decimals', () => {
    for (const t of TRANSACTIONS) {
      expect(Number.isFinite(t.amount)).toBe(true);
      expect(t.amount).not.toBe(0);
      const rounded = Math.round(t.amount * 100) / 100;
      expect(t.amount).toBeCloseTo(rounded, 10);
    }
  });

  it('seed array is ordered most-recent-first (date descending)', () => {
    for (let i = 1; i < TRANSACTIONS.length; i++) {
      expect(TRANSACTIONS[i - 1].date >= TRANSACTIONS[i].date).toBe(true);
    }
  });

  it('ledger is non-empty for each account', () => {
    for (const a of ACCOUNTS) {
      const count = TRANSACTIONS.filter((t) => t.accountId === a.id).length;
      expect(count).toBeGreaterThan(0);
    }
  });

  it('transaction ordering is stable across reads (deterministic)', () => {
    const ids = TRANSACTIONS.map((t) => t.id);
    expect(TRANSACTIONS.map((t) => t.id)).toEqual(ids);
  });
});
