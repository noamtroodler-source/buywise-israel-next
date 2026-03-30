import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useMyAgency } from '@/hooks/useAgencyManagement';
import { AppRole } from '@/types/database';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: AppRole;
  allowAgencyOwner?: boolean;
}

export function ProtectedRoute({ children, requiredRole, allowAgencyOwner }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { hasRole, isLoading: rolesLoading } = useUserRole();
  const { isAgencyAdmin, isLoading: agencyLoading } = useMyAgency();
  const location = useLocation();

  const needsAgencyCheck = allowAgencyOwner || location.pathname.startsWith('/agency');
  const isLoading = authLoading || rolesLoading || (needsAgencyCheck && agencyLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Determine role context based on pathname for professional flows
    let roleParam = '';
    if (location.pathname.startsWith('/agency')) {
      roleParam = '&role=agency';
    } else if (location.pathname.startsWith('/agent')) {
      roleParam = '&role=agent';
    } else if (location.pathname.startsWith('/developer')) {
      roleParam = '&role=developer';
    }
    
    return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname)}${roleParam}&intent=view_profile`} replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    // For agency routes, also allow agency owners even without the "agent" role
    if (needsAgencyCheck && isAgencyAdmin) {
      return <>{children}</>;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
