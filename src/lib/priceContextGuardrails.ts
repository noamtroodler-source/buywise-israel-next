export interface PriceContextFeatureCandidate {
  listing_status?: string | null;
  price_context_badge_status?: string | null;
  benchmark_review_status?: string | null;
}

export function getPriceContextFeatureGuardrail(candidate: PriceContextFeatureCandidate) {
  if (candidate.listing_status !== 'for_sale') {
    return { eligible: true, reason: null };
  }

  if (candidate.benchmark_review_status === 'requested' || candidate.benchmark_review_status === 'under_review') {
    return {
      eligible: false,
      reason: 'Context under review — resolve the benchmark request before featuring.',
    };
  }

  if (candidate.price_context_badge_status !== 'complete') {
    return {
      eligible: false,
      reason: 'Pricing Context Complete is required before a sale listing can be featured.',
    };
  }

  return { eligible: true, reason: null };
}