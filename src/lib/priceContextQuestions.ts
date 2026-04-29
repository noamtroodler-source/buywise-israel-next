import type { PriceContextPropertyClass } from './priceContext';

export type BuyerQuestionReason =
  | 'premium_gap'
  | 'sqm_source'
  | 'ownership'
  | 'parking'
  | 'storage'
  | 'furniture_extras'
  | 'renovation'
  | 'sea_view'
  | 'new_build'
  | 'redevelopment'
  | 'mamad';

export interface BuyerQuestion {
  id: BuyerQuestionReason;
  question: string;
  priority: number;
}

export interface PriceContextQuestionProperty {
  property_type?: string | null;
  condition?: string | null;
  parking?: number | null;
  has_storage?: boolean | null;
  furnished_status?: string | null;
  furniture_items?: string[] | null;
  features?: string[] | null;
  featured_highlight?: string | null;
  description?: string | null;
  sqm_source?: string | null;
  ownership_type?: string | null;
}

function hasTextSignal(property: PriceContextQuestionProperty, pattern: RegExp) {
  return pattern.test(`${property.featured_highlight ?? ''} ${property.description ?? ''}`.toLowerCase());
}

function includesSignal(values: string[], signals: string[]) {
  return values.some((value) => signals.some((signal) => value.toLowerCase().includes(signal)));
}

export function buildPriceContextBuyerQuestions(
  property: PriceContextQuestionProperty,
  propertyClass: PriceContextPropertyClass,
  gap: number | null,
  premiumDrivers: string[],
): BuyerQuestion[] {
  const features = property.features ?? [];
  const driverSignals = premiumDrivers.map((driver) => driver.toLowerCase());
  const questions: BuyerQuestion[] = [];

  if (gap !== null && gap > 10) {
    questions.push({ id: 'premium_gap', question: 'What explains the premium over nearby recorded sales?', priority: 100 });
  }

  if (!property.sqm_source || property.sqm_source === 'unknown' || gap !== null) {
    questions.push({ id: 'sqm_source', question: 'Is the listed sqm based on Tabu, Arnona, contractor plans, or marketing size?', priority: 95 });
  }

  if (!property.ownership_type || property.ownership_type === 'unknown' || property.ownership_type === 'minhal_leasehold' || property.ownership_type === 'company_or_other') {
    questions.push({ id: 'ownership', question: 'Is the property private Tabu, Minhal leasehold, or another ownership structure?', priority: 88 });
  }

  if ((property.parking ?? 0) > 0 || includesSignal(driverSignals, ['parking'])) {
    questions.push({ id: 'parking', question: 'Is the parking registered, private, shared, robotic, or separate?', priority: 84 });
  }

  if (property.has_storage || includesSignal(driverSignals, ['storage'])) {
    questions.push({ id: 'storage', question: 'Is storage included and registered?', priority: 82 });
  }

  if ((property.furniture_items?.length ?? 0) > 0 || Boolean(property.furnished_status) || includesSignal(driverSignals, ['furnished', 'extras'])) {
    questions.push({ id: 'furniture_extras', question: 'Which furniture, appliances, or extras are included in the price?', priority: 78 });
  }

  if (property.condition === 'renovated' || includesSignal(driverSignals, ['renovation', 'luxury']) || hasTextSignal(property, /renovat|architect|designer|luxury|high[- ]end/)) {
    questions.push({ id: 'renovation', question: 'When was the property renovated, and what work was included?', priority: 76 });
  }

  if (propertyClass === 'beachfront_sea_view' || includesSignal(features, ['sea_view', 'beachfront', 'first_line', 'panoramic_view']) || hasTextSignal(property, /sea|beach|first line|waterfront/)) {
    questions.push({ id: 'sea_view', question: 'Is the sea view direct, partial, protected, or vulnerable to future construction?', priority: 74 });
  }

  if (propertyClass === 'new_build_project') {
    questions.push({ id: 'new_build', question: 'For new-build: what is the delivery date, payment schedule, and included specification?', priority: 72 });
  }

  if (hasTextSignal(property, /tama|pinui|binui|redevelopment|evacuation|renewal|expansion/)) {
    questions.push({ id: 'redevelopment', question: 'Does the building have Tama 38 or Pinui Binui implications?', priority: 68 });
  }

  if (includesSignal(features, ['mamad', 'safe_room']) || hasTextSignal(property, /mamad|safe room|shelter/)) {
    questions.push({ id: 'mamad', question: 'Is there a registered Mamad or only a shared shelter?', priority: 64 });
  }

  return Array.from(new Map(questions.map((item) => [item.id, item])).values())
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 6);
}
