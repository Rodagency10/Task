import { createContext, useContext, useState, type ReactNode } from "react";
import {
  formatAmount,
  formatAmountCompact,
  CURRENCIES,
  type CurrencyCode,
} from "~/lib/utils/currency";

const LS_KEY = "task_currency";

function getInitialCurrency(): CurrencyCode {
  if (typeof window === "undefined") return "EUR";
  const stored = localStorage.getItem(LS_KEY);
  if (stored === "EUR" || stored === "USD" || stored === "XOF") return stored;
  return "EUR";
}

interface CurrencyContextValue {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  formatCurrency: (amount: number) => string;
  formatCurrencyCompact: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "EUR",
  setCurrency: () => {},
  formatCurrency: (n) => formatAmount(n, "EUR"),
  formatCurrencyCompact: (n) => formatAmountCompact(n, "EUR"),
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(getInitialCurrency);

  const setCurrency = (code: CurrencyCode) => {
    setCurrencyState(code);
    if (typeof window !== "undefined") {
      localStorage.setItem(LS_KEY, code);
    }
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        formatCurrency: (amount) => formatAmount(amount, currency),
        formatCurrencyCompact: (amount) => formatAmountCompact(amount, currency),
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}

export { CURRENCIES, type CurrencyCode };
