import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches active boosts for a given product slug and returns target entity IDs.
 * Used across homepage, search, city, and similar listings to merge boosted items.
 */
export function useBoostedListings(
  productSlug: string | undefined,
  targetType: 'property' | 'project' | 'agency' | 'developer' = 'property'
) {
  return useQuery({
    queryKey: ['boostedListings', productSlug, targetType],
    queryFn: async (): Promise<string[]> => {
      if (!productSlug) return [];

      // Get product ID by slug
      const { data: product } = await supabase
        .from('visibility_products')
        .select('id')
        .eq('slug', productSlug)
        .eq('is_active', true)
        .maybeSingle();

      if (!product) return [];

      // Get active boosts for this product
      const { data: boosts, error } = await supabase
        .from('active_boosts')
        .select('target_id')
        .eq('product_id', product.id)
        .eq('target_type', targetType)
        .eq('is_active', true)
        .gt('ends_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return boosts?.map(b => b.target_id) ?? [];
    },
    enabled: !!productSlug,
    staleTime: 60_000, // 1 minute cache - boosts don't change frequently
  });
}

/**
 * Fetches boosted IDs for multiple product slugs at once.
 * Returns a map of slug -> target_ids.
 */
export function useBoostedListingsBySlug(
  productSlugs: string[],
  targetType: 'property' | 'project' | 'agency' | 'developer' = 'property'
) {
  return useQuery({
    queryKey: ['boostedListingsBySlug', productSlugs, targetType],
    queryFn: async (): Promise<Record<string, string[]>> => {
      if (!productSlugs.length) return {};

      // Get product IDs by slugs
      const { data: products } = await supabase
        .from('visibility_products')
        .select('id, slug')
        .in('slug', productSlugs)
        .eq('is_active', true);

      if (!products?.length) return {};

      const productIds = products.map(p => p.id);

      // Get active boosts for these products
      const { data: boosts, error } = await supabase
        .from('active_boosts')
        .select('target_id, product_id')
        .in('product_id', productIds)
        .eq('target_type', targetType)
        .eq('is_active', true)
        .gt('ends_at', new Date().toISOString());

      if (error) throw error;

      // Map back to slugs
      const result: Record<string, string[]> = {};
      for (const slug of productSlugs) {
        const productId = products.find(p => p.slug === slug)?.id;
        result[slug] = boosts
          ?.filter(b => b.product_id === productId)
          .map(b => b.target_id) ?? [];
      }
      return result;
    },
    enabled: productSlugs.length > 0,
    staleTime: 60_000,
  });
}
