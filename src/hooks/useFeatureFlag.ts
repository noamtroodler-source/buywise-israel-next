import { useQuery } from '@tanstack/react-query';
import { FeatureFlagKey, fetchFeatureFlag } from '@/lib/featureFlags';

export function useFeatureFlag(flagKey: FeatureFlagKey, defaultValue = false) {
  return useQuery({
    queryKey: ['feature-flags', flagKey],
    queryFn: () => fetchFeatureFlag(flagKey, defaultValue),
    staleTime: 60_000,
    placeholderData: defaultValue,
  });
}