import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjectWizard, ProjectStatus } from '../ProjectWizardContext';
import { useCities } from '@/hooks/useCities';
import { AddressAutocomplete, ParsedAddress } from '@/components/agent/wizard/AddressAutocomplete';
import { NeighborhoodAutocomplete } from '@/components/agent/wizard/NeighborhoodAutocomplete';
import { PropertyMiniMapWrapper } from '@/components/property/PropertyMiniMapWrapper';
import { AlertCircle, MapPin } from 'lucide-react';
import { GoogleMapsProvider } from '@/components/maps/GoogleMapsProvider';

const statusOptions: { value: ProjectStatus; label: string }[] = [
  { value: 'planning', label: 'Planning' },
  { value: 'pre_sale', label: 'Pre-Sale' },
  { value: 'foundation', label: 'Foundation' },
  { value: 'structure', label: 'Structure' },
  { value: 'finishing', label: 'Finishing' },
  { value: 'delivery', label: 'Delivery' },
];

export function StepBasics() {
  const { data, updateData } = useProjectWizard();
  const { data: cities = [] } = useCities();
  const supportedCityNames = cities.map(c => c.name);

  const handleAddressSelect = (address: ParsedAddress) => {
    updateData({
      address: address.streetAddress || address.fullAddress,
      city: address.matchedSupportedCity || address.city || data.city,
      neighborhood: address.neighborhood || data.neighborhood,
      latitude: address.latitude,
      longitude: address.longitude,
    });
  };

  // When user types without selecting, invalidate the location
  const handleAddressInputChange = () => {
    updateData({
      latitude: undefined,
      longitude: undefined,
    });
  };

  const hasAddressText = (data.address || '').trim().length > 0;
  const hasValidLocation = !!(data.latitude && data.longitude);
  const showAddressWarning = hasAddressText && !hasValidLocation;
  // Check if address has a street number (contains digits)
  const hasMissingStreetNumber = hasValidLocation && !/\d+/.test(data.address || '');

  return (
    <GoogleMapsProvider>
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Project Basics</h2>
        <p className="text-muted-foreground mb-6">
          Enter the basic information about your development project.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Project Name *</Label>
          <Input
            id="name"
            value={data.name}
            onChange={(e) => updateData({ name: e.target.value })}
            placeholder="e.g., Park View Residences"
            className="h-11 rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Select
            value={data.city}
            onValueChange={(value) => updateData({ city: value })}
          >
            <SelectTrigger className="h-11 rounded-xl">
              <SelectValue placeholder="Select city" />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city.slug} value={city.name}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="neighborhood">Neighborhood</Label>
          <NeighborhoodAutocomplete
            value={data.neighborhood || ''}
            onValueChange={(val) => updateData({ neighborhood: val })}
            cityName={data.city}
            placeholder="Select or search neighborhood"
          />
          <p className="text-xs text-muted-foreground">
            Helps buyers find this project when filtering by neighborhood
          </p>
        </div>

        {/* Location Section with AddressAutocomplete */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-semibold">Project Location</h3>
          </div>

          <div className="space-y-2">
            <Label>Street Address *</Label>
            <AddressAutocomplete
              value={data.address || ''}
              onAddressSelect={handleAddressSelect}
              onInputChange={handleAddressInputChange}
              placeholder="Start typing: Rothschild 42, Tel Aviv..."
              supportedCities={supportedCityNames}
              selectedCity={data.city}
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

          {/* Map Preview */}
          {data.latitude && data.longitude ? (
            <div className="space-y-2">
              <Label>Confirm Location</Label>
              <div className="h-[180px] rounded-xl overflow-hidden border border-border">
                <PropertyMiniMapWrapper
                  latitude={data.latitude}
                  longitude={data.longitude}
                  propertyTitle={data.name || 'Project Location'}
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

        <div className="space-y-2">
          <Label>Project Status *</Label>
          <Select
            value={data.status}
            onValueChange={(value) => updateData({ status: value as ProjectStatus })}
          >
            <SelectTrigger className="h-11 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Current phase of the development
          </p>
        </div>
      </div>
    </div>
    </GoogleMapsProvider>
  );
}
