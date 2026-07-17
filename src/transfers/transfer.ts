/**
 * Pure transfer logic: validation and application.
 *
 * Kept free of React so it is straightforward to unit-test, including the
 * exact two-decimal precision guarantees (VAL-BANKING-020). All money math
 * goes through integer-cent arithmetic (see `utils/money`) so repeated
 * transfers never drift.
 */
import type { Account, Transaction } from '../types';
import { toCents, fromCents } from '../utils/money';
import { formatCurrency } from '../utils/format';

/**
 * Per-transfer limit in USD. Surfaced in the UI as helper text and enforced
 * here independent of the available-balance check.
 */
export const TRANSFER_LIMIT = 10000;

export interface TransferInput {
  sourceId: string;
  destinationId: string;
  /** Raw amount string from the form input (untrimmed). */
  amount: string;
}

export type TransferValidation =
  | { ok: true; amountCents: number; amountDollars: number }
  | { ok: false; error: string };

/**
 * Validate a transfer request against the rules:
 *  - source and destination must both be selected and must differ
 *  - amount must be a non-empty, numeric, positive value with <= 2 decimals
 *  - amount must not exceed the per-transfer limit
 *  - source must have sufficient funds (balance >= amount)
 *
 * Returns a tagged result; the error string is user-facing and clear.
 */
export function validateTransfer(
  input: TransferInput,
  accounts: readonly Account[],
): TransferValidation {
  const source = accounts.find((a) => a.id === input.sourceId);
  const destination = accounts.find((a) => a.id === input.destinationId);

  if (!source || !destination) {
    return {
      ok: false,
      error: 'Please select both a source and a destination account.',
    };
  }

  if (input.sourceId === input.destinationId) {
    return {
      ok: false,
      error: 'Source and destination accounts must be different.',
    };
  }

  const trimmed = input.amount.trim();
  if (trimmed === '') {
    return { ok: false, error: 'Please enter an amount.' };
  }

  // Reject anything that is not a clean numeric literal (e.g. "abc", "1,000",
  // "ten"). Number() is permissive with whitespace and a single trailing/leading
  // sign, which is fine for a number input.
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return { ok: false, error: 'Please enter a valid numeric amount.' };
  }

  if (parsed <= 0) {
    return { ok: false, error: 'Amount must be greater than zero.' };
  }

  // Reject more than two decimal places to keep money exact and unambiguous.
  const decimalPart = trimmed.split('.')[1];
  if (decimalPart && decimalPart.length > 2) {
    return {
      ok: false,
      error: 'Amount may have at most two decimal places.',
    };
  }

  if (parsed > TRANSFER_LIMIT) {
    return {
      ok: false,
      error: `Transfer amount exceeds the per-transfer limit of ${formatCurrency(TRANSFER_LIMIT)}.`,
    };
  }

  if (source.balance < parsed) {
    return {
      ok: false,
      error: `Insufficient funds. Your available balance is ${formatCurrency(source.balance)}.`,
    };
  }

  return { ok: true, amountCents: toCents(parsed), amountDollars: fromCents(toCents(parsed)) };
}

export interface TransferResult {
  accounts: Account[];
  transactions: Transaction[];
}

// Monotonic counter guarantees unique transaction ids across repeated
// in-session transfers, even when several happen on the same calendar day.
let transferCounter = 0;

/** Reset the id counter (test helper; not used in production). */
export function _resetTransferCounter(): void {
  transferCounter = 0;
}

/**
 * Apply a validated transfer to immutable copies of the accounts and
 * transactions. Does NOT mutate the inputs. Money math is done in cents to
 * preserve exact two-decimal precision across repeated transfers.
 *
 * Produces two new transactions: a debit on the source and a credit on the
 * destination, both dated `todayIso`, prepended so they sort most-recent-first.
 */
export function applyTransfer(
  input: TransferInput,
  accounts: readonly Account[],
  transactions: readonly Transaction[],
  validation: { ok: true; amountCents: number },
  todayIso: string,
): TransferResult {
  const amountCents = validation.amountCents;
  const amountDollars = fromCents(amountCents);

  const source = accounts.find((a) => a.id === input.sourceId)!;
  const destination = accounts.find((a) => a.id === input.destinationId)!;

  transferCounter += 1;
  const idSeed = `tx-transfer-${transferCounter}`;

  const newAccounts = accounts.map((a) => {
    if (a.id === source.id) {
      return { ...a, balance: fromCents(toCents(a.balance) - amountCents) };
    }
    if (a.id === destination.id) {
      return { ...a, balance: fromCents(toCents(a.balance) + amountCents) };
    }
    return a;
  });

  const sourceTx: Transaction = {
    id: `${idSeed}-dr`,
    accountId: source.id,
    date: todayIso,
    description: `Transfer to ${destination.name}`,
    amount: -amountDollars,
    category: 'Transfer',
  };
  const destTx: Transaction = {
    id: `${idSeed}-cr`,
    accountId: destination.id,
    date: todayIso,
    description: `Transfer from ${source.name}`,
    amount: amountDollars,
    category: 'Transfer',
  };

  // Prepend so the newest transaction leads. sortByDateDesc is a stable sort,
  // so same-date ties retain this insertion order.
  const newTransactions = [destTx, sourceTx, ...transactions];

  return { accounts: newAccounts, transactions: newTransactions };
}
