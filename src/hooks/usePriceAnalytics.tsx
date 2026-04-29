import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CityPriceData {
  city: string;
  avgPrice: number;
  avgPriceSqm: number;
  count: number;
}

export interface PriceRangeData {
  range: string;
  count: number;
  percentage: number;
}

export interface BedroomDistribution {
  bedrooms: string;
  count: number;
  percentage: number;
}

export interface PriceContextKpis {
  totalListings: number;
  complete: number;
  incomplete: number;
  underReview: number;
  rankingReady: number;
  suppressed: number;
  blockedFromBoost: number;
  completionRate: number;
  rankingReadinessRate: number;
  suppressionRate: number;
  highConfidence: number;
  moduleViews: number;
  buyerQuestionEngagements: number;
  postViewInquiries: number;
  savesAfterContextView: number;
  detailsOpened: number;
  comparableViews: number;
  helpfulFeedback: number;
  notHelpfulFeedback: number;
  questionEngagementRate: number;
  inquiryConversionRate: number;
  saveAfterContextViewRate: number;
  detailsOpenRate: number;
  helpfulFeedbackRate: number;
  premiumContextCompletionRate: number;
  priceContextCompleteBadgeRate: number;
  benchmarkReviewRequestRate: number;
  contextCompleteInquiryConversionRate: number;
  contextIncompleteInquiryConversionRate: number;
  avgLeadQualityRating: number;
  contextCompleteAvgLeadQualityRating: number;
  avgTimeToPublishHours: number;
  highGapListings: number;
  highGapRate: number;
  highGapWithoutPremiumExplanation: number;
  unknownSqmSource: number;
  unknownSqmSourceRate: number;
  unknownOwnership: number;
  unknownOwnershipRate: number;
  adminCorrectionEvents: number;
  adminCorrectionRate: number;
  correctionEvents: { eventType: string; count: number }[];
  confidenceDistribution: { tier: string; count: number; percentage: number }[];
  reviewReasons: { reason: string; count: number }[];
  insufficientDataByCity: { city: string; count: number; percentage: number }[];
  recentEvents: { eventType: string; count: number }[];
  qualityIssues: { issue: string; count: number; percentage: number; severity: 'critical' | 'warning' | 'info' }[];
}

export interface PriceAnalyticsData {
  cityPrices: CityPriceData[];
  priceRanges: PriceRangeData[];
  bedroomDistribution: BedroomDistribution[];
  avgPlatformPrice: number;
  avgPlatformPriceSqm: number;
  medianPrice: number;
  priceContext: PriceContextKpis;
}

const emptyPriceContext: PriceContextKpis = {
  totalListings: 0,
  complete: 0,
  incomplete: 0,
  underReview: 0,
  rankingReady: 0,
  suppressed: 0,
  blockedFromBoost: 0,
  completionRate: 0,
  rankingReadinessRate: 0,
  suppressionRate: 0,
  highConfidence: 0,
  moduleViews: 0,
  buyerQuestionEngagements: 0,
  postViewInquiries: 0,
  savesAfterContextView: 0,
  detailsOpened: 0,
  comparableViews: 0,
  helpfulFeedback: 0,
  notHelpfulFeedback: 0,
  questionEngagementRate: 0,
  inquiryConversionRate: 0,
  saveAfterContextViewRate: 0,
  detailsOpenRate: 0,
  helpfulFeedbackRate: 0,
  premiumContextCompletionRate: 0,
  priceContextCompleteBadgeRate: 0,
  benchmarkReviewRequestRate: 0,
  contextCompleteInquiryConversionRate: 0,
  contextIncompleteInquiryConversionRate: 0,
  avgLeadQualityRating: 0,
  contextCompleteAvgLeadQualityRating: 0,
  avgTimeToPublishHours: 0,
  highGapListings: 0,
  highGapRate: 0,
  highGapWithoutPremiumExplanation: 0,
  unknownSqmSource: 0,
  unknownSqmSourceRate: 0,
  unknownOwnership: 0,
  unknownOwnershipRate: 0,
  adminCorrectionEvents: 0,
  adminCorrectionRate: 0,
  correctionEvents: [],
  confidenceDistribution: [],
  reviewReasons: [],
  insufficientDataByCity: [],
  recentEvents: [],
  qualityIssues: [],
};

