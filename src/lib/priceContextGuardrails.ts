export interface PriceContextFeatureCandidate {
  listing_status?: string | null;
  price_context_confidence_tier?: string | null;
}

export function isPriceContextUnderReview(candidate: PriceContextFeatureCandidate) {
  return false;
}

export function isPriceContextPlacementEligible(candidate: PriceContextFeatureCandidate) {
  if (candidate.listing_status !== 'for_sale') return true;
  return true;
}

export function getPriceContextFeatureGuardrail(candidate: PriceContextFeatureCandidate, requireCompleteContext = true) {
  if (candidate.listing_status !== 'for_sale') {
    return { eligible: true, reason: null };
  }

  return { eligible: true, reason: null };
}