const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format a numeric amount as USD currency with exactly two decimals + grouping. */
export function formatCurrency(amount: number): string {
  if (!Number.isFinite(amount)) return '$0.00';
  return currencyFormatter.format(amount);
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

/**
 * Format an ISO calendar date (YYYY-MM-DD) as a human-readable date
 * (e.g. "Jul 10, 2026"). Parses as a local date to avoid timezone shifts.
 * Returns a stable fallback for invalid input.
 */
export function formatDate(iso: string): string {
  const parsed = parseIsoDate(iso);
  if (!parsed) return '—';
  return dateFormatter.format(parsed);
}

/** Parse a YYYY-MM-DD string into a local Date, or null if invalid. */
export function parseIsoDate(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split('-').map((part) => Number(part));
  const dt = new Date(y, m - 1, d);
  // Guard against rollover (e.g. month 13 -> next year).
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== m - 1 ||
    dt.getDate() !== d
  ) {
    return null;
  }
  return dt;
}

/** Returns true when the ISO date string is a valid calendar date. */
export function isValidIsoDate(iso: string): boolean {
  return parseIsoDate(iso) !== null;
}

/**
 * Today's date as an ISO calendar string (YYYY-MM-DD), computed from the local
 * timezone. Used for runtime-created transactions (transfers); NOT used for the
 * deterministic seed data, which is static.
 */
export function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
