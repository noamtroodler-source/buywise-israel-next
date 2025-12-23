export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  category_id: string | null;
  author_id: string | null;
  is_published: boolean;
  published_at: string | null;
  views_count: number;
  created_at: string;
  updated_at: string;
  category?: BlogCategory;
  city?: string | null;
  audiences?: string[];
  reading_time_minutes?: number;
  saves_count?: number;
}

export interface SavedArticle {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface Neighborhood {
  name: string;
  description?: string;
}

export interface City {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  hero_image: string | null;
  population: number | null;
  average_price: number | null;
  neighborhoods: Neighborhood[] | unknown;
  highlights: string[] | null;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  // Additional fields from database
  arnona_monthly_avg?: number | null;
  arnona_rate_sqm?: number | null;
  average_vaad_bayit?: number | null;
  gross_yield_percent?: number | null;
  net_yield_percent?: number | null;
  average_price_sqm?: number | null;
  yoy_price_change?: number | null;
  investment_score?: number | null;
  commute_time_tel_aviv?: number | null;
  has_train_station?: boolean | null;
  anglo_presence?: string | null;
  socioeconomic_rank?: number | null;
  price_range_min?: number | null;
  price_range_max?: number | null;
  rental_3_room_min?: number | null;
  rental_3_room_max?: number | null;
  rental_4_room_min?: number | null;
  rental_4_room_max?: number | null;
  median_apartment_price?: number | null;
  buyer_profile_match?: string[] | null;
  market_outlook?: string | null;
  key_developments?: string | null;
  renovation_cost_basic?: number | null;
  renovation_cost_premium?: number | null;
}

export type BlogSortOption = 'newest' | 'most_viewed' | 'most_saved';
export type BlogAudience = 'families' | 'investors' | 'olim' | 'first-time-buyers' | 'retirees';

export const AUDIENCE_OPTIONS: { value: BlogAudience; label: string }[] = [
  { value: 'families', label: 'Families' },
  { value: 'investors', label: 'Investors' },
  { value: 'olim', label: 'Olim' },
  { value: 'first-time-buyers', label: 'First-Time Buyers' },
  { value: 'retirees', label: 'Retirees' },
];
