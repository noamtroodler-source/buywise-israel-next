import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Menu, X, User, LogOut, Heart, Building2, Shield, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { PreferencesDialog } from './PreferencesDialog';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { isAgent, isAdmin } = useUserRole();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

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
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            to="/listings?status=for_sale" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Buy
          </Link>
          <Link 
            to="/listings?status=for_rent" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Rent
          </Link>
          <Link 
            to="/projects" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Projects
          </Link>
          <Link 
            to="/areas" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Areas
          </Link>
          <Link 
            to="/tools" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Tools
          </Link>
          <Link 
            to="/guides" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Guides
          </Link>
          <Link 
            to="/blog" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Blog
          </Link>
          <Link 
            to="/contact" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Contact
          </Link>
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {/* Preferences Button */}
          <PreferencesDialog />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/favorites" className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Saved Properties
                  </Link>
                </DropdownMenuItem>
                {isAgent && (
                  <DropdownMenuItem asChild>
                    <Link to="/agent" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Agent Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 text-destructive">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container py-4 flex flex-col gap-2">
            <Link 
              to="/listings?status=for_sale" 
              className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Buy
            </Link>
            <Link 
              to="/listings?status=for_rent" 
              className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Rent
            </Link>
            <Link 
              to="/projects" 
              className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Projects
            </Link>
            <Link 
              to="/areas" 
              className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Areas
            </Link>
            <Link 
              to="/tools" 
              className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Tools
            </Link>
            <Link 
              to="/guides" 
              className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Guides
            </Link>
            <Link 
              to="/blog" 
              className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Blog
            </Link>
            <Link 
              to="/contact" 
              className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
            <hr className="my-2 border-border" />
            <PreferencesDialog 
              trigger={
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md w-full text-left">
                  <Settings className="h-4 w-4" />
                  Preferences
                </button>
              }
            />
            {!user && (
              <>
                <hr className="my-2 border-border" />
                <Link 
                  to="/auth" 
                  className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link 
                  to="/auth?tab=signup" 
                  className="px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}