export const getCurrencySymbol = (code: string): string => {
  const map: Record<string, string> = {
    'ILS': '₪',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'NIS': '₪'
  };
  return map[code?.toUpperCase()] || code || '$';
};

export const formatPrice = (amount: number, currencyCode: string = 'USD'): string => {
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${amount.toLocaleString()}`;
};
