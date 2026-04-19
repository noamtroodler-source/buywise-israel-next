/**
 * useDuplicateCheck — runs check_cross_agency_duplicate_v2 against the current
 * draft listing to detect whether another agency has already published the
 * same property. Used by the property wizards to BLOCK manual duplicate
 * submissions at the door (vs the old "let it in then dispute" model).
 *
 * Returns:
 *   - blocking: a manual-vs-manual collision → submission must be blocked
 *   - non-blocking: existing listing is scraped → caller can proceed and
 *     the silent co-listing logic will handle attribution
 */
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DuplicateCheckInput {
  agencyId: string;
  address: string | null | undefined;
  city: string | null | undefined;
  neighborhood?: string | null;
  size_sqm?: number | null;
  bedrooms?: number | null;
  price?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  floor?: number | null;
  apartment_number?: string | null;
}

export interface DuplicateMatch {
  property_id: string;
  existing_agency_id: string | null;
  existing_source_url: string | null;
  existing_added_manually: boolean;
  existing_import_source: string | null;
  similarity_score: number;
  same_building_different_unit: boolean;
  existing_agency_name?: string | null;
}

const BLOCK_THRESHOLD = 70;

export async function checkDuplicateForSubmission(
  input: DuplicateCheckInput
): Promise<{ blocking: DuplicateMatch | null; soft: DuplicateMatch | null }> {
  if (!input.address || !input.city || !input.agencyId) {
    return { blocking: null, soft: null };
  }

  const { data, error } = await supabase.rpc('check_cross_agency_duplicate_v2', {
    p_attempted_agency_id: input.agencyId,
    p_address: input.address,
    p_city: input.city,
    p_neighborhood: input.neighborhood ?? null,
    p_size_sqm: input.size_sqm ?? null,
    p_bedrooms: input.bedrooms != null ? Math.floor(input.bedrooms) : null,
    p_price: input.price ?? null,
    p_latitude: input.latitude ?? null,
    p_longitude: input.longitude ?? null,
    p_floor_number: input.floor != null ? Math.floor(input.floor) : null,
    p_apartment_number: input.apartment_number ?? null,
  });

  if (error || !data || data.length === 0) {
    return { blocking: null, soft: null };
  }

  const match = data[0] as DuplicateMatch;
  if (match.similarity_score < BLOCK_THRESHOLD) {
    return { blocking: null, soft: null };
  }
  if (match.same_building_different_unit) {
    return { blocking: null, soft: null };
  }

  // Enrich with agency name for the dialog
  if (match.existing_agency_id) {
    const { data: agency } = await supabase
      .from('agencies')
      .select('name')
      .eq('id', match.existing_agency_id)
      .maybeSingle();
    match.existing_agency_name = agency?.name ?? null;
  }

  // BLOCKING only when the existing listing was MANUALLY added by another agency.
  // If it was scraped, the silent co-listing path takes over — no block.
  if (match.existing_added_manually) {
    return { blocking: match, soft: null };
  }
  return { blocking: null, soft: match };
}

export function useDuplicateCheck() {
  return useMutation({
    mutationFn: checkDuplicateForSubmission,
  });
}

export interface CoListingRequestInput {
  requestingAgencyId: string;
  existingPropertyId: string;
  existingAgencyId: string | null;
  attemptedAddress: string;
  attemptedCity: string | null;
  attemptedNeighborhood: string | null;
  similarityScore: number;
  message?: string;
}

export function useRequestCoListing() {
  return useMutation({
    mutationFn: async (input: CoListingRequestInput) => {
      const { error } = await supabase.from('co_listing_requests').insert({
        requesting_agency_id: input.requestingAgencyId,
        existing_property_id: input.existingPropertyId,
        existing_agency_id: input.existingAgencyId,
        attempted_address: input.attemptedAddress,
        attempted_city: input.attemptedCity,
        attempted_neighborhood: input.attemptedNeighborhood,
        similarity_score: input.similarityScore,
        message: input.message ?? null,
      });
      if (error) throw error;
    },
  });
}
