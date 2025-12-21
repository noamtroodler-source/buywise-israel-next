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
}
