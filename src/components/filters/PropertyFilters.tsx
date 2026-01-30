import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, MapPin, DollarSign, LayoutGrid, Bath, Building2, SlidersHorizontal, ArrowUpDown, Bell, X, Search, Check, Sparkles, Car, Layers, ArrowRight, Calendar, Clock, Home, PawPrint, CalendarCheck, Cat, Dog, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PriceRangeSlider } from '@/components/filters/PriceRangeSlider';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { PropertyFilters as PropertyFiltersType, PropertyType, PropertyCondition, SortOption } from '@/types/database';
import { useCities } from '@/hooks/useCities';
import { cn } from '@/lib/utils';
import { matchCities } from '@/lib/utils/cityMatcher';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileFilterSheet } from '@/components/filters/MobileFilterSheet';

interface PropertyFiltersProps {
  filters: PropertyFiltersType;
  onFiltersChange: (filters: PropertyFiltersType) => void;
  listingType: 'for_sale' | 'for_rent' | 'projects';
  onCreateAlert?: () => void;
  showSoldToggle?: boolean;
  isSoldView?: boolean;
  onSoldToggle?: (showSold: boolean) => void;
  previewCount?: number;
  isCountLoading?: boolean;
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

export function PropertyFilters({ filters, onFiltersChange, listingType, onCreateAlert, showSoldToggle, isSoldView, onSoldToggle, previewCount, isCountLoading }: PropertyFiltersProps) {
  const [cityOpen, setCityOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const [bedsAndBathsOpen, setBedsAndBathsOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  
  const { data: cities } = useCities();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { currency, exchangeRate } = usePreferences();
  const isMobile = useIsMobile();
  
  // Count active filters for mobile badge (excluding city, sort, listing_status)
  const mobileActiveFilterCount = useMemo(() => {
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
  
  // Use passed count from parent instead of separate query
  const countLoading = isCountLoading;
  
  // Check if lot size filter should be shown (for house-type properties)
  const showLotSizeFilter = useMemo(() => {
    const houseTypes: PropertyType[] = ['house', 'cottage', 'garden_apartment'];
    return filters.property_types?.some(t => houseTypes.includes(t)) || false;
  }, [filters.property_types]);
  

  const handleCreateAlertClick = () => {
    if (!user) {
      navigate('/auth?redirect=/listings&intent=create_alert');
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
  

  const getSortLabel = () => {
    if (filters.sort_by) {
      const found = SORT_OPTIONS.find(s => s.value === filters.sort_by);
      return found?.label || 'Newest Listings';
    }
    return 'Newest Listings';
  };

  // Check if any filters are active (excluding sort and listing_status)
  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.city ||
      filters.min_price ||
      filters.max_price ||
      filters.min_rooms ||
      filters.min_bathrooms ||
      filters.property_types?.length ||
      filters.features?.length ||
      filters.min_size ||
      filters.max_size ||
      filters.min_parking ||
      filters.condition ||
      filters.min_year_built ||
      filters.min_floor ||
      filters.max_floor ||
      filters.max_days_listed ||
      filters.allows_pets?.length ||
      filters.available_by ||
      filters.available_now
    );
  }, [filters]);

  // Clear all filters except listing_status and sort_by
  const clearAllFilters = () => {
    onFiltersChange({
      listing_status: filters.listing_status,
      sort_by: filters.sort_by,
    });
  };

  // Filter button base styles
  const filterButtonBase = "h-11 min-h-[44px] gap-2 rounded-full border border-border/60 bg-background hover:bg-muted/30 shadow-sm px-4 font-medium transition-all active:scale-[0.98] touch-manipulation";
  const filterButtonActive = "bg-primary text-primary-foreground border-primary";

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {/* Row 1: Main Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Active/Sold Toggle - Only shown on for_sale listings, DESKTOP ONLY */}
          {showSoldToggle && !isMobile && (
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
                className={cn(filterButtonBase, filters.city && "border-primary/50", cityOpen && filterButtonActive)}
              >
                <MapPin className="h-4 w-4" />
                <span>{filters.city || 'City'}</span>
                {cityOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[360px] p-0 bg-background border shadow-xl z-50" align="start">
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Location</h3>
                  {filters.city && (
                    <button 
                      className="text-sm text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        onFiltersChange({
                          ...filters,
                          city: undefined,
                        });
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
                          onFiltersChange({
                            ...filters,
                            city: city.name,
                            neighborhoods: undefined,
                          });
                          setCityOpen(false);
                          setCitySearch('');
                        }}
                      >
                        {city.name}
                      </button>
                    ))}
                  </div>
                </div>


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
                  }}
                >
                  {countLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {previewCount !== undefined ? `Show ${previewCount} results` : 'Apply'}
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Mobile: Consolidated Filters Button */}
          {isMobile && (
            <Button 
              variant="outline"
              className={cn(filterButtonBase, mobileActiveFilterCount > 0 && "border-primary/50")}
              onClick={() => setMobileFiltersOpen(true)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>{mobileActiveFilterCount > 0 ? `Filters (${mobileActiveFilterCount})` : 'Filters'}</span>
            </Button>
          )}

          {/* Desktop: Price Filter */}
          {!isMobile && (
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
            <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[340px] p-0 bg-background border shadow-xl z-50" align="start">
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
                  onRangeChange={(min, max) => {
                    // single update to avoid stale-props overwriting
                    onFiltersChange({ ...filters, min_price: min, max_price: max });
                  }}
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
          )}

          {/* Desktop: Beds/Baths Combined Filter */}
          {!isMobile && (
          <Popover open={bedsAndBathsOpen} onOpenChange={setBedsAndBathsOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className={cn(filterButtonBase, bedsAndBathsOpen && filterButtonActive)}
              >
                <LayoutGrid className="h-4 w-4" />
                <span>Beds / Baths</span>
                {bedsAndBathsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[320px] p-0 bg-background border shadow-xl z-50" align="start">
              <div className="p-4 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Rooms & Bathrooms</h3>
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

                {/* Rooms */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Rooms</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[250px]">
                        <p className="text-sm">In Israel, "rooms" includes living areas. A 3-room apartment typically has 2 bedrooms + a living room.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex gap-2">
                    {[undefined, 2, 3, 4, 5].map(num => (
                      <button
                        key={num ?? 'any'}
                        className={cn(
                          "flex-1 h-10 rounded-full text-sm font-medium transition-all",
                          filters.min_rooms === num 
                            ? "bg-primary text-primary-foreground" 
                            : "border border-border hover:bg-muted"
                        )}
                        onClick={() => updateFilter('min_rooms', num)}
                      >
                        {num ?? 'Any'}
                        {num && '+'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bathrooms */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Bathrooms</Label>
                  <div className="flex gap-2">
                    {[undefined, 1, 2, 3].map(num => (
                      <button
                        key={num ?? 'any'}
                        className={cn(
                          "flex-1 h-10 rounded-full text-sm font-medium transition-all",
                          filters.min_bathrooms === num 
                            ? "bg-primary text-primary-foreground" 
                            : "border border-border hover:bg-muted"
                        )}
                        onClick={() => updateFilter('min_bathrooms', num)}
                      >
                        {num ?? 'Any'}
                        {num && '+'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          )}

          {/* Desktop: Property Type */}
          {!isMobile && (
          <Popover open={typeOpen} onOpenChange={setTypeOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className={cn(filterButtonBase, typeOpen && filterButtonActive)}
              >
                <Building2 className="h-4 w-4" />
                <span>Type</span>
                {typeOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[320px] p-0 bg-background border shadow-xl z-50" align="start">
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Property Type</h3>
                  {filters.property_types?.length && (
                    <button 
                      className="text-sm text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        updateFilter('property_types', undefined);
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {PROPERTY_TYPES.map(type => (
                    <button
                      key={type.value}
                      className={cn(
                        "px-4 h-9 rounded-full text-sm font-medium transition-all",
                        filters.property_types?.includes(type.value) 
                          ? "bg-primary text-primary-foreground" 
                          : "border border-border hover:bg-muted"
                      )}
                      onClick={() => {
                        const current = filters.property_types || [];
                        if (current.includes(type.value)) {
                          updateFilter('property_types', current.filter(t => t !== type.value));
                        } else {
                          updateFilter('property_types', [...current, type.value]);
                        }
                      }}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          )}

          {/* Desktop: More Filters */}
          {!isMobile && (
            <Button 
              variant="outline"
              className={cn(filterButtonBase)}
              onClick={() => setMoreFiltersOpen(true)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>More</span>
            </Button>
          )}

          {/* Clear All Filters - Desktop only */}
          {hasActiveFilters && !isMobile && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={clearAllFilters}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Clear</span>
            </Button>
          )}
        </div>

        {/* Row 2: Sort & Alert - Mobile uses justify-between, desktop stays inline */}
        <div className={cn(
          "flex items-center",
          isMobile ? "justify-between" : "gap-3"
        )}>
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
              <PopoverContent className="w-[220px] p-2 bg-background border shadow-xl z-50" align="start">
                {SORT_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg transition-colors text-left",
                      filters.sort_by === option.value 
                        ? "bg-primary/10 text-primary font-medium" 
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

          {/* Subtle Separator - Desktop only */}
          {onCreateAlert && !isMobile && (
            <div className="h-6 w-px bg-border/60" />
          )}

          {/* Create Alert Button */}
          {onCreateAlert && (
            <Button 
              onClick={handleCreateAlertClick}
              className="h-11 gap-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-5 font-medium shadow-sm"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Create Alert</span>
            </Button>
          )}
        </div>
      </div>

      {/* More Filters Sheet - Full screen on mobile */}
      <Sheet open={moreFiltersOpen} onOpenChange={setMoreFiltersOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
          <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
            <SheetHeader className="text-left">
              <SheetTitle className="text-xl">More Filters</SheetTitle>
            </SheetHeader>
          </div>
          
          <div className="px-4 pb-32 space-y-6 py-2">
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
          
          {/* Fixed bottom action bar - sticky at bottom */}
          <div className="fixed bottom-0 left-0 right-0 sm:left-auto sm:right-0 sm:w-full sm:max-w-md bg-background border-t border-border p-4 pb-safe flex gap-3 z-20">
            <Button 
              variant="outline" 
              className="flex-1 rounded-full h-12"
              onClick={resetMoreFilters}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button 
              className="flex-1 rounded-full h-12 bg-primary"
              onClick={() => setMoreFiltersOpen(false)}
            >
              {countLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {previewCount !== undefined ? `Show ${previewCount} results` : 'Apply Filters'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile Filters Sheet */}
      <MobileFilterSheet
        open={mobileFiltersOpen}
        onOpenChange={setMobileFiltersOpen}
        filters={filters}
        onFiltersChange={onFiltersChange}
        listingType={listingType}
        cities={cities || []}
        previewCount={previewCount}
        isCountLoading={isCountLoading}
        currency={currency}
        exchangeRate={exchangeRate}
        showSoldToggle={showSoldToggle}
        isSoldView={isSoldView}
        onSoldToggle={onSoldToggle}
      />
    </TooltipProvider>
  );
}