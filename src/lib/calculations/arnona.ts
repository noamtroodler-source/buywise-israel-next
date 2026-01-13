/**
 * Arnona (Municipal Property Tax) Calculation Helpers
 * 
 * Israel offers nationally mandated arnona discounts for qualifying residents.
 * Users typically claim the HIGHEST applicable single discount (no stacking).
 */

export type ArnonaDiscountCategory = 
  | 'new_immigrant_year1'
  | 'new_immigrant_year2' 
  | 'senior_70'
  | 'disabled_90'
  | 'disabled_75'
  | 'holocaust_survivor'
  | 'low_income'
  | 'single_parent'
  | 'idf_active';

export interface ArnonaDiscount {
  key: ArnonaDiscountCategory;
  label: string;
  maxPercent: number;
  areaLimitSqm: number | null;
  description: string;
}

export const ARNONA_DISCOUNTS: Record<ArnonaDiscountCategory, ArnonaDiscount> = {
  new_immigrant_year1: {
    key: 'new_immigrant_year1',
    label: 'New Immigrant (Year 1)',
    maxPercent: 90,
    areaLimitSqm: 100,
    description: 'Up to 90% discount on first 100m²',
  },
  new_immigrant_year2: {
    key: 'new_immigrant_year2',
    label: 'New Immigrant (Year 2)',
    maxPercent: 66,
    areaLimitSqm: 100,
    description: '66% discount on first 100m² in second year',
  },
  senior_70: {
    key: 'senior_70',
    label: 'Senior (70+)',
    maxPercent: 30,
    areaLimitSqm: 100,
    description: 'Up to 30% discount on first 100m²',
  },
  disabled_90: {
    key: 'disabled_90',
    label: '90%+ Disability',
    maxPercent: 80,
    areaLimitSqm: null,
    description: 'Up to 80% discount for 90%+ disability rating',
  },
  disabled_75: {
    key: 'disabled_75',
    label: '75-89% Disability',
    maxPercent: 40,
    areaLimitSqm: null,
    description: 'Up to 40% discount for 75-89% disability rating',
  },
  holocaust_survivor: {
    key: 'holocaust_survivor',
    label: 'Holocaust Survivor',
    maxPercent: 66,
    areaLimitSqm: 70,
    description: 'Up to 66% discount on first 70m²',
  },
  low_income: {
    key: 'low_income',
    label: 'Low Income',
    maxPercent: 90,
    areaLimitSqm: null,
    description: '20-90% discount based on income level',
  },
  single_parent: {
    key: 'single_parent',
    label: 'Single Parent',
    maxPercent: 20,
    areaLimitSqm: null,
    description: 'Up to 20% discount for single parents',
  },
  idf_active: {
    key: 'idf_active',
    label: 'Active IDF Soldier',
    maxPercent: 100,
    areaLimitSqm: null,
    description: '100% exemption for active IDF soldiers',
  },
};

// User-selectable discounts (exclude auto-detected oleh discounts)
export const SELECTABLE_ARNONA_DISCOUNTS: ArnonaDiscountCategory[] = [
  'senior_70',
  'disabled_90', 
  'disabled_75',
  'holocaust_survivor',
  'low_income',
  'single_parent',
  'idf_active',
];

export interface ArnonaEstimate {
  baseMonthly: number;
  discountedMonthly: number;
  discountPercent: number;
  discountType: string | null;
  discountKey: ArnonaDiscountCategory | null;
  areaLimitApplied: boolean;
  areaLimitSqm: number | null;
  // Oleh status tracking
  olehStatusChecked: boolean;
  olehYearsSinceAliyah: number | null;
  isAutoDetectedDiscount: boolean;
}

interface BuyerArnonaProfile {
  residency_status?: 'israeli_resident' | 'oleh_hadash' | 'non_resident';
  aliyah_year?: number | null;
  arnona_discount_categories?: string[];
}

/**
 * Auto-detect Oleh Year 1 or Year 2 discount from profile
 */
function getOlehArnonaDiscount(profile: BuyerArnonaProfile): ArnonaDiscountCategory | null {
  if (profile.residency_status !== 'oleh_hadash' || !profile.aliyah_year) {
    return null;
  }
  
  const currentYear = new Date().getFullYear();
  const yearsSinceAliyah = currentYear - profile.aliyah_year;
  
  if (yearsSinceAliyah === 0) {
    return 'new_immigrant_year1';
  } else if (yearsSinceAliyah === 1) {
    return 'new_immigrant_year2';
  }
  
  return null;
}

/**
 * Find the best (highest value) discount for the user
 */
