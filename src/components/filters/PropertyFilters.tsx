import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, X, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PropertyFilters as PropertyFiltersType, PropertyType, PropertyCondition, SortOption } from '@/types/database';
import { useCities } from '@/hooks/useCities';

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

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Primary Filters Row */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* City */}
          <Select 
            value={filters.city || ''} 
            onValueChange={(v) => updateFilter('city', v || undefined)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="City" />
            </SelectTrigger>
            <SelectContent>
              {cities?.map(city => (
                <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Price Range */}
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Min Price"
              value={filters.min_price || ''}
              onChange={(e) => updateFilter('min_price', e.target.value ? Number(e.target.value) : undefined)}
              className="w-[120px]"
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="number"
              placeholder="Max Price"
              value={filters.max_price || ''}
              onChange={(e) => updateFilter('max_price', e.target.value ? Number(e.target.value) : undefined)}
              className="w-[120px]"
            />
          </div>

          {/* Rooms with Tooltip */}
          <div className="flex items-center gap-1">
            <Select 
              value={filters.min_rooms?.toString() || ''} 
              onValueChange={(v) => updateFilter('min_rooms', v ? Number(v) : undefined)}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Rooms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1+</SelectItem>
                <SelectItem value="2">2+</SelectItem>
                <SelectItem value="3">3+</SelectItem>
                <SelectItem value="4">4+</SelectItem>
                <SelectItem value="5">5+</SelectItem>
                <SelectItem value="6">6+</SelectItem>
              </SelectContent>
            </Select>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[280px]">
                <p className="font-medium mb-1">What are "Rooms" in Israel?</p>
                <p className="text-sm text-muted-foreground">
                  In Israel, "rooms" includes bedrooms plus living areas (living room, dining room). 
                  A "4-room apartment" typically has 3 bedrooms + 1 living area.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Bathrooms */}
          <Select 
            value={filters.min_bathrooms?.toString() || ''} 
            onValueChange={(v) => updateFilter('min_bathrooms', v ? Number(v) : undefined)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Bathrooms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1+ Bath</SelectItem>
              <SelectItem value="2">2+ Baths</SelectItem>
              <SelectItem value="3">3+ Baths</SelectItem>
              <SelectItem value="4">4+ Baths</SelectItem>
            </SelectContent>
          </Select>

          {/* Property Type */}
          <Select 
            value={filters.property_type || ''} 
            onValueChange={(v) => updateFilter('property_type', v as PropertyType || undefined)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Property Type" />
            </SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* More Filters Toggle */}
          <Button 
            variant="outline" 
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className="gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            More Filters
            {showMoreFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          {/* Sort */}
          <Select 
            value={filters.sort_by || ''} 
            onValueChange={(v) => updateFilter('sort_by', v as SortOption || undefined)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear & Alert Buttons */}
          {activeFilterCount > 0 && (
            <Button variant="ghost" onClick={clearAllFilters} className="gap-1">
              <X className="h-4 w-4" />
              Clear ({activeFilterCount})
            </Button>
          )}

          {onCreateAlert && (
            <Button variant="secondary" onClick={onCreateAlert} className="gap-2">
              Create Alert
            </Button>
          )}
        </div>

        {/* Expanded More Filters */}
        <Collapsible open={showMoreFilters} onOpenChange={setShowMoreFilters}>
          <CollapsibleContent>
            <div className="bg-muted/30 border rounded-lg p-4 mt-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <Select 
                    value={filters.min_parking?.toString() || ''} 
                    onValueChange={(v) => updateFilter('min_parking', v ? Number(v) : undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">At least 1</SelectItem>
                      <SelectItem value="2">At least 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Furnished */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Furnished</Label>
                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="furnished"
                        checked={filters.is_furnished === true}
                        onCheckedChange={(checked) => updateFilter('is_furnished', checked ? true : undefined)}
                      />
                      <Label htmlFor="furnished" className="text-sm">Furnished</Label>
                    </div>
                  </div>
                </div>

                {/* Accessible */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Accessibility</Label>
                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="accessible"
                        checked={filters.is_accessible === true}
                        onCheckedChange={(checked) => updateFilter('is_accessible', checked ? true : undefined)}
                      />
                      <Label htmlFor="accessible" className="text-sm">Accessible</Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Amenities</Label>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES.map(amenity => (
                    <Badge
                      key={amenity.value}
                      variant={filters.features?.includes(amenity.value) ? 'default' : 'outline'}
                      className="cursor-pointer transition-colors"
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
                              Provides protection during emergencies.
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
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Condition</Label>
                  <div className="flex flex-wrap gap-2">
                    {CONDITIONS.map(condition => (
                      <Badge
                        key={condition.value}
                        variant={filters.condition?.includes(condition.value) ? 'default' : 'outline'}
                        className="cursor-pointer transition-colors"
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