import type { Account, AccountType } from '../types';

/**
 * DETERMINISTIC seed accounts.
 * No random/Date.now-based values. Ids, names, masked numbers, and balances
 * are fixed at module-load time and identical across reloads.
 */
export const ACCOUNTS: Account[] = [
  {
    id: 'acc-checking',
    name: 'Everyday Checking',
    type: 'checking',
    maskedNumber: '••••4821',
    balance: 8450.25,
  },
  {
    id: 'acc-savings',
    name: 'High-Yield Savings',
    type: 'savings',
    maskedNumber: '••••9032',
    balance: 42180.0,
  },
  {
    id: 'acc-credit',
    name: 'Platinum Credit Card',
    type: 'credit',
    maskedNumber: '••••7741',
    balance: -2340.5,
  },
];

export const ALL_ACCOUNTS: readonly Account[] = ACCOUNTS;

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: 'Checking',
  savings: 'Savings',
  credit: 'Credit',
};

export function getAccountById(id: string): Account | undefined {
  return ACCOUNTS.find((a) => a.id === id);
}
