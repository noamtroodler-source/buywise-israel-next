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
  | 'Not enough recorded data to benchmark reliably';

export type PriceContextBadgeStatus = 'automatic';
export type PriceContextCompClassMatch = 'same_class' | 'similar_class' | 'mixed_fallback' | 'no_comps';

export interface PriceContextCompClassMetadata {
  classMatch: PriceContextCompClassMatch;
  subjectClass: PriceContextPropertyClass;
  selectedCount: number;
  sameClassCount: number;
  fallbackUsed: boolean;
}

export type PriceContextSpecMatchQuality = 'strong' | 'directional' | 'weak';

export interface PriceContextSpecMatchMetadata {
  roomMatchQuality: PriceContextSpecMatchQuality | null;
  sizeMatchQuality: PriceContextSpecMatchQuality | null;
  avgRoomDelta: number | null;
  avgSizeDeltaPercent: number | null;
}

export interface PriceContextRecencyMetadata {
  avgRecencyMonths: number | null;
  newestRecencyMonths: number | null;
  oldestRecencyMonths: number | null;
}

export interface PriceContextConfidenceCap {
  code: string;
  label: string;
  detail: string;
  severity: 'warning' | 'critical';
}

export interface PriceContextInput {
  avgComparison: number | null;
  compsCount: number;
  radiusUsedM: number;
  compRecencyMonths?: number | null;
  compDispersionPercent?: number | null;
  compClassMatch?: PriceContextCompClassMatch | null;
  roomMatchQuality?: PriceContextSpecMatchQuality | null;
  sizeMatchQuality?: PriceContextSpecMatchQuality | null;
  avgCompPriceSqm?: number | null;
  benchmarkPriceSqm?: number | null;
  pricePerSqm?: number | null;
  property: MarketFitPropertyInput & {
    listing_status?: string | null;
    size_sqm?: number | null;
    sqm_source?: string | null;
    ownership_type?: string | null;
    premium_drivers?: string[] | null;
    premium_explanation?: string | null;
  };
}

