import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PropertyFilters } from '@/types/database';

const SESSION_KEY = 'analytics_session_id';

function getSessionId(): string {
  return sessionStorage.getItem(SESSION_KEY) || 'unknown';
}

interface SearchTrackingData {
  listingType?: 'for_sale' | 'for_rent' | 'projects';
  filters?: PropertyFilters;
  resultsCount?: number;
  resultsShown?: number;
  sortOption?: string;
  pageNumber?: number;
}

export function useSearchTracking() {
  const { user } = useAuth();
  const searchStartTime = useRef<number>(Date.now());
  const currentSearchId = useRef<string | null>(null);

  const trackSearchStart = useCallback(() => {
    searchStartTime.current = Date.now();
  }, []);

  const trackSearch = useCallback(async (data: SearchTrackingData) => {
    try {
      const sessionId = getSessionId();
      const timeSpent = Date.now() - searchStartTime.current;

      const { data: result, error } = await supabase.from('search_analytics').insert({
        session_id: sessionId,
        user_id: user?.id || null,
        listing_type: data.listingType || null,
        cities: data.filters?.city ? [data.filters.city] : null,
        neighborhoods: data.filters?.neighborhoods || null,
        property_types: data.filters?.property_types?.map(t => t) || null,
        price_min: data.filters?.min_price || null,
        price_max: data.filters?.max_price || null,
        bedrooms_min: data.filters?.min_rooms || null,
        bedrooms_max: data.filters?.max_rooms || null,
        size_min: data.filters?.min_size || null,
        size_max: data.filters?.max_size || null,
        features_required: data.filters?.features || null,
        results_count: data.resultsCount || null,
        results_shown: data.resultsShown || null,
        sort_option: data.sortOption || null,
        page_number: data.pageNumber || 1,
        time_spent_ms: timeSpent,
      }).select('id').single();

      if (result) {
        currentSearchId.current = result.id;
      }
    } catch (error) {
      console.debug('Search tracking error:', error);
    }
  }, [user]);

  const trackSearchResultClick = useCallback(async (propertyId: string) => {
    if (!currentSearchId.current) return;
    
    try {
      // Get current clicked_result_ids and append
      const { data: current } = await supabase
        .from('search_analytics')
        .select('clicked_result_ids')
        .eq('id', currentSearchId.current)
        .single();

      const existingIds = (current?.clicked_result_ids as string[]) || [];
      if (!existingIds.includes(propertyId)) {
        await supabase
          .from('search_analytics')
          .update({ clicked_result_ids: [...existingIds, propertyId] })
          .eq('id', currentSearchId.current);
      }
    } catch (error) {
      console.debug('Search result click tracking error:', error);
    }
  }, []);

  const trackSearchResultSave = useCallback(async (propertyId: string) => {
    if (!currentSearchId.current) return;
    
    try {
      const { data: current } = await supabase
        .from('search_analytics')
        .select('saved_result_ids')
        .eq('id', currentSearchId.current)
        .single();

      const existingIds = (current?.saved_result_ids as string[]) || [];
      if (!existingIds.includes(propertyId)) {
        await supabase
          .from('search_analytics')
          .update({ saved_result_ids: [...existingIds, propertyId] })
          .eq('id', currentSearchId.current);
      }
    } catch (error) {
      console.debug('Search result save tracking error:', error);
    }
  }, []);

  const trackSearchResultInquiry = useCallback(async (propertyId: string) => {
    if (!currentSearchId.current) return;
    
    try {
      const { data: current } = await supabase
        .from('search_analytics')
        .select('inquired_result_ids')
        .eq('id', currentSearchId.current)
        .single();

      const existingIds = (current?.inquired_result_ids as string[]) || [];
      if (!existingIds.includes(propertyId)) {
        await supabase
          .from('search_analytics')
          .update({ inquired_result_ids: [...existingIds, propertyId] })
          .eq('id', currentSearchId.current);
      }
    } catch (error) {
      console.debug('Search result inquiry tracking error:', error);
    }
  }, []);

  return {
    trackSearchStart,
    trackSearch,
    trackSearchResultClick,
    trackSearchResultSave,
    trackSearchResultInquiry,
  };
}
