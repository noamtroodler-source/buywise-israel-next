export type ProjectStatus = 'planning' | 'pre_sale' | 'foundation' | 'structure' | 'finishing' | 'delivery' | 'under_construction' | 'completed';

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
  user_id: string | null;
  created_at: string;
  updated_at: string;
  // New fields from signup wizard
  status: string | null;
  verification_status: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  office_address: string | null;
  office_city: string | null;
  company_size: string | null;
  company_type: string | null;
  specialties: string[] | null;
  value_proposition: string | null;
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
  price_from: number | null;
  price_to: number | null;
  currency: string;
  completion_date: string | null;
  construction_start: string | null;
  construction_progress_percent: number | null;
  amenities: string[] | null;
  images: string[] | null;
  floor_plans: string[] | null;
  is_featured: boolean;
  is_published: boolean;
  views_count: number;
  featured_highlight: string | null;
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
  min_bedrooms: number | null;
  max_bedrooms: number | null;
  /** Client-side only — set after boost query merge, never persisted to DB */
  _isBoosted?: boolean;
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
  district: string | null;
  year: number;
  month: number | null; // For quarterly: 1-4, for monthly: 1-12
  quarter: number | null; // Alias for clarity when using quarterly data
  average_price_sqm: number | null;
  median_price: number | null;
  total_transactions: number | null;
  price_change_percent: number | null;
  data_type: 'quarterly' | 'yearly' | 'monthly';
  created_at: string;
}
