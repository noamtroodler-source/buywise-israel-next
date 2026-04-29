type PriceContextRankable = {
  id?: string | null;
  created_at?: string | null;
  is_featured?: boolean | null;
  _isBoosted?: boolean | null;
  price_context_badge_status?: string | null;
  price_context_confidence_tier?: string | null;
  benchmark_review_status?: string | null;
  price_context_filter_eligible?: boolean | null;
  price_context_placement_eligible?: boolean | null;
  price_context_featured_eligible?: boolean | null;
};

type PriceContextRankingOptions = {
  enablePlacementBoost?: boolean;
};

const CONFIDENCE_BONUS: Record<string, number> = {
  strong_comparable_match: 24,
  high_confidence: 24,
  good_comparable_match: 16,
  medium_confidence: 16,
  limited_comparable_match: 6,
};

function getPriceContextRankingScore(property: PriceContextRankable, options?: PriceContextRankingOptions) {
  const reviewStatus = property.benchmark_review_status;
  if (reviewStatus === 'requested' || reviewStatus === 'under_review') return -30;

  let score = 0;
  if (options?.enablePlacementBoost) {
    if (property.price_context_placement_eligible) score += 18;
    if (property.price_context_filter_eligible) score += 8;
    if (property.price_context_badge_status === 'complete') score += 32;
    if (property.price_context_badge_status === 'incomplete') score += 4;
  }
  if (property.price_context_badge_status === 'blocked') score -= 18;
  if (options?.enablePlacementBoost && property.price_context_confidence_tier) {
    score += CONFIDENCE_BONUS[property.price_context_confidence_tier] ?? 0;
  }
  return score;
}

export function isPriceContextFeatureEligible(property: PriceContextRankable) {
  const reviewStatus = property.benchmark_review_status;
  if (reviewStatus === 'requested' || reviewStatus === 'under_review') return false;
  if (property.price_context_badge_status !== 'complete') return false;
  if (property.price_context_featured_eligible || property.price_context_placement_eligible) return true;
  return property.price_context_confidence_tier === 'strong_comparable_match' || property.price_context_confidence_tier === 'high_confidence';
}

export function rankByPriceContext<T extends PriceContextRankable>(properties: T[], options?: PriceContextRankingOptions) {
  return [...properties].sort((a, b) => {
    if (Boolean(a._isBoosted) !== Boolean(b._isBoosted)) return a._isBoosted ? -1 : 1;
    if (Boolean(a.is_featured) !== Boolean(b.is_featured)) return a.is_featured ? -1 : 1;

    const scoreDiff = getPriceContextRankingScore(b, options) - getPriceContextRankingScore(a, options);
    if (scoreDiff !== 0) return scoreDiff;

    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });
}
