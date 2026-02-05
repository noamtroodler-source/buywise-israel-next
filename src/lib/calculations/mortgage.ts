/**
 * Mortgage Calculation Utilities
 * Based on Bank of Israel regulations and Israeli mortgage market
 */

export type MortgageTrackType = 
  | 'prime'           // Variable rate linked to BoI prime
  | 'fixed_unlinked'  // Fixed rate, not CPI linked
  | 'fixed_linked'    // Fixed rate, CPI linked
  | 'fixed_cpi'       // Alias for fixed_linked
  | 'variable_linked' // Variable rate, CPI linked (5-year adjustable)
  | 'variable_unlinked' // Variable rate, not CPI linked
  | 'variable_cpi'    // Alias for variable_linked
  | 'foreign_currency' // USD/EUR denominated
  | 'eligibility';    // Government subsidized loan

// Alias for components using TrackType
export type TrackType = MortgageTrackType;

export type BuyerCategory = 'first_time' | 'upgrader' | 'investor' | 'foreign' | 'oleh' | 'company';

export interface MortgageTrack {
  type: MortgageTrackType;
  principal: number;
  interestRate: number;
  termYears: number;
  isCpiLinked: boolean;
}

export interface MortgagePaymentResult {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  effectiveRate: number;
}

export interface AmortizationEntry {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  cumulativeInterest: number;
}

export interface AffordabilityResult {
  maxPropertyPrice: number;
  maxLoanAmount: number;
  maxMonthlyPayment: number;
  requiredDownPayment: number;
  pti: number;
}

export interface MortgageMixRecommendation {
  tracks: MortgageTrack[];
  totalMonthlyPayment: number;
  riskLevel: 'low' | 'medium' | 'high';
  rationale: string;
}

// LTV Limits by buyer category (Bank of Israel regulations)
export const LTV_LIMITS: Record<BuyerCategory, number> = {
  first_time: 0.75,  // 75% max
  upgrader: 0.70,    // 70% max
  investor: 0.50,    // 50% max
  foreign: 0.50,     // 50% max
  oleh: 0.75,        // Same as first-time
  company: 0.50,     // Same as investor
};

// Maximum Payment-to-Income ratio (Bank of Israel Directive 329)
// Bank of Israel limits debt-to-income to 33-40% of net monthly income
const MAX_PTI = 0.40; // 40% max - regulatory limit

// Current approximate rates (2024)
const CURRENT_RATES: Record<MortgageTrackType, { min: number; max: number }> = {
  prime: { min: 6.0, max: 7.0 },
  fixed_unlinked: { min: 5.5, max: 6.5 },
  fixed_linked: { min: 3.5, max: 4.5 },
  fixed_cpi: { min: 3.5, max: 4.5 },
  variable_linked: { min: 3.0, max: 4.0 },
  variable_unlinked: { min: 5.0, max: 6.0 },
  variable_cpi: { min: 3.0, max: 4.0 },
  foreign_currency: { min: 4.0, max: 5.5 },
  eligibility: { min: 3.0, max: 4.0 },
};

/**
 * Calculate monthly mortgage payment (PMT formula)
 */
