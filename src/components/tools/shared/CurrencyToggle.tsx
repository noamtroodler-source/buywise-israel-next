import { useState, createContext, useContext, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CurrencyContextType {
  currency: 'ILS' | 'USD';
  setCurrency: (currency: 'ILS' | 'USD') => void;
  exchangeRate: number;
  formatCurrency: (value: number) => string;
  formatCurrencyShort: (value: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

const DEFAULT_EXCHANGE_RATE = 3.6; // USD to ILS

export function CurrencyProvider({ children, exchangeRate = DEFAULT_EXCHANGE_RATE }: { children: ReactNode; exchangeRate?: number }) {
  const [currency, setCurrency] = useState<'ILS' | 'USD'>('ILS');

  const formatCurrency = (value: number): string => {
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(value / exchangeRate);
    }
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCurrencyShort = (value: number): string => {
    const actualValue = currency === 'USD' ? value / exchangeRate : value;
    const symbol = currency === 'USD' ? '$' : '₪';
    
    if (actualValue >= 1000000) {
      return `${symbol}${(actualValue / 1000000).toFixed(1)}M`;
    }
    if (actualValue >= 1000) {
      return `${symbol}${(actualValue / 1000).toFixed(0)}K`;
    }
    return `${symbol}${actualValue.toFixed(0)}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, exchangeRate, formatCurrency, formatCurrencyShort }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    // Fallback for when not wrapped in provider
    return {
      currency: 'ILS' as const,
      setCurrency: () => {},
      exchangeRate: DEFAULT_EXCHANGE_RATE,
      formatCurrency: (value: number) => new Intl.NumberFormat('he-IL', {
        style: 'currency',
        currency: 'ILS',
        maximumFractionDigits: 0,
      }).format(value),
      formatCurrencyShort: (value: number) => {
        if (value >= 1000000) return `₪${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `₪${(value / 1000).toFixed(0)}K`;
        return `₪${value.toFixed(0)}`;
      },
    };
  }
  return context;
}

interface CurrencyToggleProps {
  className?: string;
}

export function CurrencyToggle({ className }: CurrencyToggleProps) {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className={cn("inline-flex items-center rounded-lg border border-border bg-muted p-1", className)}>
      <button
        onClick={() => setCurrency('ILS')}
        className={cn(
          "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
          currency === 'ILS'
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        ₪ NIS
      </button>
      <button
        onClick={() => setCurrency('USD')}
        className={cn(
          "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
          currency === 'USD'
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        $ USD
      </button>
    </div>
  );
}
