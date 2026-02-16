import { useState, useMemo } from 'react';
import { SlidersHorizontal, MapPin, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MobileFilterSheet } from '@/components/filters/MobileFilterSheet';
import { useCities } from '@/hooks/useCities';
import { usePreferences } from '@/contexts/PreferencesContext';
import { cn } from '@/lib/utils';
import { MapShareMenu } from './MapShareMenu';
import type { PropertyFilters, SortOption } from '@/types/database';

interface MobileMapFilterBarProps {
  filters: PropertyFilters;
  onFiltersChange: (filters: PropertyFilters) => void;
  listingType: 'for_sale' | 'for_rent' | 'projects';
  onBuyRentChange: (type: 'for_sale' | 'for_rent') => void;
  previewCount?: number;
  isCountLoading?: boolean;
}

function countActiveFilters(f: PropertyFilters): number {
  let n = 0;
  if (f.min_price) n++;
  if (f.max_price) n++;
  if (f.min_rooms) n++;
  if (f.max_rooms) n++;
  if (f.property_types?.length) n++;
  if (f.min_bathrooms) n++;
  if (f.min_size) n++;
  if (f.max_size) n++;
  if (f.min_floor) n++;
  if (f.max_floor) n++;
  if (f.min_parking) n++;
  if (f.max_days_listed) n++;
  if (f.features?.length) n += f.features.length;
  return n;
}

export function MobileMapFilterBar({
  filters,
  onFiltersChange,
  listingType,
  onBuyRentChange,
  previewCount,
  isCountLoading,
}: MobileMapFilterBarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { data: cities = [] } = useCities();
  const { currency, exchangeRate } = usePreferences();
  const activeCount = useMemo(() => countActiveFilters(filters), [filters]);

  const cityList = cities.map((c) => ({ id: c.id, name: c.name }));

  return (
    <>
      <div className="absolute top-0 left-0 right-0 z-[35] flex items-center gap-2 px-3 py-2 bg-background/95 backdrop-blur-sm border-b border-border">
        {/* Buy / Rent toggle */}
        <div className="flex rounded-full border border-border bg-muted/50 p-0.5 shrink-0">
          <button
            onClick={() => onBuyRentChange('for_sale')}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-full transition-colors',
              listingType === 'for_sale'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Buy
          </button>
          <button
            onClick={() => onBuyRentChange('for_rent')}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-full transition-colors',
              listingType === 'for_rent'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Rent
          </button>
        </div>

        {/* City chip */}
        {filters.city && (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium truncate max-w-[120px]">
            <MapPin className="h-3 w-3 shrink-0" />
            {filters.city}
          </span>
        )}

        {/* Share button */}
        <MapShareMenu>
          <button
            className="ml-auto flex items-center justify-center w-8 h-8 rounded-full border border-border bg-background text-foreground hover:bg-accent transition-colors shrink-0"
            aria-label="Share map view"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
        </MapShareMenu>

        {/* Filters button */}
        <button
          onClick={() => setFiltersOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-background text-foreground text-xs font-medium hover:bg-accent transition-colors shrink-0"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {activeCount > 0 && (
            <Badge variant="default" className="h-4 min-w-4 px-1 text-[10px] rounded-full">
              {activeCount}
            </Badge>
          )}
        </button>
      </div>

      <MobileFilterSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={filters}
        onFiltersChange={onFiltersChange}
        listingType={listingType}
        cities={cityList}
        previewCount={previewCount}
        isCountLoading={isCountLoading}
        currency={currency}
        exchangeRate={exchangeRate}
      />
    </>
  );
}
