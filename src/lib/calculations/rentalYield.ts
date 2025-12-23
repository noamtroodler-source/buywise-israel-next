/**
 * Rental Yield and Investment Return Calculation Utilities
 * For Israeli real estate investment analysis
 */

export interface YieldResult {
  grossYield: number;
  netYield: number;
  annualNetIncome: number;
  monthlyNetIncome: number;
}

export interface ExpenseBreakdown {
  arnona: number;
  vaadBayit: number;
  insurance: number;
  maintenance: number;
  vacancy: number;
  managementFee?: number;
  total: number;
}

export interface ROIProjection {
  year: number;
  propertyValue: number;
  annualRent: number;
  annualExpenses: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
  totalReturn: number;
  roi: number;
}

export interface RentalTaxResult {
  method: 'exemption' | 'flat_10' | 'progressive';
  taxableIncome: number;
  taxAmount: number;
  annualTax: number; // Alias for taxAmount
  effectiveRate: number;
  netIncome: number;
}

// 2024 rental income tax thresholds
const TAX_THRESHOLDS = {
  exemptionLimit: 5471, // Monthly rental income tax exemption
  flatRateThreshold: 5471, // Above this, 10% flat or progressive
  progressiveRates: [
    { min: 0, max: 84120, rate: 0.10 },
    { min: 84120, max: 120720, rate: 0.14 },
    { min: 120720, max: 193800, rate: 0.20 },
    { min: 193800, max: 269280, rate: 0.31 },
    { min: 269280, max: 560280, rate: 0.35 },
    { min: 560280, max: 721560, rate: 0.47 },
    { min: 721560, max: null, rate: 0.50 },
  ],
};

// City-specific vacancy rates (approximate)
const VACANCY_RATES: Record<string, number> = {
  'tel-aviv': 0.03,     // 3% - high demand
  'jerusalem': 0.04,
  'herzliya': 0.04,
  'raanana': 0.04,
  'haifa': 0.06,        // 6% - moderate demand
  'netanya': 0.05,
  'modiin': 0.04,
  'beer-sheva': 0.08,   // 8% - student-dependent
  'default': 0.05,      // 5% average
};

/**
 * Calculate gross yield (annual rent / property price)
 */
export function calculateGrossYield(
  propertyPrice: number,
  monthlyRent: number
): number {
  if (propertyPrice <= 0) return 0;
  
  const annualRent = monthlyRent * 12;
  const grossYield = (annualRent / propertyPrice) * 100;
  
  return Math.round(grossYield * 100) / 100;
}

/**
 * Estimate annual expenses for rental property
 */
export function estimateAnnualExpenses(
  monthlyRent: number,
  sizeSqm: number,
  city?: string,
  includeManagement: boolean = false
): ExpenseBreakdown {
  const citySlug = city?.toLowerCase().replace(/\s+/g, '-') || 'default';
  const vacancyRate = VACANCY_RATES[citySlug] || VACANCY_RATES.default;
  
  // Arnona (property tax) - varies by city, roughly 1000-3000/year per 80sqm
  const arnona = Math.round(sizeSqm * 20); // ~₪20/sqm/year average
  
  // Vaad Bayit (building maintenance) - 200-500/month
  const vaadBayit = 350 * 12;
  
  // Home insurance - 100-200/month
  const insurance = 150 * 12;
  
  // Maintenance reserve - typically 5-10% of rent
  const maintenance = Math.round(monthlyRent * 12 * 0.05);
  
  // Vacancy cost
  const vacancy = Math.round(monthlyRent * 12 * vacancyRate);
  
  // Property management (if applicable) - 8-10% of rent
  const managementFee = includeManagement ? Math.round(monthlyRent * 12 * 0.08) : 0;
  
  const total = arnona + vaadBayit + insurance + maintenance + vacancy + managementFee;
  
  return {
    arnona,
    vaadBayit,
    insurance,
    maintenance,
    vacancy,
    managementFee: includeManagement ? managementFee : undefined,
    total,
  };
}

