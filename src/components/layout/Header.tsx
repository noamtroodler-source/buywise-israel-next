import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Menu, X, User, LogOut, Heart, Building2, Shield, Settings, Users, Landmark, ChevronDown } from 'lucide-react';
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
import { usePreferences } from '@/contexts/PreferencesContext';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user, signOut } = useAuth();
  const { isAgent, isAdmin, isDeveloper } = useUserRole();
  const navigate = useNavigate();
  
  // These hooks already have internal `enabled: !!user` checks for performance
  const { data: profile } = useProfile();
  const { favoriteIds } = useFavorites();
  const { projectFavoriteIds } = useProjectFavorites();
  const { data: myAgency } = useMyAgency();
  const { data: developerProfile } = useDeveloperProfile();
  const { currency, areaUnit } = usePreferences();
  
  const favoriteCount = (favoriteIds?.length || 0) + (projectFavoriteIds?.length || 0);
  const isAgencyAdmin = !!myAgency;
  const hasDeveloperProfile = !!developerProfile;
  const hasProfessionalRole = isAgent || isAgencyAdmin || hasDeveloperProfile || isDeveloper || isAdmin;
  const currencySymbol = currency === 'USD' ? '$' : '₪';
  const unitLabel = areaUnit === 'sqft' ? 'ft²' : 'm²';

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Debounced hover handlers for "More" dropdown (fixes portal gap issue)
  const handleMoreMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setMoreDropdownOpen(true);
  };

  const handleMoreMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setMoreDropdownOpen(false);
    }, 150);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Home className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">BuyWise</span>
          <span className="text-xl font-bold text-primary">Israel</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link 
            to="/listings?status=for_sale" 
            className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Buy
          </Link>
          <Link 
            to="/listings?status=for_rent" 
            className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Rent
          </Link>
          <Link 
            to="/projects" 
            className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Projects
          </Link>
          <Link 
            to="/tools" 
            className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Tools
          </Link>
          <Link 
            to="/guides" 
            className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Guides
          </Link>
          <Link 
            to="/areas" 
            className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Areas
          </Link>
          <Link 
            to="/advertise" 
            className="text-base font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Advertise
          </Link>
          <div 
            onMouseEnter={handleMoreMouseEnter} 
            onMouseLeave={handleMoreMouseLeave}
          >
            <DropdownMenu open={moreDropdownOpen} onOpenChange={setMoreDropdownOpen}>
              <DropdownMenuTrigger className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 outline-none">
                More
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-40 bg-background border-border"
                onMouseEnter={handleMoreMouseEnter}
                onMouseLeave={handleMoreMouseLeave}
              >
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/blog">Blog</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/about">About</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/contact">Contact</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-1 sm:gap-2">
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
                <Link to="/auth?tab=signup">Sign Up</Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu Button - 44px touch target */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-10 w-10"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu with smooth animation */}
      <div 
        className={`md:hidden border-t border-border bg-background overflow-hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="container py-4 flex flex-col gap-1">
            {/* User Section (when logged in) */}
            {user ? (
              <>
                <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-lg mb-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      {profile?.full_name || 'Welcome back'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
                
                {/* Quick access links - min 44px touch targets */}
                <Link 
                  to="/profile" 
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg active:bg-muted/80"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="h-5 w-5" />
                  My Profile
                </Link>
                {isAgent && (
                  <Link 
                    to="/agent" 
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg active:bg-muted/80"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Building2 className="h-5 w-5" />
                    Agent Dashboard
                  </Link>
                )}
                {isAgencyAdmin && (
                  <Link 
                    to="/agency" 
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg active:bg-muted/80"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Users className="h-5 w-5" />
                    Agency Portal
                  </Link>
                )}
                {(isDeveloper || hasDeveloperProfile) && (
                  <Link 
                    to="/developer" 
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg active:bg-muted/80"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Landmark className="h-5 w-5" />
                    Developer Portal
                  </Link>
                )}
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg active:bg-muted/80"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Shield className="h-5 w-5" />
                    Admin Panel
                  </Link>
                )}
                <hr className="my-2 border-border" />
              </>
            ) : (
              /* Guest Favorites Section */
              <>
                <div className="px-4 py-3 bg-muted/50 rounded-lg mb-2">
                  <Link 
                    to="/favorites" 
                    className="flex items-center justify-between"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Heart className={favoriteCount > 0 ? "h-5 w-5 text-primary fill-primary" : "h-5 w-5 text-primary"} />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">Saved Properties</p>
                        <p className="text-xs text-muted-foreground">Saved to this browser</p>
                      </div>
                    </div>
                    {favoriteCount > 0 && (
                      <Badge variant="secondary" className="rounded-full text-xs">
                        {favoriteCount}
                      </Badge>
                    )}
                  </Link>
                </div>
                <hr className="my-2 border-border" />
              </>
            )}
            
            {/* Main navigation links - 44px touch targets */}
            <Link 
              to="/listings?status=for_sale"
              className="px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg active:bg-muted/80"
              onClick={() => setMobileMenuOpen(false)}
            >
              Buy
            </Link>
            <Link 
              to="/listings?status=for_rent" 
              className="px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg active:bg-muted/80"
              onClick={() => setMobileMenuOpen(false)}
            >
              Rent
            </Link>
            <Link 
              to="/projects" 
              className="px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg active:bg-muted/80"
              onClick={() => setMobileMenuOpen(false)}
            >
              Projects
            </Link>
            <Link 
              to="/tools" 
              className="px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg active:bg-muted/80"
              onClick={() => setMobileMenuOpen(false)}
            >
              Tools
            </Link>
            <Link 
              to="/guides" 
              className="px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg active:bg-muted/80"
              onClick={() => setMobileMenuOpen(false)}
            >
              Guides
            </Link>
            <Link 
              to="/areas" 
              className="px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg active:bg-muted/80"
              onClick={() => setMobileMenuOpen(false)}
            >
              Areas
            </Link>
            <Link 
              to="/blog" 
              className="px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg active:bg-muted/80"
              onClick={() => setMobileMenuOpen(false)}
            >
              Blog
            </Link>
            <Link 
              to="/advertise" 
              className="px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg active:bg-primary/20"
              onClick={() => setMobileMenuOpen(false)}
            >
              Advertise
            </Link>
            <Link 
              to="/about" 
              className="px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg active:bg-muted/80"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link 
              to="/contact" 
              className="px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg active:bg-muted/80"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
            <hr className="my-2 border-border" />
            <PreferencesDialog 
              trigger={
                <button className="flex items-center justify-between px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md w-full">
                  <span className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Preferences
                  </span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {currencySymbol} · {unitLabel}
                  </span>
                </button>
              }
            />
            {user ? (
              <button 
                onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg active:bg-muted/80 w-full text-left"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            ) : (
              <>
                <hr className="my-2 border-border" />
                <Link 
                  to="/auth" 
                  className="px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg active:bg-muted/80"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link 
                  to="/auth?tab=signup" 
                  className="px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg active:bg-primary/20"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
    </header>
  );
}