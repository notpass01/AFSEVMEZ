"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { fetchPricesInCurrency, CURRENCIES } from "@/services/priceService";

type Currency = typeof CURRENCIES[0];

interface PricesContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  prices: Record<string, number>;
  loading: boolean;
}

const PricesContext = createContext<PricesContextType | null>(null);

export function PricesProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState(CURRENCIES[0]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (curr: Currency) => {
    setLoading(true);
    try {
      const data = await fetchPricesInCurrency(curr.code);
      setPrices(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("winwin_currency");
    const found = saved ? CURRENCIES.find(c => c.code === saved) : null;
    const initial = found ?? CURRENCIES[0];
    setCurrencyState(initial);
    load(initial);
  }, [load]);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem("winwin_currency", c.code);
    load(c);
  };

  return (
    <PricesContext.Provider value={{ currency, setCurrency, prices, loading }}>
      {children}
    </PricesContext.Provider>
  );
}

export function usePrices() {
  const ctx = useContext(PricesContext);
  if (!ctx) throw new Error("usePrices must be used within PricesProvider");
  return ctx;
}
