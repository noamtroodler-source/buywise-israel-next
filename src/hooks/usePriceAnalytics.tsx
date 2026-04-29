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
  inquiryConversionRate: number;
  confidenceDistribution: { tier: string; count: number; percentage: number }[];
  reviewReasons: { reason: string; count: number }[];
  recentEvents: { eventType: string; count: number }[];
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
  inquiryConversionRate: 0,
  confidenceDistribution: [],
  reviewReasons: [],
  recentEvents: [],
};

export function usePriceAnalytics(days: number = 30) {
  return useQuery({
    queryKey: ['price-analytics', days],
    queryFn: async (): Promise<PriceAnalyticsData> => {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const { data: properties } = await (supabase
        .from('properties')
        .select('id, city, price, size_sqm, bedrooms, listing_status, price_context_badge_status, price_context_confidence_tier, price_context_percentage_suppressed, benchmark_review_status, benchmark_review_reason') as any)
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

      const [{ data: inquiries }, { data: views }, { data: events }] = await Promise.all([
        (supabase.from('property_inquiries').select('property_id, created_at') as any).gte('created_at', since),
        (supabase.from('property_views').select('property_id, created_at') as any).gte('created_at', since),
        (supabase.from('price_context_events' as any).select('event_type, created_at') as any).gte('created_at', since),
      ]);

      const completePropertyIds = new Set(propertyRows.filter(p => p.price_context_badge_status === 'complete').map(p => p.id));
      const completeViews = (views ?? []).filter((view: any) => completePropertyIds.has(view.property_id)).length;
      const completeInquiries = (inquiries ?? []).filter((inquiry: any) => completePropertyIds.has(inquiry.property_id)).length;
      const eventCounts = ((events ?? []) as any[]).reduce((acc: Record<string, number>, event: any) => {
        const key = event.event_type || 'unknown';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

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
        inquiryConversionRate: completeViews ? (completeInquiries / completeViews) * 100 : 0,
        confidenceDistribution,
        reviewReasons: Object.entries(reviewReasonCounts).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count),
        recentEvents: Object.entries(eventCounts).map(([eventType, count]) => ({ eventType, count: Number(count) })).sort((a, b) => b.count - a.count),
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
