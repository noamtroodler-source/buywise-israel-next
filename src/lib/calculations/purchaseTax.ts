/**
 * Purchase Tax (Mas Rechisha) Calculation Utilities
 * Based on 2024 Israeli tax brackets
 */

export type BuyerType = 
  | 'first_time'      // First apartment buyer
  | 'oleh'            // New immigrant within 7 years
  | 'upgrader'        // Selling existing property within 18 months
  | 'investor'        // Additional property buyer (Israeli resident)
  | 'foreign'         // Foreign resident/non-resident
  | 'company';        // Corporate buyer

export interface TaxBracket {
  min: number;
  max: number | null;
  rate: number;
}

export interface PurchaseTaxResult {
  totalTax: number;
  effectiveRate: number;
  breakdown: Array<{
    bracket: TaxBracket;
    taxableAmount: number;
    taxAmount: number;
  }>;
  buyerType: BuyerType;
  savings?: {
    vsInvestor: number;
    vsForeign: number;
  };
}

// 2024 Tax Brackets (updated January 2024)
const TAX_BRACKETS: Record<BuyerType, TaxBracket[]> = {
  first_time: [
    { min: 0, max: 1978745, rate: 0 },
    { min: 1978745, max: 2347040, rate: 0.035 },
    { min: 2347040, max: 6055070, rate: 0.05 },
    { min: 6055070, max: 20183560, rate: 0.08 },
    { min: 20183560, max: null, rate: 0.10 },
  ],
  oleh: [
    { min: 0, max: 1978745, rate: 0 },
    { min: 1978745, max: 6055070, rate: 0.005 }, // Special 0.5% rate
    { min: 6055070, max: 20183560, rate: 0.08 },
    { min: 20183560, max: null, rate: 0.10 },
  ],
  upgrader: [
    // Same as first_time if selling within 18 months
    { min: 0, max: 1978745, rate: 0 },
    { min: 1978745, max: 2347040, rate: 0.035 },
    { min: 2347040, max: 6055070, rate: 0.05 },
    { min: 6055070, max: 20183560, rate: 0.08 },
    { min: 20183560, max: null, rate: 0.10 },
  ],
  investor: [
    { min: 0, max: 6055070, rate: 0.08 },
    { min: 6055070, max: null, rate: 0.10 },
  ],
  foreign: [
    { min: 0, max: 6055070, rate: 0.08 },
    { min: 6055070, max: null, rate: 0.10 },
  ],
  company: [
    { min: 0, max: 6055070, rate: 0.08 },
    { min: 6055070, max: null, rate: 0.10 },
  ],
};

/**
 * Calculate purchase tax based on price and buyer type
 */
export function calculatePurchaseTax(
  price: number,
  buyerType: BuyerType,
  isOleh: boolean = false,
  aliyahYear?: number
): PurchaseTaxResult {
  // If buyer is Oleh and still eligible, use Oleh brackets
  const effectiveBuyerType = isOleh && calculateOlehEligibility(aliyahYear) 
    ? 'oleh' 
    : buyerType;
  
  const brackets = TAX_BRACKETS[effectiveBuyerType];
  const breakdown: PurchaseTaxResult['breakdown'] = [];
  let totalTax = 0;
  let remainingPrice = price;

  for (const bracket of brackets) {
    if (remainingPrice <= 0) break;

    const bracketMax = bracket.max ?? Infinity;
    const bracketSize = bracketMax - bracket.min;
    const taxableAmount = Math.min(remainingPrice, bracketSize);
    const taxAmount = taxableAmount * bracket.rate;

    breakdown.push({
      bracket,
      taxableAmount,
      taxAmount,
    });

    totalTax += taxAmount;
    remainingPrice -= taxableAmount;
  }

  const effectiveRate = price > 0 ? (totalTax / price) * 100 : 0;

  // Calculate savings vs investor/foreign rates
  const investorTax = calculateTaxAmount(price, 'investor');
  const foreignTax = calculateTaxAmount(price, 'foreign');

  return {
    totalTax: Math.round(totalTax),
    effectiveRate: Math.round(effectiveRate * 100) / 100,
    breakdown,
    buyerType: effectiveBuyerType,
    savings: {
      vsInvestor: Math.round(investorTax - totalTax),
      vsForeign: Math.round(foreignTax - totalTax),
    },
  };
}

/**
 * Simple tax calculation without full breakdown
 */
