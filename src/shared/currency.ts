export const MAX_MONEY_AMOUNT = 999_999_999_999_999;

const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  currencyDisplay: 'symbol',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

export function formatRp(amount: number): string {
  if (!Number.isFinite(amount)) return 'Rp0';
  return rupiahFormatter.format(Math.trunc(amount)).replace(/\s/g, ' ');
}

export function formatCurrencyInput(amount: number): string {
  return amount > 0 ? formatRp(amount) : '';
}

export function parseCurrencyInput(value: string): number {
  const digits = value.replace(/\D/g, '').slice(0, 15);
  return digits ? Number.parseInt(digits, 10) : 0;
}
