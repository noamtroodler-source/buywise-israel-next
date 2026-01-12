/**
 * Purchase Costs Calculation Utilities
 * Comprehensive one-time and recurring costs for Israeli real estate
 */

import { calculatePurchaseTax, BuyerType } from './purchaseTax';

export interface PurchaseCostOptions {
  buyerType: BuyerType;
  isNewConstruction: boolean;
  loanAmount?: number;
  isOleh?: boolean;
  aliyahYear?: number;
  sizeSqm?: number;
  city?: string;
  includeAgentFee?: boolean;
}

export interface CostItem {
  name: string;
  hebrewName?: string;
  amount: number;
  amountMax?: number;
  isRange: boolean;
  isPercentage: boolean;
  rate?: number;
  rateMax?: number;
  includesVat: boolean;
  notes?: string;
  category: 'tax' | 'legal' | 'agent' | 'mortgage' | 'registration' | 'other';
}

export interface TotalPurchaseCostsResult {
  totalMin: number;
  totalMax: number;
  totalOneTimeCosts: number; // Alias for totalMin
  costs: CostItem[];
  purchaseTax: number;
  closingCosts: number;
  mortgageCosts: number;
  percentOfPrice: {
    min: number;
    max: number;
  };
  // Convenience properties for individual fee access
  lawyerFees: number;
  agentFees: number;
  developerLawyerFees: number;
  bankGuarantee: number;
  mortgageOriginationFee: number;
  appraisalFee: number;
  mortgageRegistration: number;
  tabuRegistration: number;
  caveatRegistration: number;
}

export interface MonthlyCostsResult {
  total: number;
  arnona: number;
  vaadBayit: number;
  insurance: number;
  mortgage?: number;
}

// VAT rate (updated January 2025)
// Note: This is a fallback - prefer using getVatRate() from constants.ts
const VAT_RATE = 0.18;

// Standard cost ranges (₪)
const COSTS = {
  lawyer: { rateMin: 0.005, rateMax: 0.015, minFee: 3000, maxFee: 50000 },
  developerLawyer: { rateMin: 0.015, rateMax: 0.02, minFee: 5000, maxFee: 100000 },
  agent: { rate: 0.02, minFee: 10000, maxFee: 100000 },
  appraisal: { min: 700, max: 1500 },
  mortgageOrigination: { fixed: 360 }, // Capped by law
  tabuRegistration: { min: 300, max: 600 },
  caveatRegistration: { min: 130, max: 250 },
  mortgageRegistration: { min: 200, max: 350 },
  bankGuarantee: { rateMin: 0.005, rateMax: 0.015 }, // For new construction
  notary: { min: 200, max: 500 },
  insurance: { monthlyMin: 100, monthlyMax: 200 },
  vaadBayit: { monthlyMin: 200, monthlyMax: 500 },
};

// Arnona rates by city tier (₪ per sqm per month, approximate)
const ARNONA_RATES: Record<string, number> = {
  'tel-aviv': 120,
  'jerusalem': 90,
  'haifa': 70,
  'raanana': 100,
  'herzliya': 110,
  'netanya': 75,
  'ashdod': 65,
  'beer-sheva': 55,
  'modiin': 80,
  'petah-tikva': 75,
  'default': 70,
};

/**
 * Calculate total purchase costs (one-time)
 */
