import { useState } from 'react';
import { MapPin, DollarSign, LayoutGrid, Building2, Calendar, Briefcase, Loader2, Bath, Search, Layers, Sparkles, Car, Check, HardHat, Home } from 'lucide-react';
import { NeighborhoodSelector } from '@/components/filters/NeighborhoodSelector';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { PriceRangeSlider } from '@/components/filters/PriceRangeSlider';
import { Input } from '@/components/ui/input';
import { ProjectFiltersType } from '@/components/filters/ProjectFilters';

interface ProjectMobileFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: ProjectFiltersType;
  onFiltersChange: (filters: ProjectFiltersType) => void;
  cities: { id: string; name: string }[];
  developers?: { id: string; name: string; is_verified?: boolean }[];
  previewCount?: number;
  isCountLoading?: boolean;
  currency: string;
  exchangeRate: number;
}

const PROJECT_STATUSES = [
  { value: 'planning', label: 'Planning', desc: 'Permits & approvals in progress' },
  { value: 'pre_sale', label: 'Pre-Sale', desc: 'Units available before construction' },
  { value: 'foundation', label: 'Foundation', desc: 'Groundwork & foundation laid' },
  { value: 'structure', label: 'Structure', desc: 'Building frame going up' },
  { value: 'finishing', label: 'Finishing', desc: 'Interior work & fit-out' },
  { value: 'delivery', label: 'Delivery', desc: 'Ready for handover' },
];

