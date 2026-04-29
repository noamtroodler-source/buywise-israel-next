import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormattedNumberInput } from '@/components/ui/formatted-number-input';
import { usePropertyWizard } from '../PropertyWizardContext';
import type { ReactNode } from 'react';
import { Bed, Bath, Ruler, Building, Calendar, Car, LandPlot, Info, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

function ReviewHint({ children, tone = 'required' }: { children: ReactNode; tone?: 'required' | 'recommended' }) {
  const isRequired = tone === 'required';

  return (
    <div className={cn(
      'flex items-start gap-2 rounded-lg border px-3 py-2',
      isRequired ? 'bg-destructive/10 border-destructive/30' : 'bg-primary/5 border-primary/20'
    )}>
      <AlertCircle className={cn('h-3.5 w-3.5 shrink-0 mt-0.5', isRequired ? 'text-destructive' : 'text-primary')} />
      <p className={cn('text-xs', isRequired ? 'text-destructive' : 'text-primary')}>{children}</p>
    </div>
  );
}

export function StepDetails() {
  const { data, updateData } = usePropertyWizard();

  // Determine which fields to show based on property type
  const isLand = data.property_type === 'land';
  const isStandalone = ['house', 'land'].includes(data.property_type);
  const isImported = !!data.import_source;
  const shouldReviewOtherRooms = isImported && (data.additional_rooms ?? 0) === 0 && (data.bedrooms ?? 0) >= 2;
  const shouldReviewApartmentNumber = isImported && !isStandalone && !data.apartment_number;
  const shouldReviewParking = isImported && (data.parking ?? 0) === 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-1">Property Details</h2>
        <p className="text-muted-foreground">
          {isLand 
            ? 'Provide details about the land' 
            : 'Help buyers understand the size and layout'}
        </p>
      </div>

      <div className="space-y-6">
        {/* Land-specific: Lot Size */}
        {isLand && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <LandPlot className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold">Land Size</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lot_size_sqm">Lot Size (m²) *</Label>
              <FormattedNumberInput
                id="lot_size_sqm"
                value={data.lot_size_sqm}
                onChange={(value) => updateData({ lot_size_sqm: value })}
                placeholder="e.g., 500"
                suffix="m²"
                className="h-11 rounded-xl"
              />
            </div>
          </div>
        )}

        {/* Layout - hide for land */}
        {!isLand && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bed className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold">Layout</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms *</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  min="0"
                  max="20"
                  value={data.bedrooms || ''}
                  onChange={(e) => updateData({ bedrooms: Number(e.target.value) || 0 })}
                  onFocus={(e) => e.target.select()}
                  placeholder="0"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="additional_rooms">Other Rooms</Label>
                <Input
                  id="additional_rooms"
                  type="number"
                  min="0"
                  max="10"
                  value={data.additional_rooms || ''}
                  onChange={(e) => updateData({ additional_rooms: Number(e.target.value) || 0 })}
                  onFocus={(e) => e.target.select()}
                  placeholder="0"
                  className={cn('h-11 rounded-xl', shouldReviewOtherRooms && 'border-destructive/50 bg-destructive/5')}
                />
                {shouldReviewOtherRooms ? (
                  <ReviewHint>Imported listing needs review: add living room, mamad, office, or keep 0 if none.</ReviewHint>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {data.additional_rooms === 0 && (data.bedrooms ?? 0) >= 3
                      ? 'Living room, mamad, office — most 3+ bed apartments have at least 1'
                      : 'Mamad, living room, office — helps buyers understand your listing'}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathrooms">Bathrooms *</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={data.bathrooms || ''}
                  onChange={(e) => updateData({ bathrooms: Number(e.target.value) || 0 })}
                  onFocus={(e) => e.target.select()}
                  placeholder="0"
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
          </div>
        )}

        {/* Size - hide for land */}
        {!isLand && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Ruler className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold">Size</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="size_sqm">Living Area (m²) *</Label>
              <FormattedNumberInput
                id="size_sqm"
                value={data.size_sqm}
                onChange={(value) => updateData({ size_sqm: value })}
                placeholder="e.g., 95"
                suffix="m²"
                className="h-11 rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                Include living area, not balconies or storage
              </p>
            </div>
          </div>
        )}

        {/* Building - hide for standalone properties (house, land) */}
        {!isStandalone && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold">Building</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="floor">Floor *</Label>
                <Input
                  id="floor"
                  type="number"
                  min="0"
                  value={data.floor ?? ''}
                  onChange={(e) => updateData({ floor: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="e.g., 3"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_floors">Total Floors in Building *</Label>
                <Input
                  id="total_floors"
                  type="number"
                  min="0"
                  value={data.total_floors ?? ''}
                  onChange={(e) => updateData({ total_floors: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="e.g., 8"
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="apartment_number" className="flex items-center gap-2">
                Apartment # <span className="text-xs text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="apartment_number"
                value={data.apartment_number ?? ''}
                onChange={(e) => updateData({ apartment_number: e.target.value || undefined })}
                placeholder="e.g., 4B"
                maxLength={16}
                className={cn('h-11 rounded-xl', shouldReviewApartmentNumber && 'border-primary/40 bg-primary/5')}
              />
              {shouldReviewApartmentNumber ? (
                <ReviewHint tone="recommended">Recommended for imported listings. Add the apartment number if you know it; it stays internal.</ReviewHint>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Helps us tell your listing apart from other apartments in the same building. Stays internal — not shown publicly.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Year & Parking - Year hidden for land */}
        <div className={`grid gap-6 ${isLand ? '' : 'sm:grid-cols-2'}`}>
          {!isLand && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-semibold">Year Built</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[240px] text-xs">
                      Helps buyers assess renovation needs, TAMA 38 eligibility, and building quality. Especially useful for pre-2000 buildings.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="year_built"
                type="number"
                min="1900"
                max={new Date().getFullYear() + 5}
                value={data.year_built ?? ''}
                onChange={(e) => updateData({ year_built: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="e.g., 2015"
                className="h-11 rounded-xl"
              />
            </div>
          )}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Car className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold">Parking Spots</h3>
            </div>
            <Input
              id="parking"
              type="number"
              min="0"
              max="10"
              value={data.parking || ''}
              onChange={(e) => updateData({ parking: Number(e.target.value) || 0 })}
              onFocus={(e) => e.target.select()}
              placeholder="0"
              className={cn('h-11 rounded-xl', shouldReviewParking && 'border-destructive/50 bg-destructive/5')}
            />
            {shouldReviewParking && (
              <ReviewHint>Imported listing needs review: enter parking spots, or keep 0 if there is no parking.</ReviewHint>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