export function calculateTotalPurchaseCosts(
  price: number,
  options: PurchaseCostOptions
): TotalPurchaseCostsResult {
  const costs: CostItem[] = [];
  
  // 1. Purchase Tax (Mas Rechisha)
  const taxResult = calculatePurchaseTax(
    price, 
    options.buyerType, 
    options.isOleh, 
    options.aliyahYear
  );
  costs.push({
    name: 'Purchase Tax',
    hebrewName: 'מס רכישה',
    amount: taxResult.totalTax,
    isRange: false,
    isPercentage: false,
    rate: taxResult.effectiveRate,
    includesVat: false,
    category: 'tax',
    notes: `Effective rate: ${taxResult.effectiveRate}%`,
  });

  // 2. Lawyer fees
  const lawyerFeeMin = Math.max(
    COSTS.lawyer.minFee,
    price * COSTS.lawyer.rateMin
  ) * (1 + VAT_RATE);
  const lawyerFeeMax = Math.min(
    COSTS.lawyer.maxFee,
    price * COSTS.lawyer.rateMax
  ) * (1 + VAT_RATE);
  
  costs.push({
    name: 'Lawyer Fees',
    hebrewName: 'עורך דין',
    amount: Math.round(lawyerFeeMin),
    amountMax: Math.round(lawyerFeeMax),
    isRange: true,
    isPercentage: true,
    rate: COSTS.lawyer.rateMin * 100,
    rateMax: COSTS.lawyer.rateMax * 100,
    includesVat: true,
    category: 'legal',
    notes: '0.5-1.5% + VAT',
  });

  // 3. Developer lawyer (new construction only)
  if (options.isNewConstruction) {
    const devLawyerFeeMin = Math.max(
      COSTS.developerLawyer.minFee,
      price * COSTS.developerLawyer.rateMin
    ) * (1 + VAT_RATE);
    const devLawyerFeeMax = Math.min(
      COSTS.developerLawyer.maxFee,
      price * COSTS.developerLawyer.rateMax
    ) * (1 + VAT_RATE);
    
    costs.push({
      name: 'Developer Lawyer',
      hebrewName: 'עורך דין קבלן',
      amount: Math.round(devLawyerFeeMin),
      amountMax: Math.round(devLawyerFeeMax),
      isRange: true,
      isPercentage: true,
      rate: COSTS.developerLawyer.rateMin * 100,
      rateMax: COSTS.developerLawyer.rateMax * 100,
      includesVat: true,
      category: 'legal',
      notes: 'Mandatory for new construction',
    });
  }

  // 4. Agent fees (resale only, if applicable)
  if (!options.isNewConstruction && options.includeAgentFee !== false) {
    const agentFee = Math.min(
      COSTS.agent.maxFee,
      Math.max(COSTS.agent.minFee, price * COSTS.agent.rate)
    ) * (1 + VAT_RATE);
    
    costs.push({
      name: 'Agent Commission',
      hebrewName: 'עמלת תיווך',
      amount: Math.round(agentFee),
      isRange: false,
      isPercentage: true,
      rate: COSTS.agent.rate * 100,
      includesVat: true,
      category: 'agent',
      notes: '2% + VAT (resale only)',
    });
  }

  // 5. Mortgage-related costs (if loan amount provided)
  if (options.loanAmount && options.loanAmount > 0) {
    // Appraisal
    costs.push({
      name: 'Property Appraisal',
      hebrewName: 'שמאות',
      amount: COSTS.appraisal.min,
      amountMax: COSTS.appraisal.max,
      isRange: true,
      isPercentage: false,
      includesVat: false,
      category: 'mortgage',
    });

    // Mortgage origination (capped at ₪360)
    costs.push({
      name: 'Mortgage Origination',
      hebrewName: 'עמלת פתיחת תיק',
      amount: COSTS.mortgageOrigination.fixed,
      isRange: false,
      isPercentage: false,
      includesVat: false,
      category: 'mortgage',
      notes: 'Capped by law at ₪360',
    });

    // Mortgage registration
    costs.push({
      name: 'Mortgage Registration',
      hebrewName: 'רישום משכנתא',
      amount: COSTS.mortgageRegistration.min,
      amountMax: COSTS.mortgageRegistration.max,
      isRange: true,
      isPercentage: false,
      includesVat: false,
      category: 'registration',
    });
  }

  // 6. Property registration
  costs.push({
    name: 'Tabu Registration',
    hebrewName: 'רישום בטאבו',
    amount: COSTS.tabuRegistration.min,
    amountMax: COSTS.tabuRegistration.max,
    isRange: true,
    isPercentage: false,
    includesVat: false,
    category: 'registration',
  });

  // 7. Caveat registration
  costs.push({
    name: 'Caveat Registration',
    hebrewName: 'רישום הערת אזהרה',
    amount: COSTS.caveatRegistration.min,
    amountMax: COSTS.caveatRegistration.max,
    isRange: true,
    isPercentage: false,
    includesVat: false,
    category: 'registration',
  });

  // 8. Bank guarantee (new construction only)
  if (options.isNewConstruction && options.loanAmount && options.loanAmount > 0) {
    const guaranteeMin = options.loanAmount * COSTS.bankGuarantee.rateMin;
    const guaranteeMax = options.loanAmount * COSTS.bankGuarantee.rateMax;
    
    costs.push({
      name: 'Bank Guarantee',
      hebrewName: 'ערבות בנקאית',
      amount: Math.round(guaranteeMin),
      amountMax: Math.round(guaranteeMax),
      isRange: true,
      isPercentage: true,
      rate: COSTS.bankGuarantee.rateMin * 100,
      rateMax: COSTS.bankGuarantee.rateMax * 100,
      includesVat: false,
      category: 'other',
      notes: '0.5-1.5% of financed amount',
    });
  }

  // Calculate totals
  const totalMin = costs.reduce((sum, cost) => sum + cost.amount, 0);
  const totalMax = costs.reduce((sum, cost) => sum + (cost.amountMax || cost.amount), 0);
  
  const purchaseTax = taxResult.totalTax;
  const closingCosts = costs
    .filter(c => c.category !== 'tax' && c.category !== 'mortgage')
    .reduce((sum, c) => sum + c.amount, 0);
  const mortgageCostsTotal = costs
    .filter(c => c.category === 'mortgage')
    .reduce((sum, c) => sum + c.amount, 0);

  // Extract individual fee amounts from costs array
  const findCost = (name: string) => costs.find(c => c.name === name)?.amount || 0;

  return {
    totalMin: Math.round(totalMin),
    totalMax: Math.round(totalMax),
    totalOneTimeCosts: Math.round(totalMin),
    costs,
    purchaseTax,
    closingCosts: Math.round(closingCosts),
    mortgageCosts: Math.round(mortgageCostsTotal),
    percentOfPrice: {
      min: Math.round((totalMin / price) * 1000) / 10,
      max: Math.round((totalMax / price) * 1000) / 10,
    },
    // Individual fee access
    lawyerFees: findCost('Lawyer Fees'),
    agentFees: findCost('Agent Commission'),
    developerLawyerFees: findCost('Developer Lawyer'),
    bankGuarantee: findCost('Bank Guarantee'),
    mortgageOriginationFee: findCost('Mortgage Origination'),
    appraisalFee: findCost('Property Appraisal'),
    mortgageRegistration: findCost('Mortgage Registration'),
    tabuRegistration: findCost('Tabu Registration'),
    caveatRegistration: findCost('Caveat Registration'),
  };
}