export interface PriceContextResult {
  propertyClass: PriceContextPropertyClass;
  propertyClassLabel: string;
  isLuxuryPremiumMode: boolean;
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
  confidenceCaps: PriceContextConfidenceCap[];
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

export function getCompPropertyClass(propertyType?: string | null): PriceContextPropertyClass {
  const type = String(propertyType ?? '').toLowerCase();
  if (type.includes('land')) return 'land';
  if (type.includes('commercial')) return 'commercial';
  if (type.includes('house') || type.includes('villa') || type.includes('cottage')) return 'house_villa_cottage';
  if (type.includes('penthouse')) return 'penthouse';
  if (type.includes('garden')) return 'garden_apartment';
  if (type.includes('duplex')) return 'duplex_unique';
  if (type.includes('new') || type.includes('project') || type.includes('kablan')) return 'new_build_project';
  return 'standard_resale';
}

export function selectPriceContextComps<T extends { property_type?: string | null }>(
  comps: T[],
  subjectClass: PriceContextPropertyClass,
  limit = 6,
): { comps: T[]; metadata: PriceContextCompClassMetadata } {
  const sameClass = comps.filter((comp) => getCompPropertyClass(comp.property_type) === subjectClass);
  const standardFallbackAllowed = subjectClass === 'standard_resale';
  const selected = sameClass.length >= 3 || !standardFallbackAllowed
    ? sameClass.slice(0, limit)
    : comps.slice(0, limit);
  const fallbackUsed = selected.length > 0 && sameClass.length < 3;

  return {
    comps: selected,
    metadata: {
      subjectClass,
      selectedCount: selected.length,
      sameClassCount: sameClass.length,
      fallbackUsed,
      classMatch: selected.length === 0
        ? 'no_comps'
        : sameClass.length >= 3
          ? 'same_class'
          : fallbackUsed
            ? 'mixed_fallback'
            : 'similar_class',
    },
  };
}

export function computePriceContextSpecMatch<T extends { rooms?: number | null; size_sqm?: number | null }>(
  comps: T[],
  subjectRooms?: number | null,
  subjectSizeSqm?: number | null,
): PriceContextSpecMatchMetadata {
  const validRoomComps = comps.filter((comp) => comp.rooms != null);
  const avgRoomDelta = subjectRooms != null && validRoomComps.length > 0
    ? validRoomComps.reduce((sum, comp) => sum + Math.abs((comp.rooms ?? subjectRooms) - subjectRooms), 0) / validRoomComps.length
    : null;

  const validSizeComps = comps.filter((comp) => comp.size_sqm != null && comp.size_sqm > 0);
  const avgCompSize = validSizeComps.length > 0
    ? validSizeComps.reduce((sum, comp) => sum + (comp.size_sqm ?? 0), 0) / validSizeComps.length
    : null;
  const avgSizeDeltaPercent = subjectSizeSqm && subjectSizeSqm > 0 && avgCompSize
    ? Math.abs(avgCompSize - subjectSizeSqm) / subjectSizeSqm
    : null;

  return {
    avgRoomDelta: avgRoomDelta == null ? null : Number(avgRoomDelta.toFixed(2)),
    avgSizeDeltaPercent: avgSizeDeltaPercent == null ? null : Math.round(avgSizeDeltaPercent * 100),
    roomMatchQuality: subjectRooms == null
      ? null
      : avgRoomDelta == null
        ? 'weak'
        : avgRoomDelta <= 0.5
          ? 'strong'
          : avgRoomDelta <= 1
            ? 'directional'
            : 'weak',
    sizeMatchQuality: !subjectSizeSqm
      ? null
      : avgSizeDeltaPercent == null
        ? 'weak'
        : avgSizeDeltaPercent <= 0.1
          ? 'strong'
          : avgSizeDeltaPercent <= 0.25
            ? 'directional'
            : 'weak',
  };
}

export function computePriceContextCompRecency<T extends { sold_date?: string | null }>(
  comps: T[],
  asOf = new Date(),
): PriceContextRecencyMetadata {
  const recencies = comps
    .map((comp) => {
      if (!comp.sold_date) return null;
      const soldDate = new Date(comp.sold_date);
      if (Number.isNaN(soldDate.getTime())) return null;
      const monthsOld = (asOf.getTime() - soldDate.getTime()) / (1000 * 60 * 60 * 24 * 30.4375);
      return Math.max(0, monthsOld);
    })
    .filter((value): value is number => value != null);

  if (recencies.length === 0) {
    return { avgRecencyMonths: null, newestRecencyMonths: null, oldestRecencyMonths: null };
  }

  const avg = recencies.reduce((sum, value) => sum + value, 0) / recencies.length;
  return {
    avgRecencyMonths: Math.round(avg),
    newestRecencyMonths: Math.round(Math.min(...recencies)),
    oldestRecencyMonths: Math.round(Math.max(...recencies)),
  };
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

function getInternalBenchmarkGap(pricePerSqm?: number | null, benchmarkPriceSqm?: number | null) {
  if (!pricePerSqm || !benchmarkPriceSqm) return null;
  return Math.round(((pricePerSqm - benchmarkPriceSqm) / benchmarkPriceSqm) * 100);
}

function confidenceCapDetail(code: string, input: PriceContextInput, compsCount: number, radiusUsedM: number): PriceContextConfidenceCap {
  const details: Record<string, Omit<PriceContextConfidenceCap, 'code'>> = {
    fewer_than_5_comps: { label: 'Sparse comp count', detail: `Only ${compsCount} comparable sale${compsCount === 1 ? '' : 's'} selected; strong confidence requires a deeper pool.`, severity: 'critical' },
    no_listing_level_comps: { label: 'No listing-level comps', detail: 'No comparable recorded sales were available for this listing-level benchmark.', severity: 'critical' },
    wide_radius: { label: 'Wide search radius', detail: `Comparable search expanded to ${radiusUsedM}m, which weakens precision in dense markets.`, severity: 'warning' },
    stale_comps: { label: 'Stale transactions', detail: `Average comp age is ${input.compRecencyMonths} months; newer sales are needed for strong confidence.`, severity: 'warning' },
    wide_comp_dispersion: { label: 'Wide price dispersion', detail: `Selected comps vary by about ${input.compDispersionPercent}%, so the average may hide meaningful differences.`, severity: 'critical' },
    similar_class_comps: { label: 'Similar-class only', detail: 'The comparable pool is not strictly same-class, so class differences may affect pricing.', severity: 'warning' },
    mixed_fallback_comps: { label: 'Mixed fallback pool', detail: 'Same-class comps were sparse, so fallback comps were used for directional context only.', severity: 'critical' },
    no_same_class_comps: { label: 'No same-class pool', detail: 'No reliable same-class comparable pool was available for this property class.', severity: 'critical' },
    weak_room_match: { label: 'Weak room match', detail: 'Selected comps do not closely match the listing’s Israeli room count.', severity: 'warning' },
    weak_size_match: { label: 'Weak size match', detail: 'Selected comps do not closely match the listing size, reducing price/sqm reliability.', severity: 'warning' },
    missing_size_or_price_per_sqm: { label: 'Missing size or price/sqm', detail: 'Listing size or price/sqm is missing, so property-level benchmarking is incomplete.', severity: 'critical' },
    unknown_sqm_source: { label: 'Unknown sqm source', detail: 'The sqm source is unknown, which makes recorded-sale comparisons less reliable.', severity: 'warning' },
    unknown_ownership_type: { label: 'Unknown ownership type', detail: 'Ownership type is unknown, reducing comparability across Israeli property records.', severity: 'warning' },
  };

  return { code, ...(details[code] ?? { label: formatPriceContextValue(code), detail: 'This factor limits comparable confidence.', severity: 'warning' }) };
}

export function getPriceContext(input: PriceContextInput): PriceContextResult {
  const { avgComparison, compsCount, radiusUsedM, benchmarkPriceSqm, pricePerSqm, property } = input;
  const propertyClass = getPriceContextPropertyClass(property);
  const isPremiumClass = PREMIUM_CLASSES.includes(propertyClass);
  const detectedPremiumDrivers = detectPremiumDrivers(property);
  const confirmedPremiumDrivers = property.premium_drivers ?? [];
  const premiumDrivers = unique([...confirmedPremiumDrivers, ...detectedPremiumDrivers]);
  const hasPremiumContext = premiumDrivers.length > 0 || Boolean(property.premium_explanation?.trim());
  const benchmarkGap = getInternalBenchmarkGap(pricePerSqm, benchmarkPriceSqm);
  const gap = avgComparison === null ? benchmarkGap : Math.round(avgComparison);
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

  if (input.compClassMatch === 'same_class') reasons.push('Comparable pool is same-class');
  else if (input.compClassMatch === 'similar_class') { score -= 18; reasons.push('Comparable pool is similar-class only'); limitedCaps.push('similar_class_comps'); }
  else if (input.compClassMatch === 'mixed_fallback') { score -= 28; reasons.push('Mixed fallback comps used because same-class comps were sparse'); limitedCaps.push('mixed_fallback_comps'); }
  else if (input.compClassMatch === 'no_comps') { score -= 35; reasons.push('No same-class comparable pool available'); limitedCaps.push('no_same_class_comps'); }

  if (input.roomMatchQuality === 'weak') { score -= 18; reasons.push('Room-count match is weak'); limitedCaps.push('weak_room_match'); }
  else if (input.roomMatchQuality === 'directional') { score -= 8; reasons.push('Room-count match is directional'); }
  else if (input.roomMatchQuality === 'strong') reasons.push('Room-count match is strong');

  if (input.sizeMatchQuality === 'weak') { score -= 18; reasons.push('Size match is weak'); limitedCaps.push('weak_size_match'); }
  else if (input.sizeMatchQuality === 'directional') { score -= 8; reasons.push('Size match is directional'); }
  else if (input.sizeMatchQuality === 'strong') reasons.push('Size match is strong');

  if (!property.size_sqm || !pricePerSqm) { score -= 35; reasons.push('Missing size weakens price/sqm context'); limitedCaps.push('missing_size_or_price_per_sqm'); }
  if (!property.sqm_source || property.sqm_source === 'unknown') { score -= 20; reasons.push('Unknown sqm source caps confidence'); limitedCaps.push('unknown_sqm_source'); }
  if (!property.ownership_type || property.ownership_type === 'unknown') { score -= 15; reasons.push('Unknown ownership type reduces comparability'); limitedCaps.push('unknown_ownership_type'); }
  if (isPremiumClass) { score -= 20; reasons.push('Premium/unique property class requires same-class caution'); }
  score = Math.max(0, Math.min(100, score));
  const hasStrongSpecMatch = (input.roomMatchQuality == null || input.roomMatchQuality === 'strong')
    && (input.sizeMatchQuality == null || input.sizeMatchQuality === 'strong');

  let confidenceTier: PriceContextConfidenceTier;
  if (compsCount === 0 && !benchmarkPriceSqm) confidenceTier = 'insufficient_data';
  else if (isPremiumClass) confidenceTier = 'premium_unique_property';
  else if (limitedCaps.length > 0) confidenceTier = 'limited_comparable_match';
  else if (score >= 80 && compsCount >= 8 && radiusUsedM <= 600 && hasStrongSpecMatch) confidenceTier = 'strong_comparable_match';
  else if (score >= 60 && compsCount >= 5) confidenceTier = 'directional_benchmark';
  else confidenceTier = 'limited_comparable_match';

  const isLuxuryPremiumMode = Boolean(
    isPremiumClass
    && gap !== null
    && gap >= 35
    && confidenceTier !== 'strong_comparable_match',
  );

  const mayShowPercentage = confidenceTier === 'strong_comparable_match'
    && propertyClass === 'standard_resale'
    && gap !== null
    && gap <= 25;

  const percentageSuppressionReason = mayShowPercentage
    ? null
    : confidenceTier !== 'strong_comparable_match'
        ? 'Comparable confidence is not strong enough for a public percentage.'
        : propertyClass !== 'standard_resale'
          ? 'Premium or unique property classes should not show a standard resale gap.'
          : gap !== null && gap > 25
            ? 'Large gaps are kept qualitative to avoid false precision.'
            : 'Public percentage not available.';

  let publicLabel: PriceContextPublicLabel;
  if (confidenceTier === 'insufficient_data') publicLabel = 'Not enough recorded data to benchmark reliably';
  else if (confidenceTier === 'premium_unique_property') publicLabel = 'Premium property — standard comps may not apply';
  else if (confidenceTier === 'limited_comparable_match') publicLabel = 'Limited comparable match';
  else if (gap === null || gap <= 10) publicLabel = 'In line with available benchmarks';
  else if (gap <= 25) publicLabel = hasPremiumContext ? 'Premium features identified' : 'Moderate premium to recorded sales';
  else publicLabel = hasPremiumContext ? 'Premium features identified' : 'Large premium — context important';

  const buyWiseTake = confidenceTier === 'insufficient_data'
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
  );

  const buyerQuestions = buildPriceContextBuyerQuestions(property, propertyClass, gap, premiumDrivers).map((item) => item.question);
  const base = input.avgCompPriceSqm ?? benchmarkPriceSqm ?? null;
  const benchmarkRange = base ? { min: Math.round(base * 0.95), max: Math.round(base * 1.05) } : null;
  const confidenceCaps = unique(limitedCaps).map((code) => confidenceCapDetail(code, input, compsCount, radiusUsedM));

  return {
    propertyClass,
    propertyClassLabel: propertyClassLabel(propertyClass),
    isLuxuryPremiumMode,
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
    confidenceCaps,
    buyerQuestions,
    badgeStatus: 'automatic',
    badgeEligible,
    benchmarkRange,
  };
}