/**
 * Calculate net yield (after expenses)
 */
export function calculateNetYield(
  propertyPrice: number,
  monthlyRent: number,
  annualExpenses?: number,
  sizeSqm?: number,
  city?: string
): YieldResult {
  if (propertyPrice <= 0) return { grossYield: 0, netYield: 0, annualNetIncome: 0, monthlyNetIncome: 0 };
  
  const annualRent = monthlyRent * 12;
  const grossYield = (annualRent / propertyPrice) * 100;
  
  // If expenses not provided, estimate them
  const expenses = annualExpenses ?? 
    estimateAnnualExpenses(monthlyRent, sizeSqm || 80, city).total;
  
  const annualNetIncome = annualRent - expenses;
  const netYield = (annualNetIncome / propertyPrice) * 100;
  
  return {
    grossYield: Math.round(grossYield * 100) / 100,
    netYield: Math.round(netYield * 100) / 100,
    annualNetIncome: Math.round(annualNetIncome),
    monthlyNetIncome: Math.round(annualNetIncome / 12),
  };
}

/**
 * Calculate cash-on-cash return (ROI on actual cash invested)
 */
export function calculateCashOnCash(
  downPayment: number,
  closingCosts: number,
  annualNetCashFlow: number
): number {
  const totalCashInvested = downPayment + closingCosts;
  if (totalCashInvested <= 0) return 0;
  
  const cashOnCash = (annualNetCashFlow / totalCashInvested) * 100;
  return Math.round(cashOnCash * 100) / 100;
}

/**
 * Project ROI over multiple years
 */
export function projectROI(
  purchasePrice: number,
  monthlyRent: number,
  appreciationRate: number,
  years: number,
  annualExpenses?: number,
  downPayment?: number
): ROIProjection[] {
  const projections: ROIProjection[] = [];
  const initialInvestment = downPayment || purchasePrice;
  let cumulativeCashFlow = 0;
  
  const baseExpenses = annualExpenses ?? 
    estimateAnnualExpenses(monthlyRent, 80).total;
  
  for (let year = 1; year <= years; year++) {
    const propertyValue = purchasePrice * Math.pow(1 + appreciationRate / 100, year);
    const annualRent = monthlyRent * 12 * Math.pow(1.03, year - 1); // 3% annual rent increase
    const expenses = baseExpenses * Math.pow(1.02, year - 1); // 2% expense increase
    const netCashFlow = annualRent - expenses;
    cumulativeCashFlow += netCashFlow;
    
    const appreciation = propertyValue - purchasePrice;
    const totalReturn = cumulativeCashFlow + appreciation;
    const roi = (totalReturn / initialInvestment) * 100;
    
    projections.push({
      year,
      propertyValue: Math.round(propertyValue),
      annualRent: Math.round(annualRent),
      annualExpenses: Math.round(expenses),
      netCashFlow: Math.round(netCashFlow),
      cumulativeCashFlow: Math.round(cumulativeCashFlow),
      totalReturn: Math.round(totalReturn),
      roi: Math.round(roi * 10) / 10,
    });
  }
  
  return projections;
}

/**
 * Calculate rental income tax using different methods
 */
