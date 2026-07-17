import { describe, expect, it, beforeEach } from 'vitest';
import {
  TRANSFER_LIMIT,
  validateTransfer,
  applyTransfer,
  _resetTransferCounter,
  type TransferInput,
} from './transfer';
import { toCents } from '../utils/money';
import type { Account } from '../types';

const ACCOUNTS: Account[] = [
  { id: 'a-checking', name: 'Checking', type: 'checking', maskedNumber: '••••1111', balance: 1000.0 },
  { id: 'a-savings', name: 'Savings', type: 'savings', maskedNumber: '••••2222', balance: 50000.0 },
  { id: 'a-credit', name: 'Credit', type: 'credit', maskedNumber: '••••3333', balance: -800.0 },
];

const TX = [
  { id: 'seed-1', accountId: 'a-checking', date: '2026-07-10', description: 'Seed', amount: 100.0, category: 'Deposit' },
];

function input(sourceId: string, destinationId: string, amount: string): TransferInput {
  return { sourceId, destinationId, amount };
}

describe('validateTransfer — valid cases', () => {
  it('accepts a normal in-limit transfer with sufficient funds', () => {
    const r = validateTransfer(input('a-checking', 'a-savings', '250.00'), ACCOUNTS);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.amountCents).toBe(25000);
      expect(r.amountDollars).toBe(250);
    }
  });

  it('accepts an amount without explicit decimals', () => {
    const r = validateTransfer(input('a-savings', 'a-checking', '100'), ACCOUNTS);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.amountCents).toBe(10000);
  });

  it('accepts the exact transfer limit', () => {
    const r = validateTransfer(input('a-savings', 'a-checking', String(TRANSFER_LIMIT) + '.00'), ACCOUNTS);
    expect(r.ok).toBe(true);
  });
});

describe('validateTransfer — selection errors', () => {
  it('rejects when source or destination is missing', () => {
    const r = validateTransfer(input('', 'a-savings', '10.00'), ACCOUNTS);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/select both/i);
  });

  it('rejects when source and destination are the same', () => {
    const r = validateTransfer(input('a-checking', 'a-checking', '10.00'), ACCOUNTS);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/must be different/i);
  });
});

describe('validateTransfer — amount errors (empty/zero/negative/non-numeric)', () => {
  it('rejects an empty amount', () => {
    const r = validateTransfer(input('a-checking', 'a-savings', ''), ACCOUNTS);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/enter an amount/i);
  });

  it('rejects a whitespace-only amount', () => {
    const r = validateTransfer(input('a-checking', 'a-savings', '   '), ACCOUNTS);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/enter an amount/i);
  });

  it('rejects zero', () => {
    const r = validateTransfer(input('a-checking', 'a-savings', '0'), ACCOUNTS);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/greater than zero/i);
  });

  it('rejects zero with decimals', () => {
    const r = validateTransfer(input('a-checking', 'a-savings', '0.00'), ACCOUNTS);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/greater than zero/i);
  });

  it('rejects a negative amount', () => {
    const r = validateTransfer(input('a-checking', 'a-savings', '-50.00'), ACCOUNTS);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/greater than zero/i);
  });

  it('rejects a non-numeric amount', () => {
    const r = validateTransfer(input('a-checking', 'a-savings', 'abc'), ACCOUNTS);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/valid numeric/i);
  });

  it('rejects an amount with more than two decimal places', () => {
    const r = validateTransfer(input('a-checking', 'a-savings', '10.999'), ACCOUNTS);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/two decimal places/i);
  });
});

describe('validateTransfer — limit and funds', () => {
  it('rejects an amount exceeding the transfer limit', () => {
    const r = validateTransfer(input('a-savings', 'a-checking', '10000.01'), ACCOUNTS);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/limit/i);
  });

  it('limit rejection is independent of insufficient funds (source has enough)', () => {
    // Savings has 50000, so 20000 exceeds the limit but NOT via the funds path.
    expect(50000).toBeGreaterThan(20000);
    const r = validateTransfer(input('a-savings', 'a-checking', '20000.00'), ACCOUNTS);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/limit/i);
  });

  it('rejects insufficient funds with a clear message', () => {
    const r = validateTransfer(input('a-checking', 'a-savings', '5000.00'), ACCOUNTS);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/insufficient funds/i);
  });

  it('cannot transfer from a credit account (negative balance => insufficient)', () => {
    const r = validateTransfer(input('a-credit', 'a-checking', '10.00'), ACCOUNTS);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/insufficient funds/i);
  });
});

