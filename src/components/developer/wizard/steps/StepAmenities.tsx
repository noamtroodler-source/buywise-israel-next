import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useProjectWizard } from '../ProjectWizardContext';

const amenityOptions = {
  building: [
    { value: 'lobby', label: 'Grand Lobby' },
    { value: 'concierge', label: '24/7 Concierge' },
    { value: 'security', label: '24/7 Security' },
    { value: 'parking_underground', label: 'Underground Parking' },
    { value: 'ev_charging', label: 'EV Charging Stations' },
    { value: 'storage', label: 'Storage Units' },
    { value: 'bicycle_storage', label: 'Bicycle Storage' },
    { value: 'generator', label: 'Backup Generator' },
    { value: 'mamad', label: 'Safe Rooms (ממ״ד)' },
    { value: 'shabbat_elevator', label: 'Shabbat Elevator' },
    { value: 'accessible', label: 'Full Accessibility' },
  ],
  leisure: [
    { value: 'pool', label: 'Swimming Pool' },
    { value: 'heated_pool', label: 'Heated Pool' },
    { value: 'gym', label: 'Fitness Center' },
    { value: 'spa', label: 'Spa & Sauna' },
    { value: 'rooftop', label: 'Rooftop Terrace' },
    { value: 'garden', label: 'Landscaped Gardens' },
    { value: 'private_gardens', label: 'Private Gardens (ground floor)' },
    { value: 'playground', label: "Children's Playground" },
    { value: 'beach_access', label: 'Beach Access' },
  ],
  community: [
    { value: 'coworking', label: 'Co-Working Space' },
    { value: 'event_room', label: 'Event Room / Community Hall' },
    { value: 'guest_suite', label: 'Guest Suites' },
    { value: 'dog_spa', label: 'Pet Spa' },
    { value: 'shul', label: 'Synagogue (בית כנסת)' },
    { value: 'mikvah', label: 'Mikvah (מקווה)' },
    { value: 'sukkot_area', label: 'Designated Sukkot Area' },
    { value: 'commercial', label: 'Commercial Spaces / Shops' },
    { value: 'daycare', label: 'Daycare Center' },
  ],
  technology: [
    { value: 'smart_home', label: 'Smart Home Ready' },
    { value: 'fiber_optic', label: 'Fiber Optic Internet' },
    { value: 'underfloor_heating', label: 'Underfloor Heating' },
  ],
  sustainability: [
    { value: 'solar', label: 'Solar Panels' },
    { value: 'green_building', label: 'Green Building Certified' },
    { value: 'rainwater', label: 'Rainwater Harvesting' },
  ],
};

const categoryLabels: Record<string, string> = {
  building: 'Building Essentials',
  leisure: 'Leisure & Recreation',
  community: 'Community & Services',
  technology: 'Technology',
  sustainability: 'Sustainability',
};

export function StepAmenities() {
  const { data, updateData } = useProjectWizard();

  const toggleAmenity = (amenity: string) => {
    const current = data.amenities;
    const updated = current.includes(amenity)
      ? current.filter(a => a !== amenity)
      : [...current, amenity];
    updateData({ amenities: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Amenities & Features</h2>
        <p className="text-muted-foreground mb-6">
          Select the amenities available in your development.
        </p>
      </div>

      {Object.entries(amenityOptions).map(([category, amenities]) => (
        <div key={category} className="space-y-3">
          <Label className="text-base font-medium">{categoryLabels[category]}</Label>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {amenities.map((amenity) => (
              <div key={amenity.value} className="flex items-center space-x-2">
                <Checkbox
                  id={amenity.value}
                  checked={data.amenities.includes(amenity.value)}
                  onCheckedChange={() => toggleAmenity(amenity.value)}
                />
                <Label 
                  htmlFor={amenity.value} 
                  className="text-sm font-normal cursor-pointer"
                >
                  {amenity.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      ))}

      {data.amenities.length > 0 && (
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{data.amenities.length}</span> amenities selected
          </p>
        </div>
      )}
    </div>
  );
}
