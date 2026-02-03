import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PropertyFilters as PropertyFiltersType, PropertyType } from '@/types/database';
import { cn } from '@/lib/utils';
import { MapPin, DollarSign, LayoutGrid, Building2 } from 'lucide-react';

interface MapFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: PropertyFiltersType;
  onFiltersChange: (filters: PropertyFiltersType) => void;
  listingType: 'for_sale' | 'for_rent';
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

export function MapFilterDialog({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  listingType,
}: MapFilterDialogProps) {
  const [localFilters, setLocalFilters] = useState<PropertyFiltersType>(filters);

  const updateFilter = <K extends keyof PropertyFiltersType>(key: K, value: PropertyFiltersType[K]) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
  };

  const handleClear = () => {
    const clearedFilters: PropertyFiltersType = {
      listing_status: filters.listing_status,
    };
    setLocalFilters(clearedFilters);
  };

  // Sync local state when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setLocalFilters(filters);
    }
    onOpenChange(isOpen);
  };

  const isRental = listingType === 'for_rent';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>Filter Properties</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <div className="px-6 py-4 space-y-6">
            {/* City */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                City
              </Label>
              <Input
                placeholder="Enter city name..."
                value={localFilters.city || ''}
                onChange={(e) => updateFilter('city', e.target.value || undefined)}
              />
            </div>
            
            {/* Price Range */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Price Range
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input
                    type="number"
                    placeholder={isRental ? "Min (₪/mo)" : "Min (₪)"}
                    value={localFilters.min_price || ''}
                    onChange={(e) => updateFilter('min_price', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    placeholder={isRental ? "Max (₪/mo)" : "Max (₪)"}
                    value={localFilters.max_price || ''}
                    onChange={(e) => updateFilter('max_price', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
              </div>
            </div>
            
            {/* Rooms */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-primary" />
                Minimum Rooms
              </Label>
              <div className="flex flex-wrap gap-2">
                {[undefined, 2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num ?? 'any'}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all",
                      localFilters.min_rooms === num
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    )}
                    onClick={() => updateFilter('min_rooms', num)}
                  >
                    {num ? `${num}+` : 'Any'}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Property Types */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Property Type
              </Label>
              <div className="flex flex-wrap gap-2">
                {PROPERTY_TYPES.map((type) => {
                  const isSelected = localFilters.property_types?.includes(type.value) || false;
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
                        const current = localFilters.property_types || [];
                        if (isSelected) {
                          updateFilter('property_types', current.filter(t => t !== type.value));
                        } else {
                          updateFilter('property_types', [...current, type.value]);
                        }
                      }}
                    >
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Size */}
            <div className="space-y-2">
              <Label>Size (m²)</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  placeholder="Min"
                  value={localFilters.min_size || ''}
                  onChange={(e) => updateFilter('min_size', e.target.value ? Number(e.target.value) : undefined)}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={localFilters.max_size || ''}
                  onChange={(e) => updateFilter('max_size', e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
            </div>
          </div>
        </ScrollArea>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-between">
          <Button variant="ghost" onClick={handleClear}>
            Clear All
          </Button>
          <Button onClick={handleApply}>
            Apply Filters
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
