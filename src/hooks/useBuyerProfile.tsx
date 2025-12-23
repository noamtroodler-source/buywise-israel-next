import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface BuyerProfile {
  id: string;
  user_id: string;
  residency_status: 'israeli_resident' | 'oleh_hadash' | 'non_resident';
  aliyah_year: number | null;
  is_first_property: boolean;
  purchase_purpose: 'primary_residence' | 'vacation_home' | 'investment' | 'undecided';
  buyer_entity: 'individual' | 'company';
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
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
      return data as BuyerProfile | null;
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

      const { data, error } = await supabase
        .from('buyer_profiles')
        .insert({
          user_id: user.id,
          residency_status: profileData.residency_status || 'israeli_resident',
          aliyah_year: profileData.aliyah_year || null,
          is_first_property: profileData.is_first_property ?? true,
          purchase_purpose: profileData.purchase_purpose || 'primary_residence',
          buyer_entity: profileData.buyer_entity || 'individual',
          onboarding_completed: profileData.onboarding_completed ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return data as BuyerProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-profile'] });
    },
    onError: (error) => {
      toast.error('Failed to save preferences: ' + error.message);
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
        .update(profileData)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as BuyerProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-profile'] });
      toast.success('Preferences updated');
    },
    onError: (error) => {
      toast.error('Failed to update preferences: ' + error.message);
    },
  });
}

// Helper function to determine buyer type for tax calculations
export function getBuyerTaxCategory(profile: BuyerProfile | null): 'first_time' | 'oleh' | 'additional' | 'non_resident' {
  if (!profile) return 'first_time'; // Default assumption
  
  // Check if Oleh Hadash benefits still apply (within 7 years)
  if (profile.residency_status === 'oleh_hadash' && profile.aliyah_year) {
    const currentYear = new Date().getFullYear();
    const yearsInIsrael = currentYear - profile.aliyah_year;
    if (yearsInIsrael <= 7) {
      return 'oleh';
    }
  }
  
  // Non-resident always pays higher rate
  if (profile.residency_status === 'non_resident') {
    return 'non_resident';
  }
  
  // Israeli resident - check if first property
  if (profile.is_first_property) {
    return 'first_time';
  }
  
  return 'additional';
}

// 2025 Tax brackets based on research
export function calculatePurchaseTax(price: number, buyerCategory: 'first_time' | 'oleh' | 'additional' | 'non_resident'): number {
  switch (buyerCategory) {
    case 'first_time':
      // First-time buyer brackets (2025)
      if (price <= 1978745) return 0;
      if (price <= 2347040) return (price - 1978745) * 0.035;
      if (price <= 6055070) return (2347040 - 1978745) * 0.035 + (price - 2347040) * 0.05;
      if (price <= 20183565) return (2347040 - 1978745) * 0.035 + (6055070 - 2347040) * 0.05 + (price - 6055070) * 0.08;
      return (2347040 - 1978745) * 0.035 + (6055070 - 2347040) * 0.05 + (20183565 - 6055070) * 0.08 + (price - 20183565) * 0.10;
    
    case 'oleh':
      // Oleh Hadash brackets (2025)
      if (price <= 1978745) return 0;
      if (price <= 6055070) return (price - 1978745) * 0.005;
      if (price <= 20183565) return (6055070 - 1978745) * 0.005 + (price - 6055070) * 0.08;
      return (6055070 - 1978745) * 0.005 + (20183565 - 6055070) * 0.08 + (price - 20183565) * 0.10;
    
    case 'additional':
    case 'non_resident':
      // Investment/Additional property brackets (2025)
      if (price <= 6055070) return price * 0.08;
      return 6055070 * 0.08 + (price - 6055070) * 0.10;
    
    default:
      return 0;
  }
}

// Get human-readable label for buyer category
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
