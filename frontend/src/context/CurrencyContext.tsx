import React, { createContext, useContext, useState, useEffect } from 'react';

type Currency = 'USD' | 'KHR';

interface CurrencyContextType {
  currency: Currency;
  exchangeRate: number;
  setCurrency: (c: Currency) => void;
  setExchangeRate: (rate: number) => void;
  toggleCurrency: () => void;
  formatMoney: (amountUsd?: number | null, forceCurrency?: Currency) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    return (localStorage.getItem('pos_currency') as Currency) || 'USD';
  });

  const [exchangeRate, setExchangeRate] = useState<number>(4100.0);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem('pos_currency', c);
  };

  const toggleCurrency = () => {
    setCurrency(currency === 'USD' ? 'KHR' : 'USD');
  };

  const formatMoney = (amountUsd?: number | null, forceCurrency?: Currency): string => {
    const num = Number(amountUsd);
    const safeAmount = (typeof num === 'number' && !isNaN(num)) ? num : 0;
    const activeCurr = forceCurrency || currency;
    if (activeCurr === 'KHR') {
      const khrVal = Math.round(safeAmount * (exchangeRate || 4100));
      return `៛${khrVal.toLocaleString('en-US')}`;
    }
    return `$${safeAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, exchangeRate, setCurrency, setExchangeRate, toggleCurrency, formatMoney }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used within CurrencyProvider');
  return context;
};
