import { useState } from 'react';
import { ChevronDown, HelpCircle, MapPin, DollarSign, LayoutGrid, Bath, Building2, SlidersHorizontal, ArrowUpDown, Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PropertyFilters as PropertyFiltersType, PropertyType, PropertyCondition, SortOption } from '@/types/database';
import { useCities } from '@/hooks/useCities';
import { cn } from '@/lib/utils';

interface PropertyFiltersProps {
  filters: PropertyFiltersType;
  onFiltersChange: (filters: PropertyFiltersType) => void;
  listingType: 'for_sale' | 'for_rent' | 'projects';
  onCreateAlert?: () => void;
}

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'garden_apartment', label: 'Garden Apartment' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'mini_penthouse', label: 'Mini Penthouse' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'house', label: 'House' },
  { value: 'cottage', label: 'Cottage' },
];

const AMENITIES = [
  { value: 'elevator', label: 'Elevator' },
  { value: 'balcony', label: 'Balcony' },
  { value: 'garden', label: 'Garden' },
  { value: 'sea_view', label: 'Sea View' },
  { value: 'safe_room', label: 'Safe Room (Mamad)' },
  { value: 'storage', label: 'Storage' },
];

const CONDITIONS: { value: PropertyCondition; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'renovated', label: 'Renovated' },
  { value: 'good', label: 'Good Condition' },
  { value: 'needs_renovation', label: 'Needs Renovation' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest Listings' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'size_desc', label: 'Largest First' },
  { value: 'rooms_desc', label: 'Most Rooms First' },
];

const ROOM_OPTIONS = [
  { value: 1, label: '1+ Room' },
  { value: 2, label: '2+ Rooms' },
  { value: 3, label: '3+ Rooms' },
  { value: 4, label: '4+ Rooms' },
  { value: 5, label: '5+ Rooms' },
  { value: 6, label: '6+ Rooms' },
];

const BATH_OPTIONS = [
  { value: 1, label: '1+ Bath' },
  { value: 2, label: '2+ Baths' },
  { value: 3, label: '3+ Baths' },
  { value: 4, label: '4+ Baths' },
];

interface FilterButtonProps {
  icon: React.ReactNode;
  label: string;
  hasValue?: boolean;
  children: React.ReactNode;
  className?: string;
}

function FilterButton({ icon, label, hasValue, children, className }: FilterButtonProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className={cn(
            "h-10 gap-2 rounded-full border-border/60 bg-background hover:bg-muted/50 shadow-sm",
            hasValue && "border-primary/50 bg-primary/5",
            className
          )}
        >
          {icon}
          <span className="font-medium">{label}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-popover border shadow-lg z-50" align="start">
        {children}
      </PopoverContent>
    </Popover>
  );
}

