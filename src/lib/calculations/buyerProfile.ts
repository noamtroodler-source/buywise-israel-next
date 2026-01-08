/**
 * Multi-Dimensional Buyer Profile System
 * Handles complex combinations of buyer characteristics for Israeli tax calculations
 */

import { BuyerType, calculateOlehEligibility } from './purchaseTax';

export interface BuyerProfileDimensions {
  residency_status: 'israeli_resident' | 'oleh_hadash' | 'non_resident';
  is_first_property: boolean;
  buyer_entity: 'individual' | 'company';
  aliyah_year?: number | null;
  is_upgrading?: boolean;
  has_existing_property?: boolean;
}

export interface DerivedBuyerType {
  taxType: BuyerType;
  label: string;
  shortLabel: string;
  description: string;
  benefits: string[];
  warnings?: string[];
}

// LTV Limits by effective buyer type
export const LTV_LIMITS: Record<BuyerType, { maxLtv: number; label: string }> = {
  first_time: { maxLtv: 75, label: 'Up to 75% LTV' },
  oleh: { maxLtv: 75, label: 'Up to 75% LTV' },
  upgrader: { maxLtv: 70, label: 'Up to 70% LTV' },
  investor: { maxLtv: 50, label: 'Up to 50% LTV' },
  foreign: { maxLtv: 50, label: 'Up to 50% LTV' },
  company: { maxLtv: 50, label: 'Up to 50% LTV' },
};

/**
 * Derive the effective buyer type from multi-dimensional profile
 * Priority: Company > Non-Resident > Oleh > First-Time > Upgrader > Investor
 */
export function deriveEffectiveBuyerType(profile: BuyerProfileDimensions): DerivedBuyerType {
  const { residency_status, is_first_property, buyer_entity, aliyah_year, is_upgrading } = profile;

  // 1. Company buyer - always highest tax rate regardless of other factors
  if (buyer_entity === 'company') {
    return {
      taxType: 'company',
      label: 'Corporate Buyer',
      shortLabel: 'Company',
      description: 'Purchasing as a company or corporate entity',
      benefits: [],
      warnings: ['Corporate buyers pay 8-10% on all purchases'],
    };
  }

  // 2. Non-resident - always foreign rates regardless of first/additional
  if (residency_status === 'non_resident') {
    const baseResult: DerivedBuyerType = {
      taxType: 'foreign',
      label: is_first_property ? 'Non-Resident (First Property)' : 'Non-Resident (Additional Property)',
      shortLabel: 'Non-Resident',
      description: 'Not an Israeli tax resident',
      benefits: [],
      warnings: ['Non-residents pay 8-10% regardless of property count'],
    };
    return baseResult;
  }

  // 3. Oleh Hadash - special rates if within 7-year window
  if (residency_status === 'oleh_hadash') {
    const isEligible = calculateOlehEligibility(aliyah_year ?? undefined);
    
    if (isEligible && aliyah_year) {
      const currentYear = new Date().getFullYear();
      const yearsRemaining = Math.max(0, aliyah_year + 7 - currentYear);
      
      return {
        taxType: 'oleh',
        label: is_first_property ? 'Oleh Hadash (First Property)' : 'Oleh Hadash (Additional Property)',
        shortLabel: 'Oleh Hadash',
        description: `New immigrant with ${yearsRemaining} year${yearsRemaining !== 1 ? 's' : ''} of benefits remaining`,
        benefits: [
          'Special 0.5% rate up to ₪6M',
          `${yearsRemaining} year${yearsRemaining !== 1 ? 's' : ''} remaining on benefit window`,
          'Applies to first AND additional properties',
        ],
      };
    } else {
      // Oleh outside 7-year window - treat as regular Israeli
      // Fall through to Israeli resident logic below
    }
  }

  // 4. Israeli resident (or expired Oleh) - First property
  if (is_first_property && !is_upgrading) {
    return {
      taxType: 'first_time',
      label: 'First-Time Buyer',
      shortLabel: 'First-Time',
      description: 'Israeli resident purchasing first property',
      benefits: [
        'Zero tax on first ₪1.98M',
        'Reduced rates on higher brackets',
        'Up to 75% LTV available',
      ],
    };
  }

  // 5. Upgrader - selling existing property within 18 months
  if (is_upgrading) {
    return {
      taxType: 'upgrader',
      label: 'Upgrader',
      shortLabel: 'Upgrader',
      description: 'Selling existing property within 18 months',
      benefits: [
        'First-time buyer rates apply',
        'Must sell existing property within 18 months',
        'Zero tax on first ₪1.98M',
      ],
      warnings: ['18-month deadline applies from purchase date'],
    };
  }

  // 6. Investor - additional property without upgrader status
  return {
    taxType: 'investor',
    label: 'Investor (Additional Property)',
    shortLabel: 'Investor',
    description: 'Israeli resident purchasing additional property',
    benefits: [],
    warnings: ['8-10% tax rate on all purchases'],
  };
}

