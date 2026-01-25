import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AppRole } from '@/types/database';

export type UserFilter = 'all' | 'active' | 'banned';

export interface AdminUser {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  is_banned: boolean;
  banned_at: string | null;
  banned_until: string | null;
  ban_reason: string | null;
  roles: AppRole[];
}

export function useAdminUsers(filter: UserFilter = 'all') {
  return useQuery({
    queryKey: ['admin-users', filter],
    queryFn: async (): Promise<AdminUser[]> => {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter === 'active') {
        query = query.or('is_banned.is.null,is_banned.eq.false');
      } else if (filter === 'banned') {
        query = query.eq('is_banned', true);
      }

      const { data: profiles, error: profilesError } = await query;
      if (profilesError) throw profilesError;

      // Fetch roles for all users
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      if (rolesError) throw rolesError;

      // Map roles to users
      const roleMap = roles.reduce((acc: Record<string, AppRole[]>, r) => {
        if (!acc[r.user_id]) acc[r.user_id] = [];
        acc[r.user_id].push(r.role as AppRole);
        return acc;
      }, {});

      return (profiles || []).map((p) => ({
        ...p,
        is_banned: p.is_banned || false,
        roles: roleMap[p.id] || ['user'],
      }));
    },
  });
}

export function useUserStats() {
  return useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_banned');

      if (error) throw error;

      return {
        total: data?.length || 0,
        active: data?.filter(p => !p.is_banned).length || 0,
        banned: data?.filter(p => p.is_banned).length || 0,
      };
    },
  });
}

export function useBanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      banDuration, 
      reason 
    }: { 
      userId: string; 
      banDuration: '1d' | '1w' | '1m' | 'permanent'; 
      reason?: string;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('admin-manage-account', {
        body: { action: 'ban', userId, banDuration, reason },
      });

      if (response.error) throw response.error;
      if (!response.data?.success) throw new Error(response.data?.error || 'Failed to ban user');

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
      toast.success('User banned successfully');
    },
    onError: (error) => {
      console.error('Ban error:', error);
      toast.error('Failed to ban user');
    },
  });
}

export function useUnbanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('admin-manage-account', {
        body: { action: 'unban', userId },
      });

      if (response.error) throw response.error;
      if (!response.data?.success) throw new Error(response.data?.error || 'Failed to unban user');

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
      toast.success('User unbanned successfully');
    },
    onError: (error) => {
      console.error('Unban error:', error);
      toast.error('Failed to unban user');
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('admin-manage-account', {
        body: { action: 'delete', userId },
      });

      if (response.error) throw response.error;
      if (!response.data?.success) throw new Error(response.data?.error || 'Failed to delete user');

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success('User deleted successfully');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Failed to delete user');
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ agentId, userId }: { agentId: string; userId: string | null }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('admin-manage-account', {
        body: { 
          action: 'delete', 
          userId: userId || agentId, 
          entityType: 'agent', 
          entityId: agentId 
        },
      });

      if (response.error) throw response.error;
      if (!response.data?.success) throw new Error(response.data?.error || 'Failed to delete agent');

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-agents'] });
      queryClient.invalidateQueries({ queryKey: ['admin-agent-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
      toast.success('Agent deleted successfully');
    },
    onError: (error) => {
      console.error('Delete agent error:', error);
      toast.error('Failed to delete agent');
    },
  });
}

export function useDeleteDeveloper() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ developerId, userId }: { developerId: string; userId: string | null }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('admin-manage-account', {
        body: { 
          action: 'delete', 
          userId: userId || developerId, 
          entityType: 'developer', 
          entityId: developerId 
        },
      });

      if (response.error) throw response.error;
      if (!response.data?.success) throw new Error(response.data?.error || 'Failed to delete developer');

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-developers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-developer-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
      toast.success('Developer deleted successfully');
    },
    onError: (error) => {
      console.error('Delete developer error:', error);
      toast.error('Failed to delete developer');
    },
  });
}
