import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { BuyerProfileDimensions, deriveEffectiveBuyerType, DerivedBuyerType } from '@/lib/calculations/buyerProfile';
import { BuyerType } from '@/lib/calculations/purchaseTax';
import { getUserFriendlyError } from '@/utils/userFriendlyErrors';

export interface MortgagePreferencesJson {
  down_payment_percent: number | null;
  down_payment_amount: number | null;
  term_years: number;
  assumed_rate: number;
}

export interface ReadinessSnapshot {
  stage: 'curious' | 'learning' | 'searching' | 'ready';
  completed_at: string;
  confidence_checks: Record<string, boolean>;
  gaps_identified: string[];
}

export interface BuyerProfile {
  id: string;
  user_id: string;
  residency_status: 'israeli_resident' | 'oleh_hadash' | 'non_resident';
  aliyah_year: number | null;
  is_first_property: boolean;
  purchase_purpose: 'primary_residence' | 'vacation_home' | 'investment' | 'undecided';
  buyer_entity: 'individual' | 'company';
  onboarding_completed: boolean;
  // Multi-dimensional fields
  has_existing_property: boolean;
  is_upgrading: boolean;
  upgrade_sale_date: string | null;
  // Arnona discount eligibility
  arnona_discount_categories: string[];
  // Rental budget (optional)
  rental_budget?: number | null;
  // Mortgage preferences (stored as JSON in DB, typed here)
  mortgage_preferences?: MortgagePreferencesJson | null;
  // Saved locations (stored as JSON in DB)
  saved_locations?: unknown[] | null;
  // New preference tracking fields
  target_cities?: string[] | null;
  property_type_preferences?: string[] | null;
  purchase_timeline?: 'immediate' | '1_3_months' | '3_6_months' | '6_12_months' | 'flexible' | null;
  budget_min?: number | null;
  budget_max?: number | null;
  // Readiness snapshot from tool
  readiness_snapshot?: ReadinessSnapshot | null;
  // Onboarding progress tracking
  onboarding_step?: string | null;
  created_at: string;
  updated_at: string;
}

// Helper to safely parse DB response to BuyerProfile
function parseBuyerProfile(data: unknown): BuyerProfile | null {
  if (!data) return null;
  const raw = data as Record<string, unknown>;
  return {
    ...raw,
    mortgage_preferences: raw.mortgage_preferences as MortgagePreferencesJson | null,
    readiness_snapshot: raw.readiness_snapshot as ReadinessSnapshot | null,
  } as BuyerProfile;
}

export type BuyerProfileInsert = Omit<BuyerProfile, 'id' | 'created_at' | 'updated_at'>;

export function useBuyerProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['buyer-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('buyer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return parseBuyerProfile(data);
    },
    enabled: !!user,
  });
}

export function useCreateBuyerProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (profileData: Partial<BuyerProfileInsert>) => {
      if (!user) throw new Error('Not authenticated');

      const insertData = {
        user_id: user.id,
        residency_status: profileData.residency_status || 'israeli_resident',
        aliyah_year: profileData.aliyah_year || null,
        is_first_property: profileData.is_first_property ?? true,
        purchase_purpose: profileData.purchase_purpose || 'primary_residence',
        buyer_entity: profileData.buyer_entity || 'individual',
        onboarding_completed: profileData.onboarding_completed ?? true,
        has_existing_property: profileData.has_existing_property ?? false,
        is_upgrading: profileData.is_upgrading ?? false,
        upgrade_sale_date: profileData.upgrade_sale_date || null,
        arnona_discount_categories: profileData.arnona_discount_categories || [],
        saved_locations: profileData.saved_locations || [],
        mortgage_preferences: profileData.mortgage_preferences || null,
      };

      const { data, error } = await supabase
        .from('buyer_profiles')
        .upsert(insertData as never, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return parseBuyerProfile(data) as BuyerProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-profile'] });
    },
    onError: (error) => {
      toast.error(getUserFriendlyError(error, 'Failed to save preferences. Please try again.'));
    },
  });
}

export function useUpdateBuyerProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (profileData: Partial<BuyerProfile>) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('buyer_profiles')
        .update(profileData as Record<string, unknown>)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return parseBuyerProfile(data) as BuyerProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-profile'] });
      toast.success('Preferences updated');
    },
    onError: (error) => {
      toast.error(getUserFriendlyError(error, 'Failed to update preferences. Please try again.'));
    },
  });
}

/**
 * Convert BuyerProfile to BuyerProfileDimensions for calculations
 */
export function profileToDimensions(profile: BuyerProfile | null): BuyerProfileDimensions {
  if (!profile) {
    return {
      residency_status: 'israeli_resident',
      is_first_property: true,
      buyer_entity: 'individual',
      aliyah_year: null,
      is_upgrading: false,
    };
  }
  
  return {
    residency_status: profile.residency_status,
    is_first_property: profile.is_first_property,
    buyer_entity: profile.buyer_entity,
    aliyah_year: profile.aliyah_year,
    is_upgrading: profile.is_upgrading ?? false,
    has_existing_property: profile.has_existing_property ?? false,
  };
}

/**
 * Get the effective buyer type from profile for tax calculations
 */
export function getEffectiveBuyerType(profile: BuyerProfile | null): DerivedBuyerType {
  const dimensions = profileToDimensions(profile);
  return deriveEffectiveBuyerType(dimensions);
}

/**
 * Get the tax type (BuyerType) from profile
 */
export function getBuyerTaxType(profile: BuyerProfile | null): BuyerType {
  const derived = getEffectiveBuyerType(profile);
  return derived.taxType;
}
/**
 * @deprecated Use getBuyerTaxType() instead for proper 6-category support.
 * This function maps to the legacy 4-category system for backwards compatibility.
 */
export function getBuyerTaxCategory(profile: BuyerProfile | null): 'first_time' | 'oleh' | 'additional' | 'non_resident' {
  if (!profile) return 'first_time';
  
  const derived = getEffectiveBuyerType(profile);
  
  // Map new BuyerType to old category format
  switch (derived.taxType) {
    case 'oleh':
      return 'oleh';
    case 'foreign':
      return 'non_resident';
    case 'first_time':
    case 'upgrader':
      return 'first_time';
    case 'investor':
    case 'company':
      return 'additional';
    default:
      return 'first_time';
  }
}

/**
 * @deprecated Use getBuyerTypeLabel from purchaseTax.ts instead.
 * Get human-readable label for legacy buyer category.
 */
export function getBuyerCategoryLabel(category: 'first_time' | 'oleh' | 'additional' | 'non_resident'): string {
  switch (category) {
    case 'first_time':
      return 'First-Time Buyer';
    case 'oleh':
      return 'Oleh Hadash';
    case 'additional':
      return 'Additional Property';
    case 'non_resident':
      return 'Non-Resident';
    default:
      return 'First-Time Buyer';
  }
}