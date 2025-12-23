/**
 * Capital Gains Tax (Mas Shevach) Calculation Utilities
 * For Israeli real estate sales
 */

export interface CapitalGainsResult {
  grossGain: number;
  inflationAdjustment: number;
  adjustedGain: number;
  exemptionApplied: number;
  taxableGain: number;
  taxAmount: number;
  effectiveRate: number;
  netProceeds: number;
}

export type SellerCategory = 
  | 'primary_residence'    // Primary residence exemption
  | 'single_property'      // Only property owned
  | 'upgrader'             // Selling to buy another residence
  | 'investor'             // Investment property
  | 'inherited'            // Inherited property
  | 'foreign';             // Foreign resident seller

// 2024 Exemption thresholds
const EXEMPTIONS = {
  primaryResidence: {
    maxExemption: 4522000,  // Up to ₪4.522M exempt
    holdingPeriodMonths: 18, // Must be primary residence for 18 months
  },
  upgrader: {
    combinedThreshold: 2252000, // Combined value threshold
  },
  singleProperty: {
    fullExemption: true, // Full exemption if only property
  },
};

// Capital gains tax rate
const CAPITAL_GAINS_RATE = 0.25; // 25% on real gain

// Historical CPI adjustments (approximate annual rates)
const CPI_RATES: Record<number, number> = {
  2015: 0.006,
  2016: -0.002,
  2017: 0.004,
  2018: 0.008,
  2019: 0.003,
  2020: -0.007,
  2021: 0.028,
  2022: 0.052,
  2023: 0.032,
  2024: 0.025,
};

/**
 * Calculate CPI (inflation) adjustment
 */
export function calculateInflationAdjustment(
  purchasePrice: number,
  purchaseYear: number,
  saleYear: number = new Date().getFullYear()
): number {
  let cumulativeInflation = 1;
  
  for (let year = purchaseYear; year < saleYear; year++) {
    const rate = CPI_RATES[year] || 0.025; // Default 2.5% if not available
    cumulativeInflation *= (1 + rate);
  }
  
  const adjustedPurchasePrice = purchasePrice * cumulativeInflation;
  return Math.round(adjustedPurchasePrice - purchasePrice);
}

/**
 * Check if primary residence exemption applies
 */
export function isPrimaryResidenceExempt(
  ownedMonths: number,
  otherPropertiesOwned: number
): boolean {
  // Must be primary residence for at least 18 months
  // Must be the only residential property (or upgrading)
  return ownedMonths >= EXEMPTIONS.primaryResidence.holdingPeriodMonths && 
         otherPropertiesOwned === 0;
}

/**
 * Calculate primary residence exemption amount
 */
export function calculatePrimaryResidenceExemption(
  salePrice: number,
  gain: number
): number {
  if (salePrice <= EXEMPTIONS.primaryResidence.maxExemption) {
    return gain; // Full exemption
  }
  
  // Linear reduction for higher values
  const excessRatio = (salePrice - EXEMPTIONS.primaryResidence.maxExemption) / salePrice;
  const taxableGain = gain * excessRatio;
  
  return Math.round(gain - taxableGain);
}

/**
 * Calculate upgrader exemption
 */
export function calculateUpgraderExemption(
  oldPropertySalePrice: number,
  newPropertyPurchasePrice: number,
  gain: number
): {
  eligible: boolean;
  exemptionAmount: number;
  reason?: string;
} {
  // Must purchase new property within 12 months before or 24 months after sale
  // Combined value threshold applies
  
  if (oldPropertySalePrice + newPropertyPurchasePrice > EXEMPTIONS.upgrader.combinedThreshold) {
    // Partial exemption only
    const ratio = EXEMPTIONS.upgrader.combinedThreshold / (oldPropertySalePrice + newPropertyPurchasePrice);
    return {
      eligible: true,
      exemptionAmount: Math.round(gain * ratio),
      reason: 'Partial exemption - combined value exceeds threshold',
    };
  }
  
  return {
    eligible: true,
    exemptionAmount: gain,
    reason: 'Full exemption - within combined threshold',
  };
}

/**
 * Calculate Mas Shevach (capital gains tax)
 */