describe('applyTransfer — balances & transactions', () => {
  beforeEach(() => _resetTransferCounter());

  it('decrements source and increments destination by exactly the amount', () => {
    const v = validateTransfer(input('a-checking', 'a-savings', '250.00'), ACCOUNTS);
    if (!v.ok) throw new Error('should be valid');
    const result = applyTransfer(input('a-checking', 'a-savings', '250.00'), ACCOUNTS, TX, v, '2026-07-17');
    const src = result.accounts.find((a) => a.id === 'a-checking')!;
    const dst = result.accounts.find((a) => a.id === 'a-savings')!;
    expect(src.balance).toBe(750);
    expect(dst.balance).toBe(50250);
  });

  it('creates a debit on the source and a credit on the destination', () => {
    const v = validateTransfer(input('a-checking', 'a-savings', '250.00'), ACCOUNTS);
    if (!v.ok) throw new Error('should be valid');
    const result = applyTransfer(input('a-checking', 'a-savings', '250.00'), ACCOUNTS, TX, v, '2026-07-17');
    const newTxs = result.transactions.slice(0, 2);
    const credit = newTxs.find((t) => t.accountId === 'a-savings')!;
    const debit = newTxs.find((t) => t.accountId === 'a-checking')!;
    expect(credit.amount).toBe(250);
    expect(debit.amount).toBe(-250);
    expect(credit.category).toBe('Transfer');
    expect(debit.category).toBe('Transfer');
    expect(credit.description).toMatch(/from Checking/i);
    expect(debit.description).toMatch(/to Savings/i);
    expect(credit.date).toBe('2026-07-17');
    expect(debit.date).toBe('2026-07-17');
  });

  it('does not mutate the input arrays', () => {
    const v = validateTransfer(input('a-checking', 'a-savings', '100.00'), ACCOUNTS);
    if (!v.ok) throw new Error('should be valid');
    const accountsCopy = ACCOUNTS.map((a) => ({ ...a }));
    const txCopy = TX.map((t) => ({ ...t }));
    applyTransfer(input('a-checking', 'a-savings', '100.00'), ACCOUNTS, TX, v, '2026-07-17');
    expect(ACCOUNTS).toEqual(accountsCopy);
    expect(TX).toEqual(txCopy);
  });

  it('prepends new transactions so the newest appears first', () => {
    const v = validateTransfer(input('a-checking', 'a-savings', '100.00'), ACCOUNTS);
    if (!v.ok) throw new Error('should be valid');
    const result = applyTransfer(input('a-checking', 'a-savings', '100.00'), ACCOUNTS, TX, v, '2026-07-17');
    expect(result.transactions[0].id).toMatch(/tx-transfer-1-cr/);
    expect(result.transactions[1].id).toMatch(/tx-transfer-1-dr/);
    expect(result.transactions.length).toBe(TX.length + 2);
  });
});

describe('applyTransfer — exact precision across repeated transfers', () => {
  beforeEach(() => _resetTransferCounter());

  it('ten $0.01 transfers from 100.00 leave exactly 99.90 (no float drift)', () => {
    let accounts: Account[] = [
      { id: 'src', name: 'Src', type: 'checking', maskedNumber: '••••0001', balance: 100.0 },
      { id: 'dst', name: 'Dst', type: 'savings', maskedNumber: '••••0002', balance: 0.0 },
    ];
    let transactions = TX;
    for (let i = 0; i < 10; i++) {
      const v = validateTransfer(input('src', 'dst', '0.01'), accounts);
      if (!v.ok) throw new Error('should be valid');
      const r = applyTransfer(input('src', 'dst', '0.01'), accounts, transactions, v, '2026-07-17');
      accounts = r.accounts;
      transactions = r.transactions;
    }
    const src = accounts.find((a) => a.id === 'src')!;
    const dst = accounts.find((a) => a.id === 'dst')!;
    expect(toCents(src.balance)).toBe(9990);
    expect(toCents(dst.balance)).toBe(10);
    expect(src.balance).toBeCloseTo(99.9, 2);
    expect(dst.balance).toBeCloseTo(0.1, 2);
  });

  it('repeated $0.10 transfers preserve exact cents with no accumulating error', () => {
    let accounts: Account[] = [
      { id: 'src', name: 'Src', type: 'checking', maskedNumber: '••••0001', balance: 1.0 },
      { id: 'dst', name: 'Dst', type: 'savings', maskedNumber: '••••0002', balance: 0.0 },
    ];
    let transactions = TX;
    for (let i = 0; i < 10; i++) {
      const v = validateTransfer(input('src', 'dst', '0.10'), accounts);
      if (!v.ok) throw new Error('should be valid');
      const r = applyTransfer(input('src', 'dst', '0.10'), accounts, transactions, v, '2026-07-17');
      accounts = r.accounts;
      transactions = r.transactions;
    }
    const src = accounts.find((a) => a.id === 'src')!;
    const dst = accounts.find((a) => a.id === 'dst')!;
    expect(toCents(src.balance)).toBe(0);
    expect(toCents(dst.balance)).toBe(100);
  });

  it('preserves the fractional part .25 across many transfers', () => {
    let accounts: Account[] = [
      { id: 'src', name: 'Src', type: 'checking', maskedNumber: '••••0001', balance: 8450.25 },
      { id: 'dst', name: 'Dst', type: 'savings', maskedNumber: '••••0002', balance: 0.0 },
    ];
    let transactions = TX;
    for (let i = 0; i < 7; i++) {
      const v = validateTransfer(input('src', 'dst', '0.03'), accounts);
      if (!v.ok) throw new Error('should be valid');
      const r = applyTransfer(input('src', 'dst', '0.03'), accounts, transactions, v, '2026-07-17');
      accounts = r.accounts;
      transactions = r.transactions;
    }
    const src = accounts.find((a) => a.id === 'src')!;
    expect(toCents(src.balance)).toBe(845025 - 21);
  });
});
