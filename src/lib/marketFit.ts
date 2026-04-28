export type MarketFitState =
  | 'normal_range'
  | 'above_recorded_sales'
  | 'premium_needs_context'
  | 'feature_driven_premium'
  | 'limited_comparable_match'
  | 'agency_review_needed';

export interface MarketFitPropertyInput {
  property_type?: string | null;
  condition?: string | null;
  floor?: number | null;
  total_floors?: number | null;
  parking?: number | null;
  features?: string[] | null;
  has_balcony?: boolean | null;
  has_storage?: boolean | null;
  furnished_status?: string | null;
  furniture_items?: string[] | null;
  featured_highlight?: string | null;
  description?: string | null;
}

export interface MarketFitInput {
  avgComparison: number | null;
  compsCount: number;
  radiusUsedM: number;
  property: MarketFitPropertyInput;
}

export interface MarketFitResult {
  state: MarketFitState;
  label: string;
  contextLine: string;
  premiumDrivers: string[];
  confidence: 'low' | 'medium' | 'high';
}

export type MarketFitReviewLevel = 'none' | 'soft_prompt' | 'context_required' | 'review_required';

export interface MarketFitReviewInput {
  price?: number | null;
  size_sqm?: number | null;
  listing_status?: string | null;
  cityAveragePriceSqm?: number | null;
  premium_drivers?: string[] | null;
  premium_explanation?: string | null;
  property: MarketFitPropertyInput;
}

export interface MarketFitReviewResult {
  level: MarketFitReviewLevel;
  gapPercent: number | null;
  requiresContext: boolean;
  requiresConfirmation: boolean;
  hasPremiumContext: boolean;
  title: string;
  message: string;
  reviewReason: string | null;
}

const FEATURE_DRIVER_LABELS: Record<string, string> = {
  sea_view: 'sea view',
  panoramic_view: 'view',
  city_view: 'view',
  beachfront: 'beachfront location',
  first_line: 'first-line location',
  balcony: 'outdoor space',
  sukkah_balcony: 'sukkah balcony',
  garden: 'outdoor space',
  rooftop: 'outdoor space',
  parking: 'parking',
  storage: 'storage',
  mamad: 'mamad',
  'mamad/safe_room': 'mamad',
  luxury_finish: 'luxury finish',
  renovated_kitchen: 'renovation',
  pool: 'premium amenities',
  doorman: 'boutique or serviced building',
};

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

export function detectPremiumDrivers(property: MarketFitPropertyInput): string[] {
  const drivers: string[] = [];
  const features = property.features ?? [];
  const text = `${property.featured_highlight ?? ''} ${property.description ?? ''}`.toLowerCase();

  for (const feature of features) {
    const label = FEATURE_DRIVER_LABELS[feature];
    if (label) drivers.push(label);
  }

  if (property.property_type === 'penthouse' || property.property_type === 'mini_penthouse') drivers.push('penthouse');
  if (property.property_type === 'garden_apartment') drivers.push('garden apartment');
  if (property.condition === 'new' || property.condition === 'shell') drivers.push('new build / project unit');
  if (property.condition === 'renovated' || property.condition === 'like_new') drivers.push('renovation');
  if ((property.parking ?? 0) > 0) drivers.push('parking');
  if (property.has_balcony) drivers.push('outdoor space');
  if (property.has_storage) drivers.push('storage');
  if ((property.furniture_items?.length ?? 0) > 0 || property.furnished_status === 'fully' || property.furnished_status === 'semi') drivers.push('furnished / bundled extras');

  const floor = property.floor ?? null;
  const totalFloors = property.total_floors ?? null;
  if (floor !== null && (floor >= 6 || (totalFloors !== null && totalFloors > 0 && floor >= totalFloors - 1))) drivers.push('high floor');

  if (/sea|ocean|beach|first line|waterfront/.test(text)) drivers.push('sea view / beachfront');
  if (/renovat|architect|designer|luxury|high[- ]end/.test(text)) drivers.push('renovation / luxury finish');
  if (/boutique|rare|quiet street|prime street|tama|expansion/.test(text)) drivers.push('rarity / future potential');
  if (/furnished|appliance|included|private parking/.test(text)) drivers.push('bundled extras');

  return unique(drivers);
}

