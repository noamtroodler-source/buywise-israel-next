import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useBuyerProfile, getBuyerTaxCategory, MortgagePreferencesJson } from './useBuyerProfile';
import { getLtvLimit } from '@/lib/calculations/constants';
import { useCalculatorConstants } from './useCalculatorConstants';
import { toast } from 'sonner';

const LOCAL_STORAGE_KEY = 'mortgage_preferences';
const DEFAULT_TERM_YEARS = 25;
const DEFAULT_RATE_LOW = 4.5;
const DEFAULT_RATE_MID = 5.25;
const DEFAULT_RATE_HIGH = 6.0;

export interface MortgagePreferences {
  down_payment_percent: number | null;
  down_payment_amount: number | null;
  term_years: number;
  assumed_rate: number;
  monthly_income: number | null;
  income_type: 'net' | 'gross' | null;
}

export interface MortgageEstimate {
  loanAmount: number;
  downPayment: number;
  downPaymentPercent: number;
  monthlyPaymentLow: number;
  monthlyPaymentMid: number;
  monthlyPaymentHigh: number;
  termYears: number;
  ltvLimit: number;
  buyerCategory: string;
}

const DEFAULT_PREFERENCES: MortgagePreferences = {
  down_payment_percent: null,
  down_payment_amount: null,
  term_years: DEFAULT_TERM_YEARS,
  assumed_rate: DEFAULT_RATE_MID,
  monthly_income: null,
  income_type: null,
};

/**
 * Calculate monthly mortgage payment using PMT formula
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
 * Read preferences from localStorage (for guests)
 */
function getLocalPreferences(): MortgagePreferences | null {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

/**
 * Save preferences to localStorage
 */
function saveLocalPreferences(prefs: MortgagePreferences): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

/**
 * Hook for managing mortgage preferences
 * - Logged-in users: stored in buyer_profiles.mortgage_preferences
 * - Guests: stored in localStorage
 */
export function useMortgagePreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: buyerProfile } = useBuyerProfile();
  const { data: constants } = useCalculatorConstants();
  
  // Local state for guest users
  const [localPrefs, setLocalPrefs] = useState<MortgagePreferences | null>(() => getLocalPreferences());
  
  // Get preferences from profile or local storage
  const preferences: MortgagePreferences = useMemo(() => {
    if (user && buyerProfile?.mortgage_preferences) {
      // Type assertion since mortgage_preferences is JSONB
      return buyerProfile.mortgage_preferences as MortgagePreferences;
    }
    return localPrefs || DEFAULT_PREFERENCES;
  }, [user, buyerProfile, localPrefs]);
  
  // Get buyer category and LTV limit
  const buyerCategory = getBuyerTaxCategory(buyerProfile);
  const ltvLimit = getLtvLimit(constants, buyerCategory);
  const maxDownPaymentPercent = 1 - ltvLimit; // e.g., 0.25 for 75% LTV
  
  // Mutation for saving to database
  const saveMutation = useMutation({
    mutationFn: async (newPrefs: Partial<MortgagePreferences>) => {
      if (!user) throw new Error('Not authenticated');
      
      const merged = { ...preferences, ...newPrefs };
      
      const { error } = await supabase
        .from('buyer_profiles')
        .update({ mortgage_preferences: merged })
        .eq('user_id', user.id);
      
      if (error) throw error;
      return merged;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-profile'] });
      toast.success('Mortgage preferences saved');
    },
    onError: (error) => {
      toast.error('Failed to save preferences: ' + error.message);
    },
  });
  
  // Save preferences (to DB for logged-in users, localStorage for guests)
  const savePreferences = useCallback((newPrefs: Partial<MortgagePreferences>) => {
    const merged = { ...preferences, ...newPrefs };
    
    if (user) {
      saveMutation.mutate(newPrefs);
    } else {
      setLocalPrefs(merged);
      saveLocalPreferences(merged);
      toast.success('Preferences saved locally');
    }
  }, [user, preferences, saveMutation]);
  
  // Calculate mortgage estimate for a property price
  const getEstimate = useCallback((propertyPrice: number): MortgageEstimate => {
    // Determine down payment
    let downPayment: number;
    let downPaymentPercent: number;
    
    if (preferences.down_payment_amount !== null) {
      downPayment = preferences.down_payment_amount;
      downPaymentPercent = propertyPrice > 0 ? (downPayment / propertyPrice) : maxDownPaymentPercent;
    } else if (preferences.down_payment_percent !== null) {
      downPaymentPercent = preferences.down_payment_percent / 100;
      downPayment = propertyPrice * downPaymentPercent;
    } else {
      // Default to minimum required by LTV
      downPaymentPercent = maxDownPaymentPercent;
      downPayment = propertyPrice * maxDownPaymentPercent;
    }
    
    // Ensure down payment respects LTV limit
    if (downPaymentPercent < maxDownPaymentPercent) {
      downPaymentPercent = maxDownPaymentPercent;
      downPayment = propertyPrice * maxDownPaymentPercent;
    }
    
    const loanAmount = propertyPrice - downPayment;
    const termYears = preferences.term_years || DEFAULT_TERM_YEARS;
    
    // Calculate payment range
    const monthlyPaymentLow = Math.round(calculateMonthlyPayment(loanAmount, DEFAULT_RATE_LOW, termYears));
    const monthlyPaymentMid = Math.round(calculateMonthlyPayment(loanAmount, DEFAULT_RATE_MID, termYears));
    const monthlyPaymentHigh = Math.round(calculateMonthlyPayment(loanAmount, DEFAULT_RATE_HIGH, termYears));
    
    return {
      loanAmount: Math.round(loanAmount),
      downPayment: Math.round(downPayment),
      downPaymentPercent: Math.round(downPaymentPercent * 100),
      monthlyPaymentLow,
      monthlyPaymentMid,
      monthlyPaymentHigh,
      termYears,
      ltvLimit: Math.round(ltvLimit * 100),
      buyerCategory,
    };
  }, [preferences, maxDownPaymentPercent, ltvLimit, buyerCategory]);
  
  return {
    preferences,
    savePreferences,
    getEstimate,
    ltvLimit: Math.round(ltvLimit * 100),
    buyerCategory,
    isLoggedIn: !!user,
    hasCustomPreferences: !!(preferences.down_payment_amount || preferences.down_payment_percent),
    isSaving: saveMutation.isPending,
  };
}

/**
 * Quick hook just for getting mortgage estimate without full preferences management
 */
export function useMortgageEstimate(propertyPrice: number) {
  const { getEstimate, ltvLimit, buyerCategory, hasCustomPreferences } = useMortgagePreferences();
  
  return useMemo(() => ({
    ...getEstimate(propertyPrice),
    hasCustomPreferences,
  }), [getEstimate, propertyPrice, hasCustomPreferences]);
}
