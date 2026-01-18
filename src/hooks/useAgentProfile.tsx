import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UpdateAgentProfileData {
  id: string;
  name?: string;
  email?: string;
  phone?: string | null;
  bio?: string | null;
  license_number?: string | null;
  years_experience?: number | null;
  languages?: string[] | null;
  specializations?: string[] | null;
  neighborhoods_covered?: string[] | null;
  avatar_url?: string | null;
}

export function useUpdateAgentProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateAgentProfileData) => {
      const { error } = await supabase
        .from('agents')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentProfile'] });
      queryClient.invalidateQueries({ queryKey: ['agent'] });
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update profile: ' + error.message);
    },
  });
}

interface DuplicatePropertyResult {
  newPropertyId: string;
}

export function useDuplicateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (propertyId: string): Promise<DuplicatePropertyResult> => {
      // Fetch the original property
      const { data: original, error: fetchError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (fetchError) throw fetchError;
      if (!original) throw new Error('Property not found');

      // Create a duplicate with modified fields
      const { id, created_at, updated_at, views_count, verification_status, submitted_at, reviewed_at, reviewed_by, rejection_reason, admin_notes, ...propertyData } = original;

      const { data: newProperty, error: insertError } = await supabase
        .from('properties')
        .insert({
          ...propertyData,
          title: `[Copy] ${original.title}`,
          verification_status: 'draft',
          is_published: false,
          submitted_at: null,
          reviewed_at: null,
          reviewed_by: null,
          rejection_reason: null,
          admin_notes: null,
          views_count: 0,
        } as any)
        .select('id')
        .single();

      if (insertError) throw insertError;

      return { newPropertyId: newProperty.id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentProperties'] });
      toast.success('Property duplicated as draft');
    },
    onError: (error) => {
      toast.error('Failed to duplicate property: ' + error.message);
    },
  });
}

export function useUpdatePropertyStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, listing_status }: { id: string; listing_status: string }) => {
      const { error } = await supabase
        .from('properties')
        .update({ listing_status } as any)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentProperties'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Property status updated');
    },
    onError: (error) => {
      toast.error('Failed to update status: ' + error.message);
    },
  });
}
