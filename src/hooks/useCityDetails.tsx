import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CityDetails {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  population: number | null;
  average_price: number | null;
  average_price_sqm: number | null;
  median_apartment_price: number | null;
  price_range_min: number | null;
  price_range_max: number | null;
  yoy_price_change: number | null;
  gross_yield_percent: number | null;
  net_yield_percent: number | null;
  investment_score: number | null;
  arnona_rate_sqm: number | null;
  arnona_monthly_avg: number | null;
  average_vaad_bayit: number | null;
  renovation_cost_basic: number | null;
  renovation_cost_premium: number | null;
  rental_3_room_min: number | null;
  rental_3_room_max: number | null;
  rental_4_room_min: number | null;
  rental_4_room_max: number | null;
  anglo_presence: string | null;
  socioeconomic_rank: number | null;
  commute_time_tel_aviv: number | null;
  has_train_station: boolean | null;
  highlights: string[] | null;
  buyer_profile_match: string[] | null;
  market_outlook: string | null;
  key_developments: string | null;
  hero_image: string | null;
  is_featured: boolean | null;
  // TAMA 38 tracking
  tama38_status: 'active' | 'expired' | 'extended' | null;
  tama38_expiry_date: string | null;
  tama38_notes: string | null;
}

export function useCityDetails(citySlug: string) {
  return useQuery({
    queryKey: ['city-details', citySlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .eq('slug', citySlug)
        .maybeSingle();
      
      if (!data) throw new Error('City not found');

      if (error) throw error;
      return data as CityDetails;
    },
    enabled: !!citySlug,
  });
}

export function useCityComparison(citySlugs: string[]) {
  return useQuery({
    queryKey: ['city-comparison', citySlugs],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .in('slug', citySlugs);

      if (error) throw error;
      return data as CityDetails[];
    },
    enabled: citySlugs.length > 0,
  });
}
