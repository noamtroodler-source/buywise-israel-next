export type ProjectStatus = 'planning' | 'pre_sale' | 'under_construction' | 'completed';

export interface Developer {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  founded_year: number | null;
  total_projects: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  developer_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  city: string;
  neighborhood: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  status: ProjectStatus;
  total_units: number;
  available_units: number;
  price_from: number | null;
  price_to: number | null;
  currency: string;
  completion_date: string | null;
  construction_start: string | null;
  amenities: string[] | null;
  images: string[] | null;
  floor_plans: string[] | null;
  is_featured: boolean;
  is_published: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
  developer?: Developer;
  representing_agent_id: string | null;
  representing_agent?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
    agency_name: string | null;
    is_verified: boolean | null;
    bio: string | null;
    languages: string[] | null;
    years_experience: number | null;
  };
}

export interface ProjectUnit {
  id: string;
  project_id: string;
  unit_type: string;
  bedrooms: number;
  bathrooms: number;
  size_sqm: number | null;
  floor: number | null;
  price: number | null;
  currency: string;
  status: string;
  floor_plan_url: string | null;
  created_at: string;
}

export interface MarketData {
  id: string;
  city: string;
  neighborhood: string | null;
  year: number;
  month: number | null;
  average_price_sqm: number | null;
  median_price: number | null;
  total_transactions: number | null;
  price_change_percent: number | null;
  data_type: string;
  created_at: string;
}