/**
 * Calculate monthly recurring costs
 */
export function calculateMonthlyCosts(
  sizeSqm: number,
  city?: string,
  mortgagePayment?: number
): MonthlyCostsResult {
  const citySlug = city?.toLowerCase().replace(/\s+/g, '-') || 'default';
  const arnonaRate = ARNONA_RATES[citySlug] || ARNONA_RATES.default;
  
  const arnona = Math.round(sizeSqm * arnonaRate / 12); // Monthly average
  const vaadBayit = Math.round((COSTS.vaadBayit.monthlyMin + COSTS.vaadBayit.monthlyMax) / 2);
  const insurance = Math.round((COSTS.insurance.monthlyMin + COSTS.insurance.monthlyMax) / 2);
  
  return {
    total: arnona + vaadBayit + insurance + (mortgagePayment || 0),
    arnona,
    vaadBayit,
    insurance,
    mortgage: mortgagePayment,
  };
}

/**
 * Estimate new construction price increase (Madad linkage)
 */
export function calculateNewConstructionPremium(
  basePrice: number,
  buildTimeYears: number,
  estimatedMadadIncrease: number = 0.02 // 2% annual average
): {
  finalPrice: number;
  madadIncrease: number;
  percentIncrease: number;
} {
  const totalIncrease = Math.pow(1 + estimatedMadadIncrease, buildTimeYears) - 1;
  const madadIncrease = Math.round(basePrice * totalIncrease);
  
  return {
    finalPrice: Math.round(basePrice + madadIncrease),
    madadIncrease,
    percentIncrease: Math.round(totalIncrease * 100 * 10) / 10,
  };
}

/**
 * Alias for calculateNewConstructionPremium for component compatibility
 */
export function calculateNewConstructionLinkage(
  basePrice: number,
  buildTimeMonths: number,
  annualRate: number = 0.02
): {
  totalLinkedCost: number;
  linkageAmount: number;
  annualRate: number;
  finalPrice: number;
  percentIncrease: number;
} {
  const buildTimeYears = buildTimeMonths / 12;
  const result = calculateNewConstructionPremium(basePrice, buildTimeYears, annualRate);
  
  return {
    totalLinkedCost: result.finalPrice,
    linkageAmount: result.madadIncrease,
    annualRate: annualRate * 100,
    finalPrice: result.finalPrice,
    percentIncrease: result.percentIncrease,
  };
}

/**
 * Get estimated Arnona rate for a city
 */
export function getArnonaRate(city: string): number {
  const citySlug = city.toLowerCase().replace(/\s+/g, '-');
  return ARNONA_RATES[citySlug] || ARNONA_RATES.default;
}

/**
 * Calculate annual Arnona
 */
export function calculateAnnualArnona(sizeSqm: number, city?: string): number {
  const rate = city ? getArnonaRate(city) : ARNONA_RATES.default;
  return Math.round(sizeSqm * rate);
}

/**
 * Get cost breakdown by category
 */
export function getCostsByCategory(
  costs: CostItem[]
): Record<CostItem['category'], { items: CostItem[]; total: number }> {
  const categories: CostItem['category'][] = ['tax', 'legal', 'agent', 'mortgage', 'registration', 'other'];
  
  return categories.reduce((acc, category) => {
    const items = costs.filter(c => c.category === category);
    acc[category] = {
      items,
      total: items.reduce((sum, c) => sum + c.amount, 0),
    };
    return acc;
  }, {} as Record<CostItem['category'], { items: CostItem[]; total: number }>);
}

/**
 * Calculate total cash needed to close
 */
export function calculateCashToClose(
  price: number,
  loanAmount: number,
  options: PurchaseCostOptions
): {
  downPayment: number;
  closingCosts: number;
  reserves: number;
  totalCashNeeded: number;
} {
  const costs = calculateTotalPurchaseCosts(price, { ...options, loanAmount });
  const downPayment = price - loanAmount;
  
  // Recommend 3 months reserves for emergencies
  const monthlyReserves = calculateMonthlyCosts(options.sizeSqm || 80, options.city);
  const reserves = monthlyReserves.total * 3;
  
  return {
    downPayment,
    closingCosts: costs.totalMin,
    reserves,
    totalCashNeeded: downPayment + costs.totalMin + reserves,
  };
}
