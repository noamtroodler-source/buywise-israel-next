export interface FeaturedNeighborhood {
  name: string;
  name_he?: string;
  vibe: string;
  description: string;
  price_tier: 'budget' | 'mid-range' | 'premium' | 'ultra-premium';
  sort_order: number;
  // CBS price data (enriched at runtime from approved mappings)
  avg_price?: number | null;
  yoy_change_percent?: number | null;
}

export type PriceTier = FeaturedNeighborhood['price_tier'];
