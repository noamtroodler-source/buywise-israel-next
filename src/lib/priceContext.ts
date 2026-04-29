import { detectPremiumDrivers, type MarketFitPropertyInput } from './marketFit';
import { buildPriceContextBuyerQuestions } from './priceContextQuestions';

export type PriceContextPropertyClass =
  | 'standard_resale'
  | 'new_build_project'
  | 'penthouse'
  | 'garden_apartment'
  | 'beachfront_sea_view'
  | 'duplex_unique'
  | 'house_villa_cottage'
  | 'land'
  | 'commercial'
  | 'premium_unique';

export type PriceContextConfidenceTier =
  | 'strong_comparable_match'
  | 'directional_benchmark'
  | 'limited_comparable_match'
  | 'premium_unique_property'
  | 'insufficient_data';

export type PriceContextPublicLabel =
  | 'In line with available benchmarks'
  | 'Moderate premium to recorded sales'
  | 'Premium features identified'
  | 'Large premium — context important'
  | 'Limited comparable match'
  | 'Premium property — standard comps may not apply'
  | 'Not enough recorded data to benchmark reliably'
  | 'Market context under review';

export type PriceContextBadgeStatus = 'complete' | 'incomplete' | 'blocked';

export interface PriceContextInput {
  avgComparison: number | null;
  compsCount: number;
  radiusUsedM: number;
  compRecencyMonths?: number | null;
  compDispersionPercent?: number | null;
  roomMatchQuality?: 'strong' | 'directional' | 'weak' | null;
  sizeMatchQuality?: 'strong' | 'directional' | 'weak' | null;
  avgCompPriceSqm?: number | null;
  benchmarkPriceSqm?: number | null;
  pricePerSqm?: number | null;
  property: MarketFitPropertyInput & {
    listing_status?: string | null;
    size_sqm?: number | null;
    sqm_source?: string | null;
    ownership_type?: string | null;
    benchmark_review_status?: string | null;
    premium_drivers?: string[] | null;
    premium_explanation?: string | null;
  };
}

export interface PriceContextResult {
  propertyClass: PriceContextPropertyClass;
  propertyClassLabel: string;
  confidenceTier: PriceContextConfidenceTier;
  confidenceLabel: string;
  confidenceScore: number;
  publicLabel: PriceContextPublicLabel;
  buyWiseTake: string;
  percentageSuppressed: boolean;
  percentageSuppressionReason: string | null;
  displayGapPercent: number | null;
  gapBand: string | null;
  premiumDrivers: string[];
  detectedPremiumDrivers: string[];
  confirmedPremiumDrivers: string[];
  confidenceReasons: string[];
  buyerQuestions: string[];
  badgeStatus: PriceContextBadgeStatus;
  badgeEligible: boolean;
  benchmarkRange: { min: number; max: number } | null;
}

const PREMIUM_CLASSES: PriceContextPropertyClass[] = [
  'new_build_project',
  'penthouse',
  'garden_apartment',
  'beachfront_sea_view',
  'duplex_unique',
  'house_villa_cottage',
  'premium_unique',
];

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

