import { useMemo } from 'react';
import { useBuyerProfile } from './useBuyerProfile';
import { useMortgagePreferences } from './useMortgagePreferences';
import { useSavedLocations } from './useSavedLocations';
import { useProfile } from './useProfile';

interface CompletionItem {
  key: string;
  label: string;
  isComplete: boolean;
  description: string;
}

export function useProfileCompletion() {
  const { data: buyerProfile, isLoading: buyerLoading } = useBuyerProfile();
  const { preferences, isSaving: mortgageSaving } = useMortgagePreferences();
  const { data: locations = [], isLoading: locationsLoading } = useSavedLocations();
  const { data: profile, isLoading: profileLoading } = useProfile();

  const isLoading = buyerLoading || locationsLoading || profileLoading;

  const items = useMemo<CompletionItem[]>(() => {
    return [
      {
        key: 'buyer-profile',
        label: 'Buyer Profile',
        isComplete: buyerProfile?.onboarding_completed === true,
        description: buyerProfile?.onboarding_step && !buyerProfile.onboarding_completed
          ? 'Resume setup to finish'
          : 'Tax status and property ownership',
      },
      {
        key: 'mortgage',
        label: 'Mortgage Preferences',
        isComplete: preferences !== null && (preferences.down_payment_percent !== null || preferences.down_payment_amount !== null),
        description: 'Down payment and loan terms',
      },
      {
        key: 'locations',
        label: 'Core Locations',
        isComplete: locations.length > 0,
        description: 'Personalized travel times',
      },
      {
        key: 'personal-info',
        label: 'Personal Info',
        isComplete: !!(profile?.full_name && profile?.phone),
        description: 'Name and contact info',
      },
    ];
  }, [buyerProfile, preferences, locations, profile]);

  const completedCount = items.filter((item) => item.isComplete).length;
  const totalCount = items.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  const nextIncomplete = items.find((item) => !item.isComplete);

  // Generate personalized insight based on buyer profile
  const insight = useMemo(() => {
    if (!buyerProfile) return null;
    
    if (buyerProfile.residency_status === 'oleh_hadash' && buyerProfile.aliyah_year) {
      const benefitEndYear = buyerProfile.aliyah_year + 7;
      const currentYear = new Date().getFullYear();
      if (benefitEndYear > currentYear) {
        return `Your Oleh tax benefit is active until ${benefitEndYear}`;
      }
    }
    
    if (buyerProfile.is_first_property) {
      return 'First-time buyer rates apply to your calculations';
    }
    
    return null;
  }, [buyerProfile]);

  return {
    items,
    completedCount,
    totalCount,
    percentage,
    nextIncomplete,
    insight,
    isLoading,
  };
}
