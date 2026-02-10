import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePropertyWizard } from '../PropertyWizardContext';
import { PropertyType, ListingStatus } from '@/types/database';
import { Home, MapPin, DollarSign, AlertCircle, ShieldCheck, TrendingDown, TrendingUp } from 'lucide-react';
import { AddressAutocomplete, ParsedAddress } from '../AddressAutocomplete';
import { PropertyMiniMapWrapper } from '@/components/property/PropertyMiniMapWrapper';
import { useCities } from '@/hooks/useCities';
import { GoogleMapsProvider } from '@/components/maps/GoogleMapsProvider';

const propertyTypes: { value: PropertyType; label: string }[] = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'cottage', label: 'Cottage / Garden Apartment' },
  { value: 'land', label: 'Land' },
];

const listingStatuses: { value: ListingStatus; label: string }[] = [
  { value: 'for_sale', label: 'For Sale' },
  { value: 'for_rent', label: 'For Rent' },
];

export function StepBasics() {
  const { data, updateData } = usePropertyWizard();
  const { data: cities = [] } = useCities();
  const supportedCityNames = cities.map(c => c.name);

  const handleAddressSelect = (address: ParsedAddress) => {
    updateData({
      address: address.streetAddress || address.fullAddress,
      city: address.matchedSupportedCity || address.city || data.city,
      neighborhood: address.neighborhood || data.neighborhood,
      latitude: address.latitude,
      longitude: address.longitude,
      place_id: address.placeId,
    });
  };

  // When user types without selecting, invalidate the location
  const handleAddressInputChange = () => {
    updateData({
      latitude: null,
      longitude: null,
      place_id: '',
    });
  };

  const hasAddressText = data.address.trim().length > 0;
  const hasValidLocation = !!(data.latitude && data.longitude);
  const showAddressWarning = hasAddressText && !hasValidLocation;
  // Check if address has a street number (contains digits)
  const hasMissingStreetNumber = hasValidLocation && !/\d+/.test(data.address);

  return (
    <GoogleMapsProvider>
    <div className="space-y-8">
      {/* Quality Standards Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-muted/30 border border-primary/20">
        <div className="flex gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-1">Quality Standards</h3>
            <p className="text-sm text-muted-foreground mb-2">
              BuyWise Israel maintains high listing standards to ensure the best experience for buyers. All listings are reviewed before publication.
            </p>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p className="font-medium text-foreground/80">Listings may be returned for revision if:</p>
              <ul className="list-disc list-inside ml-1 space-y-0.5">
                <li>Photos are low quality or insufficient</li>
                <li>Description contains errors or lacks detail</li>
                <li>Information appears incomplete or inaccurate</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

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
            {/* Price change indicator (edit mode only) */}
            {data.savedPrice && data.savedPrice > 0 && (() => {
              const diff = data.price - data.savedPrice;
              const pct = ((diff / data.savedPrice) * 100);
              if (diff === 0) return null;
              const isDropping = diff < 0;
              return (
                <div className={`flex items-center gap-2 text-sm rounded-lg p-3 ${
                  isDropping 
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' 
                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                }`}>
                  {isDropping ? <TrendingDown className="h-4 w-4 shrink-0" /> : <TrendingUp className="h-4 w-4 shrink-0" />}
                  <div>
                    <span className="font-medium">
                      {isDropping ? 'Price drop' : 'Price increase'}: {pct > 0 ? '+' : ''}{pct.toFixed(1)}%
                    </span>
                    <span className="ml-1.5 text-xs opacity-80">
                      ({diff > 0 ? '+' : ''}{diff.toLocaleString('en-US')} ₪ from ₪{data.savedPrice.toLocaleString('en-US')})
                    </span>
                  </div>
                </div>
              );
            })()}
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
          
          <div className="space-y-2">
            <Label>Street Address *</Label>
            <AddressAutocomplete
              value={data.address}
              onAddressSelect={handleAddressSelect}
              onInputChange={handleAddressInputChange}
              placeholder="Start typing: Rothschild 42, Tel Aviv..."
              supportedCities={supportedCityNames}
            />
            {showAddressWarning ? (
              <p className="text-xs text-primary font-medium">
                You must select an address from the dropdown suggestions
              </p>
            ) : hasMissingStreetNumber ? (
              <p className="text-xs text-primary font-medium">
                Please select an address with a street number (e.g., Rothschild 42)
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Type to search, then select an address from the suggestions
              </p>
            )}
          </div>

          {/* Auto-filled location fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={data.city}
                onChange={(e) => updateData({ city: e.target.value })}
                placeholder="Auto-filled from address"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="neighborhood">Neighborhood</Label>
              <Input
                id="neighborhood"
                value={data.neighborhood}
                onChange={(e) => updateData({ neighborhood: e.target.value })}
                placeholder="Auto-filled or enter manually"
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          {/* Map Preview */}
          {data.latitude && data.longitude ? (
            <div className="space-y-2">
              <Label>Confirm Location</Label>
              <div className="h-[180px] rounded-xl overflow-hidden border border-border">
                <PropertyMiniMapWrapper
                  latitude={data.latitude}
                  longitude={data.longitude}
                  propertyTitle={data.title || 'Property Location'}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                If the pin is incorrect, search for a different address above
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Type an address above, then click on a result from the suggestions to confirm the location</span>
            </div>
          )}
        </div>
      </div>
    </div>
    </GoogleMapsProvider>
  );
}