export function calculateTaxAmount(price: number, buyerType: BuyerType): number {
  const brackets = TAX_BRACKETS[buyerType];
  let totalTax = 0;
  let remainingPrice = price;

  for (const bracket of brackets) {
    if (remainingPrice <= 0) break;

    const bracketMax = bracket.max ?? Infinity;
    const bracketSize = bracketMax - bracket.min;
    const taxableAmount = Math.min(remainingPrice, bracketSize);
    
    totalTax += taxableAmount * bracket.rate;
    remainingPrice -= taxableAmount;
  }

  return Math.round(totalTax);
}

/**
 * Check if Oleh is still within 7-year benefit window
 */
export function calculateOlehEligibility(aliyahYear?: number): boolean {
  if (!aliyahYear) return false;
  
  const currentYear = new Date().getFullYear();
  const yearsInIsrael = currentYear - aliyahYear;
  
  return yearsInIsrael <= 7;
}

/**
 * Calculate remaining Oleh benefit period
 */
export function getOlehBenefitRemaining(aliyahYear?: number): { 
  eligible: boolean; 
  yearsRemaining: number;
  expiryYear: number;
} {
  if (!aliyahYear) {
    return { eligible: false, yearsRemaining: 0, expiryYear: 0 };
  }
  
  const currentYear = new Date().getFullYear();
  const expiryYear = aliyahYear + 7;
  const yearsRemaining = Math.max(0, expiryYear - currentYear);
  
  return {
    eligible: yearsRemaining > 0,
    yearsRemaining,
    expiryYear,
  };
}

/**
 * Calculate upgrader scenario timeline
 */
export function calculateUpgraderTimeline(purchaseDate: Date): {
  deadline: Date;
  daysRemaining: number;
  isEligible: boolean;
} {
  const deadline = new Date(purchaseDate);
  deadline.setMonth(deadline.getMonth() + 18);
  
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  
  return {
    deadline,
    daysRemaining,
    isEligible: daysRemaining > 0,
  };
}

/**
 * Compare tax across all buyer types
 */
export function compareTaxByBuyerType(price: number): Record<BuyerType, { tax: number; effectiveRate: number }> {
  const buyerTypes: BuyerType[] = ['first_time', 'oleh', 'upgrader', 'investor', 'foreign', 'company'];
  
  return buyerTypes.reduce((acc, type) => {
    const result = calculatePurchaseTax(price, type);
    acc[type] = {
      tax: result.totalTax,
      effectiveRate: result.effectiveRate,
    };
    return acc;
  }, {} as Record<BuyerType, { tax: number; effectiveRate: number }>);
}

/**
 * Calculate tax savings between two buyer categories
 */
export function calculateTaxSavings(
  price: number,
  actualCategory: BuyerType,
  comparisonCategory: BuyerType
): number {
  const actualTax = calculateTaxAmount(price, actualCategory);
  const comparisonTax = calculateTaxAmount(price, comparisonCategory);
  
  return Math.round(comparisonTax - actualTax);
}

/**
 * Get tax brackets for a specific buyer type
 */
export function getTaxBrackets(buyerType: BuyerType): TaxBracket[] {
  return TAX_BRACKETS[buyerType];
}

/**
 * Get buyer type label for display
 */
export function getBuyerTypeLabel(buyerType: BuyerType): string {
  const labels: Record<BuyerType, string> = {
    first_time: 'First-Time Buyer',
    oleh: 'New Immigrant (Oleh)',
    upgrader: 'Upgrader',
    investor: 'Investor',
    foreign: 'Foreign Resident',
    company: 'Corporate Buyer',
  };
  
  return labels[buyerType];
}

/**
 * Determine buyer type from profile data
 */
export function determineBuyerType(profile: {
  residency_status: string;
  is_first_property: boolean;
  purchase_purpose: string;
  buyer_entity: string;
  aliyah_year?: number | null;
}): BuyerType {
  // Company buyer
  if (profile.buyer_entity === 'company') {
    return 'company';
  }
  
  // Foreign resident
  if (profile.residency_status === 'non_resident' || profile.residency_status === 'foreign') {
    return 'foreign';
  }
  
  // Oleh (new immigrant) - check eligibility
  if (profile.residency_status === 'oleh' && profile.aliyah_year) {
    if (calculateOlehEligibility(profile.aliyah_year)) {
      return 'oleh';
    }
  }
  
  // First-time buyer
  if (profile.is_first_property) {
    return 'first_time';
  }
  
  // Investment property
  if (profile.purchase_purpose === 'investment') {
    return 'investor';
  }
  
  // Upgrader (replacing primary residence)
  if (profile.purchase_purpose === 'primary_residence' && !profile.is_first_property) {
    return 'upgrader';
  }
  
  // Default to investor for additional properties
  return 'investor';
}
