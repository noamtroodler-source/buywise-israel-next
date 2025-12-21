import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, MapPin, DollarSign, LayoutGrid, Bath, Building2, SlidersHorizontal, ArrowUpDown, Bell, X, Search, Check, Sparkles, Car, Layers, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PropertyFilters as PropertyFiltersType, PropertyType, PropertyCondition, SortOption } from '@/types/database';
import { useCities } from '@/hooks/useCities';
import { cn } from '@/lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface PropertyFiltersProps {
  filters: PropertyFiltersType;
  onFiltersChange: (filters: PropertyFiltersType) => void;
  listingType: 'for_sale' | 'for_rent' | 'projects';
  onCreateAlert?: () => void;
}

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'garden_apartment', label: 'Garden Apt' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'mini_penthouse', label: 'Mini-Penthouse' },
  { value: 'house', label: 'House' },
  { value: 'cottage', label: 'Cottage' },
];

const AMENITIES = [
  { value: 'elevator', label: 'Elevator' },
  { value: 'balcony', label: 'Balcony' },
  { value: 'storage', label: 'Storage' },
  { value: 'garden', label: 'Garden/Yard' },
  { value: 'safe_room', label: 'Safe Room' },
  { value: 'sea_view', label: 'Sea View' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest Listings' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'size_desc', label: 'Largest First' },
  { value: 'rooms_desc', label: 'Rooms: Most to Fewest' },
];

// Helper to format number with commas
const formatWithCommas = (value: number | undefined): string => {
  if (value === undefined || value === null) return '';
  return value.toLocaleString('en-US');
};

// Helper to parse comma-formatted string to number
const parseCommaNumber = (value: string): number | undefined => {
  const cleaned = value.replace(/,/g, '');
  if (cleaned === '') return undefined;
  const num = Number(cleaned);
  return isNaN(num) ? undefined : num;
};

export function PropertyFilters({ filters, onFiltersChange, listingType, onCreateAlert }: PropertyFiltersProps) {
  const [cityOpen, setCityOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const [roomsOpen, setRoomsOpen] = useState(false);
  const [bathsOpen, setBathsOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  
  const { data: cities } = useCities();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCreateAlertClick = () => {
    if (!user) {
      navigate('/auth?redirect=/listings');
      return;
    }
    onCreateAlert?.();
  };

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

  const filteredCities = cities?.filter(city => 
    city.name.toLowerCase().includes(citySearch.toLowerCase())
  );

  const resetMoreFilters = () => {
    onFiltersChange({
      ...filters,
      min_size: undefined,
      max_size: undefined,
      min_parking: undefined,
      features: undefined,
      is_furnished: undefined,
      is_accessible: undefined,
      condition: undefined,
    });
  };

  const getSortLabel = () => {
    if (filters.sort_by) {
      const found = SORT_OPTIONS.find(s => s.value === filters.sort_by);
      return found?.label || 'Newest Listings';
    }
    return 'Newest Listings';
  };

  // Filter button base styles
  const filterButtonBase = "h-11 gap-2 rounded-full border border-border/60 bg-background hover:bg-muted/30 shadow-sm px-4 font-medium transition-all";
  const filterButtonActive = "bg-amber-100 border-amber-300 text-foreground";

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-2 items-center">
        {/* City Filter */}
        <Popover open={cityOpen} onOpenChange={setCityOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className={cn(filterButtonBase, cityOpen && filterButtonActive)}
            >
              <MapPin className="h-4 w-4" />
              <span>{filters.city || 'City'}</span>
              {cityOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-0 bg-background border shadow-xl z-50" align="start">
            <div className="p-4 space-y-4">
              <h3 className="font-semibold text-lg">Select City</h3>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search city..."
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  className="pl-10 rounded-lg"
                />
              </div>

              <div className="max-h-[250px] overflow-y-auto space-y-1">
                {filteredCities?.map(city => (
                  <button
                    key={city.id}
                    className={cn(
                      "w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors",
                      filters.city === city.name 
                        ? "bg-amber-400 text-foreground font-medium" 
                        : "hover:bg-muted"
                    )}
                    onClick={() => {
                      updateFilter('city', city.name);
                      setCityOpen(false);
                      setCitySearch('');
                    }}
                  >
                    {city.name}
                  </button>
                ))}
              </div>

              <Link 
                to="/tools" 
                className="flex items-center gap-1 text-primary text-sm font-medium hover:underline"
              >
                Not sure where to look? <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </PopoverContent>
        </Popover>

        {/* Price Filter */}
        <Popover open={priceOpen} onOpenChange={setPriceOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className={cn(filterButtonBase, priceOpen && filterButtonActive)}
            >
              <DollarSign className="h-4 w-4" />
              <span>Price</span>
              {priceOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-0 bg-background border shadow-xl z-50" align="start">
            <div className="p-4 space-y-4">
              <h3 className="font-semibold text-lg">Price Range</h3>
              
              <div className="flex gap-3">
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Min ($)"
                  value={formatWithCommas(filters.min_price)}
                  onChange={(e) => updateFilter('min_price', parseCommaNumber(e.target.value))}
                  className="flex-1 rounded-lg"
                />
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Max ($)"
                  value={formatWithCommas(filters.max_price)}
                  onChange={(e) => updateFilter('max_price', parseCommaNumber(e.target.value))}
                  className="flex-1 rounded-lg"
                />
              </div>

              <Link 
                to="/tools" 
                className="flex items-center gap-1 text-primary text-sm font-medium hover:underline"
              >
                Not sure how much you can afford? <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </PopoverContent>
        </Popover>

        {/* Rooms Filter */}
        <Popover open={roomsOpen} onOpenChange={setRoomsOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className={cn(filterButtonBase, roomsOpen && filterButtonActive)}
            >
              <LayoutGrid className="h-4 w-4" />
              <span>{filters.min_rooms ? `${filters.min_rooms}+` : 'Rooms'}</span>
              {roomsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[220px] p-0 bg-background border shadow-xl z-50" align="start">
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">Rooms</h3>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[250px]">
                    <p className="text-sm">In Israel, rooms = bedrooms + living areas. A "4-room" apt typically has 3 bedrooms.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {[3, 4, 5, 6, 7].map(num => (
                  <button
                    key={num}
                    className={cn(
                      "h-10 rounded-lg border text-sm font-medium transition-all",
                      filters.min_rooms === num 
                        ? "bg-primary text-primary-foreground border-primary" 
                        : "border-border hover:bg-muted"
                    )}
                    onClick={() => updateFilter('min_rooms', filters.min_rooms === num ? undefined : num)}
                  >
                    {num}+
                  </button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Baths Filter */}
        <Popover open={bathsOpen} onOpenChange={setBathsOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className={cn(filterButtonBase, bathsOpen && filterButtonActive)}
            >
              <Bath className="h-4 w-4" />
              <span>{filters.min_bathrooms ? `${filters.min_bathrooms}+` : 'Baths'}</span>
              {bathsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[220px] p-0 bg-background border shadow-xl z-50" align="start">
            <div className="p-4 space-y-4">
              <h3 className="font-semibold text-lg">Bathrooms</h3>
              
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4].map(num => (
                  <button
                    key={num}
                    className={cn(
                      "h-10 rounded-lg border text-sm font-medium transition-all",
                      filters.min_bathrooms === num 
                        ? "bg-primary text-primary-foreground border-primary" 
                        : "border-border hover:bg-muted"
                    )}
                    onClick={() => updateFilter('min_bathrooms', filters.min_bathrooms === num ? undefined : num)}
                  >
                    {num}+
                  </button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Type Filter */}
        <Popover open={typeOpen} onOpenChange={setTypeOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className={cn(filterButtonBase, typeOpen && filterButtonActive)}
            >
              <Building2 className="h-4 w-4" />
              <span>
                {filters.property_types && filters.property_types.length > 0
                  ? filters.property_types.length === 1
                    ? PROPERTY_TYPES.find(t => t.value === filters.property_types![0])?.label
                    : `${filters.property_types.length} Types`
                  : 'Type'}
              </span>
              {typeOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[240px] p-0 bg-background border shadow-xl z-50" align="start">
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Property Type</h3>
                {filters.property_types && filters.property_types.length > 0 && (
                  <button 
                    className="text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => updateFilter('property_types', undefined)}
                  >
                    Clear
                  </button>
                )}
              </div>
              
              <div className="space-y-1">
                {PROPERTY_TYPES.map(type => {
                  const isSelected = filters.property_types?.includes(type.value) || false;
                  return (
                    <button
                      key={type.value}
                      className="w-full flex items-center gap-3 px-2 py-2.5 text-sm rounded-lg hover:bg-muted transition-colors"
                      onClick={() => {
                        const currentTypes = filters.property_types || [];
                        if (isSelected) {
                          updateFilter('property_types', currentTypes.filter(t => t !== type.value));
                        } else {
                          updateFilter('property_types', [...currentTypes, type.value]);
                        }
                      }}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors",
                        isSelected 
                          ? "border-primary bg-primary" 
                          : "border-border"
                      )}>
                        {isSelected && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <span>{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* More Filters Button */}
        <Button 
          variant="outline"
          className={cn(filterButtonBase, moreFiltersOpen && filterButtonActive)}
          onClick={() => setMoreFiltersOpen(true)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>More Filters</span>
        </Button>

        {/* Sort & Alert Section */}
        <div className="flex items-center gap-3">
          {/* Sort */}
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Popover open={sortOpen} onOpenChange={setSortOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="h-11 gap-1 px-2 font-medium hover:bg-muted/50"
                >
                  <span>{getSortLabel()}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[220px] p-2 bg-background border shadow-xl z-50" align="end">
                {SORT_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg transition-colors text-left",
                      filters.sort_by === option.value 
                        ? "bg-amber-400 font-medium" 
                        : "hover:bg-muted"
                    )}
                    onClick={() => {
                      updateFilter('sort_by', option.value);
                      setSortOpen(false);
                    }}
                  >
                    {filters.sort_by === option.value && <Check className="h-4 w-4" />}
                    <span className={filters.sort_by !== option.value ? "ml-6" : ""}>{option.label}</span>
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          </div>

          {/* Subtle Separator */}
          {onCreateAlert && (
            <div className="h-6 w-px bg-border/60" />
          )}

          {/* Create Alert Button */}
          {onCreateAlert && (
            <Button 
              variant="outline"
              onClick={handleCreateAlertClick}
              className="h-11 gap-2 rounded-full border-amber-400 text-amber-600 hover:bg-amber-50 hover:text-amber-700 px-5 font-medium shadow-sm"
            >
              <Bell className="h-4 w-4" />
              <span>Create Alert</span>
            </Button>
          )}
        </div>
      </div>

      {/* More Filters Dialog */}
      <Dialog open={moreFiltersOpen} onOpenChange={setMoreFiltersOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">More Filters</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-2">
            {/* Size & Floor */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Layers className="h-4 w-4" />
                <h4 className="font-semibold">Size & Floor</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Size (m²)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="Min"
                      value={formatWithCommas(filters.min_size)}
                      onChange={(e) => updateFilter('min_size', parseCommaNumber(e.target.value))}
                      className="rounded-lg"
                    />
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="Max"
                      value={formatWithCommas(filters.max_size)}
                      onChange={(e) => updateFilter('max_size', parseCommaNumber(e.target.value))}
                      className="rounded-lg"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Floor</Label>
                  <div className="flex gap-2">
                    <Input type="number" placeholder="Min" className="rounded-lg" />
                    <Input type="number" placeholder="Max" className="rounded-lg" />
                  </div>
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-4 w-4" />
                <h4 className="font-semibold">Amenities</h4>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {AMENITIES.map(amenity => (
                  <button
                    key={amenity.value}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-muted transition-colors text-left"
                    onClick={() => toggleFeature(amenity.value)}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                      filters.features?.includes(amenity.value) 
                        ? "border-primary bg-primary" 
                        : "border-primary/50"
                    )}>
                      {filters.features?.includes(amenity.value) && (
                        <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                      )}
                    </div>
                    <span>{amenity.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Parking */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Car className="h-4 w-4" />
                <h4 className="font-semibold">Parking</h4>
              </div>
              <div className="flex gap-2">
                {[
                  { value: undefined, label: 'Any' },
                  { value: 1, label: '1+' },
                  { value: 2, label: '2+' },
                ].map(option => (
                  <button
                    key={option.label}
                    className={cn(
                      "flex-1 h-10 rounded-full text-sm font-medium transition-all",
                      filters.min_parking === option.value 
                        ? "bg-primary text-primary-foreground" 
                        : "border border-border hover:bg-muted"
                    )}
                    onClick={() => updateFilter('min_parking', option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Condition */}
            {listingType !== 'projects' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <Layers className="h-4 w-4" />
                  <h4 className="font-semibold">Condition</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'renovated', label: 'Renovated', filter: 'condition' },
                    { key: 'furnished', label: 'Furnished', filter: 'is_furnished' },
                    { key: 'accessible', label: 'Accessible', filter: 'is_accessible' },
                  ].map(item => (
                    <button
                      key={item.key}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-muted transition-colors"
                      onClick={() => {
                        if (item.filter === 'is_furnished') {
                          updateFilter('is_furnished', filters.is_furnished ? undefined : true);
                        } else if (item.filter === 'is_accessible') {
                          updateFilter('is_accessible', filters.is_accessible ? undefined : true);
                        } else {
                          const currentConditions = filters.condition || [];
                          if (currentConditions.includes('renovated')) {
                            updateFilter('condition', currentConditions.filter(c => c !== 'renovated'));
                          } else {
                            updateFilter('condition', [...currentConditions, 'renovated'] as any);
                          }
                        }
                      }}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                        (item.filter === 'is_furnished' && filters.is_furnished) ||
                        (item.filter === 'is_accessible' && filters.is_accessible) ||
                        (item.filter === 'condition' && filters.condition?.includes('renovated'))
                          ? "border-primary bg-primary" 
                          : "border-primary/50"
                      )}>
                        {((item.filter === 'is_furnished' && filters.is_furnished) ||
                          (item.filter === 'is_accessible' && filters.is_accessible) ||
                          (item.filter === 'condition' && filters.condition?.includes('renovated'))) && (
                          <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                        )}
                      </div>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              className="flex-1 rounded-full"
              onClick={resetMoreFilters}
            >
              Reset
            </Button>
            <Button 
              className="flex-1 rounded-full bg-primary"
              onClick={() => setMoreFiltersOpen(false)}
            >
              Apply Filters
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}