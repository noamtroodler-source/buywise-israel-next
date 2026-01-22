import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { Property, PropertyType, ListingStatus } from '@/types/database';

export type VerificationStatus = 'draft' | 'pending_review' | 'changes_requested' | 'approved' | 'rejected';

// Extended property type with verification fields for agent dashboard
export interface AgentProperty extends Property {
  verification_status: VerificationStatus;
  reviewed_at: string | null;
  rejection_reason: string | null;
  submitted_at: string | null;
}

export interface CreatePropertyData {
  title: string;
  description?: string;
  property_type: PropertyType;
  listing_status: ListingStatus;
  price: number;
  currency?: string;
  address: string;
  city: string;
  neighborhood?: string;
  latitude?: number | null;
  longitude?: number | null;
  bedrooms: number;
  bathrooms: number;
  size_sqm?: number;
  lot_size_sqm?: number;
  floor?: number;
  total_floors?: number;
  year_built?: number;
  features?: string[];
  images?: string[];
  is_published?: boolean;
  entry_date?: string;
  ac_type?: 'none' | 'split' | 'central' | 'mini_central';
  vaad_bayit_monthly?: number;
  verification_status?: VerificationStatus;
  submitted_at?: string;
  // Lease reality fields
  lease_term?: string;
  subletting_allowed?: string;
  furnished_status?: string;
  pets_policy?: string;
  agent_fee_required?: boolean;
}

export function useAgentProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['agentProfile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useAgentProperties() {
  const { data: agentProfile } = useAgentProfile();

  return useQuery({
    queryKey: ['agentProperties', agentProfile?.id],
    queryFn: async () => {
      if (!agentProfile) return [];
      
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('agent_id', agentProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AgentProperty[];
    },
    enabled: !!agentProfile,
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();
  const { data: agentProfile } = useAgentProfile();

  return useMutation({
    mutationFn: async (propertyData: CreatePropertyData & { submitForReview?: boolean }) => {
      if (!agentProfile) throw new Error('Agent profile not found');

      const { submitForReview, ...data } = propertyData;
      
      // Determine verification status based on action
      const verificationStatus: VerificationStatus = submitForReview ? 'pending_review' : 'draft';
      const submittedAt = submitForReview ? new Date().toISOString() : null;

      const { data: created, error } = await supabase
        .from('properties')
        .insert({
          ...data,
          agent_id: agentProfile.id,
          property_type: data.property_type as any,
          verification_status: verificationStatus,
          submitted_at: submittedAt,
          is_published: false, // Always start unpublished, admin will publish on approval
        } as any)
        .select()
        .single();

      if (error) throw error;
      return { data: created, submitForReview };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['agentProperties'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['pendingReviewCount'] });
      
      if (result.submitForReview) {
        toast.success('Listing submitted for review! We\'ll notify you when it\'s approved.');
      } else {
        toast.success('Draft saved successfully');
      }
    },
    onError: (error) => {
      toast.error('Failed to create property: ' + error.message);
    },
  });
}

export function useSubmitForReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (propertyId: string) => {
      const { error } = await supabase
        .from('properties')
        .update({
          verification_status: 'pending_review',
          submitted_at: new Date().toISOString(),
          rejection_reason: null, // Clear previous rejection reason
        } as any)
        .eq('id', propertyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentProperties'] });
      queryClient.invalidateQueries({ queryKey: ['pendingReviewCount'] });
      toast.success('Listing submitted for review!');
    },
    onError: (error) => {
      toast.error('Failed to submit: ' + error.message);
    },
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...propertyData }: Partial<Property> & { id: string }) => {
      const { data, error } = await supabase
        .from('properties')
        .update(propertyData as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentProperties'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Property updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update property: ' + error.message);
    },
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentProperties'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Property deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete property: ' + error.message);
    },
  });
}
