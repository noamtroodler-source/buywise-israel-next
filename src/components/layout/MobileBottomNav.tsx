import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Heart, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFavoritesContext } from '@/contexts/FavoritesContext';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  to?: string;
  isActive?: boolean;
  badge?: number;
  onClick?: () => void;
}

function NavItem({ icon: Icon, label, to, isActive, badge, onClick }: NavItemProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-0.5 min-w-[64px]">
      <div className="relative">
        <Icon className={cn(
          "h-5 w-5 transition-colors",
          isActive ? "text-primary" : "text-muted-foreground"
        )} />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 text-[10px] font-medium bg-primary text-primary-foreground rounded-full flex items-center justify-center">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span className={cn(
        "text-[10px] font-medium transition-colors",
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
        className="flex-1 flex items-center justify-center py-2 active:bg-muted/50 transition-colors"
      >
        {content}
      </Link>
    );
  }

  return (
    <button 
      onClick={onClick}
      className="flex-1 flex items-center justify-center py-2 active:bg-muted/50 transition-colors"
    >
      {content}
    </button>
  );
}

const menuLinks = [
  { label: 'For Sale', to: '/listings?status=for_sale' },
  { label: 'For Rent', to: '/listings?status=for_rent' },
  { label: 'New Projects', to: '/projects' },
  { label: 'Explore Areas', to: '/areas' },
  { label: 'Tools & Calculators', to: '/tools' },
  { label: 'Guides', to: '/guides' },
  { label: 'Blog', to: '/blog' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

export function MobileBottomNav() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { guestFavorites, guestProjectFavoriteIds } = useFavoritesContext();
  
  const totalFavorites = guestFavorites.length + guestProjectFavoriteIds.length;
  
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border z-50 md:hidden pb-safe">
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
          to="/listings" 
          isActive={isActive('/listings') || isActive('/projects')} 
        />
        <NavItem 
          icon={Heart} 
          label="Saved" 
          to="/favorites" 
          isActive={isActive('/favorites')} 
          badge={totalFavorites}
        />
        
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <div className="flex-1">
              <NavItem 
                icon={Menu} 
                label="Menu" 
                onClick={() => setMenuOpen(true)}
              />
            </div>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl px-0">
            <div className="flex items-center justify-between px-4 pb-4 border-b border-border">
              <span className="text-lg font-semibold">Menu</span>
              <SheetClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <X className="h-5 w-5" />
                </Button>
              </SheetClose>
            </div>
            <div className="overflow-y-auto py-2">
              {menuLinks.map((link) => (
                <SheetClose asChild key={link.to}>
                  <Link
                    to={link.to}
                    className="flex items-center px-6 py-3.5 text-base font-medium text-foreground hover:bg-muted active:bg-muted/80 transition-colors"
                  >
                    {link.label}
                  </Link>
                </SheetClose>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