export function calculateMortgagePayment(
  principal: number,
  annualRate: number,
  termYears: number
): MortgagePaymentResult {
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;
  
  if (monthlyRate === 0) {
    const monthlyPayment = principal / numPayments;
    return {
      monthlyPayment: Math.round(monthlyPayment),
      totalPayment: Math.round(principal),
      totalInterest: 0,
      effectiveRate: 0,
    };
  }
  
  const monthlyPayment = principal * 
    (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
    (Math.pow(1 + monthlyRate, numPayments) - 1);
  
  const totalPayment = monthlyPayment * numPayments;
  const totalInterest = totalPayment - principal;
  const effectiveRate = (totalInterest / principal) * 100;
  
  return {
    monthlyPayment: Math.round(monthlyPayment),
    totalPayment: Math.round(totalPayment),
    totalInterest: Math.round(totalInterest),
    effectiveRate: Math.round(effectiveRate * 100) / 100,
  };
}

/**
 * Generate full amortization schedule
 */
export function calculateAmortizationSchedule(
  principal: number,
  annualRate: number,
  termYears: number
): AmortizationEntry[] {
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;
  const { monthlyPayment } = calculateMortgagePayment(principal, annualRate, termYears);
  
  const schedule: AmortizationEntry[] = [];
  let balance = principal;
  let cumulativeInterest = 0;
  
  for (let month = 1; month <= numPayments; month++) {
    const interest = balance * monthlyRate;
    const principalPayment = monthlyPayment - interest;
    balance = Math.max(0, balance - principalPayment);
    cumulativeInterest += interest;
    
    schedule.push({
      month,
      payment: Math.round(monthlyPayment),
      principal: Math.round(principalPayment),
      interest: Math.round(interest),
      balance: Math.round(balance),
      cumulativeInterest: Math.round(cumulativeInterest),
    });
  }
  
  return schedule;
}

/**
 * Get maximum LTV based on buyer category
 */
export function getMaxLTV(buyerCategory: BuyerCategory): number {
  return LTV_LIMITS[buyerCategory];
}

/**
 * Calculate maximum loan amount based on LTV
 */
export function calculateMaxLoanByLTV(
  propertyPrice: number,
  buyerCategory: BuyerCategory
): number {
  const maxLTV = LTV_LIMITS[buyerCategory];
  return Math.round(propertyPrice * maxLTV);
}

/**
 * Calculate maximum loan amount based on PTI (Payment-to-Income)
 */
export function calculateMaxLoanByPTI(
  netMonthlyIncome: number,
  existingDebts: number,
  interestRate: number,
  termYears: number
): number {
  const maxMonthlyPayment = (netMonthlyIncome * MAX_PTI) - existingDebts;
  
  if (maxMonthlyPayment <= 0) return 0;
  
  const monthlyRate = interestRate / 100 / 12;
  const numPayments = termYears * 12;
  
  if (monthlyRate === 0) {
    return maxMonthlyPayment * numPayments;
  }
  
  const maxLoan = maxMonthlyPayment * 
    (Math.pow(1 + monthlyRate, numPayments) - 1) / 
    (monthlyRate * Math.pow(1 + monthlyRate, numPayments));
  
  return Math.round(maxLoan);
}

/**
 * Calculate affordability - what price can you afford?
 */
export function calculateAffordability(
  netMonthlyIncome: number,
  existingDebts: number,
  buyerCategory: BuyerCategory,
  interestRate: number = 5.5,
  termYears: number = 25
): AffordabilityResult {
  const maxLTV = LTV_LIMITS[buyerCategory];
  const maxLoanByPTI = calculateMaxLoanByPTI(netMonthlyIncome, existingDebts, interestRate, termYears);
  
  // Max property price based on PTI constraint
  const maxPropertyPriceByPTI = maxLoanByPTI / maxLTV;
  
  const maxMonthlyPayment = (netMonthlyIncome * MAX_PTI) - existingDebts;
  const pti = netMonthlyIncome > 0 ? (maxMonthlyPayment / netMonthlyIncome) * 100 : 0;
  
  return {
    maxPropertyPrice: Math.round(maxPropertyPriceByPTI),
    maxLoanAmount: Math.round(maxLoanByPTI),
    maxMonthlyPayment: Math.round(maxMonthlyPayment),
    requiredDownPayment: Math.round(maxPropertyPriceByPTI * (1 - maxLTV)),
    pti: Math.round(pti * 10) / 10,
  };
}

/**
 * Calculate mortgage with multiple tracks
 */
export function calculateMultiTrackMortgage(
  tracks: MortgageTrack[]
): {
  totalMonthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  trackBreakdown: Array<{
    track: MortgageTrack;
    monthlyPayment: number;
    totalPayment: number;
    totalInterest: number;
  }>;
} {
  const breakdown = tracks.map(track => {
    const result = calculateMortgagePayment(track.principal, track.interestRate, track.termYears);
    return {
      track,
      monthlyPayment: result.monthlyPayment,
      totalPayment: result.totalPayment,
      totalInterest: result.totalInterest,
    };
  });
  
  return {
    totalMonthlyPayment: breakdown.reduce((sum, b) => sum + b.monthlyPayment, 0),
    totalPayment: breakdown.reduce((sum, b) => sum + b.totalPayment, 0),
    totalInterest: breakdown.reduce((sum, b) => sum + b.totalInterest, 0),
    trackBreakdown: breakdown,
  };
}

/**
 * Estimate optimal mortgage track mix
 */
export function estimateMortgageMix(
  loanAmount: number,
  riskTolerance: 'conservative' | 'balanced' | 'aggressive' = 'balanced',
  termYears: number = 25
): MortgageMixRecommendation {
  const mixes: Record<string, { 
    allocations: Array<{ type: MortgageTrackType; percent: number }>;
    riskLevel: 'low' | 'medium' | 'high';
    rationale: string;
  }> = {
    conservative: {
      allocations: [
        { type: 'fixed_unlinked', percent: 0.50 },
        { type: 'fixed_linked', percent: 0.33 },
        { type: 'prime', percent: 0.17 },
      ],
      riskLevel: 'low',
      rationale: 'Majority fixed rates for payment stability. Limited prime exposure for flexibility.',
    },
    balanced: {
      allocations: [
        { type: 'fixed_unlinked', percent: 0.33 },
        { type: 'prime', percent: 0.34 },
        { type: 'fixed_linked', percent: 0.33 },
      ],
      riskLevel: 'medium',
      rationale: 'Classic 1/3 split between fixed, prime, and CPI-linked for diversification.',
    },
    aggressive: {
      allocations: [
        { type: 'prime', percent: 0.50 },
        { type: 'variable_linked', percent: 0.30 },
        { type: 'fixed_linked', percent: 0.20 },
      ],
      riskLevel: 'high',
      rationale: 'Higher variable rate exposure for potentially lower initial payments. Risk of rate increases.',
    },
  };
  
  const mix = mixes[riskTolerance];
  const tracks: MortgageTrack[] = mix.allocations.map(alloc => ({
    type: alloc.type,
    principal: Math.round(loanAmount * alloc.percent),
    interestRate: (CURRENT_RATES[alloc.type].min + CURRENT_RATES[alloc.type].max) / 2,
    termYears,
    isCpiLinked: alloc.type.includes('linked'),
  }));
  
  const { totalMonthlyPayment } = calculateMultiTrackMortgage(tracks);
  
  return {
    tracks,
    totalMonthlyPayment,
    riskLevel: mix.riskLevel,
    rationale: mix.rationale,
  };
}

/**
 * Calculate prepayment penalty estimate
 */
export function calculatePrepaymentPenalty(
  trackType: MortgageTrackType,
  remainingBalance: number,
  originalRate: number,
  currentMarketRate: number,
  remainingMonths: number
): number {
  // Only fixed tracks have prepayment penalties
  if (!trackType.includes('fixed')) {
    return 0;
  }
  
  // If current rates are higher, no penalty
  const rateDifference = originalRate - currentMarketRate;
  if (rateDifference <= 0) {
    return 0;
  }
  
  // Simplified penalty calculation: difference in interest over remaining term, discounted
  const monthlyDifference = remainingBalance * (rateDifference / 100 / 12);
  const discountRate = currentMarketRate / 100 / 12;
  
  // Present value of future rate difference
  let penalty = 0;
  for (let i = 1; i <= remainingMonths; i++) {
    penalty += monthlyDifference / Math.pow(1 + discountRate, i);
  }
  
  // Cap at typical max of 3-5% of remaining balance
  return Math.min(Math.round(penalty), remainingBalance * 0.05);
}

/**
 * Apply foreign income haircut (banks discount foreign income)
 */
export function calculateForeignIncomeDiscount(
  foreignIncome: number,
  currency: 'USD' | 'EUR' | 'GBP' | 'other'
): number {
  const haircuts: Record<string, number> = {
    USD: 0.80,  // 80% of income counted
    EUR: 0.85,
    GBP: 0.80,
    other: 0.70,
  };
  
  return Math.round(foreignIncome * (haircuts[currency] || 0.70));
}

/**
 * Stress test: what if rates increase?
 */
export function stressTestPayment(
  principal: number,
  currentRate: number,
  termYears: number,
  rateIncrease: number = 2 // BoI recommends testing +2%
): {
  currentPayment: number;
  stressedPayment: number;
  increase: number;
  increasePercent: number;
} {
  const current = calculateMortgagePayment(principal, currentRate, termYears);
  const stressed = calculateMortgagePayment(principal, currentRate + rateIncrease, termYears);
  
  return {
    currentPayment: current.monthlyPayment,
    stressedPayment: stressed.monthlyPayment,
    increase: stressed.monthlyPayment - current.monthlyPayment,
    increasePercent: Math.round(((stressed.monthlyPayment - current.monthlyPayment) / current.monthlyPayment) * 100),
  };
}

/**
 * Alias for stressTestPayment for component compatibility
 */
export function stressTestMortgage(
  principal: number,
  currentRate: number,
  termYears: number,
  rateIncrease: number = 2
): {
  currentPayment: number;
  stressedPayment: number;
  increase: number;
  increasePercent: number;
} {
  return stressTestPayment(principal, currentRate, termYears, rateIncrease);
}

/**
 * Get current rate range for a track type
 */
export function getCurrentRateRange(trackType: MortgageTrackType): { min: number; max: number } {
  return CURRENT_RATES[trackType] || CURRENT_RATES.prime;
}

/**
 * Get track type label for display
 */
export function getTrackTypeLabel(trackType: MortgageTrackType): string {
  const labels: Record<MortgageTrackType, string> = {
    prime: 'Prime (Variable)',
    fixed_unlinked: 'Fixed (Non-Linked)',
    fixed_linked: 'Fixed (CPI-Linked)',
    fixed_cpi: 'Fixed (CPI-Linked)',
    variable_linked: 'Variable (CPI-Linked)',
    variable_unlinked: 'Variable (Non-Linked)',
    variable_cpi: 'Variable (CPI-Linked)',
    foreign_currency: 'Foreign Currency',
    eligibility: 'Eligibility Loan',
  };
  
  return labels[trackType] || trackType;
}

/**
 * Quick estimate of monthly mortgage payment for property listings
 * Uses typical Israeli mortgage defaults (4.5% rate, 25-year term)
 * LTV is personalized based on buyer category when provided
 */
export function estimateMonthlyPayment(
  propertyPrice: number,
  buyerCategory?: BuyerCategory
): { payment: number; ltv: number } {
  // Use buyer-specific LTV or default 70%
  const ltv = buyerCategory ? LTV_LIMITS[buyerCategory] : 0.70;
  const loanAmount = propertyPrice * ltv;
  const monthlyRate = 0.045 / 12; // 4.5% typical Israeli rate
  const termMonths = 25 * 12;

  if (monthlyRate === 0) {
    return { payment: Math.round(loanAmount / termMonths), ltv };
  }

  const monthlyPayment =
    loanAmount *
    (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1);

  return { payment: Math.round(monthlyPayment), ltv };
}

/**
 * Monthly payment range estimate - returns low/mid/high based on rate variance
 * This provides "honest ranges" rather than fake precision
 * 
 * Rate assumptions:
 * - Low: 4.5% (optimistic)
 * - Mid: 5.25% (typical current market)
 * - High: 6.0% (conservative)
 * 
 * Term: Uses 25 years (standard Israeli mortgage)
 */
export interface MonthlyPaymentRange {
  low: number;
  mid: number;
  high: number;
  ltv: number;
  assumptions: {
    rateRange: string;
    term: number;
    ltvPercent: number;
  };
}

export function estimateMonthlyPaymentRange(
  propertyPrice: number,
  buyerCategory?: BuyerCategory
): MonthlyPaymentRange {
  const ltv = buyerCategory ? LTV_LIMITS[buyerCategory] : 0.70;
  const loanAmount = propertyPrice * ltv;
  const termYears = 25;
  const termMonths = termYears * 12;
  
  // Rate scenarios
  const rates = {
    low: 4.5,   // Optimistic
    mid: 5.25,  // Typical current
    high: 6.0,  // Conservative
  };
  
  const calculatePayment = (annualRate: number): number => {
    const monthlyRate = annualRate / 100 / 12;
    if (monthlyRate === 0) return Math.round(loanAmount / termMonths);
    
    return Math.round(
      loanAmount *
      (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
      (Math.pow(1 + monthlyRate, termMonths) - 1)
    );
  };
  
  return {
    low: calculatePayment(rates.low),
    mid: calculatePayment(rates.mid),
    high: calculatePayment(rates.high),
    ltv,
    assumptions: {
      rateRange: `${rates.low}–${rates.high}%`,
      term: termYears,
      ltvPercent: Math.round(ltv * 100),
    },
  };
}
