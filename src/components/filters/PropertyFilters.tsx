import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, MapPin, DollarSign, LayoutGrid, Bath, Building2, SlidersHorizontal, ArrowUpDown, Bell, X, Search, Check, Sparkles, Car, Layers, ArrowRight, Calendar, Clock, Home, PawPrint, CalendarCheck, Cat, Dog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PriceRangeSlider } from '@/components/filters/PriceRangeSlider';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { PropertyFilters as PropertyFiltersType, PropertyType, PropertyCondition, SortOption } from '@/types/database';
import { useCities } from '@/hooks/useCities';
import { useNeighborhoods } from '@/hooks/useNeighborhoods';
import { cn } from '@/lib/utils';
import { matchCities } from '@/lib/utils/cityMatcher';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePreferences } from '@/contexts/PreferencesContext';

interface PropertyFiltersProps {
  filters: PropertyFiltersType;
  onFiltersChange: (filters: PropertyFiltersType) => void;
  listingType: 'for_sale' | 'for_rent' | 'projects';
  onCreateAlert?: () => void;
  showSoldToggle?: boolean;
  isSoldView?: boolean;
  onSoldToggle?: (showSold: boolean) => void;
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

const DAYS_ON_MARKET_OPTIONS = [
  { value: undefined, label: 'Any Time' },
  { value: 1, label: 'Last 24 Hours' },
  { value: 7, label: 'Last 7 Days' },
  { value: 30, label: 'Last 30 Days' },
];

const YEAR_BUILT_PRESETS = [
  { value: 2020, label: '2020+' },
  { value: 2010, label: '2010+' },
  { value: 2000, label: '2000+' },
];

// Rental-specific options
const AVAILABILITY_OPTIONS = [
  { value: 'any', label: 'Any Time' },
  { value: 'now', label: 'Available Now' },
  { value: '30', label: 'Within 30 Days' },
  { value: '60', label: 'Within 60 Days' },
];

const PET_OPTIONS = [
  { value: 'cats', label: 'Cats OK', Icon: Cat },
  { value: 'dogs', label: 'Dogs OK', Icon: Dog },
  { value: 'all', label: 'All Pets', Icon: PawPrint },
] as const;

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

export function PropertyFilters({ filters, onFiltersChange, listingType, onCreateAlert, showSoldToggle, isSoldView, onSoldToggle }: PropertyFiltersProps) {
  const [cityOpen, setCityOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const [bedsAndBathsOpen, setBedsAndBathsOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [neighborhoodSearch, setNeighborhoodSearch] = useState('');
  
  const { data: cities } = useCities();
  const { data: neighborhoods } = useNeighborhoods(filters.city);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { currency, exchangeRate } = usePreferences();
  
  // Check if lot size filter should be shown (for house-type properties)
  const showLotSizeFilter = useMemo(() => {
    const houseTypes: PropertyType[] = ['house', 'cottage', 'garden_apartment'];
    return filters.property_types?.some(t => houseTypes.includes(t)) || false;
  }, [filters.property_types]);
  
  // Filter neighborhoods based on search
  const filteredNeighborhoods = useMemo(() => {
    if (!neighborhoods) return [];
    if (!neighborhoodSearch) return neighborhoods;
    const search = neighborhoodSearch.toLowerCase();
    return neighborhoods.filter(n => 
      n.name.toLowerCase().includes(search) ||
      n.hebrew_name?.toLowerCase().includes(search)
    );
  }, [neighborhoods, neighborhoodSearch]);

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

  const filteredCities = matchCities(citySearch, cities || []);

  const resetMoreFilters = () => {
    onFiltersChange({
      ...filters,
      min_size: undefined,
      max_size: undefined,
      min_floor: undefined,
      max_floor: undefined,
      min_lot_size: undefined,
      max_lot_size: undefined,
      min_year_built: undefined,
      max_year_built: undefined,
      max_days_listed: undefined,
      min_parking: undefined,
      features: undefined,
      is_furnished: undefined,
      is_accessible: undefined,
      condition: undefined,
      neighborhoods: undefined,
      // Rental-specific filters
      available_now: undefined,
      available_by: undefined,
      allows_pets: undefined,
    });
  };
  
  const togglePetOption = (petValue: 'cats' | 'dogs' | 'all') => {
    const current = filters.allows_pets || [];
    if (current.includes(petValue)) {
      updateFilter('allows_pets', current.filter(p => p !== petValue));
    } else {
      updateFilter('allows_pets', [...current, petValue]);
    }
  };
  
  const handleAvailabilityChange = (value: string) => {
    if (value === 'any') {
      updateFilter('available_now', undefined);
      updateFilter('available_by', undefined);
    } else if (value === 'now') {
      updateFilter('available_now', true);
      updateFilter('available_by', undefined);
    } else {
      const days = parseInt(value);
      const date = new Date();
      date.setDate(date.getDate() + days);
      updateFilter('available_now', undefined);
      updateFilter('available_by', date.toISOString().split('T')[0]);
    }
  };
  
  const getSelectedAvailability = () => {
    if (filters.available_now) return 'now';
    if (filters.available_by) {
      const targetDate = new Date(filters.available_by);
      const today = new Date();
      const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 30) return '30';
      if (diffDays <= 60) return '60';
    }
    return 'any';
  };
  
  const toggleNeighborhood = (neighborhoodName: string) => {
    const current = filters.neighborhoods || [];
    if (current.includes(neighborhoodName)) {
      updateFilter('neighborhoods', current.filter(n => n !== neighborhoodName));
    } else {
      updateFilter('neighborhoods', [...current, neighborhoodName]);
    }
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
  const filterButtonActive = "bg-primary text-primary-foreground border-primary";

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-2 items-center">
        {/* Active/Sold Toggle - Only shown on for_sale listings */}
        {showSoldToggle && (
          <div className="flex items-center rounded-full border border-border/60 bg-background shadow-sm overflow-hidden mr-1">
            <button
              className={cn(
                "px-4 py-2.5 text-sm font-medium transition-all",
                !isSoldView 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
              onClick={() => onSoldToggle?.(false)}
            >
              Active
            </button>
            <button
              className={cn(
                "px-4 py-2.5 text-sm font-medium transition-all",
                isSoldView 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
              onClick={() => onSoldToggle?.(true)}
            >
              Sold
            </button>
          </div>
        )}

        {/* City Filter */}
        <Popover open={cityOpen} onOpenChange={setCityOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className={cn(filterButtonBase, (filters.city || filters.neighborhoods?.length) && "border-primary/50", cityOpen && filterButtonActive)}
            >
              <MapPin className="h-4 w-4" />
              <span>
                {filters.city 
                  ? filters.neighborhoods?.length 
                    ? `${filters.city} (${filters.neighborhoods.length})`
                    : filters.city
                  : 'City'}
              </span>
              {cityOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[360px] p-0 bg-background border shadow-xl z-50" align="start">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Location</h3>
                {(filters.city || filters.neighborhoods?.length) && (
                  <button 
                    className="text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      updateFilter('city', undefined);
                      updateFilter('neighborhoods', undefined);
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
              
              {/* City Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">City</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search city..."
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    className="pl-10 rounded-lg"
                  />
                </div>

                <div className="max-h-[150px] overflow-y-auto space-y-1">
                  {filteredCities?.map(city => (
                    <button
                      key={city.id}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm rounded-lg transition-colors",
                        filters.city === city.name 
                          ? "bg-primary text-primary-foreground font-medium" 
                          : "hover:bg-muted"
                      )}
                      onClick={() => {
                        updateFilter('city', city.name);
                        updateFilter('neighborhoods', undefined);
                        setCitySearch('');
                      }}
                    >
                      {city.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Neighborhood Selection - Only shown when city is selected */}
              {filters.city && neighborhoods && neighborhoods.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Neighborhoods</Label>
                    {filters.neighborhoods && filters.neighborhoods.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {filters.neighborhoods.length} selected
                      </span>
                    )}
                  </div>
                  
                  {neighborhoods.length > 6 && (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search neighborhoods..."
                        value={neighborhoodSearch}
                        onChange={(e) => setNeighborhoodSearch(e.target.value)}
                        className="pl-10 rounded-lg h-9 text-sm"
                      />
                    </div>
                  )}

                  <div className="max-h-[140px] overflow-y-auto space-y-0.5">
                    {filteredNeighborhoods.map(neighborhood => {
                      const isSelected = filters.neighborhoods?.includes(neighborhood.name) || false;
                      return (
                        <button
                          key={neighborhood.id}
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-lg hover:bg-muted transition-colors text-left"
                          onClick={() => toggleNeighborhood(neighborhood.name)}
                        >
                          <div className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                            isSelected 
                              ? "border-primary bg-primary" 
                              : "border-border"
                          )}>
                            {isSelected && (
                              <Check className="h-3 w-3 text-primary-foreground" />
                            )}
                          </div>
                          <span className="flex-1">{neighborhood.name}</span>
                          {neighborhood.price_tier && (
                            <span className="text-xs text-muted-foreground capitalize">{neighborhood.price_tier}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <Link 
                to="/tools" 
                className="flex items-center gap-1 text-primary text-sm font-medium hover:underline"
              >
                Not sure where to look? <ArrowRight className="h-4 w-4" />
              </Link>

              <Button 
                className="w-full"
                onClick={() => {
                  setCityOpen(false);
                  setNeighborhoodSearch('');
                }}
              >
                Apply
              </Button>
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
          <PopoverContent className="w-[340px] p-0 bg-background border shadow-xl z-50" align="start">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Price Range</h3>
                {(filters.min_price || filters.max_price) && (
                  <button 
                    className="text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      updateFilter('min_price', undefined);
                      updateFilter('max_price', undefined);
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
              
              <PriceRangeSlider
                minValue={filters.min_price}
                maxValue={filters.max_price}
                onMinChange={(val) => updateFilter('min_price', val)}
                onMaxChange={(val) => updateFilter('max_price', val)}
                baseMin={0}
                baseMax={listingType === 'for_rent' ? 30000 : 10000000}
                baseStep={listingType === 'for_rent' ? 500 : 50000}
                currency={currency}
                exchangeRate={exchangeRate}
              />

              <Link 
                to="/tools" 
                className="flex items-center gap-1 text-primary text-sm font-medium hover:underline"
              >
                Not sure how much you can afford? <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </PopoverContent>
        </Popover>

        {/* Beds/Baths Combined Filter */}
        <Popover open={bedsAndBathsOpen} onOpenChange={setBedsAndBathsOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className={cn(filterButtonBase, bedsAndBathsOpen && filterButtonActive)}
            >
              <LayoutGrid className="h-4 w-4" />
              <span>
                {filters.min_rooms || filters.min_bathrooms
                  ? `${filters.min_rooms ? `${filters.min_rooms}+ rm` : ''}${filters.min_rooms && filters.min_bathrooms ? ', ' : ''}${filters.min_bathrooms ? `${filters.min_bathrooms}+ ba` : ''}`
                  : 'Beds/Baths'}
              </span>
              {bedsAndBathsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-0 bg-background border shadow-xl z-50" align="start">
            <div className="p-4 space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Beds / Baths</h3>
                {(filters.min_rooms || filters.min_bathrooms) && (
                  <button 
                    className="text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      updateFilter('min_rooms', undefined);
                      updateFilter('min_bathrooms', undefined);
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Rooms Section */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Rooms</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[250px]">
                      <p className="text-sm">In Israel, rooms = bedrooms + living areas. A "4-room" apt typically has 3 bedrooms.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex gap-1.5">
                  <button
                    className={cn(
                      "h-9 px-3 rounded-lg border text-sm font-medium transition-all",
                      !filters.min_rooms
                        ? "bg-primary text-primary-foreground border-primary" 
                        : "border-border hover:bg-muted"
                    )}
                    onClick={() => updateFilter('min_rooms', undefined)}
                  >
                    Any
                  </button>
                  {[2, 3, 4, 5, 6, 7].map(num => (
                    <button
                      key={num}
                      className={cn(
                        "h-9 w-10 rounded-lg border text-sm font-medium transition-all",
                        filters.min_rooms === num 
                          ? "bg-primary text-primary-foreground border-primary" 
                          : "border-border hover:bg-muted"
                      )}
                      onClick={() => updateFilter('min_rooms', num)}
                    >
                      {num}{num === 7 ? '+' : '+'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bathrooms Section */}
              <div className="space-y-2.5">
                <span className="font-medium text-sm">Bathrooms</span>
                <div className="flex gap-1.5">
                  <button
                    className={cn(
                      "h-9 px-3 rounded-lg border text-sm font-medium transition-all",
                      !filters.min_bathrooms
                        ? "bg-primary text-primary-foreground border-primary" 
                        : "border-border hover:bg-muted"
                    )}
                    onClick={() => updateFilter('min_bathrooms', undefined)}
                  >
                    Any
                  </button>
                  {[1, 1.5, 2, 3, 4].map(num => (
                    <button
                      key={num}
                      className={cn(
                        "h-9 px-3 rounded-lg border text-sm font-medium transition-all",
                        filters.min_bathrooms === num 
                          ? "bg-primary text-primary-foreground border-primary" 
                          : "border-border hover:bg-muted"
                      )}
                      onClick={() => updateFilter('min_bathrooms', num)}
                    >
                      {num}+
                    </button>
                  ))}
                </div>
              </div>

              {/* Apply Button */}
              <div className="pt-2 border-t">
                <Button 
                  className="w-full"
                  onClick={() => setBedsAndBathsOpen(false)}
                >
                  Apply
                </Button>
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
              onClick={handleCreateAlertClick}
              className="h-11 gap-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-5 font-medium shadow-sm"
            >
              <Bell className="h-4 w-4" />
              <span>Create Alert</span>
            </Button>
          )}
        </div>
      </div>

      {/* More Filters Sheet */}
      <Sheet open={moreFiltersOpen} onOpenChange={setMoreFiltersOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-xl">More Filters</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-6 py-2">
            {/* New Listings / Days on Market */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Clock className="h-4 w-4" />
                <h4 className="font-semibold">New Listings</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {DAYS_ON_MARKET_OPTIONS.map(option => (
                  <button
                    key={option.label}
                    className={cn(
                      "px-4 h-9 rounded-full text-sm font-medium transition-all",
                      filters.max_days_listed === option.value 
                        ? "bg-primary text-primary-foreground" 
                        : "border border-border hover:bg-muted"
                    )}
                    onClick={() => updateFilter('max_days_listed', option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

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
                    <Input 
                      type="number" 
                      placeholder="Min" 
                      className="rounded-lg"
                      value={filters.min_floor ?? ''}
                      onChange={(e) => updateFilter('min_floor', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                    <Input 
                      type="number" 
                      placeholder="Max" 
                      className="rounded-lg"
                      value={filters.max_floor ?? ''}
                      onChange={(e) => updateFilter('max_floor', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </div>
                </div>
              </div>
              
              {/* Lot Size - Only shown for house types */}
              {showLotSizeFilter && (
                <div className="space-y-2 pt-2">
                  <Label className="text-sm text-muted-foreground">Lot Size (m²)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="Min"
                      value={formatWithCommas(filters.min_lot_size)}
                      onChange={(e) => updateFilter('min_lot_size', parseCommaNumber(e.target.value))}
                      className="rounded-lg"
                    />
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="Max"
                      value={formatWithCommas(filters.max_lot_size)}
                      onChange={(e) => updateFilter('max_lot_size', parseCommaNumber(e.target.value))}
                      className="rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Year Built */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Calendar className="h-4 w-4" />
                <h4 className="font-semibold">Year Built</h4>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {YEAR_BUILT_PRESETS.map(preset => (
                  <button
                    key={preset.value}
                    className={cn(
                      "px-4 h-9 rounded-full text-sm font-medium transition-all",
                      filters.min_year_built === preset.value && !filters.max_year_built
                        ? "bg-primary text-primary-foreground" 
                        : "border border-border hover:bg-muted"
                    )}
                    onClick={() => {
                      updateFilter('min_year_built', preset.value);
                      updateFilter('max_year_built', undefined);
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
                {filters.min_year_built && (
                  <button
                    className="px-3 h-9 text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      updateFilter('min_year_built', undefined);
                      updateFilter('max_year_built', undefined);
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="From year"
                  value={filters.min_year_built ?? ''}
                  onChange={(e) => updateFilter('min_year_built', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="rounded-lg"
                  min={1900}
                  max={new Date().getFullYear()}
                />
                <Input
                  type="number"
                  placeholder="To year"
                  value={filters.max_year_built ?? ''}
                  onChange={(e) => updateFilter('max_year_built', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="rounded-lg"
                  min={1900}
                  max={new Date().getFullYear()}
                />
              </div>
            </div>

            {/* Rental-specific: Availability */}
            {listingType === 'for_rent' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <CalendarCheck className="h-4 w-4" />
                  <h4 className="font-semibold">Availability</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {AVAILABILITY_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      className={cn(
                        "px-4 h-9 rounded-full text-sm font-medium transition-all",
                        getSelectedAvailability() === option.value 
                          ? "bg-primary text-primary-foreground" 
                          : "border border-border hover:bg-muted"
                      )}
                      onClick={() => handleAvailabilityChange(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Rental-specific: Pet Policy */}
            {listingType === 'for_rent' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <PawPrint className="h-4 w-4" />
                  <h4 className="font-semibold">Pet Policy</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PET_OPTIONS.map(option => {
                    const isSelected = filters.allows_pets?.includes(option.value as 'cats' | 'dogs' | 'all');
                    return (
                      <button
                        key={option.value}
                        className={cn(
                          "flex items-center gap-2 px-4 h-9 rounded-full text-sm font-medium transition-all",
                          isSelected
                            ? "bg-primary text-primary-foreground" 
                            : "border border-border hover:bg-muted"
                        )}
                        onClick={() => togglePetOption(option.value as 'cats' | 'dogs' | 'all')}
                      >
                        <option.Icon className={cn("h-4 w-4", isSelected ? "" : "text-primary")} />
                        <span>{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

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
                  <Home className="h-4 w-4" />
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
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
}