export function ProjectMobileFilterSheet({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  cities,
  developers,
  previewCount,
  isCountLoading,
  currency,
  exchangeRate,
}: ProjectMobileFilterSheetProps) {
  const [citySearch, setCitySearch] = useState('');
  const [developerSearch, setDeveloperSearch] = useState('');

  const updateFilter = <K extends keyof ProjectFiltersType>(key: K, value: ProjectFiltersType[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const filteredCities = citySearch
    ? cities.filter(c => c.name.toLowerCase().includes(citySearch.toLowerCase()))
    : cities;

  const filteredDevelopers = developerSearch
    ? developers?.filter(d => d.name.toLowerCase().includes(developerSearch.toLowerCase()))
    : developers;

  const clearAllFilters = () => {
    onFiltersChange({
      sort_by: filters.sort_by,
    });
  };

  const currentYear = new Date().getFullYear();
  const completionYears = Array.from({ length: 6 }, (_, i) => currentYear + i);

  const PROJECT_AMENITIES = [
    { value: 'elevator', label: 'Elevator' },
    { value: 'balcony', label: 'Balcony' },
    { value: 'storage', label: 'Storage' },
    { value: 'garden', label: 'Garden/Yard' },
    { value: 'safe_room', label: 'Safe Room' },
    { value: 'pool', label: 'Pool' },
    { value: 'parking', label: 'Parking' },
    { value: 'ac', label: 'A/C' },
    { value: 'accessible', label: 'Accessible' },
    { value: 'sea_view', label: 'Sea View' },
    { value: 'sukkah_balcony', label: 'Sukkah Balcony' },
    { value: 'shabbat_elevator', label: 'Shabbos Elevator' },
  ];

  // Count active filters
  const activeFilterCount = [
    filters.city,
    filters.status,
    filters.min_price || filters.max_price,
    filters.min_rooms || filters.min_bathrooms,
    filters.completion_year_from || filters.completion_year_to,
    filters.developer_id,
    filters.amenities && filters.amenities.length > 0,
    filters.min_size || filters.max_size,
    filters.min_parking,
  ].filter(Boolean).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-background border-b border-border px-4 py-4 flex items-center justify-between">
          <SheetHeader className="text-left flex-1">
            <SheetTitle className="text-lg font-semibold">Filters</SheetTitle>
          </SheetHeader>
          {activeFilterCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary text-sm"
              onClick={clearAllFilters}
            >
              Clear All
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[calc(90vh-140px)]">
          <div className="px-4 py-4 space-y-6">
            {/* City Section */}
            <section className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                City
              </h3>
              <Input
                placeholder="Search city..."
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                className="rounded-xl"
              />
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {filteredCities.slice(0, 12).map(city => (
                  <button
                    key={city.id}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                      filters.city === city.name 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted hover:bg-muted/80"
                    )}
                    onClick={() => {
                      if (filters.city === city.name) {
                        onFiltersChange({ ...filters, city: undefined, neighborhoods: undefined });
                      } else {
                        onFiltersChange({ ...filters, city: city.name, neighborhoods: undefined });
                      }
                    }}
                  >
                    {city.name}
                  </button>
                ))}
              </div>
            </section>

            {/* Neighborhood Section */}
            <section className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Neighborhood
                {filters.neighborhoods?.length ? (
                  <span className="text-xs text-muted-foreground font-normal">({filters.neighborhoods.length} selected)</span>
                ) : null}
              </h3>
              <NeighborhoodSelector
                cityName={filters.city}
                selectedNeighborhoods={filters.neighborhoods || []}
                onNeighborhoodsChange={(neighborhoods) => {
                  onFiltersChange({
                    ...filters,
                    neighborhoods: neighborhoods.length > 0 ? neighborhoods : undefined,
                  });
                }}
                onCityChange={(city) => {
                  onFiltersChange({ ...filters, city, neighborhoods: undefined });
                }}
              />
            </section>

            {/* Status Section */}
            <section className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Project Status
              </h3>
              <div className="flex flex-wrap gap-2">
                {PROJECT_STATUSES.map(status => (
                  <button
                    key={status.value}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                      filters.status === status.value 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted hover:bg-muted/80"
                    )}
                    onClick={() => updateFilter('status', filters.status === status.value ? undefined : status.value)}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Price Section */}
            <section className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Price Range
              </h3>
              <PriceRangeSlider
                minValue={filters.min_price}
                maxValue={filters.max_price}
                onRangeChange={(min, max) => {
                  onFiltersChange({ ...filters, min_price: min, max_price: max });
                }}
                baseMin={0}
                baseMax={15000000}
                baseStep={100000}
                currency={currency as 'ILS' | 'USD'}
                exchangeRate={exchangeRate}
              />
            </section>

            {/* Bedrooms Section */}
            <section className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-primary" />
                Bedrooms
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all",
                    !filters.min_rooms 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted hover:bg-muted/80"
                  )}
                  onClick={() => updateFilter('min_rooms', undefined)}
                >
                  Any
                </button>
                {[2, 3, 4, 5, 6].map(num => (
                  <button
                    key={num}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all",
                      filters.min_rooms === num 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted hover:bg-muted/80"
                    )}
                    onClick={() => updateFilter('min_rooms', filters.min_rooms === num ? undefined : num)}
                  >
                    {num}+
                  </button>
                ))}
              </div>
            </section>

            {/* Bathrooms Section */}
            <section className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Bath className="h-4 w-4 text-primary" />
                Bathrooms
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all",
                    !filters.min_bathrooms 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted hover:bg-muted/80"
                  )}
                  onClick={() => updateFilter('min_bathrooms', undefined)}
                >
                  Any
                </button>
                {[1, 1.5, 2, 3, 4].map(num => (
                  <button
                    key={num}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all",
                      filters.min_bathrooms === num 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted hover:bg-muted/80"
                    )}
                    onClick={() => updateFilter('min_bathrooms', filters.min_bathrooms === num ? undefined : num)}
                  >
                    {num}+
                  </button>
                ))}
              </div>
            </section>

            {/* Completion Year Section */}
            <section className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Completion Year
              </h3>
              <p className="text-xs text-muted-foreground">Select the completion year range</p>
              <div className="flex flex-wrap gap-2">
                <button
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all",
                    !filters.completion_year_from && !filters.completion_year_to
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted hover:bg-muted/80"
                  )}
                  onClick={() => onFiltersChange({ ...filters, completion_year_from: undefined, completion_year_to: undefined })}
                >
                  Any
                </button>
                {completionYears.map(year => {
                  const isFrom = filters.completion_year_from === year;
                  const isTo = filters.completion_year_to === year;
                  const isEndpoint = isFrom || isTo;
                  const isBetween = !!(
                    filters.completion_year_from &&
                    filters.completion_year_to &&
                    year > filters.completion_year_from &&
                    year < filters.completion_year_to
                  );

                  return (
                    <button
                      key={year}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all",
                        isEndpoint
                          ? "bg-primary text-primary-foreground"
                          : isBetween
                            ? "bg-primary/15 text-primary"
                            : "bg-muted hover:bg-muted/80"
                      )}
                      onClick={() => {
                        const { completion_year_from: from, completion_year_to: to } = filters;
                        if (!from && !to) {
                          onFiltersChange({ ...filters, completion_year_from: year, completion_year_to: undefined });
                        } else if (from && !to) {
                          if (year === from) {
                            onFiltersChange({ ...filters, completion_year_from: undefined, completion_year_to: undefined });
                          } else {
                            const lo = Math.min(from, year);
                            const hi = Math.max(from, year);
                            onFiltersChange({ ...filters, completion_year_from: lo, completion_year_to: hi });
                          }
                        } else {
                          onFiltersChange({ ...filters, completion_year_from: year, completion_year_to: undefined });
                        }
                      }}
                    >
                      {year}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Developer Section */}
            {developers && developers.length > 0 && (
              <section className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Developer
                </h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search developer..."
                    value={developerSearch}
                    onChange={(e) => setDeveloperSearch(e.target.value)}
                    className="pl-10 rounded-xl"
                  />
                </div>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {filteredDevelopers?.slice(0, 10).map(dev => (
                    <button
                      key={dev.id}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                        filters.developer_id === dev.id 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted hover:bg-muted/80"
                      )}
                      onClick={() => updateFilter('developer_id', filters.developer_id === dev.id ? undefined : dev.id)}
                    >
                      {dev.name}
                      {dev.is_verified && <span className="ml-1 text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Size Section */}
            <section className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                Size (m²)
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Min</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.min_size ?? ''}
                    onChange={(e) => updateFilter('min_size', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Max</label>
                  <input
                    type="number"
                    placeholder="Any"
                    value={filters.max_size ?? ''}
                    onChange={(e) => updateFilter('max_size', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm"
                  />
                </div>
              </div>
            </section>

            {/* Amenities Section */}
            <section className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Amenities
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {PROJECT_AMENITIES.map((amenity) => {
                  const isSelected = filters.amenities?.includes(amenity.value);
                  return (
                    <button
                      key={amenity.value}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left",
                        isSelected
                          ? "bg-primary/10 text-primary border border-primary/30"
                          : "bg-muted/50 hover:bg-muted border border-transparent"
                      )}
                      onClick={() => {
                        const current = filters.amenities || [];
                        const updated = isSelected
                          ? current.filter(a => a !== amenity.value)
                          : [...current, amenity.value];
                        updateFilter('amenities', updated.length > 0 ? updated : undefined);
                      }}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                        isSelected ? "border-primary bg-primary" : "border-muted-foreground/40"
                      )}>
                        {isSelected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                      </div>
                      {amenity.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Parking Section */}
            <section className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Car className="h-4 w-4 text-primary" />
                Parking Spots
              </h3>
              <div className="flex flex-wrap gap-2">
                {[undefined, 1, 2].map(num => (
                  <button
                    key={num ?? 'any'}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all",
                      filters.min_parking === num
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    )}
                    onClick={() => updateFilter('min_parking', num)}
                  >
                    {num === undefined ? 'Any' : `${num}+`}
                  </button>
                ))}
              </div>
            </section>

            {/* Construction Stage Section */}
            <section className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <HardHat className="h-4 w-4 text-primary" />
                Construction Stage
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'planning', label: 'Planning' },
                  { value: 'pre_sale', label: 'Pre-Sale' },
                  { value: 'foundation', label: 'Foundation' },
                  { value: 'structure', label: 'Structure' },
                  { value: 'finishing', label: 'Finishing' },
                  { value: 'delivery', label: 'Delivery' },
                ].map(option => {
                  const isSelected = filters.construction_stage?.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      className={cn(
                        "h-10 rounded-full text-sm font-medium transition-all",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      )}
                      onClick={() => {
                        const current = filters.construction_stage || [];
                        const updated = isSelected
                          ? current.filter(s => s !== option.value)
                          : [...current, option.value];
                        updateFilter('construction_stage', updated.length > 0 ? updated : undefined);
                      }}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Property Types Section */}
            <section className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Home className="h-4 w-4 text-primary" />
                Property Types
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: '3-Room Apartment', label: '3-Room Apt' },
                  { value: '4-Room Apartment', label: '4-Room Apt' },
                  { value: '5-Room Apartment', label: '5-Room Apt' },
                  { value: 'Garden Apartment', label: 'Garden Apt' },
                  { value: 'Penthouse', label: 'Penthouse' },
                ].map((type) => {
                  const isSelected = filters.property_types?.includes(type.value);
                  return (
                    <button
                      key={type.value}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left",
                        isSelected
                          ? "bg-primary/10 text-primary border border-primary/30"
                          : "bg-muted/50 hover:bg-muted border border-transparent"
                      )}
                      onClick={() => {
                        const current = filters.property_types || [];
                        const updated = isSelected
                          ? current.filter(t => t !== type.value)
                          : [...current, type.value];
                        updateFilter('property_types', updated.length > 0 ? updated : undefined);
                      }}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                        isSelected ? "border-primary bg-primary" : "border-muted-foreground/40"
                      )}>
                        {isSelected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                      </div>
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        </ScrollArea>

        {/* Fixed Bottom Action Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-background border-t border-border p-4 pb-safe flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1 rounded-xl h-12"
            onClick={clearAllFilters}
          >
            Reset
          </Button>
          <Button 
            className="flex-1 rounded-xl h-12"
            onClick={() => onOpenChange(false)}
          >
            {isCountLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {previewCount !== undefined ? `Show ${previewCount} Results` : 'Apply Filters'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
