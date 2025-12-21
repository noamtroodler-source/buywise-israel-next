import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { AppRole } from '@/types/database';

export function useUserRole() {
  const { user } = useAuth();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['userRoles', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) throw error;
      return data?.map(r => r.role as AppRole) || [];
    },
    enabled: !!user,
  });

  const hasRole = (role: AppRole) => roles.includes(role);
  const isAgent = hasRole('agent');
  const isAdmin = hasRole('admin');
  const isUser = hasRole('user');

  return {
    roles,
    isLoading,
    hasRole,
    isAgent,
    isAdmin,
    isUser,
  };
}