export function usePriceAnalytics(days: number = 30) {
  return useQuery({
    queryKey: ['price-analytics', days],
    queryFn: async (): Promise<PriceAnalyticsData> => {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const { data: properties } = await (supabase
        .from('properties')
        .select('id, city, price, size_sqm, bedrooms, listing_status, price_context_badge_status, price_context_confidence_tier, price_context_percentage_suppressed, price_context_public_label, sqm_source, ownership_type, benchmark_review_status, benchmark_review_reason, benchmark_review_requested_at, premium_explanation, premium_drivers, submitted_at, reviewed_at, created_at') as any)
        .eq('listing_status', 'for_sale')
        .gt('price', 0);

      if (!properties || properties.length === 0) {
        return {
          cityPrices: [],
          priceRanges: [],
          bedroomDistribution: [],
          avgPlatformPrice: 0,
          avgPlatformPriceSqm: 0,
          medianPrice: 0,
          priceContext: emptyPriceContext,
        };
      }

      const propertyRows = properties as Array<any>;

      // City-level price data
      const cityData: Record<string, { prices: number[]; sizes: number[] }> = {};
      
      propertyRows.forEach(p => {
        if (!cityData[p.city]) {
          cityData[p.city] = { prices: [], sizes: [] };
        }
        cityData[p.city].prices.push(p.price);
        if (p.size_sqm && p.size_sqm > 0) {
          cityData[p.city].sizes.push(p.price / p.size_sqm);
        }
      });

      const cityPrices: CityPriceData[] = Object.entries(cityData)
        .map(([city, data]) => ({
          city,
          avgPrice: data.prices.reduce((a, b) => a + b, 0) / data.prices.length,
          avgPriceSqm: data.sizes.length > 0 
            ? data.sizes.reduce((a, b) => a + b, 0) / data.sizes.length 
            : 0,
          count: data.prices.length,
        }))
        .sort((a, b) => b.count - a.count);

      // Price ranges (in ILS)
      const priceRangesConfig = [
        { label: 'Under ₪1M', min: 0, max: 1000000 },
        { label: '₪1M - ₪2M', min: 1000000, max: 2000000 },
        { label: '₪2M - ₪3M', min: 2000000, max: 3000000 },
        { label: '₪3M - ₪5M', min: 3000000, max: 5000000 },
        { label: '₪5M - ₪10M', min: 5000000, max: 10000000 },
        { label: 'Over ₪10M', min: 10000000, max: Infinity },
      ];

      const priceRangeCounts = priceRangesConfig.map(range => {
        const count = propertyRows.filter(p => p.price >= range.min && p.price < range.max).length;
        return {
          range: range.label,
          count,
          percentage: (count / propertyRows.length) * 100,
        };
      });

      // Bedroom distribution
      const bedroomCounts: Record<string, number> = {};
      propertyRows.forEach(p => {
        const bedrooms = p.bedrooms || 0;
        const label = bedrooms >= 5 ? '5+' : bedrooms.toString();
        bedroomCounts[label] = (bedroomCounts[label] || 0) + 1;
      });

      const bedroomDistribution = Object.entries(bedroomCounts)
        .map(([bedrooms, count]) => ({
          bedrooms: bedrooms === '0' ? 'Studio' : `${bedrooms} BR`,
          count,
          percentage: (count / propertyRows.length) * 100,
        }))
        .sort((a, b) => {
          const aNum = a.bedrooms === 'Studio' ? 0 : parseInt(a.bedrooms);
          const bNum = b.bedrooms === 'Studio' ? 0 : parseInt(b.bedrooms);
          return aNum - bNum;
        });

      // Platform averages
      const allPrices = propertyRows.map(p => p.price).sort((a, b) => a - b);
      const avgPlatformPrice = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;
      
      const pricesWithSize = propertyRows.filter(p => p.size_sqm && p.size_sqm > 0);
      const avgPlatformPriceSqm = pricesWithSize.length > 0
        ? pricesWithSize.reduce((sum, p) => sum + (p.price / p.size_sqm!), 0) / pricesWithSize.length
        : 0;

      const medianPrice = allPrices[Math.floor(allPrices.length / 2)] || 0;

      const complete = propertyRows.filter(p => p.price_context_badge_status === 'complete').length;
      const underReview = propertyRows.filter(p => p.benchmark_review_status === 'requested' || p.benchmark_review_status === 'under_review').length;
      const incomplete = propertyRows.filter(p => p.price_context_badge_status === 'incomplete' || p.price_context_badge_status === 'blocked').length;
      const highConfidence = propertyRows.filter(p => p.price_context_confidence_tier === 'strong_comparable_match' || p.price_context_confidence_tier === 'high_confidence').length;
      const suppressed = propertyRows.filter(p => p.price_context_percentage_suppressed === true).length;
      const blockedFromBoost = propertyRows.filter(p => p.price_context_badge_status === 'blocked' || p.benchmark_review_status === 'requested' || p.benchmark_review_status === 'under_review').length;
      const highGapListings = propertyRows.filter(p => p.price_context_public_label === 'Large premium — context important').length;
      const highGapWithoutPremiumExplanation = propertyRows.filter(p => p.price_context_public_label === 'Large premium — context important' && !p.premium_explanation).length;
      const unknownSqmSource = propertyRows.filter(p => !p.sqm_source || p.sqm_source === 'unknown').length;
      const unknownOwnership = propertyRows.filter(p => !p.ownership_type || p.ownership_type === 'unknown').length;
      const premiumContextComplete = propertyRows.filter(p => Boolean(p.premium_explanation) || (Array.isArray(p.premium_drivers) && p.premium_drivers.length > 0)).length;
      const benchmarkReviewRequested = propertyRows.filter(p => p.benchmark_review_status === 'requested' || p.benchmark_review_status === 'under_review' || p.benchmark_review_status === 'resolved').length;
      const missingConfidenceTier = propertyRows.filter(p => !p.price_context_confidence_tier).length;
      const missingPublicLabel = propertyRows.filter(p => !p.price_context_public_label).length;
      const missingBadgeStatus = propertyRows.filter(p => !p.price_context_badge_status).length;
      const staleReviewRequests = propertyRows.filter(p => {
        if (p.benchmark_review_status !== 'requested' || !p.benchmark_review_requested_at) return false;
        return Date.now() - new Date(p.benchmark_review_requested_at).getTime() > 7 * 24 * 60 * 60 * 1000;
      }).length;
      const qualityIssues = [
        { issue: 'Missing confidence tier', count: missingConfidenceTier, severity: 'critical' as const },
        { issue: 'Missing public label', count: missingPublicLabel, severity: 'critical' as const },
        { issue: 'Missing badge status', count: missingBadgeStatus, severity: 'critical' as const },
        { issue: 'Unknown SQM source', count: unknownSqmSource, severity: 'warning' as const },
        { issue: 'Unknown ownership type', count: unknownOwnership, severity: 'warning' as const },
        { issue: 'High-gap without premium explanation', count: highGapWithoutPremiumExplanation, severity: 'warning' as const },
        { issue: 'Review requests older than 7 days', count: staleReviewRequests, severity: 'info' as const },
      ]
        .filter((issue) => issue.count > 0)
        .map((issue) => ({ ...issue, percentage: propertyRows.length ? (issue.count / propertyRows.length) * 100 : 0 }))
        .sort((a, b) => b.count - a.count);
      const publishedDurations = propertyRows
        .map(p => {
          const start = p.submitted_at || p.created_at;
          const end = p.reviewed_at;
          if (!start || !end) return null;
          const hours = (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60);
          return Number.isFinite(hours) && hours >= 0 ? hours : null;
        })
        .filter((hours): hours is number => hours != null);
      const rankingReady = propertyRows.filter(p => {
        const blocked = p.price_context_badge_status === 'blocked' || p.benchmark_review_status === 'requested' || p.benchmark_review_status === 'under_review';
        const confidenceReady = p.price_context_confidence_tier === 'strong_comparable_match' || p.price_context_confidence_tier === 'high_confidence' || p.price_context_confidence_tier === 'good_comparable_match';
        return !blocked && p.price_context_badge_status === 'complete' && confidenceReady;
      }).length;

      const confidenceCounts = propertyRows.reduce<Record<string, number>>((acc, p) => {
        const tier = p.price_context_confidence_tier || 'not_set';
        acc[tier] = (acc[tier] || 0) + 1;
        return acc;
      }, {});

      const confidenceDistribution = Object.entries(confidenceCounts)
        .map(([tier, count]) => ({
          tier,
          count,
          percentage: propertyRows.length ? (count / propertyRows.length) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count);

      const reviewReasonCounts = propertyRows.reduce<Record<string, number>>((acc, p) => {
        if (p.benchmark_review_reason) {
          acc[p.benchmark_review_reason] = (acc[p.benchmark_review_reason] || 0) + 1;
        }
        return acc;
      }, {});

      const insufficientDataByCityCounts = propertyRows.reduce<Record<string, number>>((acc, p) => {
        if (p.price_context_confidence_tier === 'insufficient_data') {
          acc[p.city] = (acc[p.city] || 0) + 1;
        }
        return acc;
      }, {});

      const [{ data: inquiries }, { data: views }, { data: favorites }, { data: leadResponses }, { data: events }, { data: userEvents }] = await Promise.all([
        (supabase.from('property_inquiries').select('property_id, created_at') as any).gte('created_at', since),
        (supabase.from('property_views').select('property_id, created_at') as any).gte('created_at', since),
        (supabase.from('favorites').select('property_id, created_at') as any).gte('created_at', since),
        (supabase.from('lead_response_events').select('property_id, lead_quality_rating, price_context_complete, created_at') as any).gte('created_at', since),
        (supabase.from('price_context_events' as any).select('event_type, actor_type, property_id, created_at') as any).gte('created_at', since),
        (supabase.from('user_events').select('event_name, properties, created_at') as any)
          .in('event_name', ['price_context_module_viewed', 'buyer_question_engaged', 'price_context_post_view_inquiry', 'price_context_calculation_opened', 'price_context_details_opened', 'price_context_comparable_sales_viewed', 'price_context_trust_feedback_submitted'])
          .gte('created_at', since),
      ]);

      const completePropertyIds = new Set(propertyRows.filter(p => p.price_context_badge_status === 'complete').map(p => p.id));
      const incompletePropertyIds = new Set(propertyRows.filter(p => p.price_context_badge_status !== 'complete').map(p => p.id));
      const activePropertyIds = new Set(propertyRows.map(p => p.id));
      const completeViews = (views ?? []).filter((view: any) => completePropertyIds.has(view.property_id)).length;
      const completeInquiries = (inquiries ?? []).filter((inquiry: any) => completePropertyIds.has(inquiry.property_id)).length;
      const incompleteInquiries = (inquiries ?? []).filter((inquiry: any) => incompletePropertyIds.has(inquiry.property_id)).length;
      const incompleteViews = (views ?? []).filter((view: any) => incompletePropertyIds.has(view.property_id)).length;
      const savesAfterContextView = (favorites ?? []).filter((favorite: any) => activePropertyIds.has(favorite.property_id)).length;
      const ratedLeadRows = (leadResponses ?? []).filter((row: any) => row.lead_quality_rating != null);
      const contextCompleteRatedLeadRows = ratedLeadRows.filter((row: any) => row.price_context_complete === true || completePropertyIds.has(row.property_id));
      const eventCounts = ((events ?? []) as any[]).reduce((acc: Record<string, number>, event: any) => {
        const key = event.event_type || 'unknown';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const trackedPriceContextEvents = ((userEvents ?? []) as any[]).filter((event: any) => {
        const propertyId = event.properties?.property_id;
        return !propertyId || completePropertyIds.has(propertyId) || activePropertyIds.has(propertyId);
      });
      const moduleViews = trackedPriceContextEvents.filter((event: any) => event.event_name === 'price_context_module_viewed').length;
      const buyerQuestionEngagements = trackedPriceContextEvents.filter((event: any) => event.event_name === 'buyer_question_engaged').length;
      const postViewInquiries = trackedPriceContextEvents.filter((event: any) => event.event_name === 'price_context_post_view_inquiry').length;
      const detailsOpened = trackedPriceContextEvents.filter((event: any) => event.event_name === 'price_context_details_opened' || event.event_name === 'price_context_calculation_opened').length;
      const comparableViews = trackedPriceContextEvents.filter((event: any) => event.event_name === 'price_context_comparable_sales_viewed').length;
      const helpfulFeedback = trackedPriceContextEvents.filter((event: any) => event.event_name === 'price_context_trust_feedback_submitted' && event.properties?.helpful === true).length;
      const notHelpfulFeedback = trackedPriceContextEvents.filter((event: any) => event.event_name === 'price_context_trust_feedback_submitted' && event.properties?.helpful === false).length;
      const correctionRows = ((events ?? []) as any[]).filter((event: any) => {
        const eventType = String(event.event_type || '').toLowerCase();
        return event.actor_type === 'admin' || eventType.includes('correct') || eventType.includes('resolved') || eventType.includes('override');
      });
      const correctionCounts = correctionRows.reduce((acc: Record<string, number>, event: any) => {
        const key = event.event_type || 'admin_correction';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const insufficientDataByCity = Object.entries(insufficientDataByCityCounts).map(([city, count]) => ({
        city,
        count: Number(count),
        percentage: propertyRows.length ? (Number(count) / propertyRows.length) * 100 : 0,
      })).sort((a, b) => b.count - a.count);

      const priceContext: PriceContextKpis = {
        totalListings: propertyRows.length,
        complete,
        incomplete,
        underReview,
        rankingReady,
        suppressed,
        blockedFromBoost,
        completionRate: propertyRows.length ? (complete / propertyRows.length) * 100 : 0,
        rankingReadinessRate: propertyRows.length ? (rankingReady / propertyRows.length) * 100 : 0,
        suppressionRate: propertyRows.length ? (suppressed / propertyRows.length) * 100 : 0,
        highConfidence,
        moduleViews,
        buyerQuestionEngagements,
        postViewInquiries,
        savesAfterContextView,
        detailsOpened,
        comparableViews,
        helpfulFeedback,
        notHelpfulFeedback,
        questionEngagementRate: moduleViews ? (buyerQuestionEngagements / moduleViews) * 100 : 0,
        inquiryConversionRate: moduleViews ? (postViewInquiries / moduleViews) * 100 : completeViews ? (completeInquiries / completeViews) * 100 : 0,
        saveAfterContextViewRate: moduleViews ? (savesAfterContextView / moduleViews) * 100 : 0,
        detailsOpenRate: moduleViews ? (detailsOpened / moduleViews) * 100 : 0,
        helpfulFeedbackRate: helpfulFeedback + notHelpfulFeedback ? (helpfulFeedback / (helpfulFeedback + notHelpfulFeedback)) * 100 : 0,
        premiumContextCompletionRate: propertyRows.length ? (premiumContextComplete / propertyRows.length) * 100 : 0,
        priceContextCompleteBadgeRate: propertyRows.length ? (complete / propertyRows.length) * 100 : 0,
        benchmarkReviewRequestRate: propertyRows.length ? (benchmarkReviewRequested / propertyRows.length) * 100 : 0,
        contextCompleteInquiryConversionRate: completeViews ? (completeInquiries / completeViews) * 100 : 0,
        contextIncompleteInquiryConversionRate: incompleteViews ? (incompleteInquiries / incompleteViews) * 100 : 0,
        avgLeadQualityRating: ratedLeadRows.length ? ratedLeadRows.reduce((sum: number, row: any) => sum + Number(row.lead_quality_rating || 0), 0) / ratedLeadRows.length : 0,
        contextCompleteAvgLeadQualityRating: contextCompleteRatedLeadRows.length ? contextCompleteRatedLeadRows.reduce((sum: number, row: any) => sum + Number(row.lead_quality_rating || 0), 0) / contextCompleteRatedLeadRows.length : 0,
        avgTimeToPublishHours: publishedDurations.length ? publishedDurations.reduce((sum, hours) => sum + hours, 0) / publishedDurations.length : 0,
        highGapListings,
        highGapRate: propertyRows.length ? (highGapListings / propertyRows.length) * 100 : 0,
        highGapWithoutPremiumExplanation,
        unknownSqmSource,
        unknownSqmSourceRate: propertyRows.length ? (unknownSqmSource / propertyRows.length) * 100 : 0,
        unknownOwnership,
        unknownOwnershipRate: propertyRows.length ? (unknownOwnership / propertyRows.length) * 100 : 0,
        adminCorrectionEvents: correctionRows.length,
        adminCorrectionRate: propertyRows.length ? (correctionRows.length / propertyRows.length) * 100 : 0,
        correctionEvents: Object.entries(correctionCounts).map(([eventType, count]) => ({ eventType, count: Number(count) })).sort((a, b) => b.count - a.count),
        confidenceDistribution,
        reviewReasons: Object.entries(reviewReasonCounts).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count),
        insufficientDataByCity,
        recentEvents: Object.entries(eventCounts).map(([eventType, count]) => ({ eventType, count: Number(count) })).sort((a, b) => b.count - a.count),
        qualityIssues,
      };

      return {
        cityPrices,
        priceRanges: priceRangeCounts,
        bedroomDistribution,
        avgPlatformPrice,
        avgPlatformPriceSqm,
        medianPrice,
        priceContext,
      };
    },
  });
}
