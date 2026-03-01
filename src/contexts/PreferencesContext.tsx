import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';

type Currency = 'ILS' | 'USD';
type AreaUnit = 'sqm' | 'sqft';

interface PreferencesContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  exchangeRate: number;
  areaUnit: AreaUnit;
  setAreaUnit: (u: AreaUnit) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

const FALLBACK_EXCHANGE_RATE = 3.65; // Fallback if DB fetch fails
const STORAGE_KEY = 'buywise-preferences';
const SQM_TO_SQFT = 10.764;

interface StoredPreferences {
  currency: Currency;
  areaUnit: AreaUnit;
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  
  const [currency, setCurrencyState] = useState<Currency>('USD');
  const [exchangeRate, setExchangeRate] = useState(FALLBACK_EXCHANGE_RATE);
  const [areaUnit, setAreaUnitState] = useState<AreaUnit>('sqft');
  const [isLoaded, setIsLoaded] = useState(false);
  const profileLoadedRef = useRef(false);

  // Fetch exchange rate from database (updated daily by cron job)
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const { data, error } = await supabase
          .from('calculator_constants')
          .select('value_numeric')
          .eq('constant_key', 'EXCHANGE_RATE_USD_ILS')
          .eq('is_current', true)
          .maybeSingle();

        if (!error && data?.value_numeric) {
          setExchangeRate(Number(data.value_numeric));
        }
      } catch (e) {
        console.error('Failed to fetch exchange rate:', e);
      }
    };

    fetchExchangeRate();
  }, []);

  // Load preferences from localStorage on mount (for anonymous users or as fallback)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const prefs: StoredPreferences = JSON.parse(stored);
        setCurrencyState(prefs.currency || 'USD');
        setAreaUnitState(prefs.areaUnit || 'sqft');
      }
    } catch (e) {
      console.error('Failed to load preferences:', e);
    }
    setIsLoaded(true);
  }, []);

  // Load preferences from profile when user is logged in
  useEffect(() => {
    if (profile && !profileLoadedRef.current) {
      profileLoadedRef.current = true;
      if (profile.preferred_currency) {
        setCurrencyState(profile.preferred_currency);
      }
      if (profile.preferred_area_unit) {
        setAreaUnitState(profile.preferred_area_unit);
      }
    }
    // Reset flag when user logs out
    if (!user) {
      profileLoadedRef.current = false;
    }
  }, [profile, user]);

  // Save preferences to localStorage when they change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const prefs: StoredPreferences = {
        currency,
        areaUnit,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (e) {
      console.error('Failed to save preferences:', e);
    }
  }, [currency, areaUnit, isLoaded]);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    if (user) {
      updateProfile.mutate({ preferred_currency: c });
    }
  };
  
  const setAreaUnit = (u: AreaUnit) => {
    setAreaUnitState(u);
    if (user) {
      updateProfile.mutate({ preferred_area_unit: u });
    }
  };

  return (
    <PreferencesContext.Provider value={{
      currency,
      setCurrency,
      exchangeRate,
      areaUnit,
      setAreaUnit,
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
      currency: 'USD' as Currency,
      setCurrency: () => {},
      exchangeRate: FALLBACK_EXCHANGE_RATE,
      areaUnit: 'sqft' as AreaUnit,
      setAreaUnit: () => {},
    };
  }
  return context;
}

// Formatting utilities - memoized for performance
export function useFormatPrice() {
  const { currency, exchangeRate } = usePreferences();

  return useCallback((amount: number, originalCurrency: string = 'ILS'): string => {
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
  }, [currency, exchangeRate]);
}

/**
 * Hook version of formatPriceRange that respects the user's currency preference.
 * Converts ILS amounts to USD when the user has selected USD.
 */
export function useFormatPriceRange() {
  const { currency, exchangeRate } = usePreferences();

  return useCallback((low: number, high: number, originalCurrency: 'ILS' | 'USD' = 'ILS'): string => {
    let lowConverted = low;
    let highConverted = high;

    if (originalCurrency === 'ILS' && currency === 'USD') {
      lowConverted = low / exchangeRate;
      highConverted = high / exchangeRate;
    } else if (originalCurrency === 'USD' && currency === 'ILS') {
      lowConverted = low * exchangeRate;
      highConverted = high * exchangeRate;
    }

    const targetCurrency = currency;
    const symbol = targetCurrency === 'USD' ? '$' : '₪';

    const formatCompact = (value: number): string => {
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`.replace('.0M', 'M');
      if (value >= 1000) return `${(value / 1000).toFixed(1)}k`.replace('.0k', 'k');
      return value.toFixed(0);
    };

    return `${symbol}${formatCompact(lowConverted)}–${formatCompact(highConverted)}`;
  }, [currency, exchangeRate]);
}

export function useFormatArea() {
  const { areaUnit } = usePreferences();

  return useCallback((sqm: number): string => {
    if (areaUnit === 'sqft') {
      const sqft = Math.round(sqm * SQM_TO_SQFT);
      return `${sqft.toLocaleString()} sqft`;
    }
    return `${sqm.toLocaleString()} m²`;
  }, [areaUnit]);
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

  return useCallback((pricePerSqm: number, originalCurrency: string = 'ILS'): string => {
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
    const unit = areaUnit === 'sqft' ? 'sqft' : 'm²';

    const formatILS = (val: number) => 
      `₪${val.toLocaleString('en-US', { maximumFractionDigits: 0 })}/${unit}`;
    
    const formatUSD = (val: number) => 
      `$${val.toLocaleString('en-US', { maximumFractionDigits: 0 })}/${unit}`;

    if (currency === 'USD') {
      return formatUSD(priceInUSD);
    }
    return formatILS(displayPrice);
  }, [currency, exchangeRate, areaUnit]);
}
