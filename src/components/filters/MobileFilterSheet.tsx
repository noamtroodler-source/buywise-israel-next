import { useState, useRef, useEffect } from 'react';
import { MapPin, DollarSign, LayoutGrid, Building2, SlidersHorizontal, Filter, X, Loader2, Bath, Car, Layers, Clock, CalendarCheck, Cat, Dog, PawPrint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PropertyFilters as PropertyFiltersType, PropertyType, SortOption } from '@/types/database';
import { cn } from '@/lib/utils';

// Import the filter section components from PropertyFilters
import { PriceRangeSlider } from '@/components/filters/PriceRangeSlider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface MobileFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: PropertyFiltersType;
  onFiltersChange: (filters: PropertyFiltersType) => void;
  listingType: 'for_sale' | 'for_rent' | 'projects';
  cities: { id: string; name: string }[];
  previewCount?: number;
  isCountLoading?: boolean;
  currency: string;
  exchangeRate: number;
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
  { value: 'pool', label: 'Pool' },
  { value: 'parking', label: 'Parking' },
  { value: 'ac', label: 'A/C' },
  { value: 'accessible', label: 'Accessible' },
];

const DAYS_ON_MARKET_OPTIONS = [
  { value: undefined, label: 'Any' },
  { value: 1, label: '24 Hours' },
  { value: 7, label: '7 Days' },
  { value: 30, label: '30 Days' },
];

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

