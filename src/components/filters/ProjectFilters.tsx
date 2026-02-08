import { useState, useMemo } from 'react';
 import { ChevronDown, ChevronUp, MapPin, DollarSign, Building2, Calendar, ArrowUpDown, Search, Check, ArrowRight, LayoutGrid, HelpCircle, Bell, Briefcase, Loader2, RotateCcw, SlidersHorizontal, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PriceRangeSlider } from '@/components/filters/PriceRangeSlider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCities } from '@/hooks/useCities';
import { useDevelopers, useProjectCount } from '@/hooks/useProjects';
import { cn } from '@/lib/utils';
import { matchCities } from '@/lib/utils/cityMatcher';
import { Link } from 'react-router-dom';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { ProjectMobileFilterSheet } from '@/components/filters/ProjectMobileFilterSheet';
 import { useGeolocation } from '@/hooks/useGeolocation';
 import { findNearestCity } from '@/lib/utils/findNearestCity';

export interface ProjectFiltersType {
  city?: string;
  status?: string;
  min_price?: number;
  max_price?: number;
  completion_year?: number;
  min_rooms?: number;
  min_bathrooms?: number;
  developer_id?: string;
  sort_by?: 'newest' | 'price_asc' | 'price_desc' | 'completion';
}

interface ProjectFiltersProps {
  filters: ProjectFiltersType;
  onFiltersChange: (filters: ProjectFiltersType) => void;
  onCreateAlert?: () => void;
}

const PROJECT_STATUSES = [
  { value: 'planning', label: 'Planning' },
  { value: 'pre_sale', label: 'Pre-Sale' },
  { value: 'foundation', label: 'Foundation' },
  { value: 'structure', label: 'Structure' },
  { value: 'finishing', label: 'Finishing' },
  { value: 'delivery', label: 'Delivery' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'completion', label: 'Completion Date' },
];

const formatWithCommas = (value: number | undefined): string => {
  if (value === undefined || value === null) return '';
  return value.toLocaleString('en-US');
};

const parseCommaNumber = (value: string): number | undefined => {
  const cleaned = value.replace(/,/g, '');
  if (cleaned === '') return undefined;
  const num = Number(cleaned);
  return isNaN(num) ? undefined : num;
};


