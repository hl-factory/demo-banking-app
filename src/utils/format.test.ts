import { describe, expect, it } from 'vitest';
import { formatCurrency, formatDate, isValidIsoDate, parseIsoDate } from './format';

describe('formatCurrency', () => {
  it('formats a positive amount with $ symbol, grouping, and two decimals', () => {
    expect(formatCurrency(8450.25)).toBe('$8,450.25');
    expect(formatCurrency(42180)).toBe('$42,180.00');
    expect(formatCurrency(0.5)).toBe('$0.50');
  });

  it('formats a negative amount (owed) with a leading minus', () => {
    expect(formatCurrency(-2340.5)).toBe('-$2,340.50');
    expect(formatCurrency(-129.99)).toBe('-$129.99');
  });

  it('handles non-finite input gracefully', () => {
    expect(formatCurrency(Number.NaN)).toBe('$0.00');
    expect(formatCurrency(Number.POSITIVE_INFINITY)).toBe('$0.00');
  });
});

describe('formatDate', () => {
  it('formats a valid ISO date as "Mon DD, YYYY"', () => {
    expect(formatDate('2026-07-10')).toBe('Jul 10, 2026');
    expect(formatDate('2026-01-05')).toBe('Jan 5, 2026');
    expect(formatDate('2025-12-31')).toBe('Dec 31, 2025');
  });

  it('returns a fallback for invalid dates', () => {
    expect(formatDate('not-a-date')).toBe('—');
    expect(formatDate('2026-13-01')).toBe('—');
    expect(formatDate('2026-02-30')).toBe('—');
  });
});

describe('parseIsoDate / isValidIsoDate', () => {
  it('parses valid dates and rejects invalid ones', () => {
    expect(isValidIsoDate('2026-07-10')).toBe(true);
    expect(isValidIsoDate('2026-13-01')).toBe(false);
    expect(isValidIsoDate('2026-02-30')).toBe(false);
    expect(isValidIsoDate('20260710')).toBe(false);
    expect(parseIsoDate('2026-07-10')).toEqual(new Date(2026, 6, 10));
    expect(parseIsoDate('bad')).toBeNull();
  });
});
