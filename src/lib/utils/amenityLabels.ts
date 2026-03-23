/**
 * Centralized amenity label mapping.
 * Raw amenity keys from the database (e.g. "ev_charging") → human-readable labels.
 * Used across project detail pages, admin views, and wizard previews.
 */
export const amenityLabels: Record<string, string> = {
  lobby: 'Grand Lobby',
  concierge: '24/7 Concierge',
  security: 'Security',
  security_24_7: '24/7 Security',
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

/**
 * Get the human-readable label for an amenity key.
 * Falls back to a title-cased version of the raw key if not found.
 */
export function getAmenityLabel(key: string): string {
  if (amenityLabels[key]) return amenityLabels[key];
  // Auto-format: replace underscores with spaces and title-case
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