export function ProjectFilters({ filters, onFiltersChange, onCreateAlert }: ProjectFiltersProps) {
  const [cityOpen, setCityOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);
  const [bedsAndBathsOpen, setBedsAndBathsOpen] = useState(false);
  const [developerOpen, setDeveloperOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [developerSearch, setDeveloperSearch] = useState('');
   const [geoError, setGeoError] = useState<string | null>(null);
  
  const { data: cities } = useCities();
  const { data: developers } = useDevelopers();
  const { currency, exchangeRate } = usePreferences();
  const isMobile = useIsMobile();
  
  // Dynamic count for Apply buttons - shows preview of matching results
  const { data: previewCount, isFetching: countLoading } = useProjectCount(filters);
 
   const { getLocation, isLoading: geoLoading, coordinates, error: geoLocationError, isSupported: geoSupported } = useGeolocation();
   
   // Handle geolocation result
   useMemo(() => {
     if (coordinates && cities?.length) {
       const nearest = findNearestCity(coordinates, cities);
       if (nearest) {
         updateFilter('city', nearest.name);
         setCityOpen(false);
         setGeoError(null);
       } else {
         setGeoError('No supported city nearby');
       }
     }
   }, [coordinates, cities]);
   
   // Show geo error from hook
   useMemo(() => {
     if (geoLocationError) {
       setGeoError(geoLocationError);
     }
   }, [geoLocationError]);
   
   const handleUseMyLocation = () => {
     setGeoError(null);
     getLocation();
   };

  // Count active filters for mobile badge (excluding city, sort)
  const mobileActiveFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status) count++;
    if (filters.min_price || filters.max_price) count++;
    if (filters.min_rooms || filters.min_bathrooms) count++;
    if (filters.completion_year) count++;
    if (filters.developer_id) count++;
    return count;
  }, [filters]);

  const filteredDevelopers = developers?.filter(dev => 
    dev.name.toLowerCase().includes(developerSearch.toLowerCase())
  );

  const updateFilter = <K extends keyof ProjectFiltersType>(key: K, value: ProjectFiltersType[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const filteredCities = matchCities(citySearch, cities || []);

  const currentYear = new Date().getFullYear();
  const completionYears = Array.from({ length: 6 }, (_, i) => currentYear + i);

  const getSortLabel = () => {
    if (filters.sort_by) {
      const found = SORT_OPTIONS.find(s => s.value === filters.sort_by);
      return found?.label || 'Newest First';
    }
    return 'Newest First';
  };

  // Check if any filters are active (excluding sort)
  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.city ||
      filters.status ||
      filters.min_price ||
      filters.max_price ||
      filters.completion_year ||
      filters.min_rooms ||
      filters.min_bathrooms ||
      filters.developer_id
    );
  }, [filters]);

  // Clear all filters except sort_by
  const clearAllFilters = () => {
    onFiltersChange({
      sort_by: filters.sort_by,
    });
  };

  const filterButtonBase = "h-11 min-h-[44px] gap-2 rounded-full border border-border/60 bg-background hover:bg-muted/30 shadow-sm px-4 font-medium transition-all active:scale-[0.98] touch-manipulation";
  const filterButtonActive = "bg-primary text-primary-foreground border-primary";

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* City Filter */}
      <Popover open={cityOpen} onOpenChange={setCityOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className={cn(filterButtonBase, (cityOpen || filters.city) && filterButtonActive)}
          >
            <MapPin className="h-4 w-4" />
            <span>{filters.city || 'City'}</span>
            {cityOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[320px] p-0 bg-background border shadow-xl z-50" align="start">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Select City</h3>
              {filters.city && (
                <button 
                  className="text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    updateFilter('city', undefined);
                    setCityOpen(false);
                  }}
                >
                  Clear
                </button>
              )}
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search city..."
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                className="pl-10 rounded-lg"
              />
            </div>

             {/* My Location Button */}
             {geoSupported && (
               <div className="space-y-1">
                 <button
                   type="button"
                   disabled={geoLoading || !cities?.length}
                   onClick={handleUseMyLocation}
                   className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
                 >
                   {geoLoading ? (
                     <Loader2 className="h-4 w-4 animate-spin" />
                   ) : (
                     <Navigation className="h-4 w-4" />
                   )}
                   <span>{geoLoading ? 'Locating...' : 'Use my location'}</span>
                 </button>
                 {geoError && (
                   <p className="text-xs text-muted-foreground px-3">{geoError}</p>
                 )}
               </div>
             )}
 
             <div className="border-t my-2" />
 
            <div className="max-h-[250px] overflow-y-auto space-y-1">
              {filteredCities?.map(city => (
                <button
                  key={city.id}
                  className={cn(
                    "w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors",
                    filters.city === city.name 
                      ? "bg-accent text-accent-foreground font-medium" 
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
              to="/areas" 
              className="flex items-center gap-1 text-primary text-sm font-medium hover:underline"
            >
              Explore all areas <ArrowRight className="h-4 w-4" />
            </Link>
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

      {/* Desktop: Status Filter */}
      {!isMobile && (
      <Popover open={statusOpen} onOpenChange={setStatusOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className={cn(filterButtonBase, (statusOpen || filters.status) && filterButtonActive)}
          >
            <Building2 className="h-4 w-4" />
            <span>{filters.status ? PROJECT_STATUSES.find(s => s.value === filters.status)?.label : 'Status'}</span>
            {statusOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[240px] p-0 bg-background border shadow-xl z-50" align="start">
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Project Status</h3>
              {filters.status && (
                <button 
                  className="text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => updateFilter('status', undefined)}
                >
                  Clear
                </button>
              )}
            </div>
            
            <div className="space-y-1">
              {PROJECT_STATUSES.map(status => (
                <button
                  key={status.value}
                  className={cn(
                    "w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors flex items-center justify-between",
                    filters.status === status.value 
                      ? "bg-accent text-accent-foreground font-medium" 
                      : "hover:bg-muted"
                  )}
                  onClick={() => {
                    updateFilter('status', status.value);
                    setStatusOpen(false);
                  }}
                >
                  {status.label}
                  {filters.status === status.value && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
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
            className={cn(filterButtonBase, (bedsAndBathsOpen || filters.min_rooms || filters.min_bathrooms) && filterButtonActive)}
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
        <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[360px] p-0 bg-background border shadow-xl z-50" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
          <TooltipProvider>
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

              {/* Bedrooms Section */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Bedrooms</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
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
                      {num}+
                    </button>
                  ))}
                </div>
              </div>

              {/* Bathrooms Section */}
              <div className="space-y-2.5">
                <span className="font-medium text-sm">Bathrooms</span>
                <div className="flex flex-wrap gap-1.5">
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
                  {countLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {previewCount !== undefined ? `Show ${previewCount} results` : 'Apply'}
                </Button>
              </div>
            </div>
          </TooltipProvider>
        </PopoverContent>
      </Popover>
      )}

      {/* Desktop: Price Filter */}
      {!isMobile && (
      <Popover open={priceOpen} onOpenChange={setPriceOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className={cn(filterButtonBase, (priceOpen || filters.min_price || filters.max_price) && filterButtonActive)}
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
                onFiltersChange({ ...filters, min_price: min, max_price: max });
              }}
              baseMin={0}
              baseMax={15000000}
              baseStep={100000}
              currency={currency}
              exchangeRate={exchangeRate}
            />

            <Link 
              to="/tools?tool=affordability" 
              className="flex items-center gap-1 text-primary text-sm font-medium hover:underline"
            >
              Not sure how much you can afford? <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </PopoverContent>
      </Popover>
      )}

      {/* Desktop: Completion Year Filter */}
      {!isMobile && (
      <Popover open={yearOpen} onOpenChange={setYearOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className={cn(filterButtonBase, (yearOpen || filters.completion_year) && filterButtonActive)}
          >
            <Calendar className="h-4 w-4" />
            <span>{filters.completion_year || 'Completion'}</span>
            {yearOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[200px] p-0 bg-background border shadow-xl z-50" align="start">
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Completion</h3>
              {filters.completion_year && (
                <button 
                  className="text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => updateFilter('completion_year', undefined)}
                >
                  Clear
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {completionYears.map(year => (
                <button
                  key={year}
                  className={cn(
                    "h-10 rounded-lg border text-sm font-medium transition-all",
                    filters.completion_year === year 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "border-border hover:bg-muted"
                  )}
                  onClick={() => {
                    updateFilter('completion_year', filters.completion_year === year ? undefined : year);
                    setYearOpen(false);
                  }}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      )}

      {/* Desktop: Developer Filter */}
      {!isMobile && (
      <Popover open={developerOpen} onOpenChange={setDeveloperOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className={cn(filterButtonBase, (developerOpen || filters.developer_id) && filterButtonActive)}
          >
            <Briefcase className="h-4 w-4" />
            <span>{filters.developer_id ? developers?.find(d => d.id === filters.developer_id)?.name || 'Developer' : 'Developer'}</span>
            {developerOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[320px] p-0 bg-background border shadow-xl z-50" align="start">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Developer</h3>
              {filters.developer_id && (
                <button 
                  className="text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    updateFilter('developer_id', undefined);
                    setDeveloperOpen(false);
                  }}
                >
                  Clear
                </button>
              )}
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search developer..."
                value={developerSearch}
                onChange={(e) => setDeveloperSearch(e.target.value)}
                className="pl-10 rounded-lg"
              />
            </div>

            <div className="max-h-[200px] overflow-y-auto space-y-1">
              {filteredDevelopers?.map(dev => (
                <button
                  key={dev.id}
                  className={cn(
                    "w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors flex items-center justify-between",
                    filters.developer_id === dev.id 
                      ? "bg-accent text-accent-foreground font-medium" 
                      : "hover:bg-muted"
                  )}
                  onClick={() => {
                    updateFilter('developer_id', dev.id);
                    setDeveloperOpen(false);
                    setDeveloperSearch('');
                  }}
                >
                  <span>{dev.name}</span>
                  {dev.is_verified && (
                    <span className="text-xs text-primary">✓ Verified</span>
                  )}
                </button>
              ))}
              {filteredDevelopers?.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No developers found</p>
              )}
            </div>

            <Link 
              to="/developers" 
              className="flex items-center gap-1 text-primary text-sm font-medium hover:underline"
            >
              View all developers <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </PopoverContent>
      </Popover>
      )}

      {/* Clear All Filters - Only shown when filters are active */}
      {hasActiveFilters && (
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

      {/* Sort & Create Alert */}
      <div className="flex items-center gap-2 ml-auto">
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Popover open={sortOpen} onOpenChange={setSortOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                className="h-11 gap-1 px-2 font-medium hover:bg-muted/50"
              >
                <span className="text-sm">{getSortLabel()}</span>
                {sortOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[200px] p-2 bg-background border shadow-xl z-50" align="end">
              {SORT_OPTIONS.map(option => (
                <button
                  key={option.value}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between",
                    filters.sort_by === option.value 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "hover:bg-muted"
                  )}
                  onClick={() => {
                    updateFilter('sort_by', option.value as ProjectFiltersType['sort_by']);
                    setSortOpen(false);
                  }}
                >
                  {option.label}
                  {filters.sort_by === option.value && <Check className="h-4 w-4" />}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>

        {onCreateAlert && (
          <Button 
            onClick={onCreateAlert}
            className="h-11 gap-2 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-4"
          >
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Create Alert</span>
          </Button>
        )}
      </div>

      {/* Mobile Filters Sheet */}
      <ProjectMobileFilterSheet
        open={mobileFiltersOpen}
        onOpenChange={setMobileFiltersOpen}
        filters={filters}
        onFiltersChange={onFiltersChange}
        cities={cities || []}
        developers={developers}
        previewCount={previewCount}
        isCountLoading={countLoading}
        currency={currency}
        exchangeRate={exchangeRate}
      />
    </div>
  );
}
