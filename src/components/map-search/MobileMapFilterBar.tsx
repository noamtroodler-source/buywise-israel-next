import { useMemo } from 'react';
import { SlidersHorizontal, MapPin, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PropertyFilters as PropertyFiltersType } from '@/types/database';
import { cn } from '@/lib/utils';

interface MobileMapFilterBarProps {
  filters: PropertyFiltersType;
  listingType: 'for_sale' | 'for_rent';
  onBuyRentChange: (type: 'for_sale' | 'for_rent') => void;
  onOpenFilters: () => void;
  onCityClick: () => void;
}

export function MobileMapFilterBar({
  filters,
  listingType,
  onBuyRentChange,
  onOpenFilters,
  onCityClick,
}: MobileMapFilterBarProps) {
  // Count active filters (excluding city, sort, listing_status)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.min_price || filters.max_price) count++;
    if (filters.min_rooms || filters.min_bathrooms) count++;
    if (filters.property_types?.length) count++;
    if (filters.min_size || filters.max_size) count++;
    if (filters.features?.length) count++;
    if (filters.max_days_listed) count++;
    if (filters.min_parking) count++;
    if (filters.min_floor || filters.max_floor) count++;
    if (filters.available_now || filters.available_by) count++;
    if (filters.allows_pets?.length) count++;
    return count;
  }, [filters]);

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b bg-background">
      {/* Buy/Rent Toggle */}
      <div className="flex items-center rounded-full border border-border/50 bg-muted/30 overflow-hidden flex-shrink-0">
        <button
          className={cn(
            "px-3 py-1.5 text-xs font-medium transition-all",
            listingType === 'for_sale'
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => onBuyRentChange('for_sale')}
        >
          Buy
        </button>
        <button
          className={cn(
            "px-3 py-1.5 text-xs font-medium transition-all",
            listingType === 'for_rent'
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => onBuyRentChange('for_rent')}
        >
          Rent
        </button>
      </div>

      {/* City Chip */}
      <button
        onClick={onCityClick}
        className={cn(
          "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex-shrink-0",
          filters.city
            ? "bg-primary/10 text-primary border border-primary/30"
            : "bg-muted text-muted-foreground"
        )}
      >
        <MapPin className="h-3 w-3" />
        <span className="max-w-[80px] truncate">{filters.city || 'City'}</span>
        <ChevronDown className="h-3 w-3" />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Filter Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onOpenFilters}
        className="relative rounded-full h-8 px-3 gap-1.5 flex-shrink-0"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        <span className="text-xs">Filters</span>
        {activeFilterCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1">
            {activeFilterCount}
          </span>
        )}
      </Button>
    </div>
  );
}
