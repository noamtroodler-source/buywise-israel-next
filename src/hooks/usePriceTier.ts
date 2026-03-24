import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type PriceTier = 'standard' | 'premium' | 'luxury';

export interface PriceTierResult {
  tier: PriceTier | null;
  tierLabel: string | null;
  tierAvgPriceSqm: number | null;
  tierAvgTotalPrice: number | null;
  p33: number | null;
  p67: number | null;
  transactionCount: number;
}

/**
 * Classifies a property into a price tier (Standard/Premium/Luxury)
 * based on city-wide sold_transactions percentiles.
 *
 * @param city - City name
 * @param rooms - Israeli standard room count (use getIsraeliRoomCount)
 * @param propertyPriceSqm - This property's price per sqm
 */
export function usePriceTier(
  city: string | undefined,
  rooms: number | null | undefined,
  propertyPriceSqm: number | null | undefined
): PriceTierResult {
  const { data } = useQuery({
    queryKey: ['city-price-tiers', city, rooms],
    queryFn: async () => {
      if (!city) return null;

      const { data, error } = await supabase.rpc('get_city_price_tiers', {
        p_city: city,
        p_rooms: rooms ?? null,
        p_months_back: 24,
      });

      if (error) {
        console.error('Error fetching price tiers:', error);
        return null;
      }

      // Function returns empty when < 20 transactions
      if (!data || data.length === 0) return null;

      const row = data[0] as Record<string, unknown>;
      return {
        p33: Number(row.p33_price_sqm),
        p67: Number(row.p67_price_sqm),
        transactionCount: Number(row.transaction_count),
        tierAvgStandard: Number(row.tier_avg_standard),
        tierAvgPremium: Number(row.tier_avg_premium),
        tierAvgLuxury: Number(row.tier_avg_luxury),
        tierAvgPriceStandard: Number(row.tier_avg_price_standard),
        tierAvgPricePremium: Number(row.tier_avg_price_premium),
        tierAvgPriceLuxury: Number(row.tier_avg_price_luxury),
      };
    },
    enabled: Boolean(city),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  if (!data || !propertyPriceSqm) {
    return { tier: null, tierLabel: null, tierAvgPriceSqm: null, tierAvgTotalPrice: null, p33: null, p67: null, transactionCount: 0 };
  }

  let tier: PriceTier;
  let tierAvgPriceSqm: number;
  let tierAvgTotalPrice: number;

  if (propertyPriceSqm <= data.p33) {
    tier = 'standard';
    tierAvgPriceSqm = data.tierAvgStandard;
    tierAvgTotalPrice = data.tierAvgPriceStandard;
  } else if (propertyPriceSqm <= data.p67) {
    tier = 'premium';
    tierAvgPriceSqm = data.tierAvgPremium;
    tierAvgTotalPrice = data.tierAvgPricePremium;
  } else {
    tier = 'luxury';
    tierAvgPriceSqm = data.tierAvgLuxury;
    tierAvgTotalPrice = data.tierAvgPriceLuxury;
  }

  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);

  return {
    tier,
    tierLabel,
    tierAvgPriceSqm,
    tierAvgTotalPrice,
    p33: data.p33,
    p67: data.p67,
    transactionCount: data.transactionCount,
  };
}
