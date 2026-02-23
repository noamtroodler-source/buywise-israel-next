export type PropertyType = 'apartment' | 'garden_apartment' | 'penthouse' | 'mini_penthouse' | 'duplex' | 'house' | 'cottage' | 'land' | 'commercial';
export type ListingStatus = 'for_sale' | 'for_rent' | 'sold' | 'rented';
export type ListingType = 'for_sale' | 'for_rent' | 'projects';
export type PropertyCondition = 'new' | 'renovated' | 'good' | 'needs_renovation';
export type AlertFrequency = 'instant' | 'daily' | 'weekly';
export type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'size_desc' | 'rooms_desc' | 'price_drop';
export type AppRole = 'admin' | 'agent' | 'developer' | 'user';

// Lease reality types
export type LeaseTermOption = '6_months' | '12_months' | '24_months' | 'flexible' | 'other';
export type SublettingOption = 'allowed' | 'case_by_case' | 'not_allowed';
export type FurnishedStatus = 'fully' | 'semi' | 'unfurnished';
export type PetsPolicy = 'allowed' | 'case_by_case' | 'not_allowed';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  notify_email: boolean;
  notify_price_drops: boolean;
  notify_search_alerts: boolean;
  notify_recommendations: boolean;
  preferred_currency: 'ILS' | 'USD' | null;
  preferred_area_unit: 'sqm' | 'sqft' | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Agent {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  license_number: string | null;
  agency_name: string | null;
  agency_id: string | null;
  agency?: { id: string; name: string; logo_url: string | null } | null;
  years_experience: number;
  languages: string[];
  specializations: string[] | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  agent_id: string | null;
  title: string;
  description: string | null;
  property_type: PropertyType;
  listing_status: ListingStatus;
  price: number;
  original_price: number | null;
  currency: string;
  address: string;
  city: string;
  neighborhood: string | null;
  latitude: number | null;
  longitude: number | null;
  bedrooms: number;
  bathrooms: number;
  size_sqm: number | null;
  lot_size_sqm: number | null;
  floor: number | null;
  total_floors: number | null;
  year_built: number | null;
  features: string[] | null;
  images: string[] | null;
  views_count: number;
  is_featured: boolean;
  is_published: boolean;
  parking: number;
  condition: PropertyCondition | null;
  is_furnished: boolean;
  is_accessible: boolean;
  additional_rooms: number | null;
  entry_date: string | null;
  ac_type: 'none' | 'split' | 'central' | 'mini_central' | null;
  vaad_bayit_monthly: number | null;
  allows_pets: 'none' | 'cats' | 'dogs' | 'all' | null;
  // Lease reality fields
  lease_term: LeaseTermOption | null;
  subletting_allowed: SublettingOption | null;
  furnished_status: FurnishedStatus | null;
  pets_policy: PetsPolicy | null;
  agent_fee_required: boolean | null;
  bank_guarantee_required: boolean | null;
  checks_required: boolean | null;
   // Furniture items for furnished properties
   furniture_items: string[] | null;
   // Featured highlight - agent's choice standout feature
   featured_highlight: string | null;
   created_at: string;
  updated_at: string;
  agent?: Agent;
  /** Client-side flag: true when this property was returned via a paid boost */
  _isBoosted?: boolean;
}

export interface Favorite {
  id: string;
  user_id: string;
  property_id: string;
  created_at: string;
}

export interface Inquiry {
  id: string;
  property_id: string;
  user_id: string | null;
  agent_id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface PropertyFilters {
  city?: string;
  neighborhood?: string;
  neighborhoods?: string[];
  property_type?: PropertyType;
  property_types?: PropertyType[];
  listing_status?: ListingStatus;
  min_price?: number;
  max_price?: number;
  min_rooms?: number;
  max_rooms?: number;
  min_bathrooms?: number;
  min_size?: number;
  max_size?: number;
  min_floor?: number;
  max_floor?: number;
  min_lot_size?: number;
  max_lot_size?: number;
  min_year_built?: number;
  max_year_built?: number;
  max_days_listed?: number;
  min_parking?: number;
  features?: string[];
  condition?: PropertyCondition[];
  is_furnished?: boolean;
  is_accessible?: boolean;
  sort_by?: SortOption;
  // Rental-specific filters
  available_now?: boolean;
  available_by?: string;
  allows_pets?: ('cats' | 'dogs' | 'all')[];
  // Map bounds filter
  bounds?: MapBounds;
  // Quick amenity filters
  has_balcony?: boolean;
  has_elevator?: boolean;
  has_storage?: boolean;
  has_parking?: boolean;
  has_pool?: boolean;
}

export interface SearchAlert {
  id: string;
  user_id: string;
  name: string | null;
  filters: PropertyFilters;
  listing_type: ListingType;
  frequency: AlertFrequency;
  notify_email: boolean;
  notify_whatsapp: boolean;
  notify_sms: boolean;
  phone: string | null;
  is_active: boolean;
  last_sent_at: string | null;
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
}