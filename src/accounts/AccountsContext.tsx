import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Account, Transaction } from '../types';
import { ACCOUNTS } from '../data/accounts';
import { TRANSACTIONS } from '../data/transactions';

interface AccountsContextValue {
  accounts: Account[];
  /** All transactions, most-recent-first (by date descending). */
  transactions: Transaction[];
  getAccountById: (id: string) => Account | undefined;
  /** Transactions scoped to one account, most-recent-first. */
  getTransactionsByAccount: (accountId: string) => Transaction[];
}

const AccountsContext = createContext<AccountsContextValue | null>(null);

/**
 * Sort transactions most-recent-first. For ties on the same date, fall back to
 * the seed insertion order (stable sort) so the result is deterministic.
 */
function sortByDateDesc(list: readonly Transaction[]): Transaction[] {
  return [...list].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return 0;
  });
}

export function AccountsProvider({ children }: { children: ReactNode }) {
  // State initialized from the deterministic seed. Held in state so later
  // features (transfers) can mutate balances/append transactions in-session.
  const [accounts] = useState<Account[]>(() => ACCOUNTS.map((a) => ({ ...a })));
  const [transactions] = useState<Transaction[]>(() =>
    TRANSACTIONS.map((t) => ({ ...t })),
  );

  const sortedTransactions = useMemo(
    () => sortByDateDesc(transactions),
    [transactions],
  );

  const getAccountById = useCallback(
    (id: string) => accounts.find((a) => a.id === id),
    [accounts],
  );

  const getTransactionsByAccount = useCallback(
    (accountId: string) =>
      sortByDateDesc(transactions.filter((t) => t.accountId === accountId)),
    [transactions],
  );

  const value = useMemo<AccountsContextValue>(
    () => ({
      accounts,
      transactions: sortedTransactions,
      getAccountById,
      getTransactionsByAccount,
    }),
    [accounts, sortedTransactions, getAccountById, getTransactionsByAccount],
  );

  return (
    <AccountsContext.Provider value={value}>{children}</AccountsContext.Provider>
  );
}

export function useAccounts(): AccountsContextValue {
  const ctx = useContext(AccountsContext);
  if (!ctx) throw new Error('useAccounts must be used within an AccountsProvider');
  return ctx;
}
