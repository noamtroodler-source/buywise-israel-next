import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { Property, PropertyType, ListingStatus } from '@/types/database';

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
      return data as Property[];
    },
    enabled: !!agentProfile,
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();
  const { data: agentProfile } = useAgentProfile();

  return useMutation({
    mutationFn: async (propertyData: CreatePropertyData) => {
      if (!agentProfile) throw new Error('Agent profile not found');

      const { data, error } = await supabase
        .from('properties')
        .insert({
          ...propertyData,
          agent_id: agentProfile.id,
          property_type: propertyData.property_type as any,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentProperties'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Property created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create property: ' + error.message);
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
