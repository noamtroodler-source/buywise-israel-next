import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AgencyRole = 'owner' | 'admin' | 'agent' | null;

export interface AgencyPermissions {
  role: AgencyRole;
  isOwner: boolean;
  isAdmin: boolean;       // true for owner OR admin (operational floor)
  isAgent: boolean;
  isMember: boolean;
  canManageBilling: boolean;
  canManageTeam: boolean;
  canEditAgency: boolean;
  canManageListings: boolean;
  canManageImports: boolean;
  canManageFeatured: boolean;
  canPromoteAdmins: boolean;
  canTransferOwnership: boolean;  // owner only
  canDeleteAgency: boolean;       // owner only
  isLoading: boolean;
}

const empty: AgencyPermissions = {
  role: null,
  isOwner: false,
  isAdmin: false,
  isAgent: false,
  isMember: false,
  canManageBilling: false,
  canManageTeam: false,
  canEditAgency: false,
  canManageListings: false,
  canManageImports: false,
  canManageFeatured: false,
  canPromoteAdmins: false,
  canTransferOwnership: false,
  canDeleteAgency: false,
  isLoading: false,
};

export function useAgencyPermissions(agencyId: string | undefined | null): AgencyPermissions {
  const { user } = useAuth();

  const { data: role, isLoading } = useQuery({
    queryKey: ['agencyPermissions', agencyId, user?.id],
    queryFn: async (): Promise<AgencyRole> => {
      if (!user || !agencyId) return null;
      const { data, error } = await supabase.rpc('get_my_agency_role', { _agency_id: agencyId });
      if (error) throw error;
      return (data as AgencyRole) ?? null;
    },
    enabled: !!user && !!agencyId,
    staleTime: 30_000,
  });

  if (!user || !agencyId) return empty;

  const isOwner = role === 'owner';
  const isAdmin = role === 'owner' || role === 'admin';
  const isAgent = role === 'agent';
  const isMember = isAdmin || isAgent;

  return {
    role: role ?? null,
    isOwner,
    isAdmin,
    isAgent,
    isMember,
    canManageBilling: isAdmin,
    canManageTeam: isAdmin,
    canEditAgency: isAdmin,
    canManageListings: isAdmin,
    canManageImports: isAdmin,
    canManageFeatured: isAdmin,
    canPromoteAdmins: isAdmin,
    canTransferOwnership: isOwner,
    canDeleteAgency: isOwner,
    isLoading,
  };
}