function findBestDiscount(
  discountCategories: ArnonaDiscountCategory[],
  apartmentSizeSqm: number,
  annualRateSqm: number
): { discount: ArnonaDiscount; effectiveSavings: number } | null {
  if (discountCategories.length === 0) return null;
  
  let bestDiscount: ArnonaDiscount | null = null;
  let bestSavings = 0;
  
  for (const category of discountCategories) {
    const discount = ARNONA_DISCOUNTS[category];
    if (!discount) continue;
    
    // Calculate effective savings considering area limits
    const discountableArea = discount.areaLimitSqm 
      ? Math.min(apartmentSizeSqm, discount.areaLimitSqm)
      : apartmentSizeSqm;
    
    const savings = (discountableArea * annualRateSqm * discount.maxPercent) / 100;
    
    if (savings > bestSavings) {
      bestSavings = savings;
      bestDiscount = discount;
    }
  }
  
  return bestDiscount ? { discount: bestDiscount, effectiveSavings: bestSavings } : null;
}

/**
 * Calculate arnona with applicable discount
 * 
 * @param annualRateSqm - City's arnona rate in ₪/sqm/year
 * @param apartmentSizeSqm - Property size in square meters
 * @param profile - Buyer profile with arnona discount info
 */
export function calculateArnonaWithDiscount(
  annualRateSqm: number,
  apartmentSizeSqm: number,
  profile: BuyerArnonaProfile | null
): ArnonaEstimate {
  const baseAnnual = annualRateSqm * apartmentSizeSqm;
  const baseMonthly = Math.round(baseAnnual / 12);
  
  // No profile = no discount
  if (!profile) {
    return {
      baseMonthly,
      discountedMonthly: baseMonthly,
      discountPercent: 0,
      discountType: null,
      discountKey: null,
      areaLimitApplied: false,
      areaLimitSqm: null,
      olehStatusChecked: false,
      olehYearsSinceAliyah: null,
      isAutoDetectedDiscount: false,
    };
  }
  
  // Calculate Oleh status for tracking
  const isOleh = profile.residency_status === 'oleh_hadash';
  const yearsSinceAliyah = isOleh && profile.aliyah_year 
    ? new Date().getFullYear() - profile.aliyah_year 
    : null;
  
  // Collect all applicable discount categories
  const allCategories: ArnonaDiscountCategory[] = [];
  
  // Auto-detect Oleh discount
  const olehDiscount = getOlehArnonaDiscount(profile);
  if (olehDiscount) {
    allCategories.push(olehDiscount);
  }
  
  // Add user-selected discounts
  if (profile.arnona_discount_categories) {
    for (const cat of profile.arnona_discount_categories) {
      if (Object.keys(ARNONA_DISCOUNTS).includes(cat) && !allCategories.includes(cat as ArnonaDiscountCategory)) {
        allCategories.push(cat as ArnonaDiscountCategory);
      }
    }
  }
  
  // Find best discount
  const best = findBestDiscount(allCategories, apartmentSizeSqm, annualRateSqm);
  
  if (!best) {
    return {
      baseMonthly,
      discountedMonthly: baseMonthly,
      discountPercent: 0,
      discountType: null,
      discountKey: null,
      areaLimitApplied: false,
      areaLimitSqm: null,
      olehStatusChecked: isOleh,
      olehYearsSinceAliyah: yearsSinceAliyah,
      isAutoDetectedDiscount: false,
    };
  }
  
  const { discount } = best;
  const isAutoDetected = discount.key === 'new_immigrant_year1' || discount.key === 'new_immigrant_year2';
  
  // Calculate discounted amount with area limit
  const areaLimitApplied = discount.areaLimitSqm !== null && apartmentSizeSqm > discount.areaLimitSqm;
  const discountableArea = discount.areaLimitSqm 
    ? Math.min(apartmentSizeSqm, discount.areaLimitSqm)
    : apartmentSizeSqm;
  const fullRateArea = apartmentSizeSqm - discountableArea;
  
  const discountedAnnual = 
    (discountableArea * annualRateSqm * (1 - discount.maxPercent / 100)) +
    (fullRateArea * annualRateSqm);
  
  const discountedMonthly = Math.round(discountedAnnual / 12);
  
  // Calculate effective discount percentage
  const effectiveDiscountPercent = baseAnnual > 0 
    ? Math.round(((baseAnnual - discountedAnnual) / baseAnnual) * 100)
    : 0;
  
  return {
    baseMonthly,
    discountedMonthly,
    discountPercent: effectiveDiscountPercent,
    discountType: discount.label,
    discountKey: discount.key,
    areaLimitApplied,
    areaLimitSqm: discount.areaLimitSqm,
    olehStatusChecked: isOleh,
    olehYearsSinceAliyah: yearsSinceAliyah,
    isAutoDetectedDiscount: isAutoDetected,
  };
}

/**
 * Get label for discount category
 */
export function getArnonaDiscountLabel(category: ArnonaDiscountCategory): string {
  return ARNONA_DISCOUNTS[category]?.label ?? category;
}
