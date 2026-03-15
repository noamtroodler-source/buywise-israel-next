import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { getUserFriendlyError } from '@/utils/userFriendlyErrors';
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
  // Explicit amenity booleans
  has_balcony?: boolean;
  has_elevator?: boolean;
  has_storage?: boolean;
  // Lease reality fields
  lease_term?: string;
  subletting_allowed?: string;
  furnished_status?: string;
  pets_policy?: string;
  agent_fee_required?: boolean;
   furniture_items?: string[];
   featured_highlight?: string | null;
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
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (propertyData: CreatePropertyData & { submitForReview?: boolean }) => {
      if (!user) throw new Error('You must be logged in to create a property');
      
      // Fetch agent profile fresh at mutation time to avoid stale closure issues
      const { data: agentProfile, error: profileError } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (profileError) throw new Error('Failed to fetch agent profile');
      if (!agentProfile) throw new Error('Agent profile not found. Please complete agent registration first.');

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
      toast.error(getUserFriendlyError(error, 'Failed to create listing'));
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
          rejection_reason: null,
        } as any)
        .eq('id', propertyId);

      if (error) throw error;
    },
    onMutate: async (propertyId: string) => {
      await queryClient.cancelQueries({ queryKey: ['agentProperties'] });
      const previous = queryClient.getQueryData<AgentProperty[]>(['agentProperties']);
      queryClient.setQueryData<AgentProperty[] | undefined>(['agentProperties'], (old) =>
        old?.map(p =>
          p.id === propertyId
            ? { ...p, verification_status: 'pending_review' as const, rejection_reason: null, submitted_at: new Date().toISOString() }
            : p
        )
      );
      return { previous };
    },
    onError: (error, _propertyId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['agentProperties'], context.previous);
      }
      toast.error(getUserFriendlyError(error, 'Failed to submit for review'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['agentProperties'] });
      queryClient.invalidateQueries({ queryKey: ['pendingReviewCount'] });
    },
    onSuccess: () => {
      toast.success('Listing submitted for review!');
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
      toast.error(getUserFriendlyError(error, 'Failed to update listing'));
    },
  });
}

export function useCreatePropertyForAgency() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (propertyData: CreatePropertyData & { assignedAgentId: string; submitForReview?: boolean }) => {
      if (!user) throw new Error('You must be logged in');

      const { assignedAgentId, submitForReview, ...data } = propertyData;

      const verificationStatus: VerificationStatus = submitForReview ? 'pending_review' : 'draft';
      const submittedAt = submitForReview ? new Date().toISOString() : null;

      const { data: created, error } = await supabase
        .from('properties')
        .insert({
          ...data,
          agent_id: assignedAgentId,
          property_type: data.property_type as any,
          verification_status: verificationStatus,
          submitted_at: submittedAt,
          is_published: false,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return { data: created, submitForReview };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['agencyListingsManagement'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['pendingReviewCount'] });

      if (result.submitForReview) {
        toast.success('Listing submitted for review!');
      } else {
        toast.success('Draft saved successfully');
      }
    },
    onError: (error) => {
      toast.error(getUserFriendlyError(error, 'Failed to create listing'));
    },
  });
}

export function useUpdatePropertyForAgency() {
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
      queryClient.invalidateQueries({ queryKey: ['agencyListingsManagement'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Property updated successfully');
    },
    onError: (error) => {
      toast.error(getUserFriendlyError(error, 'Failed to update listing'));
    },
  });
}

export function useReassignProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ propertyId, newAgentId, newAgentName }: { propertyId: string; newAgentId: string; newAgentName: string }) => {
      const { error } = await supabase
        .from('properties')
        .update({ agent_id: newAgentId } as any)
        .eq('id', propertyId);

      if (error) throw error;
      return { newAgentName };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['agencyListingsManagement'] });
      queryClient.invalidateQueries({ queryKey: ['agentProperties'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success(`Listing reassigned to ${result.newAgentName}`);
    },
    onError: (error) => {
      toast.error('Failed to reassign: ' + error.message);
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
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['agentProperties'] });
      const previous = queryClient.getQueryData<AgentProperty[]>(['agentProperties']);
      queryClient.setQueryData<AgentProperty[] | undefined>(['agentProperties'], (old) =>
        old?.filter(p => p.id !== id)
      );
      return { previous };
    },
    onError: (error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['agentProperties'], context.previous);
      }
      toast.error('Failed to delete property: ' + error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['agentProperties'] });
      queryClient.invalidateQueries({ queryKey: ['agencyListingsManagement'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}

export function useBulkDeleteProperties() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('properties')
        .delete()
        .in('id', ids);

      if (error) throw error;
    },
    onMutate: async (ids: string[]) => {
      await queryClient.cancelQueries({ queryKey: ['agentProperties'] });
      const previous = queryClient.getQueryData<AgentProperty[]>(['agentProperties']);
      const idSet = new Set(ids);
      queryClient.setQueryData<AgentProperty[] | undefined>(['agentProperties'], (old) =>
        old?.filter(p => !idSet.has(p.id))
      );
      return { previous };
    },
    onError: (error, _ids, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['agentProperties'], context.previous);
      }
      toast.error('Failed to delete properties: ' + error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['agentProperties'] });
      queryClient.invalidateQueries({ queryKey: ['agencyListingsManagement'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
    onSuccess: (_data, ids) => {
      toast.success(`${ids.length} listing(s) deleted`);
    },
  });
}

export function useBulkSubmitForReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('properties')
        .update({
          verification_status: 'pending_review',
          submitted_at: new Date().toISOString(),
          rejection_reason: null,
        } as any)
        .in('id', ids);

      if (error) throw error;
    },
    onMutate: async (ids: string[]) => {
      await queryClient.cancelQueries({ queryKey: ['agentProperties'] });
      const previous = queryClient.getQueryData<AgentProperty[]>(['agentProperties']);
      const idSet = new Set(ids);
      queryClient.setQueryData<AgentProperty[] | undefined>(['agentProperties'], (old) =>
        old?.map(p =>
          idSet.has(p.id)
            ? { ...p, verification_status: 'pending_review' as const, rejection_reason: null, submitted_at: new Date().toISOString() }
            : p
        )
      );
      return { previous };
    },
    onError: (error, _ids, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['agentProperties'], context.previous);
      }
      toast.error('Failed to submit: ' + error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['agentProperties'] });
      queryClient.invalidateQueries({ queryKey: ['agencyListingsManagement'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['pendingReviewCount'] });
    },
    onSuccess: (_data, ids) => {
      toast.success(`${ids.length} listing(s) submitted for review`);
    },
  });
}
