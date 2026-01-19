import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Announcement {
  id: string;
  agency_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useAgencyAnnouncements(agencyId: string | undefined) {
  return useQuery({
    queryKey: ['agencyAnnouncements', agencyId],
    queryFn: async () => {
      if (!agencyId) return [];

      const { data, error } = await supabase
        .from('agency_announcements')
        .select('*')
        .eq('agency_id', agencyId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Announcement[];
    },
    enabled: !!agencyId,
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      agencyId, 
      title, 
      content, 
      is_pinned 
    }: { 
      agencyId: string; 
      title: string; 
      content: string; 
      is_pinned: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('agency_announcements')
        .insert({
          agency_id: agencyId,
          title,
          content,
          is_pinned,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencyAnnouncements'] });
      toast.success('Announcement created');
    },
    onError: (error) => {
      toast.error('Failed to create announcement: ' + error.message);
    },
  });
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      ...updates 
    }: { 
      id: string; 
      title?: string; 
      content?: string; 
      is_pinned?: boolean;
    }) => {
      const { error } = await supabase
        .from('agency_announcements')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencyAnnouncements'] });
      toast.success('Announcement updated');
    },
    onError: (error) => {
      toast.error('Failed to update announcement: ' + error.message);
    },
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('agency_announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencyAnnouncements'] });
      toast.success('Announcement deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete announcement: ' + error.message);
    },
  });
}
