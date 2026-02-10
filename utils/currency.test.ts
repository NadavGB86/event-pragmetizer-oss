import { describe, it, expect } from 'vitest';
import { getCurrencySymbol, formatPrice } from './currency';

describe('getCurrencySymbol', () => {
  it('returns $ for USD', () => {
    expect(getCurrencySymbol('USD')).toBe('$');
  });

  it('returns correct symbols for known currencies', () => {
    expect(getCurrencySymbol('EUR')).toBe('\u20AC');
    expect(getCurrencySymbol('GBP')).toBe('\u00A3');
    expect(getCurrencySymbol('ILS')).toBe('\u20AA');
    expect(getCurrencySymbol('NIS')).toBe('\u20AA');
  });

  it('is case-insensitive', () => {
    expect(getCurrencySymbol('usd')).toBe('$');
    expect(getCurrencySymbol('eur')).toBe('\u20AC');
  });

  it('returns code as fallback for unknown currencies', () => {
    expect(getCurrencySymbol('JPY')).toBe('JPY');
    expect(getCurrencySymbol('AUD')).toBe('AUD');
  });

  it('returns $ for null/undefined', () => {
    expect(getCurrencySymbol(null as unknown as string)).toBe('$');
    expect(getCurrencySymbol(undefined as unknown as string)).toBe('$');
  });
});

describe('formatPrice', () => {
  it('formats USD amounts with $ symbol', () => {
    expect(formatPrice(1234, 'USD')).toBe('$1,234');
  });

  it('formats ILS amounts with shekel symbol', () => {
    expect(formatPrice(5000, 'ILS')).toBe('\u20AA5,000');
  });

  it('defaults to USD when no currency provided', () => {
    expect(formatPrice(100)).toBe('$100');
  });

  it('formats zero correctly', () => {
    expect(formatPrice(0, 'EUR')).toBe('\u20AC0');
  });
});
