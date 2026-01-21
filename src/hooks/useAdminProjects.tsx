import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ProjectVerificationStatus = 'draft' | 'pending_review' | 'changes_requested' | 'approved' | 'rejected';

export interface ProjectUnit {
  id: string;
  project_id: string;
  unit_type: string;
  bedrooms: number;
  bathrooms: number;
  size_sqm: number;
  floor: number | null;
  price: number | null;
  floor_plan_url: string | null;
  status: string | null;
}

export function useAdminProjectUnits(projectId: string | undefined) {
  return useQuery({
    queryKey: ['admin-project-units', projectId],
    queryFn: async (): Promise<ProjectUnit[]> => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('project_units')
        .select('*')
        .eq('project_id', projectId)
        .order('bedrooms');
      
      if (error) throw error;
      return data as ProjectUnit[];
    },
    enabled: !!projectId,
  });
}

export interface AdminProject {
  id: string;
  name: string;
  slug: string;
  city: string;
  neighborhood: string | null;
  address: string | null;
  description: string | null;
  images: string[] | null;
  price_from: number | null;
  price_to: number | null;
  total_units: number | null;
  available_units: number | null;
  completion_date: string | null;
  construction_progress_percent: number | null;
  amenities: string[] | null;
  verification_status: string | null;
  admin_feedback: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  status: string | null;
  construction_start: string | null;
  floor_plans: string[] | null;
  developer: {
    id: string;
    name: string;
    logo_url: string | null;
    is_verified: boolean | null;
  } | null;
}

export function useAdminProjects(status?: ProjectVerificationStatus) {
  return useQuery({
    queryKey: ['admin-projects', status],
    queryFn: async (): Promise<AdminProject[]> => {
      let query = supabase
        .from('projects')
        .select(`
          *,
          developer:developers(id, name, logo_url, is_verified)
        `)
        .order('submitted_at', { ascending: false, nullsFirst: false });

      if (status) {
        query = query.eq('verification_status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as AdminProject[];
    },
  });
}

export function useProjectReviewStats() {
  return useQuery({
    queryKey: ['admin-project-review-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('verification_status');

      if (error) throw error;

      const stats: Record<string, number> = {
        draft: 0,
        pending_review: 0,
        changes_requested: 0,
        approved: 0,
        rejected: 0,
      };

      data?.forEach(project => {
        const status = project.verification_status || 'draft';
        if (status in stats) {
          stats[status]++;
        }
      });

      return stats;
    },
  });
}

export function useApproveProject() {
  const queryClient = useQueryClient();

  return useMutation({
  mutationFn: async ({ id, adminFeedback }: { id: string; adminFeedback?: string }) => {
      const { error } = await supabase
        .from('projects')
        .update({
          verification_status: 'approved',
          is_published: true,
          admin_feedback: adminFeedback || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
      queryClient.invalidateQueries({ queryKey: ['admin-project-review-stats'] });
      toast.success('Project approved and published');
    },
    onError: () => {
      toast.error('Failed to approve project');
    },
  });
}

export function useRequestProjectChanges() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, feedback }: { id: string; feedback: string }) => {
      const { error } = await supabase
        .from('projects')
        .update({
          verification_status: 'changes_requested',
          admin_feedback: feedback,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
      queryClient.invalidateQueries({ queryKey: ['admin-project-review-stats'] });
      toast.success('Changes requested');
    },
    onError: () => {
      toast.error('Failed to request changes');
    },
  });
}

export function useRejectProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase
        .from('projects')
        .update({
          verification_status: 'rejected',
          admin_feedback: reason,
          reviewed_at: new Date().toISOString(),
          is_published: false,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
      queryClient.invalidateQueries({ queryKey: ['admin-project-review-stats'] });
      toast.success('Project rejected');
    },
    onError: () => {
      toast.error('Failed to reject project');
    },
  });
}

export function usePendingProjectsCount() {
  return useQuery({
    queryKey: ['pending-projects-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'pending_review');

      if (error) throw error;
      return count || 0;
    },
  });
}
