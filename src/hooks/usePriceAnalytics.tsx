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

export interface PriceAnalyticsData {
  cityPrices: CityPriceData[];
  priceRanges: PriceRangeData[];
  bedroomDistribution: BedroomDistribution[];
  avgPlatformPrice: number;
  avgPlatformPriceSqm: number;
  medianPrice: number;
}

export function usePriceAnalytics() {
  return useQuery({
    queryKey: ['price-analytics'],
    queryFn: async (): Promise<PriceAnalyticsData> => {
      const { data: properties } = await supabase
        .from('properties')
        .select('city, price, size_sqm, bedrooms, listing_status')
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
        };
      }

      // City-level price data
      const cityData: Record<string, { prices: number[]; sizes: number[] }> = {};
      
      properties.forEach(p => {
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
        const count = properties.filter(p => p.price >= range.min && p.price < range.max).length;
        return {
          range: range.label,
          count,
          percentage: (count / properties.length) * 100,
        };
      });

      // Bedroom distribution
      const bedroomCounts: Record<string, number> = {};
      properties.forEach(p => {
        const bedrooms = p.bedrooms || 0;
        const label = bedrooms >= 5 ? '5+' : bedrooms.toString();
        bedroomCounts[label] = (bedroomCounts[label] || 0) + 1;
      });

      const bedroomDistribution = Object.entries(bedroomCounts)
        .map(([bedrooms, count]) => ({
          bedrooms: bedrooms === '0' ? 'Studio' : `${bedrooms} BR`,
          count,
          percentage: (count / properties.length) * 100,
        }))
        .sort((a, b) => {
          const aNum = a.bedrooms === 'Studio' ? 0 : parseInt(a.bedrooms);
          const bNum = b.bedrooms === 'Studio' ? 0 : parseInt(b.bedrooms);
          return aNum - bNum;
        });

      // Platform averages
      const allPrices = properties.map(p => p.price).sort((a, b) => a - b);
      const avgPlatformPrice = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;
      
      const pricesWithSize = properties.filter(p => p.size_sqm && p.size_sqm > 0);
      const avgPlatformPriceSqm = pricesWithSize.length > 0
        ? pricesWithSize.reduce((sum, p) => sum + (p.price / p.size_sqm!), 0) / pricesWithSize.length
        : 0;

      const medianPrice = allPrices[Math.floor(allPrices.length / 2)] || 0;

      return {
        cityPrices,
        priceRanges: priceRangeCounts,
        bedroomDistribution,
        avgPlatformPrice,
        avgPlatformPriceSqm,
        medianPrice,
      };
    },
  });
}
