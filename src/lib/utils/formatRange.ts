/**
 * Utility functions for formatting honest ranges in financial estimates
 * These replace fake-precision single values with transparent ranges
 */

/**
 * Format a price range with appropriate abbreviations
 * Examples: "₪11.5k–13.4k" or "₪1.8M–2.1M"
 */
export function formatPriceRange(
  low: number, 
  high: number, 
  currency: 'ILS' | 'USD' = 'ILS'
): string {
  const symbol = currency === 'USD' ? '$' : '₪';
  
  // Determine appropriate abbreviation based on magnitude
  const formatCompact = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toFixed(0);
  };
  
  // Clean up trailing .0
  const cleanFormat = (str: string): string => {
    return str.replace('.0M', 'M').replace('.0k', 'k');
  };
  
  return `${symbol}${cleanFormat(formatCompact(low))}–${cleanFormat(formatCompact(high))}`;
}

/**
 * Format a monthly payment range
 * Example: "₪11.5k–13.4k/mo"
 */
export function formatMonthlyRange(
  low: number, 
  high: number, 
  currency: 'ILS' | 'USD' = 'ILS'
): string {
  return `${formatPriceRange(low, high, currency)}/mo`;
}

/**
 * Format a percentage range
 * Example: "3.5%–4.2%"
 */
export function formatPercentRange(low: number, high: number): string {
  return `${low.toFixed(1)}%–${high.toFixed(1)}%`;
}

/**
 * Format a fee range with percentage context
 * Example: "₪15k–35k (0.5–1.0%)"
 */
export function formatFeeRange(
  lowPercent: number,
  highPercent: number,
  basePrice: number,
  currency: 'ILS' | 'USD' = 'ILS'
): { range: string; percentLabel: string; low: number; high: number } {
  const low = Math.round(basePrice * lowPercent);
  const high = Math.round(basePrice * highPercent);
  
  return {
    range: formatPriceRange(low, high, currency),
    percentLabel: `${(lowPercent * 100).toFixed(1)}–${(highPercent * 100).toFixed(1)}%`,
    low,
    high,
  };
}

/**
 * Calculate a variance range from a central value
 * Useful for market data where we know the average but want to show a realistic range
 */
export function createVarianceRange(
  centralValue: number,
  variancePercent: number = 15
): { low: number; mid: number; high: number } {
  const variance = centralValue * (variancePercent / 100);
  return {
    low: Math.round(centralValue - variance),
    mid: Math.round(centralValue),
    high: Math.round(centralValue + variance),
  };
}

/**
 * Standard fee ranges for Israeli real estate transactions
 */
export const FEE_RANGES = {
  lawyer: { min: 0.005, max: 0.01, label: '0.5–1.0%' },     // 0.5-1% of price
  agent: { min: 0.015, max: 0.025, label: '1.5–2.5%' },     // 1.5-2.5% (negotiable)
  developerLawyer: { min: 0.01, max: 0.02, label: '1–2%' }, // New construction only
  appraisal: { min: 1200, max: 2500, label: '₪1,200–2,500' },
  registration: { min: 400, max: 600, label: '₪400–600' },
  mortgageOrigination: { min: 300, max: 500, label: '₪300–500' },
} as const;

/**
 * Mortgage rate range assumptions for honest estimates
 */
export const MORTGAGE_RATE_RANGES = {
  low: 4.5,    // Optimistic rate scenario
  mid: 5.25,   // Typical current rate
  high: 6.0,   // Conservative rate scenario
} as const;

/**
 * Term range assumptions for mortgage estimates
 */
export const MORTGAGE_TERM_RANGES = {
  short: 20,   // Shorter term (higher payments)
  typical: 25, // Most common term
  long: 30,    // Maximum term
} as const;

/**
 * Israeli VAT rate (2025)
 */
export const VAT_RATE = 0.18;

/**
 * Standard rental fee ranges for Israeli leases
 */
export const RENTAL_FEE_RANGES = {
  securityDeposit: { min: 2, max: 3, label: '2–3 months' },
  agentFee: { base: 1, vatRate: 0.18, label: '1 month + VAT' },
} as const;

/**
 * Rental utilities estimate by apartment size (monthly)
 */
export const RENTAL_UTILITIES_ESTIMATE = {
  small: { min: 250, max: 400 },   // < 60 sqm
  medium: { min: 350, max: 550 },  // 60-100 sqm
  large: { min: 450, max: 700 },   // > 100 sqm
} as const;

/**
 * Helper to get utilities range based on apartment size
 */
export function getUtilitiesEstimate(sizeSqm: number | undefined): { min: number; max: number } {
  if (!sizeSqm || sizeSqm < 60) return RENTAL_UTILITIES_ESTIMATE.small;
  if (sizeSqm <= 100) return RENTAL_UTILITIES_ESTIMATE.medium;
  return RENTAL_UTILITIES_ESTIMATE.large;
}
