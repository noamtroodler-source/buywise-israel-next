import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RentalPrice {
  id: string;
  city: string;
  rooms: number;
  price_min: number;
  price_max: number;
  currency: string;
  updated_at: string;
  created_at: string;
}

export function useRentalPrices(city: string) {
  return useQuery({
    queryKey: ['rental-prices', city],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rental_prices')
        .select('*')
        .eq('city', city)
        .order('rooms', { ascending: true });

      if (error) throw error;
      return data as RentalPrice[];
    },
    enabled: !!city,
  });
}
