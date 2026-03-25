

# Plan: Enable USD/NIS Currency Switching in All 3 Calculators

## Summary
Replace hardcoded `₪` formatting in Affordability, Rent vs Buy, and True Cost calculators with preference-aware formatting that respects the global currency toggle. Internal math stays in NIS; display values convert using the exchange rate from `usePreferences()`.

## Approach

**Pattern** (same for all 3 files):

1. Import `usePreferences` (already imported in RentVsBuy and TrueCost; add to Affordability)
2. Replace the hardcoded block:
   ```tsx
   const currencySymbol = '₪';
   const formatPrice = ...₪...;
   ```
   With:
   ```tsx
   const { currency, exchangeRate } = usePreferences();
   const currencySymbol = currency === 'USD' ? '$' : '₪';
   const formatPrice = useCallback((amount: number): string => {
     const display = currency === 'USD' ? amount / exchangeRate : amount;
     return `${currencySymbol}${display.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
   }, [currency, exchangeRate]);
   ```
3. All internal calculations remain in NIS — only the final display formatting converts

## File Changes

### 1. `src/components/tools/AffordabilityCalculator.tsx`
- Add `usePreferences` import from `@/contexts/PreferencesContext`
- Replace hardcoded `currencySymbol` and `formatPrice` with preference-aware versions
- Note: This calculator already has a separate `downPaymentCurrency` selector (USD/EUR/GBP/ILS) for the down payment input — that stays as-is since it handles foreign savings. The global toggle only affects output display.

### 2. `src/components/tools/RentVsBuyCalculator.tsx`
- Already imports `usePreferences` — just destructure `currency` and `exchangeRate`
- Replace hardcoded `currencySymbol` and `formatPrice`

### 3. `src/components/tools/TrueCostCalculator.tsx`
- Already imports `usePreferences` — just destructure `currency` and `exchangeRate`
- Replace hardcoded `currencySymbol` and `formatPrice`

## What stays the same
- All regulatory limits (PTI, LTV) remain NIS-based
- Input fields keep their current behavior (NIS-denominated inputs with the Affordability down-payment currency selector unchanged)
- The global `PreferencesDialog` toggle (already in the header) controls all 3 tools

