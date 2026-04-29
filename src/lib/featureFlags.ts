import { supabase } from '@/integrations/supabase/client';

export const PRICE_CONTEXT_FLAGS = {
  broadDisplay: 'PRICE_CONTEXT_BROAD_DISPLAY',
  buyerFilter: 'PRICE_CONTEXT_BUYER_FILTER',
  placementBoost: 'PRICE_CONTEXT_PLACEMENT_BOOST',
} as const;

export type FeatureFlagKey = (typeof PRICE_CONTEXT_FLAGS)[keyof typeof PRICE_CONTEXT_FLAGS] | string;

export async function fetchFeatureFlag(flagKey: FeatureFlagKey, defaultValue = false): Promise<boolean> {
  const { data, error } = await supabase
    .from('feature_flags')
    .select('is_enabled')
    .eq('flag_key', flagKey)
    .maybeSingle();

  if (error) return defaultValue;
  return Boolean(data?.is_enabled ?? defaultValue);
}