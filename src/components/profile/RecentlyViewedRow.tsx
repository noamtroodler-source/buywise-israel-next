import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight, Home, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useFormatPrice } from '@/contexts/PreferencesContext';
import { cn } from '@/lib/utils';

export function RecentlyViewedRow() {
  const { recentProperties, isLoading, clearRecentlyViewed } = useRecentlyViewed();
  const formatPrice = useFormatPrice();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Recently Viewed</span>
        </div>
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-28 flex-shrink-0 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (recentProperties.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Recently Viewed</span>
        </div>
        <div className="text-center py-4">
          <div className="w-10 h-10 rounded-full bg-muted mx-auto mb-2 flex items-center justify-center">
            <Home className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground mb-2">No recent views</p>
          <Button asChild variant="outline" size="sm" className="h-7 text-xs">
            <Link to="/listings?status=for_sale">
              Browse Listings
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const displayedProperties = recentProperties.slice(0, 10);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Recently Viewed</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground hover:text-destructive"
          onClick={clearRecentlyViewed}
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Clear
        </Button>
      </div>

      <div className="relative group">
        {/* Left scroll button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Scrollable row */}
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {displayedProperties.map((property) => (
            <Link
              key={property.id}
              to={`/property/${property.id}`}
              className="flex-shrink-0 w-28 group/card"
            >
              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-muted">
                {property.images?.[0] ? (
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Home className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              <p className="text-xs font-medium mt-1 truncate">
                {formatPrice(property.price, property.currency || 'ILS')}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {property.city}
              </p>
            </Link>
          ))}
        </div>

        {/* Right scroll button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
