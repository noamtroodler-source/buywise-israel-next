import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ListingType = 'buy' | 'rent' | 'project';

export interface ListingData {
  type: ListingType;
  entity_id?: string;   // property_id or project_id for caching
  entity_type?: 'property' | 'project';  // for caching
  price?: number;
  size_sqm?: number;
  price_per_sqm?: number;
  year_built?: number;
  days_on_market?: number;
  price_reduced?: boolean;
  price_drop_percent?: number;
  condition?: string;
  city?: string;
  neighborhood?: string;
  property_type?: string;
  bedrooms?: number;
  has_parking?: boolean;
  has_elevator?: boolean;
  floor?: number;
  total_floors?: number;
  missing_fields?: string[];
  // Project-specific
  delivery_year?: number;
  has_payment_schedule?: boolean;
  has_bank_guarantee?: boolean;
  developer_name?: string;
}

export interface GeneratedQuestion {
  question_text: string;
  why_it_matters: string;
  category: string;
  is_ai_generated: boolean;
}

interface QuestionsResponse {
  questions: GeneratedQuestion[];
  source: 'ai' | 'fallback' | 'empty' | 'cached';
}

async function fetchListingQuestions(listing: ListingData): Promise<QuestionsResponse> {
  const { data, error } = await supabase.functions.invoke('generate-listing-questions', {
    body: { listing }
  });

  if (error) {
    console.error('Error calling generate-listing-questions:', error);
    throw error;
  }

  return data as QuestionsResponse;
}

/**
 * Generate a stable cache key from listing data.
 * Uses entity_id if available (best for server-side cache hits),
 * otherwise falls back to key identifying fields.
 */
function getListingCacheKey(listing: ListingData): string {
  // If we have entity_id, use it as primary key for best cache hits
  if (listing.entity_id) {
    return `${listing.entity_type || 'unknown'}:${listing.entity_id}`;
  }
  
  // Fallback to composite key from listing data
  const keyParts = [
    listing.type,
    listing.price?.toString() || '',
    listing.size_sqm?.toString() || '',
    listing.year_built?.toString() || '',
    listing.city || '',
    listing.neighborhood || '',
    listing.property_type || '',
  ];
  return keyParts.join('|');
}

export function useListingQuestions(listing: ListingData | null) {
  const cacheKey = listing ? getListingCacheKey(listing) : 'no-listing';
  
  return useQuery({
    queryKey: ['listing-questions', cacheKey],
    queryFn: () => fetchListingQuestions(listing!),
    enabled: !!listing,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours - questions don't change often
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
    retry: 1, // Only retry once on failure
    refetchOnWindowFocus: false,
  });
}
