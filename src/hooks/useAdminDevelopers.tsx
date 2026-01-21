import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type DeveloperStatus = 'pending' | 'active' | 'suspended';

export interface AdminDeveloper {
  id: string;
  user_id: string | null;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  description: string | null;
  logo_url: string | null;
  founded_year: number | null;
  total_projects: number | null;
  is_verified: boolean | null;
  status: string | null;
  verification_status: string | null;
  admin_notes: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  projects_count?: number;
}

export function useAdminDevelopers(status?: DeveloperStatus) {
  return useQuery({
    queryKey: ['admin-developers', status],
    queryFn: async (): Promise<AdminDeveloper[]> => {
      let query = supabase
        .from('developers')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get project counts for each developer
      const developerIds = data?.map(d => d.id) || [];
      
      if (developerIds.length > 0) {
        const { data: projects } = await supabase
          .from('projects')
          .select('developer_id')
          .in('developer_id', developerIds);

        const projectCounts: Record<string, number> = {};
        projects?.forEach(p => {
          if (p.developer_id) {
            projectCounts[p.developer_id] = (projectCounts[p.developer_id] || 0) + 1;
          }
        });

        return (data || []).map(dev => ({
          ...dev,
          projects_count: projectCounts[dev.id] || 0,
        }));
      }

      return (data || []).map(dev => ({ ...dev, projects_count: 0 }));
    },
  });
}

export function useDeveloperStats() {
  return useQuery({
    queryKey: ['admin-developer-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('developers')
        .select('status');

      if (error) throw error;

      const stats = {
        pending: 0,
        active: 0,
        suspended: 0,
        total: data?.length || 0,
      };

      data?.forEach(dev => {
        const status = dev.status as DeveloperStatus;
        if (status in stats) {
          stats[status]++;
        }
      });

      return stats;
    },
  });
}

export function useApproveDeveloper() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (developerId: string) => {
      const { error } = await supabase
        .from('developers')
        .update({
          status: 'active',
          verification_status: 'approved',
          is_verified: true,
          approved_at: new Date().toISOString(),
        })
        .eq('id', developerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-developers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-developer-stats'] });
      queryClient.invalidateQueries({ queryKey: ['developerProfile'] });
      toast.success('Developer approved successfully');
    },
    onError: (error) => {
      console.error('Approval error:', error);
      toast.error('Failed to approve developer');
    },
  });
}

export function useSuspendDeveloper() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (developerId: string) => {
      const { error } = await supabase
        .from('developers')
        .update({
          status: 'suspended',
          verification_status: 'suspended',
          is_verified: false,
        })
        .eq('id', developerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-developers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-developer-stats'] });
      toast.success('Developer suspended');
    },
    onError: () => {
      toast.error('Failed to suspend developer');
    },
  });
}

export function useReinstateDeveloper() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (developerId: string) => {
      const { error } = await supabase
        .from('developers')
        .update({
          status: 'active',
          verification_status: 'approved',
          is_verified: true,
        })
        .eq('id', developerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-developers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-developer-stats'] });
      queryClient.invalidateQueries({ queryKey: ['developerProfile'] });
      toast.success('Developer reinstated');
    },
    onError: (error) => {
      console.error('Reinstate error:', error);
      toast.error('Failed to reinstate developer');
    },
  });
}
