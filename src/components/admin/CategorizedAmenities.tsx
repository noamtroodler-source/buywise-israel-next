import { 
  Sparkles, Dumbbell, Waves, Car, Leaf, Baby, Dog, Shield, 
  Wifi, Wind, Users
} from 'lucide-react';

const amenityCategories: Record<string, { icon: typeof Sparkles; keywords: string[] }> = {
  'Fitness & Wellness': { icon: Dumbbell, keywords: ['gym', 'fitness', 'yoga', 'spa', 'sauna'] },
  'Pool & Water': { icon: Waves, keywords: ['pool', 'swimming', 'jacuzzi', 'heated_pool', 'beach'] },
  'Parking & Transport': { icon: Car, keywords: ['parking', 'garage', 'electric', 'charging', 'bicycle', 'ev_', 'multiple_parking'] },
  'Outdoor & Green': { icon: Leaf, keywords: ['garden', 'terrace', 'balcony', 'rooftop', 'landscap', 'private_garden', 'sukkot', 'sea_city_view'] },
  'Family & Kids': { icon: Baby, keywords: ['playground', 'kids', 'children', 'family', 'daycare'] },
  'Pet Friendly': { icon: Dog, keywords: ['pet', 'dog'] },
  'Security & Safety': { icon: Shield, keywords: ['security', 'guard', 'cctv', 'surveillance', 'doorman', 'concierge', 'mamad', 'safe room', 'generator', 'acoustic_insulation'] },
  'Smart Home': { icon: Wifi, keywords: ['smart', 'wifi', 'internet', 'fiber'] },
  'Community & Religious': { icon: Users, keywords: ['club', 'lounge', 'community', 'social', 'shul', 'synagogue', 'mikvah', 'event', 'commercial', 'coworking', 'eruv'] },
  'Comfort & Accessibility': { icon: Wind, keywords: ['ac', 'air condition', 'heating', 'elevator', 'lift', 'shabbat', 'underfloor', 'accessible', 'lobby', 'high_ceiling', 'floor_to_ceiling', 'central_ac'] },
  'Unit Features': { icon: Sparkles, keywords: ['pre_installed_kitchen', 'payment_plan'] },
};

const amenityLabels: Record<string, string> = {
  lobby: 'Grand Lobby',
  concierge: '24/7 Concierge',
  security: 'Security',
  parking_underground: 'Underground Parking',
  multiple_parking: 'Multiple Parking Spots',
  ev_charging: 'EV Charging',
  storage: 'Storage Rooms',
  bicycle_storage: 'Bicycle Storage',
  generator: 'Backup Generator',
  mamad: 'Safe Rooms (ממ״ד)',
  shabbat_elevator: 'Shabbat Elevator',
  accessible: 'Full Accessibility',
  acoustic_insulation: 'Acoustic Insulation',
  high_ceilings: 'High Ceilings (2.8m+)',
  floor_to_ceiling_windows: 'Floor-to-Ceiling Windows',
  central_ac: 'Central A/C',
  pre_installed_kitchen: 'Pre-Installed Kitchen',
  sea_city_view: 'Sea / City View',
  pool: 'Swimming Pool',
  heated_pool: 'Heated Pool',
  gym: 'Fitness Center',
  spa: 'Spa & Wellness',
  rooftop: 'Rooftop Terrace',
  garden: 'Gardens',
  private_gardens: 'Private Gardens',
  playground: 'Playground',
  beach_access: 'Beach Access',
  parking: 'Underground Parking',
  coworking: 'Co-Working Space',
  event_room: 'Event Room',
  guest_suite: 'Guest Suite',
  dog_spa: 'Pet Spa',
  dog_park: 'Dog Park',
  shul: 'Synagogue (בית כנסת)',
  mikvah: 'Mikvah (מקווה)',
  sukkot_area: 'Designated Sukkot Area',
  eruv_proximity: 'Within Eruv',
  commercial: 'Commercial Spaces',
  daycare: 'Daycare Center',
  doorman: 'Doorman',
  smart_home: 'Smart Home',
  fiber_optic: 'Fiber Internet',
  underfloor_heating: 'Underfloor Heating',
  solar: 'Solar Panels',
  green_building: 'Green Certified',
  rainwater: 'Rainwater Harvesting',
  payment_plan: 'Payment Plan Available',
  tennis: 'Tennis Court',
  basketball: 'Basketball Court',
  bbq_area: 'BBQ Area',
  wine_cellar: 'Wine Cellar',
  cinema: 'Private Cinema',
  bike_storage: 'Bike Storage',
  package_lockers: 'Package Lockers',
  club_room: 'Club Room',
  kids_room: 'Kids Room',
};

function categorizeAmenities(amenities: string[]) {
  const categorized: Record<string, string[]> = {};
  const uncategorized: string[] = [];

  amenities.forEach(amenity => {
    const lowerAmenity = amenity.toLowerCase();
    let found = false;

    for (const [category, { keywords }] of Object.entries(amenityCategories)) {
      if (keywords.some(keyword => lowerAmenity.includes(keyword))) {
        if (!categorized[category]) categorized[category] = [];
        categorized[category].push(amenity);
        found = true;
        break;
      }
    }

    if (!found) {
      uncategorized.push(amenity);
    }
  });

  if (uncategorized.length > 0) {
    categorized['Other Features'] = uncategorized;
  }

  return categorized;
}

function getAmenityIcon(amenity: string): typeof Sparkles {
  const lowerAmenity = amenity.toLowerCase();
  
  for (const { icon, keywords } of Object.values(amenityCategories)) {
    if (keywords.some(keyword => lowerAmenity.includes(keyword))) {
      return icon;
    }
  }
  
  return Sparkles;
}

interface CategorizedAmenitiesProps {
  amenities: string[];
  compact?: boolean;
}

export function CategorizedAmenities({ amenities, compact = false }: CategorizedAmenitiesProps) {
  if (!amenities || amenities.length === 0) {
    return <p className="text-sm text-muted-foreground italic">No amenities specified</p>;
  }

  const categorized = categorizeAmenities(amenities);

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {Object.entries(categorized).map(([category, items]) => {
        const CategoryIcon = amenityCategories[category]?.icon || Sparkles;
        
        return (
          <div key={category} className="space-y-1.5">
            <h5 className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
              <CategoryIcon className="h-3.5 w-3.5" />
              {category}
            </h5>
            <div className={compact ? "flex flex-wrap gap-1" : "grid grid-cols-2 gap-1.5"}>
              {items.map((amenity, index) => {
                const Icon = getAmenityIcon(amenity);
                const label = amenityLabels[amenity] || amenity;
                return (
                  <div 
                    key={index}
                    className={`flex items-center gap-1.5 ${compact ? 'px-2 py-1 rounded bg-muted/50 text-xs' : 'p-2 rounded-lg bg-muted/30 text-sm'}`}
                  >
                    <Icon className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} text-primary shrink-0`} />
                    <span className="truncate">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
