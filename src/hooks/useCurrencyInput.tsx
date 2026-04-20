import { useCallback } from 'react';
import { usePreferences } from '@/contexts/PreferencesContext';

/**
 * Bridges the global currency preference (USD/ILS) with calculator input fields.
 *
 * Internal calculator math always runs in ILS (because Israeli bank rules,
 * tax brackets, and constants are all ILS-denominated). But user inputs may
 * be entered in USD if that's their preferred display currency.
 *
 * Pattern:
 *   const { toILS, toDisplay, symbol } = useCurrencyInput();
 *   <FormattedNumberInput
 *     prefix={symbol}
 *     value={toDisplay(monthlyIncomeILS)}
 *     onChange={(v) => setMonthlyIncomeILS(toILS(v ?? 0))}
 *   />
 */
export function useCurrencyInput() {
  const { currency, exchangeRate } = usePreferences();

  // Convert a user-entered value (in their display currency) to ILS for math
  const toILS = useCallback(
    (displayValue: number): number => {
      if (currency === 'USD') return Math.round(displayValue * exchangeRate);
      return Math.round(displayValue);
    },
    [currency, exchangeRate]
  );

  // Convert an internal ILS value to the display currency for showing in inputs
  const toDisplay = useCallback(
    (ilsValue: number): number => {
      if (currency === 'USD') return Math.round(ilsValue / exchangeRate);
      return Math.round(ilsValue);
    },
    [currency, exchangeRate]
  );

  const symbol = currency === 'USD' ? '$' : '₪';

  return { toILS, toDisplay, symbol, currency, exchangeRate };
}
