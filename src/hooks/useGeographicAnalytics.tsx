import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays } from 'date-fns';

export interface CityAnalytics {
  city: string;
  propertyCount: number;
  totalViews: number;
  totalInquiries: number;
  conversionRate: number;
}

export interface GeographicData {
  topCities: CityAnalytics[];
  totalCities: number;
}

export function useGeographicAnalytics(days: number = 30) {
  return useQuery({
    queryKey: ['geographic-analytics', days],
    queryFn: async (): Promise<GeographicData> => {
      const startDate = subDays(new Date(), days);
      const startDateStr = startDate.toISOString();

      // Get properties with their cities
      const { data: properties } = await supabase
        .from('properties')
        .select('id, city, views_count');

      if (!properties || properties.length === 0) {
        return { topCities: [], totalCities: 0 };
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

      // Create property-to-city map
      const propertyToCity: Record<string, string> = {};
      properties.forEach(p => {
        propertyToCity[p.id] = p.city;
      });

      // Aggregate by city
      const cityData: Record<string, CityAnalytics> = {};

      // Count properties per city
      properties.forEach(p => {
        if (!cityData[p.city]) {
          cityData[p.city] = {
            city: p.city,
            propertyCount: 0,
            totalViews: 0,
            totalInquiries: 0,
            conversionRate: 0,
          };
        }
        cityData[p.city].propertyCount++;
        cityData[p.city].totalViews += p.views_count || 0;
      });

      // Count views per city (from property_views in date range)
      const viewsInRange: Record<string, number> = {};
      (views || []).forEach(v => {
        const city = propertyToCity[v.property_id];
        if (city) {
          viewsInRange[city] = (viewsInRange[city] || 0) + 1;
        }
      });

      // Count inquiries per city
      (inquiries || []).forEach(inq => {
        const city = propertyToCity[inq.property_id];
        if (city && cityData[city]) {
          cityData[city].totalInquiries++;
        }
      });

      // Calculate conversion rates and use date-range views
      Object.keys(cityData).forEach(city => {
        const data = cityData[city];
        // Use date-range views if available, otherwise fall back to all-time
        const rangeViews = viewsInRange[city] || 0;
        if (rangeViews > 0) {
          data.totalViews = rangeViews;
        }
        data.conversionRate = data.totalViews > 0 
          ? (data.totalInquiries / data.totalViews) * 100 
          : 0;
      });

      // Sort by views and take top cities
      const sortedCities = Object.values(cityData)
        .sort((a, b) => b.totalViews - a.totalViews)
        .slice(0, 10);

      return {
        topCities: sortedCities,
        totalCities: Object.keys(cityData).length,
      };
    },
  });
}
