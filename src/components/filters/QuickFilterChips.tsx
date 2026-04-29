import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { PropertyFilters as PropertyFiltersType } from '@/types/database';

interface QuickFilterChip {
  id: string;
  label: string;
  apply: (filters: PropertyFiltersType) => PropertyFiltersType;
  isActive: (filters: PropertyFiltersType) => boolean;
}

interface QuickFilterChipsProps {
  filters: PropertyFiltersType;
  onFiltersChange: (filters: PropertyFiltersType) => void;
  listingType: 'for_sale' | 'for_rent' | 'projects';
}

export function QuickFilterChips({ filters, onFiltersChange, listingType }: QuickFilterChipsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftGradient, setShowLeftGradient] = useState(false);
  const [showRightGradient, setShowRightGradient] = useState(false);
  const isMobile = useIsMobile();

  // Check scroll position to show/hide gradients
  const checkScrollPosition = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftGradient(scrollLeft > 10);
    setShowRightGradient(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    checkScrollPosition();
    container.addEventListener('scroll', checkScrollPosition);
    window.addEventListener('resize', checkScrollPosition);
    
    return () => {
      container.removeEventListener('scroll', checkScrollPosition);
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, []);

  // Only show on mobile
  if (!isMobile) return null;

  // Define quick filters based on listing type
  const quickFilters: QuickFilterChip[] = listingType === 'for_rent'
    ? [
        {
          id: 'under_8k',
          label: 'Under ₪8K/mo',
          apply: (f) => ({ ...f, max_price: 8000 }),
          isActive: (f) => f.max_price === 8000,
        },
        {
          id: 'under_12k',
          label: 'Under ₪12K/mo',
          apply: (f) => ({ ...f, max_price: 12000 }),
          isActive: (f) => f.max_price === 12000,
        },
        {
          id: '3_rooms',
          label: '3+ Rooms',
          apply: (f) => ({ ...f, min_rooms: 3 }),
          isActive: (f) => f.min_rooms === 3,
        },
        {
          id: '4_rooms',
          label: '4+ Rooms',
          apply: (f) => ({ ...f, min_rooms: 4 }),
          isActive: (f) => f.min_rooms === 4,
        },
        {
          id: 'available_now',
          label: 'Available Now',
          apply: (f) => ({ ...f, available_now: true }),
          isActive: (f) => f.available_now === true,
        },
        {
          id: 'pets_ok',
          label: 'Pets OK',
          apply: (f) => ({ ...f, allows_pets: ['all'] }),
          isActive: (f) => f.allows_pets?.includes('all') || false,
        },
      ]
    : [
        {
          id: 'under_2m',
          label: 'Under ₪2M',
          apply: (f) => ({ ...f, max_price: 2000000 }),
          isActive: (f) => f.max_price === 2000000,
        },
        {
          id: 'under_3m',
          label: 'Under ₪3M',
          apply: (f) => ({ ...f, max_price: 3000000 }),
          isActive: (f) => f.max_price === 3000000,
        },
        {
          id: 'under_5m',
          label: 'Under ₪5M',
          apply: (f) => ({ ...f, max_price: 5000000 }),
          isActive: (f) => f.max_price === 5000000,
        },
        {
          id: '3_rooms',
          label: '3+ Rooms',
          apply: (f) => ({ ...f, min_rooms: 3 }),
          isActive: (f) => f.min_rooms === 3,
        },
        {
          id: '4_rooms',
          label: '4+ Rooms',
          apply: (f) => ({ ...f, min_rooms: 4 }),
          isActive: (f) => f.min_rooms === 4,
        },
        {
          id: 'new_listings',
          label: 'New (7 days)',
          apply: (f) => ({ ...f, max_days_listed: 7 }),
          isActive: (f) => f.max_days_listed === 7,
        },
      ];

  const handleChipClick = (chip: QuickFilterChip) => {
    if (chip.isActive(filters)) {
      // Remove the filter
      const newFilters = { ...filters };
      if (chip.id.includes('under') || chip.id.includes('price')) {
        newFilters.max_price = undefined;
      } else if (chip.id.includes('rooms')) {
        newFilters.min_rooms = undefined;
      } else if (chip.id === 'new_listings') {
        newFilters.max_days_listed = undefined;
      } else if (chip.id === 'available_now') {
        newFilters.available_now = undefined;
      } else if (chip.id === 'pets_ok') {
        newFilters.allows_pets = undefined;
      }
      onFiltersChange(newFilters);
    } else {
      onFiltersChange(chip.apply(filters));
    }
  };

  return (
    <div className="relative mt-3">
      {/* Left fade gradient */}
      <div 
        className={cn(
          "absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none transition-opacity duration-200",
          showLeftGradient ? "opacity-100" : "opacity-0"
        )}
      />
      
      {/* Right fade gradient */}
      <div 
        className={cn(
          "absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none transition-opacity duration-200",
          showRightGradient ? "opacity-100" : "opacity-0"
        )}
      />

      <div 
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {quickFilters.map((chip) => {
          const isActive = chip.isActive(filters);
          return (
            <button
              key={chip.id}
              onClick={() => handleChipClick(chip)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted border border-border/50"
              )}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
