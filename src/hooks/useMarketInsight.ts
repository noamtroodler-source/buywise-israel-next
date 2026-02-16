import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MarketInsightInput {
  property_id: string;
  price: number;
  size_sqm: number | null;
  city: string;
  neighborhood: string | null;
  property_type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  floor: number | null;
  total_floors: number | null;
  year_built: number | null;
  condition: string | null;
  has_elevator: boolean | null;
  parking: number | null;
  has_balcony: boolean | null;
  has_storage: boolean | null;
  is_accessible: boolean | null;
  entry_date: string | null;
  days_on_market: number;
  original_price: number | null;
  description_snippet: string | null;
  features: string[] | null;
  listing_status: string;
  city_avg_price_sqm: number | null;
  city_yoy_change: number | null;
  comp_count: number;
  avg_comp_deviation_percent: number | null;
}

function computeInputHash(input: MarketInsightInput): string {
  // Simple hash from key numeric values that would change the insight
  const parts = [
    input.price,
    input.size_sqm,
    input.city,
    input.comp_count,
    input.avg_comp_deviation_percent?.toFixed(0),
    input.city_avg_price_sqm?.toFixed(0),
    input.city_yoy_change?.toFixed(1),
    input.condition,
    input.original_price,
  ].join('|');
  
  // Simple string hash
  let hash = 0;
  for (let i = 0; i < parts.length; i++) {
    const char = parts.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function useMarketInsight(input: MarketInsightInput | null) {
  return useQuery({
    queryKey: ['market-insight', input?.property_id, input?.comp_count, input?.avg_comp_deviation_percent],
    queryFn: async () => {
      if (!input) return null;

      const inputHash = computeInputHash(input);
      const pricePerSqm = input.size_sqm ? input.price / input.size_sqm : null;

      const { data, error } = await supabase.functions.invoke('generate-market-insight', {
        body: {
          ...input,
          price_per_sqm: pricePerSqm,
          input_hash: inputHash,
          description_snippet: input.description_snippet?.slice(0, 500) || null,
        },
      });

      if (error) {
        console.error('Market insight error:', error);
        return null;
      }

      return data?.insight as string | null;
    },
    enabled: !!input && input.comp_count > 0,
    staleTime: 10 * 60 * 1000, // 10 min client-side
    retry: false,
  });
}
