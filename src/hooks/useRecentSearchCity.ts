import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { safeGetJSON, safeSetJSON } from '@/utils/safeStorage';

const LAST_CITY_KEY = 'bw_last_search_city';

export interface RecentCity {
  name: string;
  lat: number;
  lng: number;
  timestamp: number;
}

function isRecentCity(data: unknown): data is RecentCity {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.name === 'string' &&
    typeof obj.lat === 'number' &&
    typeof obj.lng === 'number' &&
    typeof obj.timestamp === 'number'
  );
}

interface UseRecentSearchCityReturn {
  recentCity: RecentCity | null;
  isLoading: boolean;
  saveCity: (city: RecentCity) => void;
}

export function useRecentSearchCity(): UseRecentSearchCityReturn {
  const { user } = useAuth();
  const [recentCity, setRecentCity] = useState<RecentCity | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRecentCity = async () => {
      setIsLoading(true);

      // First, check localStorage for any user
      const localCity = safeGetJSON<RecentCity | null>(LAST_CITY_KEY, null, isRecentCity);
      
      if (localCity) {
        setRecentCity(localCity);
        setIsLoading(false);
        return;
      }

      // For logged-in users, check search_analytics for most common city
      if (user) {
        try {
          const { data, error } = await supabase
            .from('search_analytics')
            .select('cities')
            .eq('user_id', user.id)
            .not('cities', 'is', null)
            .order('created_at', { ascending: false })
            .limit(10);

          if (!error && data && data.length > 0) {
            // Find the most common city
            const cityCounts = new Map<string, number>();
            for (const row of data) {
              const cities = row.cities as string[] | null;
              if (cities && cities.length > 0) {
                const city = cities[0];
                cityCounts.set(city, (cityCounts.get(city) || 0) + 1);
              }
            }

            if (cityCounts.size > 0) {
              // Get the city with highest count
              let topCity = '';
              let topCount = 0;
              cityCounts.forEach((count, city) => {
                if (count > topCount) {
                  topCount = count;
                  topCity = city;
                }
              });

              if (topCity) {
                // Fetch city coordinates from cities table
                const { data: cityData } = await supabase
                  .from('cities')
                  .select('name, center_lat, center_lng')
                  .eq('name', topCity)
                  .maybeSingle();

                if (cityData && cityData.center_lat && cityData.center_lng) {
                  const foundCity: RecentCity = {
                    name: cityData.name,
                    lat: cityData.center_lat,
                    lng: cityData.center_lng,
                    timestamp: Date.now(),
                  };
                  setRecentCity(foundCity);
                  // Also save to localStorage for next time
                  safeSetJSON(LAST_CITY_KEY, foundCity);
                }
              }
            }
          }
        } catch (err) {
          console.warn('Failed to fetch search analytics:', err);
        }
      }

      setIsLoading(false);
    };

    loadRecentCity();
  }, [user]);

  const saveCity = useCallback((city: RecentCity) => {
    const cityWithTimestamp = { ...city, timestamp: Date.now() };
    setRecentCity(cityWithTimestamp);
    safeSetJSON(LAST_CITY_KEY, cityWithTimestamp);
  }, []);

  return { recentCity, isLoading, saveCity };
}

// Helper to save city from anywhere (for use in PropertyFilters, etc.)
export function saveRecentCity(name: string, lat: number, lng: number): void {
  const city: RecentCity = {
    name,
    lat,
    lng,
    timestamp: Date.now(),
  };
  safeSetJSON(LAST_CITY_KEY, city);
}
