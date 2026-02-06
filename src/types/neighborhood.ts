export interface FeaturedNeighborhood {
  name: string;
  name_he?: string;
  vibe: string;
  description: string;
  price_tier: 'budget' | 'mid-range' | 'premium' | 'ultra-premium';
  sort_order: number;
}

export type PriceTier = FeaturedNeighborhood['price_tier'];
