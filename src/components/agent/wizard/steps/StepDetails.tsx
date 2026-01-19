import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePropertyWizard } from '../PropertyWizardContext';
import { Bed, Bath, Ruler, Building, Calendar, Car, LandPlot } from 'lucide-react';

export function StepDetails() {
  const { data, updateData } = usePropertyWizard();

  // Determine which fields to show based on property type
  const isLand = data.property_type === 'land';
  const isStandalone = ['house', 'land'].includes(data.property_type);

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
              <Input
                id="lot_size_sqm"
                type="number"
                min="0"
                value={data.lot_size_sqm || ''}
                onChange={(e) => updateData({ lot_size_sqm: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="e.g., 500"
                className="h-11 rounded-xl"
              />
            </div>
          </div>
        )}

        {/* Rooms - hide for land */}
        {!isLand && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bed className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold">Rooms</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Rooms *</Label>
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
              <Label htmlFor="size_sqm">Living Area (m²)</Label>
              <Input
                id="size_sqm"
                type="number"
                min="0"
                value={data.size_sqm || ''}
                onChange={(e) => updateData({ size_sqm: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="e.g., 95"
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
                <Label htmlFor="floor">Floor</Label>
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
                <Label htmlFor="total_floors">Total Floors in Building</Label>
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
              className="h-11 rounded-xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
