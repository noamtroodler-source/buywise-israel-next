import { useMemo } from 'react';
import { useBuyerProfile, getBuyerTaxCategory } from './useBuyerProfile';

// LTV limits by buyer type
const LTV_LIMITS: Record<string, number> = {
  'first_time': 75,
  'oleh': 75,
  'additional': 50,
  'non_resident': 50,
};

// Default affordability settings
const DEFAULT_INTEREST_RATE = 5.5; // Current avg mortgage rate
const DEFAULT_TERM_YEARS = 25;
const MAX_PTI_RATIO = 0.35; // Max payment-to-income ratio

export interface AffordabilityParams {
  monthlyIncome?: number;
  existingDebts?: number;
  downPayment?: number;
  interestRate?: number;
  termYears?: number;
}

export interface AffordabilityResult {
  maxPropertyPrice: number;
  maxMortgage: number;
  monthlyPayment: number;
  downPaymentRequired: number;
  ltvLimit: number;
  ptiRatio: number;
  canAfford: (price: number) => boolean;
  getMonthlyPayment: (price: number) => number;
  getAffordabilityLevel: (price: number) => 'comfortable' | 'stretch' | 'out_of_reach';
}

/**
 * Calculate mortgage monthly payment using PMT formula
 */
function calculateMonthlyPayment(principal: number, annualRate: number, termYears: number): number {
  if (principal <= 0) return 0;
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;
  
  if (monthlyRate === 0) return principal / numPayments;
  
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
         (Math.pow(1 + monthlyRate, numPayments) - 1);
}

/**
 * Hook for affordability calculations personalized to buyer profile
 */
export function useAffordability(params: AffordabilityParams = {}): AffordabilityResult | null {
  const { data: buyerProfile } = useBuyerProfile();
  
  return useMemo(() => {
    const {
      monthlyIncome = 0,
      existingDebts = 0,
      downPayment = 0,
      interestRate = DEFAULT_INTEREST_RATE,
      termYears = DEFAULT_TERM_YEARS,
    } = params;

    if (monthlyIncome <= 0 && downPayment <= 0) {
      return null;
    }

    const buyerCategory = getBuyerTaxCategory(buyerProfile);
    const ltvLimit = LTV_LIMITS[buyerCategory] || 75;
    
    // Calculate max affordable mortgage payment
    const maxMonthlyPayment = Math.max(0, (monthlyIncome * MAX_PTI_RATIO) - existingDebts);
    
    // Calculate max mortgage from payment
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = termYears * 12;
    
    let maxMortgage = 0;
    if (monthlyRate > 0 && maxMonthlyPayment > 0) {
      maxMortgage = maxMonthlyPayment * (Math.pow(1 + monthlyRate, numPayments) - 1) / 
                    (monthlyRate * Math.pow(1 + monthlyRate, numPayments));
    }
    
    // Calculate max property price based on LTV and down payment
    const maxPriceFromMortgage = maxMortgage / (ltvLimit / 100);
    const maxPriceFromDownPayment = downPayment > 0 ? downPayment / (1 - ltvLimit / 100) : Infinity;
    const maxPropertyPrice = Math.min(maxPriceFromMortgage, maxPriceFromDownPayment);
    
    // Required down payment for max price
    const downPaymentRequired = maxPropertyPrice * (1 - ltvLimit / 100);
    
    // Calculate actual monthly payment at max price
    const actualMortgage = maxPropertyPrice * (ltvLimit / 100);
    const monthlyPayment = calculateMonthlyPayment(actualMortgage, interestRate, termYears);
    
    // PTI ratio at max
    const ptiRatio = monthlyIncome > 0 ? (monthlyPayment + existingDebts) / monthlyIncome : 0;
    
    // Helper functions
    const canAfford = (price: number): boolean => {
      const requiredDown = price * (1 - ltvLimit / 100);
      const mortgage = price * (ltvLimit / 100);
      const payment = calculateMonthlyPayment(mortgage, interestRate, termYears);
      const totalMonthlyDebt = payment + existingDebts;
      
      if (downPayment > 0 && requiredDown > downPayment) return false;
      if (monthlyIncome > 0 && totalMonthlyDebt / monthlyIncome > MAX_PTI_RATIO) return false;
      
      return true;
    };
    
    const getMonthlyPayment = (price: number): number => {
      const mortgage = price * (ltvLimit / 100);
      return calculateMonthlyPayment(mortgage, interestRate, termYears);
    };
    
    const getAffordabilityLevel = (price: number): 'comfortable' | 'stretch' | 'out_of_reach' => {
      if (!canAfford(price)) return 'out_of_reach';
      
      const requiredDown = price * (1 - ltvLimit / 100);
      const mortgage = price * (ltvLimit / 100);
      const payment = calculateMonthlyPayment(mortgage, interestRate, termYears);
      const totalMonthlyDebt = payment + existingDebts;
      const pti = monthlyIncome > 0 ? totalMonthlyDebt / monthlyIncome : 0;
      
      // Check if down payment is significantly more than required
      const downPaymentComfort = downPayment > 0 ? requiredDown / downPayment : 0;
      
      // Comfortable if PTI < 25% and down payment is > 120% of required
      if (pti < 0.25 && downPaymentComfort < 0.8) return 'comfortable';
      
      // Stretch if PTI between 25-35% or down payment is tight
      if (pti <= MAX_PTI_RATIO) return 'stretch';
      
      return 'out_of_reach';
    };
    
    return {
      maxPropertyPrice: Math.round(maxPropertyPrice),
      maxMortgage: Math.round(maxMortgage),
      monthlyPayment: Math.round(monthlyPayment),
      downPaymentRequired: Math.round(downPaymentRequired),
      ltvLimit,
      ptiRatio: Math.round(ptiRatio * 100) / 100,
      canAfford,
      getMonthlyPayment,
      getAffordabilityLevel,
    };
  }, [params, buyerProfile]);
}

/**
 * Quick affordability check without needing full income data
 * Uses stored preferences or defaults
 */
export function useQuickAffordability() {
  const { data: buyerProfile } = useBuyerProfile();
  
  // Get saved affordability settings from localStorage
  const savedSettings = useMemo(() => {
    try {
      const saved = localStorage.getItem('affordability_settings');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, []);

  const buyerCategory = getBuyerTaxCategory(buyerProfile);
  const ltvLimit = LTV_LIMITS[buyerCategory] || 75;

  const getMonthlyEstimate = (price: number): number => {
    const mortgage = price * (ltvLimit / 100);
    return calculateMonthlyPayment(mortgage, DEFAULT_INTEREST_RATE, DEFAULT_TERM_YEARS);
  };

  const getDownPaymentRequired = (price: number): number => {
    return price * (1 - ltvLimit / 100);
  };

  return {
    ltvLimit,
    hasSavedSettings: !!savedSettings,
    maxPrice: savedSettings?.maxPrice || null,
    getMonthlyEstimate,
    getDownPaymentRequired,
  };
}

/**
 * Save affordability settings to localStorage
 */
export function saveAffordabilitySettings(settings: {
  monthlyIncome: number;
  existingDebts: number;
  downPayment: number;
  maxPrice: number;
}) {
  localStorage.setItem('affordability_settings', JSON.stringify(settings));
}

/**
 * Clear saved affordability settings
 */
export function clearAffordabilitySettings() {
  localStorage.removeItem('affordability_settings');
}
