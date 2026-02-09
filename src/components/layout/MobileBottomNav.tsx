import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Heart, Menu, X, Building, User, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useFavoritesContext } from '@/contexts/FavoritesContext';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useAuth } from '@/hooks/useAuth';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  to?: string;
  isActive?: boolean;
  badge?: number;
  onClick?: () => void;
}

function NavItem({ icon: Icon, label, to, isActive, badge, onClick }: NavItemProps) {
  const { light } = useHapticFeedback();
  
  const handleClick = () => {
    light();
    onClick?.();
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-0.5 min-w-[64px] relative">
      {/* Active indicator dot */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute -top-1 w-1 h-1 rounded-full bg-primary"
          />
        )}
      </AnimatePresence>
      
      <div className="relative">
        <Icon className={cn(
          "h-5 w-5 transition-all duration-200",
          isActive ? "text-primary scale-110" : "text-muted-foreground"
        )} />
        {badge !== undefined && badge > 0 && (
          <motion.span 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 text-[10px] font-medium bg-primary text-primary-foreground rounded-full flex items-center justify-center"
          >
            {badge > 99 ? '99+' : badge}
          </motion.span>
        )}
      </div>
      <span className={cn(
        "text-[10px] font-medium transition-all duration-200",
        isActive ? "text-primary" : "text-muted-foreground"
      )}>
        {label}
      </span>
    </div>
  );

  if (to) {
    return (
      <Link 
        to={to} 
        onClick={handleClick}
        className="flex-1 flex items-center justify-center py-2 active:bg-muted/50 transition-colors touch-manipulation"
      >
        {content}
      </Link>
    );
  }

  return (
    <button 
      onClick={handleClick}
      className="flex-1 flex items-center justify-center py-2 active:bg-muted/50 transition-colors touch-manipulation"
    >
      {content}
    </button>
  );
}

const menuSections = [
  {
    title: 'Browse',
    links: [
      { label: 'Properties for Sale', to: '/listings?status=for_sale', icon: Home },
      { label: 'Rentals', to: '/listings?status=for_rent', icon: Home },
      { label: 'New Projects', to: '/projects', icon: Building },
    ],
  },
  {
    title: 'Explore',
    links: [
      { label: 'Explore Areas', to: '/areas' },
      { label: 'Tools & Calculators', to: '/tools' },
      { label: 'Guides', to: '/guides' },
      { label: 'Blog', to: '/blog' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Contact', to: '/contact' },
    ],
  },
];

export function MobileBottomNav() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { guestFavorites, guestProjectFavoriteIds } = useFavoritesContext();
  const { user } = useAuth();
  const { light } = useHapticFeedback();
  
  const totalFavorites = guestFavorites.length + guestProjectFavoriteIds.length;
  
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path.includes('?')) {
      const basePath = path.split('?')[0];
      return location.pathname === basePath && location.search.includes(path.split('?')[1]);
    }
    return location.pathname.startsWith(path);
  };

  const handleMenuOpen = (open: boolean) => {
    if (open) light();
    setMenuOpen(open);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border z-50 lg:hidden pb-safe">
      <div className="flex items-center h-16">
        <NavItem 
          icon={Home} 
          label="Home" 
          to="/" 
          isActive={isActive('/')} 
        />
        <NavItem 
          icon={Search} 
          label="Search" 
          to="/listings?status=for_sale" 
          isActive={isActive('/listings') || isActive('/projects')} 
        />
        <NavItem 
          icon={Heart} 
          label="Saved" 
          to="/favorites" 
          isActive={isActive('/favorites')} 
          badge={totalFavorites}
        />
        <NavItem 
          icon={User} 
          label={user ? "Profile" : "Sign In"} 
          to={user ? "/profile" : "/auth"} 
          isActive={isActive('/profile') || isActive('/auth')} 
        />
        
        <Sheet open={menuOpen} onOpenChange={handleMenuOpen}>
          <SheetTrigger asChild>
            <div className="flex-1">
              <NavItem 
                icon={menuOpen ? X : Menu} 
                label="More" 
                onClick={() => setMenuOpen(true)}
              />
            </div>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[75vh] rounded-t-3xl px-0 pb-safe">
            {/* Handle bar */}
            <div className="flex justify-center pt-2 pb-4">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>
            
            <div className="overflow-y-auto pb-8">
              {menuSections.map((section, sectionIndex) => (
                <div key={section.title} className={cn(sectionIndex > 0 && "mt-4")}>
                  <p className="px-6 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {section.title}
                  </p>
                  {section.links.map((link) => (
                    <SheetClose asChild key={link.to}>
                      <Link
                        to={link.to}
                        className={cn(
                          "flex items-center justify-between px-6 py-3.5 text-base font-medium transition-colors touch-manipulation",
                          isActive(link.to) 
                            ? "text-primary bg-primary/5" 
                            : "text-foreground hover:bg-muted active:bg-muted/80"
                        )}
                        onClick={() => light()}
                      >
                        <div className="flex items-center gap-3">
                          {link.icon && <link.icon className="h-5 w-5 text-muted-foreground" />}
                          <span>{link.label}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </SheetClose>
                  ))}
                </div>
              ))}
              
              {/* Quick Actions Footer */}
              {!user && (
                <div className="mt-6 mx-4 p-4 bg-muted/50 rounded-xl">
                  <p className="text-sm text-muted-foreground mb-3">
                    Create an account to save properties and get alerts
                  </p>
                  <SheetClose asChild>
                    <Link to="/auth?tab=signup">
                      <Button className="w-full" size="lg">
                        Create Free Account
                      </Button>
                    </Link>
                  </SheetClose>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
