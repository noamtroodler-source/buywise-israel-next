/**
 * reconcilePropertyData
 *
 * Single source of truth for how conflicting fields resolve on a co-listed
 * property. Called wherever data from a primary agency and one or more
 * secondary (co-listing) agencies needs to be displayed as one apartment.
 *
 * Split into two categories:
 *   - Authority fields (price, address, lat/lng): primary wins, always.
 *     These anchor the property's identity and whose listing "owns" the record.
 *   - Quality fields (description, images, features): whichever source has
 *     the richest data wins. Primary preferred on ties.
 *
 * This helper returns a plain object with the reconciled view. It does NOT
 * mutate the underlying properties — callers use it to compute a display
 * snapshot for the buyer UI.
 */

import type { Property } from '@/types/database';

export interface ReconciledPropertyView {
  /** Authority fields — always from primary */
  price: number;
  currency: string;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  /** Quality fields — richest source wins */
  description: string | null;
  features: string[];
  images: string[];
  size_sqm: number | null;
  bedrooms: number;
  floor: number | null;
  year_built: number | null;
  /** Display metadata */
  priceMin: number;
  priceMax: number;
  priceSpreadPct: number;
}

interface SecondarySource {
  price?: number | null;
  description?: string | null;
  features?: string[] | null;
  images?: string[] | null;
  size_sqm?: number | null;
  bedrooms?: number | null;
  floor?: number | null;
  year_built?: number | null;
}

const HEBREW_RE = /[\u0590-\u05FF]/g;

function isMostlyEnglish(str: string | null | undefined): boolean {
  if (!str) return false;
  const sample = str.slice(0, 200);
  const hebrewChars = (sample.match(HEBREW_RE) || []).length;
  return hebrewChars < sample.length * 0.3;
}

function scoreDescription(str: string | null | undefined): number {
  if (!str) return 0;
  // Favor longer English descriptions over shorter Hebrew ones
  const lengthScore = Math.min(str.length, 800);
  const englishBonus = isMostlyEnglish(str) ? 200 : 0;
  return lengthScore + englishBonus;
}

function pickRichest<T>(
  primary: T | null | undefined,
  secondaries: (T | null | undefined)[],
  score: (v: T | null | undefined) => number,
): T | null {
  const primaryScore = score(primary);
  const bestSecondary = secondaries
    .map((s) => ({ value: s, score: score(s) }))
    .sort((a, b) => b.score - a.score)[0];

  if (!bestSecondary || bestSecondary.score <= primaryScore) {
    return (primary ?? null) as T | null;
  }
  return (bestSecondary.value ?? null) as T | null;
}

export function reconcilePropertyData(
  primary: Property,
  secondaries: SecondarySource[] = [],
): ReconciledPropertyView {
  // ── Price range (for "Price varies" display) ──────────────────────────────
  const allPrices = [primary.price, ...secondaries.map((s) => s?.price)]
    .filter((p): p is number => typeof p === 'number' && p > 0);
  const priceMin = allPrices.length ? Math.min(...allPrices) : primary.price;
  const priceMax = allPrices.length ? Math.max(...allPrices) : primary.price;
  const priceSpreadPct = priceMin > 0 ? ((priceMax - priceMin) / priceMin) * 100 : 0;

  // ── Description — richest English wins ────────────────────────────────────
  const description = pickRichest(
    primary.description,
    secondaries.map((s) => s?.description),
    scoreDescription,
  );

  // ── Images — union, de-duplicated by URL, richer-source-first ──────────────
  const primaryImages = (primary.images ?? []).filter(Boolean) as string[];
  const secondaryImages = secondaries
    .flatMap((s) => (s?.images ?? []).filter(Boolean) as string[]);
  const seen = new Set<string>();
  const images: string[] = [];
  for (const url of [...primaryImages, ...secondaryImages]) {
    if (!seen.has(url)) {
      seen.add(url);
      images.push(url);
    }
  }

  // ── Features — set union ──────────────────────────────────────────────────
  const featureSet = new Set<string>();
  (primary.features ?? []).forEach((f) => featureSet.add(f));
  secondaries.forEach((s) => (s?.features ?? []).forEach((f) => featureSet.add(f)));

  // ── Quality-with-fallback scalar fields ───────────────────────────────────
  const coalesce = <T>(primaryVal: T | null | undefined, fallbacks: (T | null | undefined)[]): T | null => {
    if (primaryVal !== null && primaryVal !== undefined) return primaryVal;
    for (const f of fallbacks) {
      if (f !== null && f !== undefined) return f;
    }
    return null;
  };

  const size_sqm = coalesce(primary.size_sqm, secondaries.map((s) => s?.size_sqm));
  const bedrooms = coalesce<number>(
    typeof primary.bedrooms === 'number' ? primary.bedrooms : null,
    secondaries.map((s) => (typeof s?.bedrooms === 'number' ? s.bedrooms : null)),
  ) ?? 0;
  const floor = coalesce(primary.floor, secondaries.map((s) => s?.floor));
  const year_built = coalesce(primary.year_built, secondaries.map((s) => s?.year_built));

  return {
    // Authority — primary always wins
    price: primary.price,
    currency: primary.currency,
    address: primary.address,
    city: primary.city,
    latitude: primary.latitude,
    longitude: primary.longitude,
    // Quality — richest wins
    description,
    features: Array.from(featureSet),
    images,
    size_sqm,
    bedrooms,
    floor,
    year_built,
    // Display metadata
    priceMin,
    priceMax,
    priceSpreadPct,
  };
}
