import { useState, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PropertyFilters as PropertyFiltersType } from '@/types/database';
import { MapFilterDialog } from './MapFilterDialog';
import { ViewToggle } from '@/components/filters/ViewToggle';
import { CommuteFilter, CommuteFilterValue } from './CommuteFilter';
import { SavedLocation } from '@/types/savedLocation';
import { 
  SlidersHorizontal, 
  Loader2,
  X,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Quick filter chips for common amenities
const QUICK_AMENITIES = [
  { key: 'has_balcony' as const, label: 'Balcony', icon: '🏠' },
  { key: 'has_elevator' as const, label: 'Elevator', icon: '🛗' },
  { key: 'has_storage' as const, label: 'Storage', icon: '📦' },
  { key: 'has_parking' as const, label: 'Parking', icon: '🚗' },
  { key: 'has_pool' as const, label: 'Pool', icon: '🏊' },
  { key: 'is_accessible' as const, label: 'Accessible', icon: '♿' },
];

interface MapFiltersBarProps {
  filters: PropertyFiltersType;
  onFiltersChange: (filters: PropertyFiltersType) => void;
  listingType: 'for_sale' | 'for_rent';
  resultCount: number;
  isLoading: boolean;
  // Commute filter props
  savedLocations?: SavedLocation[];
  commuteFilter: CommuteFilterValue | null;
  onCommuteFilterChange: (value: CommuteFilterValue | null) => void;
}

export function MapFiltersBar({
  filters,
  onFiltersChange,
  listingType,
  resultCount,
  isLoading,
  savedLocations,
  commuteFilter,
  onCommuteFilterChange,
}: MapFiltersBarProps) {
  const [searchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [filterHistory, setFilterHistory] = useState<PropertyFiltersType[]>([]);
  
  const urlStatus = searchParams.get('status') || 'for_sale';

  // Count active filters (excluding listing_status)
  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'listing_status') return false;
      if (key === 'bounds') return false;
      if (value === undefined || value === null) return false;
      if (typeof value === 'boolean' && !value) return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    }).length;
  }, [filters]);

  // Count active quick amenity filters
  const activeAmenityCount = useMemo(() => {
    return QUICK_AMENITIES.filter(a => filters[a.key]).length;
  }, [filters]);

  const handleFiltersChange = useCallback((newFilters: PropertyFiltersType) => {
    // Save current state to history before changing
    setFilterHistory(prev => [...prev.slice(-5), filters]);
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  const handleUndo = useCallback(() => {
    if (filterHistory.length > 0) {
      const previousFilters = filterHistory[filterHistory.length - 1];
      setFilterHistory(prev => prev.slice(0, -1));
      onFiltersChange(previousFilters);
    }
  }, [filterHistory, onFiltersChange]);

  const handleClearFilter = (key: keyof PropertyFiltersType) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    handleFiltersChange(newFilters);
  };

  const handleToggleAmenity = (key: keyof PropertyFiltersType) => {
    const newFilters = { ...filters };
    if (newFilters[key]) {
      delete newFilters[key];
    } else {
      (newFilters as any)[key] = true;
    }
    handleFiltersChange(newFilters);
  };

  return (
    <div className="border-b bg-background">
      <div className="px-4 py-2 flex items-center justify-between gap-4">
        {/* Left: Type toggle + List view link */}
        <div className="flex items-center gap-2">
          {/* Sale/Rent Toggle */}
          <div className="flex rounded-lg border p-0.5">
            <Link
              to={`/map?status=for_sale`}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md transition-colors",
                urlStatus === 'for_sale' 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Buy
            </Link>
            <Link
              to={`/map?status=for_rent`}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md transition-colors",
                urlStatus === 'for_rent' 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Rent
            </Link>
          </div>
          
          <Separator orientation="vertical" className="h-6 hidden sm:block" />
          
          {/* View Toggle - Grid/Map */}
          <ViewToggle activeView="map" className="hidden sm:flex" />
        </div>

        {/* Center: Result count */}
        <div className="flex items-center gap-2 text-sm">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <span className="text-muted-foreground">
              <span className="font-medium text-foreground">{resultCount}</span> properties
            </span>
          )}
        </div>

        {/* Right: Filters */}
        <div className="flex items-center gap-3">

          {/* Commute Filter */}
          {savedLocations && savedLocations.length > 0 && (
            <CommuteFilter
              savedLocations={savedLocations}
              value={commuteFilter}
              onChange={onCommuteFilterChange}
            />
          )}
          
          {/* Filters Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(true)}
            className="relative"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <Badge 
                variant="default" 
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Quick Amenity Filter Chips */}
      <div className="px-4 py-2 border-b flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {QUICK_AMENITIES.map((amenity) => {
          const isActive = filters[amenity.key];
          return (
            <button
              key={amenity.key}
              onClick={() => handleToggleAmenity(amenity.key)}
              className={cn(
                "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              <span>{amenity.icon}</span>
              <span>{amenity.label}</span>
            </button>
          );
        })}
        
        {/* Undo button - shown when there's filter history */}
        {filterHistory.length > 0 && (
          <>
            <Separator orientation="vertical" className="h-5 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground gap-1 px-2"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="text-xs">Undo</span>
            </Button>
          </>
        )}
      </div>
      
      {/* Active Filters Chips */}
      {activeFilterCount > 0 && (
        <div className="px-4 pb-2 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {filters.city && (
            <Badge variant="secondary" className="flex items-center gap-1 pr-1">
              {filters.city}
              <button 
                onClick={() => handleClearFilter('city')}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.min_price && (
            <Badge variant="secondary" className="flex items-center gap-1 pr-1">
              Min ₪{(filters.min_price / 1000000).toFixed(1)}M
              <button 
                onClick={() => handleClearFilter('min_price')}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.max_price && (
            <Badge variant="secondary" className="flex items-center gap-1 pr-1">
              Max ₪{(filters.max_price / 1000000).toFixed(1)}M
              <button 
                onClick={() => handleClearFilter('max_price')}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.min_rooms && (
            <Badge variant="secondary" className="flex items-center gap-1 pr-1">
              {filters.min_rooms}+ rooms
              <button 
                onClick={() => handleClearFilter('min_rooms')}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.property_type && (
            <Badge variant="secondary" className="flex items-center gap-1 pr-1">
              {filters.property_type.replace('_', ' ')}
              <button 
                onClick={() => handleClearFilter('property_type')}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <button 
            onClick={() => {
              handleFiltersChange({ listing_status: filters.listing_status });
              setFilterHistory([]);
            }}
            className="text-xs text-primary hover:underline whitespace-nowrap"
          >
            Clear all
          </button>
        </div>
      )}
      
      {/* Filter Dialog */}
      <MapFilterDialog
        open={showFilters}
        onOpenChange={setShowFilters}
        filters={filters}
        onFiltersChange={(newFilters) => {
          onFiltersChange(newFilters);
          setShowFilters(false);
        }}
        listingType={listingType}
      />
    </div>
  );
}
