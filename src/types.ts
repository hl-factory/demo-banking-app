export type AccountType = 'checking' | 'savings' | 'credit';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  /** Masked account number, e.g. "••••4821". */
  maskedNumber: string;
  /**
   * Account balance in USD.
   * For checking/savings this is the available funds (positive).
   * For credit accounts this is negative (the outstanding amount owed).
   */
  balance: number;
}

export interface Transaction {
  id: string;
  accountId: string;
  /** ISO calendar date string (YYYY-MM-DD). Deterministic, no time component. */
  date: string;
  description: string;
  /**
   * Signed amount in USD.
   * Positive = credit/inflow (money into the account).
   * Negative = debit/outflow (money out of the account).
   */
  amount: number;
  category: string;
}
