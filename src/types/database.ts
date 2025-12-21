export type PropertyType = 'apartment' | 'garden_apartment' | 'penthouse' | 'mini_penthouse' | 'duplex' | 'house' | 'cottage' | 'land' | 'commercial';
export type ListingStatus = 'for_sale' | 'for_rent' | 'sold' | 'rented';
export type ListingType = 'for_sale' | 'for_rent' | 'projects';
export type PropertyCondition = 'new' | 'renovated' | 'good' | 'needs_renovation';
export type AlertFrequency = 'instant' | 'daily' | 'weekly';
export type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'size_desc' | 'rooms_desc';
export type AppRole = 'admin' | 'agent' | 'user';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
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
  created_at: string;
  updated_at: string;
  agent?: Agent;
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

export interface PropertyFilters {
  city?: string;
  property_type?: PropertyType;
  listing_status?: ListingStatus;
  min_price?: number;
  max_price?: number;
  min_rooms?: number;
  max_rooms?: number;
  min_bathrooms?: number;
  min_size?: number;
  max_size?: number;
  min_parking?: number;
  features?: string[];
  condition?: PropertyCondition[];
  is_furnished?: boolean;
  is_accessible?: boolean;
  sort_by?: SortOption;
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
  created_at: string;
  updated_at: string;
}