export function calculateRentalIncomeTax(
  monthlyRent: number,
  method: 'exemption' | 'flat_10' | 'progressive',
  estimatedDeductions?: number,
  totalDeductions?: number
): RentalTaxResult {
  const annualRent = monthlyRent * 12;
  const deductions = totalDeductions || estimatedDeductions || 0;
  
  // Method 1: Exemption (up to ₪5,471/month tax-free)
  if (method === 'exemption') {
    if (monthlyRent <= TAX_THRESHOLDS.exemptionLimit) {
      return {
        method: 'exemption',
        taxableIncome: 0,
        taxAmount: 0,
        annualTax: 0,
        effectiveRate: 0,
        netIncome: annualRent,
      };
    }
    // Graduated reduction above exemption
    const excess = monthlyRent - TAX_THRESHOLDS.exemptionLimit;
    const reducedExemption = Math.max(0, TAX_THRESHOLDS.exemptionLimit - excess);
    const taxableAnnual = (monthlyRent - reducedExemption) * 12;
    const taxAmount = taxableAnnual * 0.31; // Marginal rate on excess
    
    return {
      method: 'exemption',
      taxableIncome: Math.round(taxableAnnual),
      taxAmount: Math.round(taxAmount),
      annualTax: Math.round(taxAmount),
      effectiveRate: Math.round((taxAmount / annualRent) * 100 * 10) / 10,
      netIncome: Math.round(annualRent - taxAmount),
    };
  }
  
  // Method 2: 10% flat tax on gross (no deductions)
  if (method === 'flat_10') {
    const taxAmount = annualRent * 0.10;
    return {
      method: 'flat_10',
      taxableIncome: annualRent,
      taxAmount: Math.round(taxAmount),
      annualTax: Math.round(taxAmount),
      effectiveRate: 10,
      netIncome: Math.round(annualRent - taxAmount),
    };
  }
  
  // Method 3: Progressive tax with deductions
  const taxableIncome = Math.max(0, annualRent - deductions);
  
  let taxAmount = 0;
  let remainingIncome = taxableIncome;
  
  for (const bracket of TAX_THRESHOLDS.progressiveRates) {
    if (remainingIncome <= 0) break;
    
    const bracketMax = bracket.max ?? Infinity;
    const bracketSize = bracketMax - bracket.min;
    const taxableInBracket = Math.min(remainingIncome, bracketSize);
    
    taxAmount += taxableInBracket * bracket.rate;
    remainingIncome -= taxableInBracket;
  }
  
  return {
    method: 'progressive',
    taxableIncome: Math.round(taxableIncome),
    taxAmount: Math.round(taxAmount),
    annualTax: Math.round(taxAmount),
    effectiveRate: annualRent > 0 ? Math.round((taxAmount / annualRent) * 100 * 10) / 10 : 0,
    netIncome: Math.round(annualRent - taxAmount),
  };
}

/**
 * Find optimal tax method for rental income
 */
export function findOptimalTaxMethod(
  monthlyRent: number,
  estimatedExpenses?: number
): {
  recommended: 'exemption' | 'flat_10' | 'progressive';
  comparison: Record<'exemption' | 'flat_10' | 'progressive', RentalTaxResult>;
  savings: number;
} {
  const methods: Array<'exemption' | 'flat_10' | 'progressive'> = ['exemption', 'flat_10', 'progressive'];
  
  const comparison = methods.reduce((acc, method) => {
    acc[method] = calculateRentalIncomeTax(monthlyRent, method, estimatedExpenses);
    return acc;
  }, {} as Record<'exemption' | 'flat_10' | 'progressive', RentalTaxResult>);
  
  // Find method with lowest tax
  const recommended = methods.reduce((best, method) => 
    comparison[method].taxAmount < comparison[best].taxAmount ? method : best
  );
  
  // Calculate savings vs worst method
  const worstMethod = methods.reduce((worst, method) =>
    comparison[method].taxAmount > comparison[worst].taxAmount ? method : worst
  );
  
  const savings = comparison[worstMethod].taxAmount - comparison[recommended].taxAmount;
  
  return {
    recommended,
    comparison,
    savings: Math.round(savings),
  };
}

/**
 * Compare property yield to city average
 */
export function compareToMarketYield(
  propertyPrice: number,
  monthlyRent: number,
  cityAverageYield: number
): {
  propertyYield: number;
  cityAverage: number;
  difference: number;
  isAboveAverage: boolean;
} {
  const propertyYield = calculateGrossYield(propertyPrice, monthlyRent);
  const difference = propertyYield - cityAverageYield;
  
  return {
    propertyYield,
    cityAverage: cityAverageYield,
    difference: Math.round(difference * 100) / 100,
    isAboveAverage: difference > 0,
  };
}

/**
 * Get vacancy rate for a city
 */
