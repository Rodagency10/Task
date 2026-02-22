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

/**
 * Taux de change — EUR comme pivot (1 EUR = X unités)
 * XOF/EUR est fixe (parité garantie par le Trésor français) : 1 EUR = 655.957 XOF
 * USD/EUR est approximatif (taux de marché courant 2025)
 */
export const EXCHANGE_RATES: Record<CurrencyCode, number> = {
  EUR: 1,
  USD: 1.08,      // 1 EUR = 1.08 USD
  XOF: 655.957,   // 1 EUR = 655.957 XOF (parité fixe UEMOA)
};

/**
 * Convertit un montant d'une devise source vers une devise cible.
 * Utilise EUR comme devise pivot.
 */
export function convertAmount(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
): number {
  if (from === to) return amount;
  // Étape 1 : convertir en EUR
  const inEUR = amount / EXCHANGE_RATES[from];
  // Étape 2 : convertir vers la devise cible
  return inEUR * EXCHANGE_RATES[to];
}

export function formatAmount(amount: number, code: CurrencyCode = "EUR"): string {
  const { locale } = CURRENCIES[code];

  if (code === "XOF") {
    // XOF n'a pas de décimales en usage courant
    return (
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Math.round(amount)) + " FCFA"
    );
  }

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
    if (code === "XOF") {
      return (
        new Intl.NumberFormat(locale, {
          notation: "compact",
          maximumFractionDigits: 1,
        }).format(amount) + " FCFA"
      );
    }
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