export function formatPriceContextValue(value: string | null | undefined) {
  if (!value) return '—';
  return value.replace(/[_/]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getPriceContextPropertyClass(property: PriceContextInput['property']): PriceContextPropertyClass {
  const type = property.property_type;
  const features = property.features ?? [];
  const text = `${property.featured_highlight ?? ''} ${property.description ?? ''}`.toLowerCase();

  if (type === 'land') return 'land';
  if (type === 'commercial') return 'commercial';
  if (type === 'house' || type === 'cottage') return 'house_villa_cottage';
  if (type === 'penthouse' || type === 'mini_penthouse') return 'penthouse';
  if (type === 'garden_apartment') return 'garden_apartment';
  if (type === 'duplex') return 'duplex_unique';
  if (property.condition === 'new' || property.condition === 'shell') return 'new_build_project';
  if (features.some((feature) => ['sea_view', 'beachfront', 'first_line', 'panoramic_view'].includes(feature)) || /sea|ocean|beach|first line|waterfront/.test(text)) {
    return 'beachfront_sea_view';
  }
  if (features.some((feature) => ['luxury_finish', 'pool', 'doorman'].includes(feature)) || /designer|luxury|architect|rare|boutique/.test(text)) {
    return 'premium_unique';
  }
  return 'standard_resale';
}

function propertyClassLabel(propertyClass: PriceContextPropertyClass) {
  const labels: Record<PriceContextPropertyClass, string> = {
    standard_resale: 'Standard resale',
    new_build_project: 'New-build / project unit',
    penthouse: 'Penthouse / mini-penthouse',
    garden_apartment: 'Garden apartment',
    beachfront_sea_view: 'Beachfront / sea-view',
    duplex_unique: 'Duplex / unique layout',
    house_villa_cottage: 'House / villa / cottage',
    land: 'Land',
    commercial: 'Commercial',
    premium_unique: 'Premium / unique property',
  };
  return labels[propertyClass];
}

function confidenceLabel(tier: PriceContextConfidenceTier) {
  const labels: Record<PriceContextConfidenceTier, string> = {
    strong_comparable_match: 'Strong comparable match',
    directional_benchmark: 'Directional benchmark',
    limited_comparable_match: 'Limited comparable match',
    premium_unique_property: 'Premium / unique property',
    insufficient_data: 'Insufficient data',
  };
  return labels[tier];
}

function getGapBand(gap: number | null) {
  if (gap === null) return null;
  if (gap < 0) return 'Below selected benchmarks';
  if (gap <= 10) return '0–10% above selected benchmarks';
  if (gap <= 25) return '11–25% above selected benchmarks';
  if (gap <= 50) return 'Large premium to selected benchmarks';
  if (gap <= 100) return 'Very large gap to selected benchmarks';
  return 'Extreme mismatch to selected benchmarks';
}

export function getPriceContext(input: PriceContextInput): PriceContextResult {
  const { avgComparison, compsCount, radiusUsedM, benchmarkPriceSqm, pricePerSqm, property } = input;
  const propertyClass = getPriceContextPropertyClass(property);
  const isPremiumClass = PREMIUM_CLASSES.includes(propertyClass);
  const detectedPremiumDrivers = detectPremiumDrivers(property);
  const confirmedPremiumDrivers = property.premium_drivers ?? [];
  const premiumDrivers = unique([...confirmedPremiumDrivers, ...detectedPremiumDrivers]);
  const hasPremiumContext = premiumDrivers.length > 0 || Boolean(property.premium_explanation?.trim());
  const reviewOpen = property.benchmark_review_status === 'requested' || property.benchmark_review_status === 'under_review';
  const gap = avgComparison === null ? null : Math.round(avgComparison);
  const reasons: string[] = [];
  const limitedCaps: string[] = [];

  let score = 100;
  if (compsCount >= 8) reasons.push('8+ recorded comps available');
  else if (compsCount >= 5) { score -= 15; reasons.push('5–7 comps: directional confidence'); }
  else if (compsCount > 0) { score -= 35; reasons.push('Fewer than 5 comps caps confidence'); limitedCaps.push('fewer_than_5_comps'); }
  else { score -= 55; reasons.push('No comparable sales available'); limitedCaps.push('no_listing_level_comps'); }

  if (radiusUsedM <= 300) reasons.push('Comp radius is tightly local');
  else if (radiusUsedM <= 600) { score -= 10; reasons.push('Comp radius is directional'); }
  else { score -= 25; reasons.push('Comp radius above 600m caps confidence in dense markets'); limitedCaps.push('wide_radius'); }

  if (input.compRecencyMonths != null) {
    if (input.compRecencyMonths <= 12) reasons.push('Recent recorded sales support the benchmark');
    else if (input.compRecencyMonths <= 24) { score -= 8; reasons.push('Comparable sales are older, so the benchmark is directional'); }
    else { score -= 18; reasons.push('Comparable sales are stale'); limitedCaps.push('stale_comps'); }
  }

  if (input.compDispersionPercent != null) {
    if (input.compDispersionPercent <= 18) reasons.push('Comp prices are tightly clustered');
    else if (input.compDispersionPercent <= 35) { score -= 10; reasons.push('Comp prices have moderate spread'); }
    else { score -= 25; reasons.push('Wide comp dispersion caps confidence'); limitedCaps.push('wide_comp_dispersion'); }
  }

  if (input.roomMatchQuality === 'weak') { score -= 18; reasons.push('Room-count match is weak'); limitedCaps.push('weak_room_match'); }
  else if (input.roomMatchQuality === 'directional') { score -= 8; reasons.push('Room-count match is directional'); }
  else if (input.roomMatchQuality === 'strong') reasons.push('Room-count match is strong');

  if (input.sizeMatchQuality === 'weak') { score -= 18; reasons.push('Size match is weak'); limitedCaps.push('weak_size_match'); }
  else if (input.sizeMatchQuality === 'directional') { score -= 8; reasons.push('Size match is directional'); }
  else if (input.sizeMatchQuality === 'strong') reasons.push('Size match is strong');

  if (!property.size_sqm || !pricePerSqm) { score -= 35; reasons.push('Missing size weakens price/sqm context'); }
  if (!property.sqm_source || property.sqm_source === 'unknown') { score -= 20; reasons.push('Unknown sqm source caps confidence'); limitedCaps.push('unknown_sqm_source'); }
  if (!property.ownership_type || property.ownership_type === 'unknown') { score -= 15; reasons.push('Unknown ownership type reduces comparability'); limitedCaps.push('unknown_ownership_type'); }
  if (isPremiumClass) { score -= 20; reasons.push('Premium/unique property class requires same-class caution'); }
  if (reviewOpen) { score -= 40; reasons.push('Benchmark review is open'); }

  score = Math.max(0, Math.min(100, score));

  let confidenceTier: PriceContextConfidenceTier;
  if (reviewOpen) confidenceTier = 'limited_comparable_match';
  else if (compsCount === 0 && !benchmarkPriceSqm) confidenceTier = 'insufficient_data';
  else if (isPremiumClass) confidenceTier = 'premium_unique_property';
  else if (limitedCaps.length > 0) confidenceTier = 'limited_comparable_match';
  else if (score >= 80 && compsCount >= 8 && radiusUsedM <= 600) confidenceTier = 'strong_comparable_match';
  else if (score >= 60 && compsCount >= 5) confidenceTier = 'directional_benchmark';
  else confidenceTier = 'limited_comparable_match';

  const mayShowPercentage = confidenceTier === 'strong_comparable_match'
    && propertyClass === 'standard_resale'
    && !reviewOpen
    && gap !== null
    && gap <= 25;

  const percentageSuppressionReason = mayShowPercentage
    ? null
    : reviewOpen
      ? 'Market context is under review.'
      : confidenceTier !== 'strong_comparable_match'
        ? 'Comparable confidence is not strong enough for a public percentage.'
        : propertyClass !== 'standard_resale'
          ? 'Premium or unique property classes should not show a standard resale gap.'
          : gap !== null && gap > 25
            ? 'Large gaps are kept qualitative to avoid false precision.'
            : 'Public percentage not available.';

  let publicLabel: PriceContextPublicLabel;
  if (reviewOpen) publicLabel = 'Market context under review';
  else if (confidenceTier === 'insufficient_data') publicLabel = 'Not enough recorded data to benchmark reliably';
  else if (confidenceTier === 'premium_unique_property') publicLabel = 'Premium property — standard comps may not apply';
  else if (confidenceTier === 'limited_comparable_match') publicLabel = 'Limited comparable match';
  else if (gap === null || gap <= 10) publicLabel = 'In line with available benchmarks';
  else if (gap <= 25) publicLabel = hasPremiumContext ? 'Premium features identified' : 'Moderate premium to recorded sales';
  else publicLabel = hasPremiumContext ? 'Premium features identified' : 'Large premium — context important';

  const buyWiseTake = reviewOpen
    ? 'This listing’s market context is being reviewed, so buyers should use the available details as directional guidance for now.'
    : confidenceTier === 'insufficient_data'
      ? 'There is not enough reliable recorded-sale data to benchmark this listing at property level.'
      : confidenceTier === 'premium_unique_property'
        ? 'Standard recorded sales may not fully capture this property’s class, features, or premium drivers.'
        : confidenceTier === 'limited_comparable_match'
          ? 'Recorded sales are useful context, but the current comparable set is limited.'
          : hasPremiumContext
            ? 'Recorded sales provide useful context, and the listing includes details that may explain a premium.'
            : gap !== null && gap > 25
              ? 'The asking price sits meaningfully above selected recorded-sale benchmarks, so context matters.'
              : 'The asking price is broadly understandable against available recorded-sale benchmarks.';

  const needsPremiumExplanation = gap !== null && gap >= 25;
  const badgeEligible = Boolean(
    property.listing_status === 'for_sale'
    && property.size_sqm
    && property.sqm_source
    && property.ownership_type
    && propertyClass
    && (!needsPremiumExplanation || property.premium_explanation?.trim())
    && !reviewOpen
  );

  const buyerQuestions = buildPriceContextBuyerQuestions(property, propertyClass, gap, premiumDrivers).map((item) => item.question);
  const base = input.avgCompPriceSqm ?? benchmarkPriceSqm ?? null;
  const benchmarkRange = base ? { min: Math.round(base * 0.95), max: Math.round(base * 1.05) } : null;

  return {
    propertyClass,
    propertyClassLabel: propertyClassLabel(propertyClass),
    confidenceTier,
    confidenceLabel: confidenceLabel(confidenceTier),
    confidenceScore: score,
    publicLabel,
    buyWiseTake,
    percentageSuppressed: !mayShowPercentage,
    percentageSuppressionReason,
    displayGapPercent: mayShowPercentage ? gap : null,
    gapBand: mayShowPercentage ? getGapBand(gap) : null,
    premiumDrivers,
    detectedPremiumDrivers,
    confirmedPremiumDrivers,
    confidenceReasons: reasons,
    buyerQuestions,
    badgeStatus: badgeEligible ? 'complete' : reviewOpen ? 'blocked' : 'incomplete',
    badgeEligible,
    benchmarkRange,
  };
}