export function PropertyFilters({ filters, onFiltersChange, listingType, onCreateAlert }: PropertyFiltersProps) {
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const { data: cities } = useCities();

  const updateFilter = <K extends keyof PropertyFiltersType>(key: K, value: PropertyFiltersType[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleFeature = (feature: string) => {
    const currentFeatures = filters.features || [];
    if (currentFeatures.includes(feature)) {
      updateFilter('features', currentFeatures.filter(f => f !== feature));
    } else {
      updateFilter('features', [...currentFeatures, feature]);
    }
  };

  const toggleCondition = (condition: PropertyCondition) => {
    const currentConditions = filters.condition || [];
    if (currentConditions.includes(condition)) {
      updateFilter('condition', currentConditions.filter(c => c !== condition));
    } else {
      updateFilter('condition', [...currentConditions, condition]);
    }
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'listing_status' || key === 'sort_by') return false;
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && value !== '';
  }).length;

  const getCityLabel = () => {
    if (filters.city) return filters.city;
    return 'City';
  };

  const getPriceLabel = () => {
    if (filters.min_price && filters.max_price) {
      return `₪${(filters.min_price / 1000000).toFixed(1)}M - ₪${(filters.max_price / 1000000).toFixed(1)}M`;
    }
    if (filters.min_price) return `From ₪${(filters.min_price / 1000000).toFixed(1)}M`;
    if (filters.max_price) return `Up to ₪${(filters.max_price / 1000000).toFixed(1)}M`;
    return 'Price';
  };

  const getRoomsLabel = () => {
    if (filters.min_rooms) return `${filters.min_rooms}+ Rooms`;
    return 'Rooms';
  };

  const getBathsLabel = () => {
    if (filters.min_bathrooms) return `${filters.min_bathrooms}+ Baths`;
    return 'Baths';
  };

  const getTypeLabel = () => {
    if (filters.property_type) {
      const found = PROPERTY_TYPES.find(t => t.value === filters.property_type);
      return found?.label || 'Type';
    }
    return 'Type';
  };

  const getSortLabel = () => {
    if (filters.sort_by) {
      const found = SORT_OPTIONS.find(s => s.value === filters.sort_by);
      return found?.label || 'Newest Listings';
    }
    return 'Newest Listings';
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Filter Bar */}
        <div className="bg-muted/30 border border-border/40 rounded-2xl p-3 shadow-sm">
          <div className="flex flex-wrap gap-2 items-center">
            {/* City Filter */}
            <FilterButton 
              icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
              label={getCityLabel()}
              hasValue={!!filters.city}
            >
              <div className="p-3 space-y-1 max-h-[300px] overflow-y-auto">
                <button
                  className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                  onClick={() => updateFilter('city', undefined)}
                >
                  All Cities
                </button>
                {cities?.map(city => (
                  <button
                    key={city.id}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors",
                      filters.city === city.name && "bg-primary/10 text-primary font-medium"
                    )}
                    onClick={() => updateFilter('city', city.name)}
                  >
                    {city.name}
                  </button>
                ))}
              </div>
            </FilterButton>

            {/* Price Filter */}
            <FilterButton 
              icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
              label={getPriceLabel()}
              hasValue={!!(filters.min_price || filters.max_price)}
            >
              <div className="p-4 space-y-4 w-[280px]">
                <div className="space-y-2">
                  <Label className="text-sm">Min Price (₪)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 1000000"
                    value={filters.min_price || ''}
                    onChange={(e) => updateFilter('min_price', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Max Price (₪)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 5000000"
                    value={filters.max_price || ''}
                    onChange={(e) => updateFilter('max_price', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
              </div>
            </FilterButton>

            {/* Rooms Filter */}
            <FilterButton 
              icon={<LayoutGrid className="h-4 w-4 text-muted-foreground" />}
              label={getRoomsLabel()}
              hasValue={!!filters.min_rooms}
            >
              <div className="p-3 space-y-1">
                <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
                  <span>Rooms in Israel include bedrooms + living areas</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-3.5 w-3.5" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[250px]">
                      <p className="text-sm">A "4-room apartment" typically has 3 bedrooms + 1 living room.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <button
                  className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                  onClick={() => updateFilter('min_rooms', undefined)}
                >
                  Any
                </button>
                {ROOM_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors",
                      filters.min_rooms === option.value && "bg-primary/10 text-primary font-medium"
                    )}
                    onClick={() => updateFilter('min_rooms', option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </FilterButton>

            {/* Baths Filter */}
            <FilterButton 
              icon={<Bath className="h-4 w-4 text-muted-foreground" />}
              label={getBathsLabel()}
              hasValue={!!filters.min_bathrooms}
            >
              <div className="p-3 space-y-1">
                <button
                  className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                  onClick={() => updateFilter('min_bathrooms', undefined)}
                >
                  Any
                </button>
                {BATH_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors",
                      filters.min_bathrooms === option.value && "bg-primary/10 text-primary font-medium"
                    )}
                    onClick={() => updateFilter('min_bathrooms', option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </FilterButton>

            {/* Type Filter */}
            <FilterButton 
              icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
              label={getTypeLabel()}
              hasValue={!!filters.property_type}
            >
              <div className="p-3 space-y-1">
                <button
                  className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                  onClick={() => updateFilter('property_type', undefined)}
                >
                  All Types
                </button>
                {PROPERTY_TYPES.map(type => (
                  <button
                    key={type.value}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors",
                      filters.property_type === type.value && "bg-primary/10 text-primary font-medium"
                    )}
                    onClick={() => updateFilter('property_type', type.value)}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </FilterButton>

            {/* More Filters Button */}
            <Button 
              variant="secondary"
              className="h-10 gap-2 rounded-full shadow-sm"
              onClick={() => setShowMoreFilters(!showMoreFilters)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="font-medium">More Filters</span>
            </Button>

            {/* Sort */}
            <div className="flex items-center gap-1 ml-auto">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <FilterButton 
                icon={<span className="sr-only">Sort</span>}
                label={getSortLabel()}
                hasValue={!!filters.sort_by}
                className="border-0 shadow-none bg-transparent hover:bg-muted/50"
              >
                <div className="p-3 space-y-1">
                  {SORT_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors whitespace-nowrap",
                        filters.sort_by === option.value && "bg-primary/10 text-primary font-medium"
                      )}
                      onClick={() => updateFilter('sort_by', option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </FilterButton>
            </div>

            {/* Create Alert Button */}
            {onCreateAlert && (
              <Button 
                variant="outline"
                className="h-10 gap-2 rounded-full border-amber-400 text-amber-600 hover:bg-amber-50 hover:text-amber-700 shadow-sm"
                onClick={onCreateAlert}
              >
                <Bell className="h-4 w-4" />
                <span className="font-medium">Create Alert</span>
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters & Clear */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active</span>
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-7 gap-1 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
              Clear all
            </Button>
          </div>
        )}

        {/* Expanded More Filters */}
        <Collapsible open={showMoreFilters} onOpenChange={setShowMoreFilters}>
          <CollapsibleContent>
            <div className="bg-muted/30 border border-border/40 rounded-2xl p-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Size Range */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Size (sqm)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.min_size || ''}
                      onChange={(e) => updateFilter('min_size', e.target.value ? Number(e.target.value) : undefined)}
                      className="flex-1"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.max_size || ''}
                      onChange={(e) => updateFilter('max_size', e.target.value ? Number(e.target.value) : undefined)}
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Parking */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Parking</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={filters.min_parking === undefined ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => updateFilter('min_parking', undefined)}
                      className="flex-1"
                    >
                      Any
                    </Button>
                    <Button
                      variant={filters.min_parking === 1 ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => updateFilter('min_parking', 1)}
                      className="flex-1"
                    >
                      1+
                    </Button>
                    <Button
                      variant={filters.min_parking === 2 ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => updateFilter('min_parking', 2)}
                      className="flex-1"
                    >
                      2+
                    </Button>
                  </div>
                </div>

                {/* Furnished */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Furnished</Label>
                  <div className="flex items-center gap-3 pt-1">
                    <Checkbox
                      id="furnished"
                      checked={filters.is_furnished === true}
                      onCheckedChange={(checked) => updateFilter('is_furnished', checked ? true : undefined)}
                    />
                    <Label htmlFor="furnished" className="text-sm cursor-pointer">Furnished only</Label>
                  </div>
                </div>

                {/* Accessible */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Accessibility</Label>
                  <div className="flex items-center gap-3 pt-1">
                    <Checkbox
                      id="accessible"
                      checked={filters.is_accessible === true}
                      onCheckedChange={(checked) => updateFilter('is_accessible', checked ? true : undefined)}
                    />
                    <Label htmlFor="accessible" className="text-sm cursor-pointer">Accessible only</Label>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Amenities</Label>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES.map(amenity => (
                    <Badge
                      key={amenity.value}
                      variant={filters.features?.includes(amenity.value) ? 'default' : 'outline'}
                      className="cursor-pointer transition-all hover:scale-105 py-1.5 px-3"
                      onClick={() => toggleFeature(amenity.value)}
                    >
                      {amenity.label}
                      {amenity.value === 'safe_room' && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3 w-3 ml-1" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[250px]">
                            <p className="font-medium mb-1">What is a Mamad?</p>
                            <p className="text-sm text-muted-foreground">
                              A reinforced concrete shelter room, required by law in buildings constructed after 1992.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Condition - only show for resell, not new projects */}
              {listingType !== 'projects' && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Condition</Label>
                  <div className="flex flex-wrap gap-2">
                    {CONDITIONS.map(condition => (
                      <Badge
                        key={condition.value}
                        variant={filters.condition?.includes(condition.value) ? 'default' : 'outline'}
                        className="cursor-pointer transition-all hover:scale-105 py-1.5 px-3"
                        onClick={() => toggleCondition(condition.value)}
                      >
                        {condition.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </TooltipProvider>
  );
}