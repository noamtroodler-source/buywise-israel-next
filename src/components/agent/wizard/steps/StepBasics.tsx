import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePropertyWizard } from '../PropertyWizardContext';
import { PropertyType, ListingStatus } from '@/types/database';
import { Home, MapPin, DollarSign } from 'lucide-react';
import { CityAutocomplete } from '../CityAutocomplete';

const propertyTypes: { value: PropertyType; label: string }[] = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'cottage', label: 'Cottage / Garden Apartment' },
  { value: 'land', label: 'Land' },
  { value: 'commercial', label: 'Commercial' },
];

const listingStatuses: { value: ListingStatus; label: string }[] = [
  { value: 'for_sale', label: 'For Sale' },
  { value: 'for_rent', label: 'For Rent' },
];

export function StepBasics() {
  const { data, updateData } = usePropertyWizard();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-1">Property Basics</h2>
        <p className="text-muted-foreground">
          Start with the essential details about your listing
        </p>
      </div>

      <div className="space-y-6">
        {/* Title Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Home className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-semibold">Listing Details</h3>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="title">Listing Title *</Label>
            <Input
              id="title"
              value={data.title}
              onChange={(e) => updateData({ title: e.target.value })}
              placeholder="e.g., Stunning 3BR Apartment with Sea View"
              maxLength={100}
              className="h-11 rounded-xl"
            />
            <p className="text-xs text-muted-foreground">
              {data.title.length}/100 characters
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Property Type *</Label>
              <Select
                value={data.property_type}
                onValueChange={(v) => updateData({ property_type: v as PropertyType })}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Listing Type *</Label>
              <Select
                value={data.listing_status}
                onValueChange={(v) => updateData({ listing_status: v as ListingStatus })}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {listingStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Price Section */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-semibold">Pricing</h3>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="price">
              Price (₪) {data.listing_status === 'for_rent' ? '/month' : ''} *
            </Label>
            <Input
              id="price"
              type="text"
              inputMode="numeric"
              value={data.price ? data.price.toLocaleString('en-US') : ''}
              onChange={(e) => {
                const raw = e.target.value.replace(/,/g, '');
                const num = parseInt(raw, 10);
                updateData({ price: isNaN(num) ? 0 : num });
              }}
              placeholder={data.listing_status === 'for_rent' ? 'e.g., 8,000' : 'e.g., 2,500,000'}
              className="h-11 rounded-xl"
            />
          </div>
        </div>

        {/* Location Section */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-semibold">Location</h3>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>City *</Label>
              <CityAutocomplete
                value={data.city}
                onValueChange={(city) => updateData({ city })}
                placeholder="e.g., Tel Aviv"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="neighborhood">Neighborhood</Label>
              <Input
                id="neighborhood"
                value={data.neighborhood}
                onChange={(e) => updateData({ neighborhood: e.target.value })}
                placeholder="e.g., Neve Tzedek"
                className="h-11 rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Street Address *</Label>
            <Input
              id="address"
              value={data.address}
              onChange={(e) => updateData({ address: e.target.value })}
              placeholder="e.g., Rothschild Blvd 42"
              className="h-11 rounded-xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
