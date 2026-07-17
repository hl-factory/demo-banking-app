/**
 * Integer-cent money arithmetic.
 *
 * Floating-point dollars (e.g. `0.1 + 0.2 === 0.30000000000000004`) drift
 * across repeated operations. To guarantee exact two-decimal precision, all
 * money math is performed in integer cents and converted back to dollars only
 * for storage/display. `toCents` rounds away the representation error of the
 * input dollar value, so each operation is exact regardless of how the stored
 * float is represented.
 */

/** Convert a dollar amount to integer cents, rounding to absorb float error. */
export function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/** Convert integer cents back to a dollar amount. */
export function fromCents(cents: number): number {
  return cents / 100;
}

/** Add two dollar amounts with cent precision (no float drift). */
export function addMoney(a: number, b: number): number {
  return fromCents(toCents(a) + toCents(b));
}

/** Subtract `b` from `a` with cent precision (no float drift). */
export function subMoney(a: number, b: number): number {
  return fromCents(toCents(a) - toCents(b));
}
