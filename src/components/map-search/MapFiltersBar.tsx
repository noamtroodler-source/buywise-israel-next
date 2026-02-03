import { useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { PropertyFilters as PropertyFiltersType } from '@/types/database';
import { MapFilterDialog } from './MapFilterDialog';
import { ViewToggle } from '@/components/filters/ViewToggle';
import { 
  SlidersHorizontal, 
  MapPin, 
  Loader2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MapFiltersBarProps {
  filters: PropertyFiltersType;
  onFiltersChange: (filters: PropertyFiltersType) => void;
  listingType: 'for_sale' | 'for_rent';
  resultCount: number;
  isLoading: boolean;
  searchAsMove: boolean;
  onSearchAsMoveChange: (value: boolean) => void;
}

export function MapFiltersBar({
  filters,
  onFiltersChange,
  listingType,
  resultCount,
  isLoading,
  searchAsMove,
  onSearchAsMoveChange,
}: MapFiltersBarProps) {
  const [searchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  
  const urlStatus = searchParams.get('status') || 'for_sale';

  // Count active filters (excluding listing_status)
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'listing_status') return false;
    if (key === 'bounds') return false;
    if (value === undefined || value === null) return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  }).length;

  const handleClearFilter = (key: keyof PropertyFiltersType) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
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

        {/* Right: Search toggle + Filters */}
        <div className="flex items-center gap-3">
          {/* Search as I move toggle */}
          <div className="hidden sm:flex items-center gap-2">
            <Switch
              id="search-as-move"
              checked={searchAsMove}
              onCheckedChange={onSearchAsMoveChange}
            />
            <Label htmlFor="search-as-move" className="text-xs text-muted-foreground cursor-pointer">
              <MapPin className="h-3 w-3 inline mr-1" />
              Search as I move
            </Label>
          </div>
          
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
            onClick={() => onFiltersChange({ listing_status: filters.listing_status })}
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
