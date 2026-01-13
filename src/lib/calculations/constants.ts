/**
 * Calculator Constants Library
 * 
 * Centralized constants for all calculators with fallback values.
 * Database values take precedence when available.
 * 
 * Sources:
 * - Israel Tax Authority (taxes.gov.il)
 * - Bank of Israel Directive 329 v11 (April 2025)
 * - Ministry of Interior (Arnona regulations)
 * - Ministry of Justice (Tabu fees)
 */

import type { CalculatorConstant } from '@/hooks/useCalculatorConstants';

// Fallback constants if database is unavailable
// These should match the seeded database values
export const FALLBACK_CONSTANTS = {
  // General
  VAT_RATE: 0.18, // Updated Jan 2025 (was 0.17)
  
  // Mortgage LTV limits (Bank of Israel)
  LTV_FIRST_TIME: 0.75,
  LTV_UPGRADER: 0.70,
  LTV_INVESTOR: 0.50,
  LTV_FOREIGN: 0.50,
  LTV_OLEH: 0.75,
  MAX_PTI: 0.50, // Updated from 0.40
  VARIABLE_RATE_MAX_PERCENT: 0.3333, // 1/3 limit
  
  // Professional fees
  LAWYER_RATE_MIN: 0.005,
  LAWYER_RATE_MAX: 0.015,
  LAWYER_MIN_FEE: 5000,
  AGENT_RATE: 0.02,
  APPRAISAL_FEE_MIN: 1500,
  APPRAISAL_FEE_MAX: 3500,
  
  // Government fees
  TABU_NESACH_FEE: 128.60,
  TABU_REGISTRATION_FEE: 178,
  MORTGAGE_REGISTRATION_FEE: 178,
  MORTGAGE_ORIGINATION_MAX: 360,
  
  // Tax rates
  BETTERMENT_LEVY_RATE: 0.50,
  CAPITAL_GAINS_RATE: 0.25,
  CAPITAL_GAINS_EXEMPT_PERIOD: 18, // months
  
  // Arnona (Ministry of Interior 2025)
  ARNONA_RESIDENTIAL_MIN: 40.30,
  ARNONA_RESIDENTIAL_MAX: 139.63,
  ARNONA_ANNUAL_INCREASE_2025: 0.0529,
} as const;

export type ConstantKey = keyof typeof FALLBACK_CONSTANTS;

/**
 * Get a constant value from the database or fallback
 */
export function getConstant(
  constants: CalculatorConstant[] | undefined,
  key: ConstantKey,
  customFallback?: number
): number {
  if (constants) {
    const constant = constants.find(c => c.constant_key === key);
    if (constant?.value_numeric !== null && constant?.value_numeric !== undefined) {
      return Number(constant.value_numeric);
    }
  }
  return customFallback ?? FALLBACK_CONSTANTS[key];
}

/**
 * Get a JSON constant value from the database or fallback
 */
export function getConstantJson<T>(
  constants: CalculatorConstant[] | undefined,
  key: string,
  fallback: T
): T {
  if (constants) {
    const constant = constants.find(c => c.constant_key === key);
    if (constant?.value_json) {
      return constant.value_json as T;
    }
  }
  return fallback;
}

/**
 * Get LTV limit based on buyer category
 */
export function getLtvLimit(
  constants: CalculatorConstant[] | undefined,
  buyerCategory: string
): number {
  const categoryToKey: Record<string, ConstantKey> = {
    'first_time': 'LTV_FIRST_TIME',
    'first-time': 'LTV_FIRST_TIME',
    'upgrader': 'LTV_UPGRADER',
    'investor': 'LTV_INVESTOR',
    'foreign': 'LTV_FOREIGN',
    'oleh': 'LTV_OLEH',
    'oleh_hadash': 'LTV_OLEH',
  };
  
  const key = categoryToKey[buyerCategory.toLowerCase()] || 'LTV_FIRST_TIME';
  return getConstant(constants, key);
}

/**
 * Get VAT rate (updated to 18% Jan 2025)
 */
export function getVatRate(constants?: CalculatorConstant[]): number {
  return getConstant(constants, 'VAT_RATE');
}

/**
 * Get VAT multiplier (1.18 as of Jan 2025)
 */
export function getVatMultiplier(constants?: CalculatorConstant[]): number {
  return 1 + getVatRate(constants);
}

/**
 * Get max PTI (Payment-to-Income) ratio
 */
export function getMaxPti(constants?: CalculatorConstant[]): number {
  return getConstant(constants, 'MAX_PTI');
}

/**
 * Calculate lawyer fee range
 */
export function getLawyerFeeRange(
  constants: CalculatorConstant[] | undefined,
  price: number
): { min: number; max: number } {
  const rateMin = getConstant(constants, 'LAWYER_RATE_MIN');
  const rateMax = getConstant(constants, 'LAWYER_RATE_MAX');
  const minFee = getConstant(constants, 'LAWYER_MIN_FEE');
  const vatMultiplier = getVatMultiplier(constants);
  
  return {
    min: Math.max(minFee, price * rateMin) * vatMultiplier,
    max: Math.max(minFee, price * rateMax) * vatMultiplier,
  };
}

/**
 * Calculate agent fee
 */
export function getAgentFee(
  constants: CalculatorConstant[] | undefined,
  price: number
): number {
  const rate = getConstant(constants, 'AGENT_RATE');
  const vatMultiplier = getVatMultiplier(constants);
  return price * rate * vatMultiplier;
}

// Arnona discount types for type safety
export interface ArnonaDiscount {
  max_percent: number;
  min_percent?: number;
  area_limit_sqm: number | null;
  income_based?: boolean;
}

/**
 * Get Arnona discount rules
 */
export function getArnonaDiscounts(
  constants: CalculatorConstant[] | undefined
): Record<string, ArnonaDiscount> {
  const discounts: Record<string, ArnonaDiscount> = {};
  
  if (constants) {
    constants
      .filter(c => c.category === 'arnona_discounts' && c.value_json)
      .forEach(c => {
        const json = c.value_json as unknown as ArnonaDiscount;
        if (json && typeof json.max_percent === 'number') {
          discounts[c.constant_key] = json;
        }
      });
  }
  
  return discounts;
}

/**
 * Source attribution for display
 */
export interface ConstantSource {
  name: string;
  url?: string;
  effectiveDate?: string;
}

export function getConstantSource(
  constants: CalculatorConstant[] | undefined,
  key: string
): ConstantSource | null {
  if (!constants) return null;
  
  const constant = constants.find(c => c.constant_key === key);
  if (!constant) return null;
  
  return {
    name: constant.source || 'Unknown',
    url: constant.source_url || undefined,
    effectiveDate: constant.effective_from || undefined,
  };
}