/**
 * Get combined label for display in UI (e.g., "Oleh Hadash • First Property")
 */
export function getBuyerProfileLabel(profile: BuyerProfileDimensions): string {
  const derived = deriveEffectiveBuyerType(profile);
  return derived.label;
}

/**
 * Get short label for compact display
 */
export function getBuyerProfileShortLabel(profile: BuyerProfileDimensions): string {
  const derived = deriveEffectiveBuyerType(profile);
  return derived.shortLabel;
}

/**
 * Check if the profile qualifies for any special benefits
 */
export function hasSpecialBenefits(profile: BuyerProfileDimensions): boolean {
  const derived = deriveEffectiveBuyerType(profile);
  return derived.taxType === 'first_time' || derived.taxType === 'oleh' || derived.taxType === 'upgrader';
}

/**
 * Get all dimensions as displayable items
 */
export function getProfileDimensionsSummary(profile: BuyerProfileDimensions): Array<{ label: string; value: string }> {
  const items: Array<{ label: string; value: string }> = [];
  
  // Residency
  const residencyLabels: Record<string, string> = {
    israeli_resident: 'Israeli Resident',
    oleh_hadash: 'Oleh Hadash',
    non_resident: 'Non-Resident',
  };
  items.push({ label: 'Residency', value: residencyLabels[profile.residency_status] || profile.residency_status });
  
  // Aliyah year (if applicable)
  if (profile.residency_status === 'oleh_hadash' && profile.aliyah_year) {
    items.push({ label: 'Aliyah Year', value: profile.aliyah_year.toString() });
  }
  
  // Property ownership
  if (profile.is_upgrading) {
    items.push({ label: 'Property Status', value: 'Upgrading (selling within 18 months)' });
  } else if (profile.is_first_property) {
    items.push({ label: 'Property Status', value: 'First Property' });
  } else {
    items.push({ label: 'Property Status', value: 'Additional Property' });
  }
  
  // Entity
  items.push({ 
    label: 'Buying As', 
    value: profile.buyer_entity === 'company' ? 'Company' : 'Individual' 
  });
  
  return items;
}

/**
 * Map old BuyerCategory to new dimensions for backwards compatibility
 */
export function mapLegacyBuyerCategory(category: string): Partial<BuyerProfileDimensions> {
  switch (category) {
    case 'first_time':
      return { residency_status: 'israeli_resident', is_first_property: true, buyer_entity: 'individual' };
    case 'oleh':
      return { residency_status: 'oleh_hadash', buyer_entity: 'individual' };
    case 'additional':
    case 'investor':
      return { residency_status: 'israeli_resident', is_first_property: false, buyer_entity: 'individual' };
    case 'non_resident':
    case 'foreign':
      return { residency_status: 'non_resident', buyer_entity: 'individual' };
    case 'upgrader':
      return { residency_status: 'israeli_resident', is_first_property: false, is_upgrading: true, buyer_entity: 'individual' };
    case 'company':
      return { buyer_entity: 'company' };
    default:
      return { residency_status: 'israeli_resident', is_first_property: true, buyer_entity: 'individual' };
  }
}