export function getVacancyRate(city: string): number {
  const citySlug = city.toLowerCase().replace(/\s+/g, '-');
  return VACANCY_RATES[citySlug] || VACANCY_RATES.default;
}

/**
 * Calculate break-even occupancy rate
 */
export function calculateBreakEvenOccupancy(
  monthlyMortgage: number,
  monthlyExpenses: number,
  monthlyRent: number
): number {
  if (monthlyRent <= 0) return 100;
  
  const totalMonthlyNeeded = monthlyMortgage + monthlyExpenses;
  const breakEvenRate = (totalMonthlyNeeded / monthlyRent) * 100;
  
  return Math.min(100, Math.round(breakEvenRate * 10) / 10);
}

/**
 * Compare all rental tax methods
 */
export function compareRentalTaxMethods(
  monthlyRent: number,
  marginalRate?: number,
  totalDeductions?: number
): {
  exemption: RentalTaxResult;
  flat_10: RentalTaxResult;
  progressive: RentalTaxResult;
  recommended: 'exemption' | 'flat_10' | 'progressive';
  savings: number;
} {
  const exemption = calculateRentalIncomeTax(monthlyRent, 'exemption', marginalRate, totalDeductions);
  const flat_10 = calculateRentalIncomeTax(monthlyRent, 'flat_10', marginalRate, totalDeductions);
  const progressive = calculateRentalIncomeTax(monthlyRent, 'progressive', marginalRate, totalDeductions);

  const methods = [
    { key: 'exemption' as const, result: exemption },
    { key: 'flat_10' as const, result: flat_10 },
    { key: 'progressive' as const, result: progressive },
  ];

  const best = methods.reduce((min, curr) => 
    curr.result.taxAmount < min.result.taxAmount ? curr : min
  );

  const worst = methods.reduce((max, curr) => 
    curr.result.taxAmount > max.result.taxAmount ? curr : max
  );

  return {
    exemption,
    flat_10,
    progressive,
    recommended: best.key,
    savings: worst.result.taxAmount - best.result.taxAmount,
  };
}

/**
 * Project ROI over multiple years with detailed expenses
 */
export function projectMultiYearROI(options: {
  purchasePrice: number;
  monthlyRent: number;
  appreciationRate: number;
  years: number;
  expenses: {
    arnona: number;
    vaadBayit: number;
    insurance: number;
    maintenance: number;
    vacancy: number;
    tax: number;
  };
  mortgagePayment?: number;
  downPayment?: number;
}): ROIProjection[] {
  const {
    purchasePrice,
    monthlyRent,
    appreciationRate,
    years,
    expenses,
    mortgagePayment = 0,
    downPayment = purchasePrice,
  } = options;

  const projections: ROIProjection[] = [];
  let cumulativeCashFlow = 0;
  const totalAnnualExpenses = 
    expenses.arnona + expenses.vaadBayit + expenses.insurance + 
    expenses.maintenance + expenses.vacancy + expenses.tax;

  for (let year = 1; year <= years; year++) {
    const propertyValue = purchasePrice * Math.pow(1 + appreciationRate, year);
    const annualRent = monthlyRent * 12 * Math.pow(1.03, year - 1);
    const yearExpenses = totalAnnualExpenses * Math.pow(1.02, year - 1);
    const netCashFlow = annualRent - yearExpenses - mortgagePayment;
    cumulativeCashFlow += netCashFlow;

    const appreciation = propertyValue - purchasePrice;
    const totalReturn = cumulativeCashFlow + appreciation;
    const roi = (totalReturn / downPayment) * 100;

    projections.push({
      year,
      propertyValue: Math.round(propertyValue),
      annualRent: Math.round(annualRent),
      annualExpenses: Math.round(yearExpenses),
      netCashFlow: Math.round(netCashFlow),
      cumulativeCashFlow: Math.round(cumulativeCashFlow),
      totalReturn: Math.round(totalReturn),
      roi: Math.round(roi * 10) / 10,
    });
  }

  return projections;
}
