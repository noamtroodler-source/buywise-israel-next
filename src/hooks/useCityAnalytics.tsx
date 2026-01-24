import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays } from 'date-fns';

export interface CityMetrics {
  city: string;
  listings: number;
  avgPrice: number;
  avgPriceSqm: number;
  totalViews: number;
  totalInquiries: number;
  conversionRate: number;
  avgDaysOnMarket: number | null;
}

export interface CityAnalyticsData {
  cities: CityMetrics[];
  totalCities: number;
}

export function useCityAnalytics(days: number = 30) {
  return useQuery({
    queryKey: ['city-analytics', days],
    queryFn: async (): Promise<CityAnalyticsData> => {
      const startDate = subDays(new Date(), days);
      const startDateStr = startDate.toISOString();

      // Get all properties
      const { data: properties } = await supabase
        .from('properties')
        .select('id, city, price, size_sqm, views_count, listing_status, created_at');

      if (!properties || properties.length === 0) {
        return { cities: [], totalCities: 0 };
      }

      // Get property views in date range
      const { data: views } = await supabase
        .from('property_views')
        .select('property_id')
        .gte('viewed_at', startDateStr);

      // Get inquiries in date range
      const { data: inquiries } = await supabase
        .from('property_inquiries')
        .select('property_id')
        .gte('created_at', startDateStr);

      // Get listing lifecycle for DOM
      const { data: lifecycle } = await supabase
        .from('listing_lifecycle')
        .select('entity_id, days_on_market')
        .eq('entity_type', 'property')
        .not('days_on_market', 'is', null);

      // Create property-to-city map
      const propertyToCity: Record<string, string> = {};
      properties.forEach(p => {
        propertyToCity[p.id] = p.city;
      });

      // Aggregate by city
      const cityData: Record<string, {
        listings: number;
        prices: number[];
        pricesPerSqm: number[];
        views: number;
        inquiries: number;
        daysOnMarket: number[];
      }> = {};

      // Count properties and collect prices
      properties.forEach(p => {
        if (!cityData[p.city]) {
          cityData[p.city] = {
            listings: 0,
            prices: [],
            pricesPerSqm: [],
            views: 0,
            inquiries: 0,
            daysOnMarket: [],
          };
        }
        
        if (p.listing_status === 'for_sale' || p.listing_status === 'for_rent') {
          cityData[p.city].listings++;
        }
        
        if (p.price && p.price > 0) {
          cityData[p.city].prices.push(p.price);
          if (p.size_sqm && p.size_sqm > 0) {
            cityData[p.city].pricesPerSqm.push(p.price / p.size_sqm);
          }
        }
        
        cityData[p.city].views += p.views_count || 0;
      });

      // Count views from date range
      (views || []).forEach(v => {
        const city = propertyToCity[v.property_id];
        if (city && cityData[city]) {
          cityData[city].views++;
        }
      });

      // Count inquiries
      (inquiries || []).forEach(inq => {
        const city = propertyToCity[inq.property_id];
        if (city && cityData[city]) {
          cityData[city].inquiries++;
        }
      });

      // Add DOM data
      (lifecycle || []).forEach(lc => {
        const city = propertyToCity[lc.entity_id];
        if (city && cityData[city] && lc.days_on_market !== null) {
          cityData[city].daysOnMarket.push(lc.days_on_market);
        }
      });

      // Calculate final metrics
      const cities: CityMetrics[] = Object.entries(cityData)
        .map(([city, data]) => ({
          city,
          listings: data.listings,
          avgPrice: data.prices.length > 0 
            ? data.prices.reduce((a, b) => a + b, 0) / data.prices.length 
            : 0,
          avgPriceSqm: data.pricesPerSqm.length > 0
            ? data.pricesPerSqm.reduce((a, b) => a + b, 0) / data.pricesPerSqm.length
            : 0,
          totalViews: data.views,
          totalInquiries: data.inquiries,
          conversionRate: data.views > 0 
            ? (data.inquiries / data.views) * 100 
            : 0,
          avgDaysOnMarket: data.daysOnMarket.length > 0
            ? data.daysOnMarket.reduce((a, b) => a + b, 0) / data.daysOnMarket.length
            : null,
        }))
        .sort((a, b) => b.listings - a.listings);

      return {
        cities,
        totalCities: cities.length,
      };
    },
  });
}
