import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePropertyWizard } from '../PropertyWizardContext';
import { Bed, Bath, Ruler, Building, Calendar, Car } from 'lucide-react';

export function StepDetails() {
  const { data, updateData } = usePropertyWizard();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Property Details</h2>
        <p className="text-sm text-muted-foreground">
          Help buyers understand the size and layout
        </p>
      </div>

      <div className="space-y-6">
        {/* Rooms */}
        <div>
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Bed className="h-4 w-4" />
            Rooms
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bedrooms">Bedrooms *</Label>
              <Input
                id="bedrooms"
                type="number"
                min="0"
                max="20"
                value={data.bedrooms}
                onChange={(e) => updateData({ bedrooms: Number(e.target.value) })}
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
                value={data.bathrooms}
                onChange={(e) => updateData({ bathrooms: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>

        {/* Size */}
        <div>
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Ruler className="h-4 w-4" />
            Size
          </h3>
          <div className="space-y-2">
            <Label htmlFor="size_sqm">Living Area (m²)</Label>
            <Input
              id="size_sqm"
              type="number"
              min="0"
              value={data.size_sqm || ''}
              onChange={(e) => updateData({ size_sqm: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="e.g., 95"
            />
            <p className="text-xs text-muted-foreground">
              Include living area, not balconies or storage
            </p>
          </div>
        </div>

        {/* Building */}
        <div>
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Building className="h-4 w-4" />
            Building
          </h3>
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
              />
            </div>
          </div>
        </div>

        {/* Year & Parking */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Year Built
            </h3>
            <div className="space-y-2">
              <Input
                id="year_built"
                type="number"
                min="1900"
                max={new Date().getFullYear() + 5}
                value={data.year_built ?? ''}
                onChange={(e) => updateData({ year_built: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="e.g., 2015"
              />
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Car className="h-4 w-4" />
              Parking Spots
            </h3>
            <div className="space-y-2">
              <Input
                id="parking"
                type="number"
                min="0"
                max="10"
                value={data.parking}
                onChange={(e) => updateData({ parking: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
