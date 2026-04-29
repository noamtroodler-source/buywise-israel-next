export interface PriceContextFeatureCandidate {
  listing_status?: string | null;
  price_context_badge_status?: string | null;
  benchmark_review_status?: string | null;
  price_context_featured_eligible?: boolean | null;
  price_context_placement_eligible?: boolean | null;
}

export function isPriceContextUnderReview(candidate: PriceContextFeatureCandidate) {
  return candidate.benchmark_review_status === 'requested' || candidate.benchmark_review_status === 'under_review';
}

export function isPriceContextPlacementEligible(candidate: PriceContextFeatureCandidate) {
  if (candidate.listing_status !== 'for_sale') return true;
  if (isPriceContextUnderReview(candidate)) return false;
  return Boolean(candidate.price_context_placement_eligible || candidate.price_context_featured_eligible);
}

export function getPriceContextFeatureGuardrail(candidate: PriceContextFeatureCandidate, requireCompleteContext = true) {
  if (candidate.listing_status !== 'for_sale') {
    return { eligible: true, reason: null };
  }

  if (isPriceContextUnderReview(candidate)) {
    return {
      eligible: false,
      reason: 'Context under review — resolve the benchmark request before featuring.',
    };
  }

  if (requireCompleteContext && candidate.price_context_badge_status !== 'complete') {
    return {
      eligible: false,
      reason: 'Pricing Context Complete is required before a sale listing can be featured.',
    };
  }

  return { eligible: true, reason: null };
}