export function MobileFilterSheet({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  listingType,
  cities,
  previewCount,
  isCountLoading,
  currency,
  exchangeRate,
  showSoldToggle,
  isSoldView,
  onSoldToggle,
}: MobileFilterSheetProps) {
  const [citySearch, setCitySearch] = useState('');

  const updateFilter = <K extends keyof PropertyFiltersType>(key: K, value: PropertyFiltersType[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const filteredCities = citySearch
    ? cities.filter(c => c.name.toLowerCase().includes(citySearch.toLowerCase()))
    : cities;

  const clearAllFilters = () => {
    onFiltersChange({
      listing_status: filters.listing_status,
      sort_by: filters.sort_by,
    });
  };

  const toggleFeature = (feature: string) => {
    const currentFeatures = filters.features || [];
    if (currentFeatures.includes(feature)) {
      updateFilter('features', currentFeatures.filter(f => f !== feature));
    } else {
      updateFilter('features', [...currentFeatures, feature]);
    }
  };

  // Count active filters
  const activeFilterCount = [
    filters.city,
    filters.min_price || filters.max_price,
    filters.min_rooms || filters.min_bathrooms,
    filters.property_types?.length,
    filters.features?.length,
    filters.min_size || filters.max_size,
    filters.min_parking,
    filters.max_days_listed,
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
            {/* Listing Status Section - Only for for_sale */}
            {showSoldToggle && (
              <section className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Listing Status
                </h3>
                <div className="flex gap-2">
                  <button
                    className={cn(
                      "flex-1 px-4 py-2.5 rounded-full text-sm font-medium transition-all",
                      !isSoldView 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted hover:bg-muted/80"
                    )}
                    onClick={() => onSoldToggle?.(false)}
                  >
                    Active Listings
                  </button>
                  <button
                    className={cn(
                      "flex-1 px-4 py-2.5 rounded-full text-sm font-medium transition-all",
                      isSoldView 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted hover:bg-muted/80"
                    )}
                    onClick={() => onSoldToggle?.(true)}
                  >
                    Sold Properties
                  </button>
                </div>
              </section>
            )}

            {/* Location Section */}
            <section className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Location
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
                    onClick={() => updateFilter('city', filters.city === city.name ? undefined : city.name)}
                  >
                    {city.name}
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
                baseMax={listingType === 'for_rent' ? 30000 : 10000000}
                baseStep={listingType === 'for_rent' ? 500 : 50000}
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

            {/* Property Type Section */}
            <section className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Property Type
              </h3>
              <div className="flex flex-wrap gap-2">
                {PROPERTY_TYPES.map(type => {
                  const isSelected = filters.property_types?.includes(type.value) || false;
                  return (
                    <button
                      key={type.value}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                        isSelected 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted hover:bg-muted/80"
                      )}
                      onClick={() => {
                        const currentTypes = filters.property_types || [];
                        if (isSelected) {
                          updateFilter('property_types', currentTypes.filter(t => t !== type.value));
                        } else {
                          updateFilter('property_types', [...currentTypes, type.value]);
                        }
                      }}
                    >
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Amenities Section */}
            <section className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                Amenities
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {AMENITIES.map(amenity => {
                  const isSelected = filters.features?.includes(amenity.value) || false;
                  return (
                    <button
                      key={amenity.value}
                      className={cn(
                        "px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left",
                        isSelected 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted hover:bg-muted/80"
                      )}
                      onClick={() => toggleFeature(amenity.value)}
                    >
                      {amenity.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Size Section */}
            <section className="space-y-3">
              <h3 className="font-semibold">Size (m²)</h3>
              <div className="flex gap-3">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.min_size ?? ''}
                  onChange={(e) => updateFilter('min_size', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="rounded-xl"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.max_size ?? ''}
                  onChange={(e) => updateFilter('max_size', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="rounded-xl"
                />
              </div>
            </section>

            {/* Listing Age */}
            <section className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Listing Age
              </h3>
              <div className="flex flex-wrap gap-2">
                {DAYS_ON_MARKET_OPTIONS.map(option => (
                  <button
                    key={option.label}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                      filters.max_days_listed === option.value 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted hover:bg-muted/80"
                    )}
                    onClick={() => updateFilter('max_days_listed', option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Parking Section */}
            <section className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Car className="h-4 w-4 text-primary" />
                Parking
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all",
                    !filters.min_parking 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted hover:bg-muted/80"
                  )}
                  onClick={() => updateFilter('min_parking', undefined)}
                >
                  Any
                </button>
                {[1, 2, 3].map(num => (
                  <button
                    key={num}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all",
                      filters.min_parking === num 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted hover:bg-muted/80"
                    )}
                    onClick={() => updateFilter('min_parking', filters.min_parking === num ? undefined : num)}
                  >
                    {num}+
                  </button>
                ))}
              </div>
            </section>

            {/* Floor Section */}
            <section className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                Floor
              </h3>
              <div className="flex gap-3">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.min_floor ?? ''}
                  onChange={(e) => updateFilter('min_floor', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="rounded-xl"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.max_floor ?? ''}
                  onChange={(e) => updateFilter('max_floor', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="rounded-xl"
                />
              </div>
            </section>

            {/* Rental-specific: Availability & Pets */}
            {listingType === 'for_rent' && (
              <>
                {/* Availability Section */}
                <section className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4 text-primary" />
                    Availability
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABILITY_OPTIONS.map(option => {
                      const isSelected = option.value === 'any' 
                        ? (!filters.available_now && !filters.available_by)
                        : option.value === 'now' 
                          ? filters.available_now 
                          : false;
                      return (
                        <button
                          key={option.value}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                            isSelected
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted hover:bg-muted/80"
                          )}
                          onClick={() => {
                            if (option.value === 'any') {
                              updateFilter('available_now', undefined);
                              updateFilter('available_by', undefined);
                            } else if (option.value === 'now') {
                              updateFilter('available_now', true);
                              updateFilter('available_by', undefined);
                            } else {
                              const days = parseInt(option.value);
                              const date = new Date();
                              date.setDate(date.getDate() + days);
                              updateFilter('available_now', undefined);
                              updateFilter('available_by', date.toISOString().split('T')[0]);
                            }
                          }}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Pet Policy Section */}
                <section className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <PawPrint className="h-4 w-4 text-primary" />
                    Pet Policy
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {PET_OPTIONS.map(option => {
                      const isSelected = filters.allows_pets?.includes(option.value) || false;
                      const Icon = option.Icon;
                      return (
                        <button
                          key={option.value}
                          className={cn(
                            "px-3 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                            isSelected
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted hover:bg-muted/80"
                          )}
                          onClick={() => {
                            const current = filters.allows_pets || [];
                            if (isSelected) {
                              updateFilter('allows_pets', current.filter(p => p !== option.value));
                            } else {
                              updateFilter('allows_pets', [...current, option.value]);
                            }
                          }}
                        >
                          <Icon className="h-4 w-4" />
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </section>
              </>
            )}
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
