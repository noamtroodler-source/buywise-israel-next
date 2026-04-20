/**
 * useDuplicateCheck — pre-submission duplicate detection for the property
 * wizards. Returns one of four decisions:
 *
 *   - clear             → no match; proceed with normal insert.
 *   - intra_block       → same agency already has this listing; hard block.
 *   - confirm_scrape    → another agency's scrape already lists this; ask
 *                         the agent to confirm "same apartment" (→ upgrade
 *                         primary) or "different unit" (→ jump back & add
 *                         a discriminator).
 *   - confirm_manual    → another agency has MANUALLY listed this property.
 *                         Three paths: co-represent / different unit / dispute.
 *
 * Replaces the old "let it in then dispute" model and the hard-block-on-any
 * cross-agency match model. Co-listing is normal in the Israeli market; the
 * wizard treats it as a confirm step, not a wall.
 */
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DuplicateCheckInput {
  agencyId: string;
  agentId?: string | null;
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

export interface IntraAgencyMatch {
  property_id: string;
  title: string | null;
  created_at: string;
  address: string | null;
  city: string | null;
}

export type DuplicateCheckResult =
  | { kind: 'clear' }
  | { kind: 'intra_block'; match: IntraAgencyMatch }
  | { kind: 'confirm_scrape'; match: DuplicateMatch }
  | { kind: 'confirm_manual'; match: DuplicateMatch };

const BLOCK_THRESHOLD = 70;

export async function checkDuplicateForSubmission(
  input: DuplicateCheckInput,
): Promise<DuplicateCheckResult> {
  if (!input.address || !input.city || !input.agencyId) {
    return { kind: 'clear' };
  }

  // 1. Intra-agency: has this agency already listed this property?
  //    If yes, hard-block — the agent just forgot.
  const { data: intraData } = await (supabase.rpc as any)('check_intra_agency_duplicate', {
    p_agency_id: input.agencyId,
    p_address: input.address,
    p_city: input.city,
    p_size_sqm: input.size_sqm ?? null,
    p_bedrooms: input.bedrooms != null ? Math.floor(input.bedrooms) : null,
    p_floor_number: input.floor != null ? Math.floor(input.floor) : null,
    p_apartment_number: input.apartment_number ?? null,
  });
  if (intraData && intraData.length > 0) {
    return { kind: 'intra_block', match: intraData[0] as unknown as IntraAgencyMatch };
  }

  // 2. Cross-agency: existing property by someone else matching this draft?
  const { data: crossData } = await supabase.rpc('check_cross_agency_duplicate_v2', {
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

  if (!crossData || crossData.length === 0) return { kind: 'clear' };
  const match = crossData[0] as DuplicateMatch;
  if (match.similarity_score < BLOCK_THRESHOLD) return { kind: 'clear' };
  if (match.same_building_different_unit) return { kind: 'clear' };

  // Enrich with agency name for the confirm dialog
  if (match.existing_agency_id) {
    const { data: agency } = await supabase
      .from('agencies')
      .select('name')
      .eq('id', match.existing_agency_id)
      .maybeSingle();
    match.existing_agency_name = agency?.name ?? null;
  }

  return match.existing_added_manually
    ? { kind: 'confirm_manual', match }
    : { kind: 'confirm_scrape', match };
}

export function useDuplicateCheck() {
  return useMutation({
    mutationFn: checkDuplicateForSubmission,
  });
}

// ─── Action RPCs called from the confirm dialog ─────────────────────────────

export async function colistAsSecondary(
  existingPropertyId: string,
  newAgencyId: string,
  newAgentId: string,
): Promise<void> {
  const { error } = await (supabase.rpc as any)('colist_as_secondary', {
    p_existing_property_id: existingPropertyId,
    p_new_agency_id: newAgencyId,
    p_new_agent_id: newAgentId,
  });
  if (error) throw error;
}

export async function upgradePrimaryFromScrape(
  existingPropertyId: string,
  newAgencyId: string,
  newAgentId: string,
): Promise<void> {
  const { error } = await (supabase.rpc as any)('upgrade_primary_from_scrape', {
    p_existing_property_id: existingPropertyId,
    p_new_agency_id: newAgencyId,
    p_new_agent_id: newAgentId,
  });
  if (error) throw error;
}

export async function filePrimaryDisputeWithColist(
  existingPropertyId: string,
  disputingAgencyId: string,
  disputingAgentId: string,
  reason: string | null,
): Promise<string> {
  const { data, error } = await (supabase.rpc as any)('file_primary_dispute_with_colist', {
    p_existing_property_id: existingPropertyId,
    p_disputing_agency_id: disputingAgencyId,
    p_disputing_agent_id: disputingAgentId,
    p_reason: reason,
  });
  if (error) throw error;
  return data as string;
}
