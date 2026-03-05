import { useBuyerProfile, useUpdateBuyerProfile } from './useBuyerProfile';

export type JourneyStage = 'researching' | 'shortlisting' | 'viewing' | 'offer' | 'legal' | 'completing';

export const JOURNEY_STAGES: { key: JourneyStage; label: string; subtitle: string; insight: string }[] = [
  { key: 'researching', label: 'Researching', subtitle: 'Understanding the market', insight: 'Most buyers spend 2–6 weeks here. Take your time.' },
  { key: 'shortlisting', label: 'Shortlisting', subtitle: 'Narrowing down', insight: 'Typically 3–8 weeks. Compare before committing.' },
  { key: 'viewing', label: 'Viewing', subtitle: 'Visiting properties', insight: 'Most buyers view 5–15 properties before deciding.' },
  { key: 'offer', label: 'Offer', subtitle: 'Making an offer', insight: 'Verify everything before you sign. No rushing.' },
  { key: 'legal', label: 'Legal', subtitle: 'Legal & contracts', insight: 'A good lawyer is worth the investment.' },
  { key: 'completing', label: 'Completing', subtitle: 'Closing & moving in', insight: 'Almost there! The final stretch takes 1–3 months.' },
];

export function useBuyerJourneyStage() {
  const { data: profile, isLoading } = useBuyerProfile();
  const updateProfile = useUpdateBuyerProfile();

  const currentStage: JourneyStage = (profile?.journey_stage as JourneyStage) || 'researching';
  const currentIndex = JOURNEY_STAGES.findIndex(s => s.key === currentStage);
  const stageInfo = JOURNEY_STAGES[currentIndex] || JOURNEY_STAGES[0];

  const setStage = (stage: JourneyStage) => {
    updateProfile.mutate({ journey_stage: stage } as any);
  };

  return {
    currentStage,
    currentIndex,
    stageInfo,
    stages: JOURNEY_STAGES,
    setStage,
    isLoading,
    isUpdating: updateProfile.isPending,
    hasProfile: !!profile,
  };
}