export function getMarketFit(input: MarketFitInput): MarketFitResult {
  const { avgComparison, compsCount, radiusUsedM, property } = input;
  const premiumDrivers = detectPremiumDrivers(property);
  const hasPremiumDrivers = premiumDrivers.length > 0;
  const lowComparableConfidence = compsCount < 3 || radiusUsedM >= 1000;
  const confidence: MarketFitResult['confidence'] = compsCount < 3 ? 'low' : radiusUsedM >= 1000 ? 'medium' : 'high';

  if (avgComparison === null || compsCount === 0 || compsCount < 3) {
    return {
      state: 'limited_comparable_match',
      label: 'Limited comparable match',
      contextLine: 'Nearby recorded sales may not fully reflect this property class',
      premiumDrivers,
      confidence,
    };
  }

  if (avgComparison <= 15) {
    return {
      state: 'normal_range',
      label: avgComparison < 0 ? 'Below recorded sales' : 'In line with recorded sales',
      contextLine: avgComparison < 0 ? 'Recorded sales suggest potential value' : 'Within a normal active-listing range',
      premiumDrivers,
      confidence,
    };
  }

  if (avgComparison <= 35) {
    return {
      state: 'above_recorded_sales',
      label: 'Above recorded sales',
      contextLine: 'Common for active listings before negotiation',
      premiumDrivers,
      confidence,
    };
  }

  if (lowComparableConfidence) {
    return {
      state: 'limited_comparable_match',
      label: 'Limited comparable match',
      contextLine: 'Recorded sales are useful context, but may not be a close match',
      premiumDrivers,
      confidence,
    };
  }

  if (hasPremiumDrivers) {
    return {
      state: 'feature_driven_premium',
      label: 'Feature-driven premium likely',
      contextLine: 'Recorded sales may not fully reflect view, floor, renovation, outdoor space, parking, or rarity',
      premiumDrivers,
      confidence,
    };
  }

  if (avgComparison >= 70) {
    return {
      state: 'agency_review_needed',
      label: 'Asking price requires closer review',
      contextLine: 'The gap is not fully explained by nearby recorded sales alone',
      premiumDrivers,
      confidence,
    };
  }

  return {
    state: 'premium_needs_context',
    label: 'Premium needs context',
    contextLine: 'View, renovation, floor, outdoor space, parking, or rarity may explain the gap',
    premiumDrivers,
    confidence,
  };
}

export function getMarketFitReview(input: MarketFitReviewInput): MarketFitReviewResult {
  const price = input.price ?? 0;
  const size = input.size_sqm ?? 0;
  const average = input.cityAveragePriceSqm ?? 0;
  const agentDrivers = input.premium_drivers ?? [];
  const detectedDrivers = detectPremiumDrivers(input.property);
  const hasPremiumContext = agentDrivers.length > 0 || detectedDrivers.length > 0 || Boolean(input.premium_explanation?.trim());

  const base: MarketFitReviewResult = {
    level: 'none',
    gapPercent: null,
    requiresContext: false,
    requiresConfirmation: false,
    hasPremiumContext,
    title: 'Market fit looks ready',
    message: 'The listing can be submitted normally.',
    reviewReason: null,
  };

  if (input.listing_status !== 'for_sale' || price <= 0 || size <= 0 || average <= 0) {
    return base;
  }

  const pricePerSqm = price / size;
  const gapPercent = Math.round(((pricePerSqm - average) / average) * 100);

  if (gapPercent < 35) {
    return { ...base, gapPercent };
  }

  if (gapPercent < 70) {
    return {
      level: 'soft_prompt',
      gapPercent,
      requiresContext: false,
      requiresConfirmation: false,
      hasPremiumContext,
      title: 'Help us present this listing accurately',
      message: 'This asking price is above the city price/sqm benchmark. If view, renovation, floor, outdoor space, parking, new-build status, or rarity explain the gap, add that context so buyers understand the premium.',
      reviewReason: `Soft review: ${gapPercent}% above city price/sqm benchmark`,
    };
  }

  if (gapPercent < 100) {
    return {
      level: 'context_required',
      gapPercent,
      requiresContext: !hasPremiumContext,
      requiresConfirmation: !hasPremiumContext,
      hasPremiumContext,
      title: 'Premium context needed before submission',
      message: 'The asking price is significantly above recorded benchmarks. Add premium drivers or confirm that this needs closer review so the listing can be presented fairly.',
      reviewReason: `Context required: ${gapPercent}% above city price/sqm benchmark`,
    };
  }

  return {
    level: 'review_required',
    gapPercent,
    requiresContext: false,
    requiresConfirmation: true,
    hasPremiumContext,
    title: 'Closer review will be requested',
    message: 'This listing is far above the city price/sqm benchmark. It can still be submitted, but please confirm the price and add any premium context that helps buyers understand the gap.',
    reviewReason: `Closer review: ${gapPercent}% above city price/sqm benchmark`,
  };
}