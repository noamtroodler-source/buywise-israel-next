import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CanonicalMetrics {
  id: string;
  city_slug: string;
  report_version_key: string;
  average_price_sqm: number | null;
  median_apartment_price: number | null;
  yoy_price_change: number | null;
  gross_yield_percent: number | null;
  net_yield_percent: number | null;
  arnona_rate_sqm: number | null;
  arnona_monthly_avg: number | null;
  rental_2_room_min: number | null;
  rental_2_room_max: number | null;
  rental_3_room_min: number | null;
  rental_3_room_max: number | null;
  rental_4_room_min: number | null;
  rental_4_room_max: number | null;
  rental_5_room_min: number | null;
  rental_5_room_max: number | null;
  // Property mix percentages (CBS Q3-Q4 2025)
  resale_percent: number | null;
  new_projects_percent: number | null;
  rentals_percent: number | null;
  source_priority: string | null;
  created_at: string;
  updated_at: string;
}

async function fetchActiveReportVersion(): Promise<string | null> {
  const { data, error } = await supabase
    .from('report_versions')
    .select('version_key')
    .eq('is_active', true)
    .single();

  if (error || !data) return null;
  return data.version_key;
}

async function fetchCanonicalMetrics(citySlug: string): Promise<CanonicalMetrics | null> {
  const versionKey = await fetchActiveReportVersion();
  if (!versionKey) return null;

  const { data, error } = await supabase
    .from('city_canonical_metrics')
    .select('*')
    .eq('city_slug', citySlug)
    .eq('report_version_key', versionKey)
    .single();

  if (error || !data) return null;
  return data as CanonicalMetrics;
}

async function fetchAllCanonicalMetrics(): Promise<CanonicalMetrics[]> {
  const versionKey = await fetchActiveReportVersion();
  if (!versionKey) return [];

  const { data, error } = await supabase
    .from('city_canonical_metrics')
    .select('*')
    .eq('report_version_key', versionKey)
    .order('city_slug');

  if (error || !data) return [];
  return data as CanonicalMetrics[];
}

export function useCanonicalMetrics(citySlug: string) {
  return useQuery({
    queryKey: ['canonical-metrics', citySlug],
    queryFn: () => fetchCanonicalMetrics(citySlug),
    enabled: !!citySlug,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useAllCanonicalMetrics() {
  return useQuery({
    queryKey: ['all-canonical-metrics'],
    queryFn: fetchAllCanonicalMetrics,
    staleTime: 1000 * 60 * 10,
  });
}

// Helper to get rental range for a specific room count
export function getRentalRange(
  metrics: CanonicalMetrics | null | undefined,
  rooms: number
): { min: number | null; max: number | null } {
  if (!metrics) return { min: null, max: null };
  
  switch (rooms) {
    case 2:
      return { min: metrics.rental_2_room_min, max: metrics.rental_2_room_max };
    case 3:
      return { min: metrics.rental_3_room_min, max: metrics.rental_3_room_max };
    case 4:
      return { min: metrics.rental_4_room_min, max: metrics.rental_4_room_max };
    case 5:
      return { min: metrics.rental_5_room_min, max: metrics.rental_5_room_max };
    default:
      return { min: null, max: null };
  }
}
