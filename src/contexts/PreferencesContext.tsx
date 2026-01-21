import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Currency = 'ILS' | 'USD';
type AreaUnit = 'sqm' | 'sqft';

interface PreferencesContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  exchangeRate: number;
  setExchangeRate: (rate: number) => void;
  isCustomRate: boolean;
  setIsCustomRate: (custom: boolean) => void;
  areaUnit: AreaUnit;
  setAreaUnit: (u: AreaUnit) => void;
  defaultExchangeRate: number;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

const FALLBACK_EXCHANGE_RATE = 3.65; // Fallback if DB fetch fails
const STORAGE_KEY = 'buywise-preferences';
const SQM_TO_SQFT = 10.764;

interface StoredPreferences {
  currency: Currency;
  exchangeRate: number;
  isCustomRate: boolean;
  areaUnit: AreaUnit;
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('ILS');
  const [exchangeRate, setExchangeRateState] = useState(FALLBACK_EXCHANGE_RATE);
  const [isCustomRate, setIsCustomRateState] = useState(false);
  const [areaUnit, setAreaUnitState] = useState<AreaUnit>('sqm');
  const [defaultExchangeRate, setDefaultExchangeRate] = useState(FALLBACK_EXCHANGE_RATE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Fetch default exchange rate from database
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const { data, error } = await supabase
          .from('calculator_constants')
          .select('value_numeric')
          .eq('constant_key', 'EXCHANGE_RATE_USD_ILS')
          .eq('is_current', true)
          .single();

        if (!error && data?.value_numeric) {
          setDefaultExchangeRate(Number(data.value_numeric));
        }
      } catch (e) {
        console.error('Failed to fetch exchange rate:', e);
      }
    };

    fetchExchangeRate();
  }, []);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const prefs: StoredPreferences = JSON.parse(stored);
        setCurrencyState(prefs.currency || 'ILS');
        setExchangeRateState(prefs.exchangeRate || FALLBACK_EXCHANGE_RATE);
        setIsCustomRateState(prefs.isCustomRate || false);
        setAreaUnitState(prefs.areaUnit || 'sqm');
      }
    } catch (e) {
      console.error('Failed to load preferences:', e);
    }
    setIsLoaded(true);
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const prefs: StoredPreferences = {
        currency,
        exchangeRate,
        isCustomRate,
        areaUnit,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (e) {
      console.error('Failed to save preferences:', e);
    }
  }, [currency, exchangeRate, isCustomRate, areaUnit, isLoaded]);

  const setCurrency = (c: Currency) => setCurrencyState(c);
  const setExchangeRate = (rate: number) => setExchangeRateState(rate);
  const setIsCustomRate = (custom: boolean) => {
    setIsCustomRateState(custom);
    if (!custom) {
      setExchangeRateState(defaultExchangeRate);
    }
  };
  const setAreaUnit = (u: AreaUnit) => setAreaUnitState(u);

  return (
    <PreferencesContext.Provider value={{
      currency,
      setCurrency,
      exchangeRate,
      setExchangeRate,
      isCustomRate,
      setIsCustomRate,
      areaUnit,
      setAreaUnit,
      defaultExchangeRate,
    }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    // Return default values if context is not available (e.g., during HMR or testing)
    return {
      currency: 'ILS' as Currency,
      setCurrency: () => {},
      exchangeRate: FALLBACK_EXCHANGE_RATE,
      setExchangeRate: () => {},
      isCustomRate: false,
      setIsCustomRate: () => {},
      areaUnit: 'sqm' as AreaUnit,
      setAreaUnit: () => {},
      defaultExchangeRate: FALLBACK_EXCHANGE_RATE,
    };
  }
  return context;
}

// Formatting utilities
export function useFormatPrice() {
  const { currency, exchangeRate } = usePreferences();

  return (amount: number, originalCurrency: string = 'ILS'): string => {
    // Convert to ILS if needed
    let amountInILS = amount;
    if (originalCurrency === 'USD') {
      amountInILS = amount * exchangeRate;
    }

    // Convert to USD
    const amountInUSD = amountInILS / exchangeRate;

    const formatILS = (val: number) => 
      `₪${val.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    
    const formatUSD = (val: number) => 
      `$${val.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

    if (currency === 'USD') {
      return formatUSD(amountInUSD);
    }
    return formatILS(amountInILS);
  };
}

export function useFormatArea() {
  const { areaUnit } = usePreferences();
  const SQM_TO_SQFT = 10.764;

  return (sqm: number): string => {
    if (areaUnit === 'sqft') {
      const sqft = Math.round(sqm * SQM_TO_SQFT);
      return `${sqft.toLocaleString()} ft²`;
    }
    return `${sqm.toLocaleString()} m²`;
  };
}

// Returns just the currency symbol for input prefixes
export function useCurrencySymbol() {
  const { currency } = usePreferences();
  return currency === 'USD' ? '$' : '₪';
}

// Returns the area unit label for input suffixes
export function useAreaUnitLabel() {
  const { areaUnit } = usePreferences();
  return areaUnit === 'sqft' ? 'sqft' : 'sqm';
}

export function useFormatPricePerArea() {
  const { currency, exchangeRate, areaUnit } = usePreferences();
  const SQM_TO_SQFT = 10.764;

  return (pricePerSqm: number, originalCurrency: string = 'ILS'): string => {
    // Convert price to ILS if needed
    let priceInILS = pricePerSqm;
    if (originalCurrency === 'USD') {
      priceInILS = pricePerSqm * exchangeRate;
    }

    // Adjust for area unit
    let displayPrice = priceInILS;
    if (areaUnit === 'sqft') {
      displayPrice = priceInILS / SQM_TO_SQFT;
    }

    const priceInUSD = displayPrice / exchangeRate;
    const unit = areaUnit === 'sqft' ? 'ft²' : 'm²';

    const formatILS = (val: number) => 
      `₪${val.toLocaleString('en-US', { maximumFractionDigits: 0 })}/${unit}`;
    
    const formatUSD = (val: number) => 
      `$${val.toLocaleString('en-US', { maximumFractionDigits: 0 })}/${unit}`;

    if (currency === 'USD') {
      return formatUSD(priceInUSD);
    }
    return formatILS(displayPrice);
  };
}
