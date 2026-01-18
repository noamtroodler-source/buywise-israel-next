import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePropertyWizard } from '../PropertyWizardContext';
import { PropertyType, ListingStatus } from '@/types/database';

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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Property Basics</h2>
        <p className="text-sm text-muted-foreground">
          Start with the essential details about your listing
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Listing Title *</Label>
          <Input
            id="title"
            value={data.title}
            onChange={(e) => updateData({ title: e.target.value })}
            placeholder="e.g., Stunning 3BR Apartment with Sea View"
            maxLength={100}
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
              <SelectTrigger>
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
              <SelectTrigger>
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

        <div className="space-y-2">
          <Label htmlFor="price">
            Price (₪) {data.listing_status === 'for_rent' ? '/month' : ''} *
          </Label>
          <Input
            id="price"
            type="number"
            min="0"
            value={data.price || ''}
            onChange={(e) => updateData({ price: Number(e.target.value) })}
            placeholder={data.listing_status === 'for_rent' ? 'e.g., 8000' : 'e.g., 2500000'}
          />
          {data.price > 0 && (
            <p className="text-sm text-muted-foreground">
              {new Intl.NumberFormat('he-IL', {
                style: 'currency',
                currency: 'ILS',
                maximumFractionDigits: 0,
              }).format(data.price)}
              {data.listing_status === 'for_rent' ? ' /month' : ''}
            </p>
          )}
        </div>

        <div className="pt-4 border-t">
          <h3 className="font-medium mb-4">Location</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={data.city}
                onChange={(e) => updateData({ city: e.target.value })}
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
              />
            </div>
          </div>
          <div className="space-y-2 mt-4">
            <Label htmlFor="address">Street Address *</Label>
            <Input
              id="address"
              value={data.address}
              onChange={(e) => updateData({ address: e.target.value })}
              placeholder="e.g., Rothschild Blvd 42"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
