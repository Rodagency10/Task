import { createContext, useContext, useState, type ReactNode } from "react";
import {
  formatAmount,
  formatAmountCompact,
  convertAmount as convertAmountUtil,
  CURRENCIES,
  type CurrencyCode,
} from "~/lib/utils/currency";

const LS_KEY = "task_currency";
const LS_BASE_KEY = "task_base_currency";

function getStored(key: string): CurrencyCode {
  if (typeof window === "undefined") return "EUR";
  const v = localStorage.getItem(key);
  if (v === "EUR" || v === "USD" || v === "XOF") return v;
  return "EUR";
}

interface CurrencyContextValue {
  /** Devise d'affichage (ce que l'utilisateur voit) */
  currency: CurrencyCode;
  /** Devise de saisie / base (dans laquelle les montants sont enregistrés) */
  baseCurrency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  setBaseCurrency: (code: CurrencyCode) => void;
  /** Formate amount en convertissant de baseCurrency → currency */
  formatCurrency: (amount: number) => string;
  formatCurrencyCompact: (amount: number) => string;
  /** Convertit explicitement entre deux devises */
  convertAmount: (amount: number, from: CurrencyCode, to?: CurrencyCode) => number;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "EUR",
  baseCurrency: "EUR",
  setCurrency: () => {},
  setBaseCurrency: () => {},
  formatCurrency: (n) => formatAmount(n, "EUR"),
  formatCurrencyCompact: (n) => formatAmountCompact(n, "EUR"),
  convertAmount: (n) => n,
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() =>
    getStored(LS_KEY),
  );
  const [baseCurrency, setBaseCurrencyState] = useState<CurrencyCode>(() =>
    getStored(LS_BASE_KEY),
  );

  const setCurrency = (code: CurrencyCode) => {
    setCurrencyState(code);
    localStorage.setItem(LS_KEY, code);
  };

  const setBaseCurrency = (code: CurrencyCode) => {
    setBaseCurrencyState(code);
    localStorage.setItem(LS_BASE_KEY, code);
  };

  const convertAmount = (amount: number, from: CurrencyCode, to?: CurrencyCode) =>
    convertAmountUtil(amount, from, to ?? currency);

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        baseCurrency,
        setCurrency,
        setBaseCurrency,
        formatCurrency: (amount) =>
          formatAmount(convertAmountUtil(amount, baseCurrency, currency), currency),
        formatCurrencyCompact: (amount) =>
          formatAmountCompact(convertAmountUtil(amount, baseCurrency, currency), currency),
        convertAmount,
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
