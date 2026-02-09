import { Link, useNavigate } from 'react-router-dom';
import { Home, User, LogOut, Heart, Building2, Shield, Users, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useProfile } from '@/hooks/useProfile';
import { useFavorites } from '@/hooks/useFavorites';
import { useProjectFavorites } from '@/hooks/useProjectFavorites';
import { PreferencesDialog } from './PreferencesDialog';
import { useMyAgency } from '@/hooks/useAgencyManagement';
import { useDeveloperProfile } from '@/hooks/useDeveloperProfile';

import { MoreNav } from './MoreNav';
import { LearnNav } from './LearnNav';
import { MegaMenu } from './MegaMenu';
import { NAV_CONFIG } from '@/lib/navigationConfig';

export function Header() {
  const { user, signOut } = useAuth();
  const { isAgent, isAdmin, isDeveloper } = useUserRole();
  const navigate = useNavigate();
  
  // These hooks already have internal `enabled: !!user` checks for performance
  const { data: profile } = useProfile();
  const { favoriteIds } = useFavorites();
  const { projectFavoriteIds } = useProjectFavorites();
  const { data: myAgency } = useMyAgency();
  const { data: developerProfile } = useDeveloperProfile();
  const favoriteCount = (favoriteIds?.length || 0) + (projectFavoriteIds?.length || 0);
  const isAgencyAdmin = !!myAgency;
  const hasDeveloperProfile = !!developerProfile;
  const hasProfessionalRole = isAgent || isAgencyAdmin || hasDeveloperProfile || isDeveloper || isAdmin;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // (Hover logic for "More" moved to NavigationMenu-based component)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container h-16 grid grid-cols-[auto_1fr_auto] items-center gap-4">
        {/* Logo - Left */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Home className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">BuyWise</span>
          <span className="text-xl font-bold text-primary">Israel</span>
        </Link>

        {/* Desktop Navigation - True Center */}
        <nav className="hidden md:flex items-center justify-center gap-6">
          <MegaMenu config={NAV_CONFIG.buy} />
          <MegaMenu config={NAV_CONFIG.projects} />
          <MegaMenu config={NAV_CONFIG.rent} />
          <LearnNav />
          <MoreNav />
        </nav>

        {/* Right Side */}
        <div className="flex items-center justify-end gap-1 sm:gap-2">
          {/* Preferences Button */}
          <PreferencesDialog />
          {/* Favorites Icon - visible to all users on all screen sizes */}
          <Button variant="ghost" size="icon" className="relative rounded-full h-10 w-10" asChild>
            <Link to="/favorites">
              <Heart className={favoriteCount > 0 ? "h-5 w-5 fill-primary text-primary" : "h-5 w-5"} />
              {favoriteCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 justify-center rounded-full p-0 text-[10px]">
                  {favoriteCount}
                </Badge>
              )}
            </Link>
          </Button>

        {user ? (
            hasProfessionalRole ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl border-border/50 shadow-lg p-1.5">
                  {/* User Info Header */}
                  <div className="px-3 py-2 mb-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {profile?.full_name || 'Welcome'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-border/50 mb-1" />
                  
                  <DropdownMenuItem asChild className="rounded-lg px-3 py-2">
                    <Link to="/profile" className="flex items-center gap-2.5">
                      <User className="h-4 w-4 text-muted-foreground" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  {isAgent && (
                    <DropdownMenuItem asChild className="rounded-lg px-3 py-2">
                      <Link to="/agent" className="flex items-center gap-2.5">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        Agent Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {isAgencyAdmin && (
                    <DropdownMenuItem asChild className="rounded-lg px-3 py-2">
                      <Link to="/agency" className="flex items-center gap-2.5">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        Agency Portal
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {(isDeveloper || hasDeveloperProfile) && (
                    <DropdownMenuItem asChild className="rounded-lg px-3 py-2">
                      <Link to="/developer" className="flex items-center gap-2.5">
                        <Landmark className="h-4 w-4 text-muted-foreground" />
                        Developer Portal
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem asChild className="rounded-lg px-3 py-2">
                      <Link to="/admin" className="flex items-center gap-2.5">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-border/50 my-1" />
                  <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground">
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" asChild>
                <Link to="/profile">
                  <User className="h-5 w-5" />
                </Link>
              </Button>
            )
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button asChild>
                <Link to="/auth?tab=signup">Create Free Account</Link>
              </Button>
            </div>
          )}

        </div>
      </div>
    </header>
  );
}