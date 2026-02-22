export type CurrencyCode = "EUR" | "USD" | "XOF";

export interface CurrencyConfig {
  code: CurrencyCode;
  label: string;
  locale: string;
  symbol: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  EUR: { code: "EUR", label: "Euro (€)", locale: "fr-FR", symbol: "€" },
  USD: { code: "USD", label: "Dollar US ($)", locale: "en-US", symbol: "$" },
  XOF: { code: "XOF", label: "Franc CFA (FCFA)", locale: "fr-FR", symbol: "FCFA" },
};

export function formatAmount(amount: number, code: CurrencyCode = "EUR"): string {
  const { locale } = CURRENCIES[code];
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatAmountCompact(amount: number, code: CurrencyCode = "EUR"): string {
  const { locale } = CURRENCIES[code];
  if (amount >= 1_000_000) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  }
  return formatAmount(amount, code);
}

/** Legacy — kept for backward compat, defaults to EUR */
export function formatCurrency(amount: number): string {
  return formatAmount(amount, "EUR");
}

export function formatCurrencyCompact(amount: number): string {
  return formatAmountCompact(amount, "EUR");
}

export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^\d,.-]/g, "").replace(",", ".");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