export function calculateMasShevach(
  purchasePrice: number,
  salePrice: number,
  purchaseYear: number,
  sellerCategory: SellerCategory,
  options?: {
    ownedMonths?: number;
    otherProperties?: number;
    improvementCosts?: number;
    sellingCosts?: number;
  }
): CapitalGainsResult {
  const saleYear = new Date().getFullYear();
  
  // Calculate gross gain
  const grossGain = salePrice - purchasePrice;
  
  // No tax if loss
  if (grossGain <= 0) {
    return {
      grossGain,
      inflationAdjustment: 0,
      adjustedGain: grossGain,
      exemptionApplied: 0,
      taxableGain: 0,
      taxAmount: 0,
      effectiveRate: 0,
      netProceeds: salePrice,
    };
  }
  
  // Calculate inflation adjustment
  const inflationAdjustment = calculateInflationAdjustment(purchasePrice, purchaseYear, saleYear);
  
  // Deduct improvement and selling costs
  const deductions = (options?.improvementCosts || 0) + (options?.sellingCosts || 0);
  
  // Calculate adjusted (real) gain
  const adjustedGain = Math.max(0, grossGain - inflationAdjustment - deductions);
  
  // Apply exemptions based on seller category
  let exemptionApplied = 0;
  
  switch (sellerCategory) {
    case 'primary_residence':
      if (isPrimaryResidenceExempt(options?.ownedMonths || 24, options?.otherProperties || 0)) {
        exemptionApplied = calculatePrimaryResidenceExemption(salePrice, adjustedGain);
      }
      break;
      
    case 'single_property':
      // Full exemption if only property
      exemptionApplied = adjustedGain;
      break;
      
    case 'upgrader':
      // Partial exemption based on threshold
      exemptionApplied = Math.min(
        adjustedGain,
        adjustedGain * (EXEMPTIONS.upgrader.combinedThreshold / salePrice)
      );
      break;
      
    case 'inherited':
      // Special rules for inherited properties
      // Typically step-up in basis applies
      exemptionApplied = 0;
      break;
      
    case 'investor':
    case 'foreign':
      // No exemption
      exemptionApplied = 0;
      break;
  }
  
  // Calculate taxable gain
  const taxableGain = Math.max(0, adjustedGain - exemptionApplied);
  
  // Calculate tax (25% on real gain)
  const taxAmount = Math.round(taxableGain * CAPITAL_GAINS_RATE);
  
  // Calculate effective rate on gross gain
  const effectiveRate = grossGain > 0 ? (taxAmount / grossGain) * 100 : 0;
  
  // Calculate net proceeds
  const sellingCosts = options?.sellingCosts || Math.round(salePrice * 0.02); // 2% default
  const netProceeds = salePrice - taxAmount - sellingCosts;
  
  return {
    grossGain: Math.round(grossGain),
    inflationAdjustment: Math.round(inflationAdjustment),
    adjustedGain: Math.round(adjustedGain),
    exemptionApplied: Math.round(exemptionApplied),
    taxableGain: Math.round(taxableGain),
    taxAmount,
    effectiveRate: Math.round(effectiveRate * 100) / 100,
    netProceeds: Math.round(netProceeds),
  };
}

/**
 * Estimate net proceeds from sale
 */
export function estimateNetProceeds(
  purchasePrice: number,
  salePrice: number,
  holdingYears: number,
  sellerCategory: SellerCategory,
  mortgageBalance: number = 0
): {
  grossProceeds: number;
  capitalGainsTax: number;
  sellingCosts: number;
  mortgagePayoff: number;
  netProceeds: number;
} {
  const purchaseYear = new Date().getFullYear() - holdingYears;
  const taxResult = calculateMasShevach(purchasePrice, salePrice, purchaseYear, sellerCategory, {
    ownedMonths: holdingYears * 12,
    otherProperties: sellerCategory === 'investor' ? 1 : 0,
  });
  
  // Typical selling costs: agent (2%), lawyer (0.5%), other (0.5%)
  const sellingCosts = Math.round(salePrice * 0.03);
  
  return {
    grossProceeds: salePrice,
    capitalGainsTax: taxResult.taxAmount,
    sellingCosts,
    mortgagePayoff: mortgageBalance,
    netProceeds: salePrice - taxResult.taxAmount - sellingCosts - mortgageBalance,
  };
}

/**
 * Compare tax across seller categories
 */
export function compareTaxBySellerCategory(
  purchasePrice: number,
  salePrice: number,
  purchaseYear: number
): Record<SellerCategory, { tax: number; effectiveRate: number }> {
  const categories: SellerCategory[] = [
    'primary_residence', 'single_property', 'upgrader', 
    'investor', 'inherited', 'foreign'
  ];
  
  return categories.reduce((acc, category) => {
    const result = calculateMasShevach(purchasePrice, salePrice, purchaseYear, category);
    acc[category] = {
      tax: result.taxAmount,
      effectiveRate: result.effectiveRate,
    };
    return acc;
  }, {} as Record<SellerCategory, { tax: number; effectiveRate: number }>);
}

/**
 * Calculate holding period benefits
 */
export function calculateHoldingBenefits(
  purchasePrice: number,
  currentValue: number,
  purchaseYear: number
): {
  holdingYears: number;
  inflationAdjustment: number;
  adjustedBasis: number;
  potentialTax: number;
  taxSavingsFromInflation: number;
} {
  const currentYear = new Date().getFullYear();
  const holdingYears = currentYear - purchaseYear;
  
  const inflationAdjustment = calculateInflationAdjustment(purchasePrice, purchaseYear);
  const adjustedBasis = purchasePrice + inflationAdjustment;
  
  // Tax on nominal gain
  const nominalGain = currentValue - purchasePrice;
  const nominalTax = Math.max(0, nominalGain * CAPITAL_GAINS_RATE);
  
  // Tax on real gain
  const realGain = currentValue - adjustedBasis;
  const realTax = Math.max(0, realGain * CAPITAL_GAINS_RATE);
  
  return {
    holdingYears,
    inflationAdjustment: Math.round(inflationAdjustment),
    adjustedBasis: Math.round(adjustedBasis),
    potentialTax: Math.round(realTax),
    taxSavingsFromInflation: Math.round(nominalTax - realTax),
  };
}

/**
 * Get seller category label
 */
export function getSellerCategoryLabel(category: SellerCategory): string {
  const labels: Record<SellerCategory, string> = {
    primary_residence: 'Primary Residence',
    single_property: 'Single Property Owner',
    upgrader: 'Upgrader',
    investor: 'Investment Property',
    inherited: 'Inherited Property',
    foreign: 'Foreign Resident',
  };
  
  return labels[category];
}
