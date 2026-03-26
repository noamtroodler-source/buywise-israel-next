import { Layout } from '@/components/layout/Layout';
import { Loader2, Compass, ArrowRight, MapPin, Banknote, Heart, Target, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBuyerJourneyStage } from '@/hooks/useBuyerJourneyStage';
import { useBuyerProfile } from '@/hooks/useBuyerProfile';
import { useFavorites } from '@/hooks/useFavorites';
import { useSavedLocations } from '@/hooks/useSavedLocations';
import { JourneyStepper } from '@/components/journey/JourneyStepper';
import { StageContent } from '@/components/journey/StageContent';
import { Button } from '@/components/ui/button';

function formatBudget(min?: number | null, max?: number | null) {
  const fmt = (n: number) => n >= 1_000_000 ? `₪${(n / 1_000_000).toFixed(1)}M` : `₪${(n / 1_000).toFixed(0)}K`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (max) return `Up to ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return null;
}

export default function MyJourney() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentStage, stageInfo, stages, setStage, isLoading, isUpdating, currentIndex } = useBuyerJourneyStage();
  const { data: profile } = useBuyerProfile();
  const { favoriteIds } = useFavorites();
  const { data: savedLocations = [] } = useSavedLocations();

  if (!user) {
    return (
      <Layout>
        <div className="container py-12 max-w-3xl text-center space-y-4">
          <Compass className="h-12 w-12 text-primary mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">My Buying Journey</h1>
          <p className="text-muted-foreground">Sign in to track your progress through the property buying process in Israel.</p>
          <Button onClick={() => navigate('/auth')}>Sign In to Get Started</Button>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const nextStage = currentIndex < stages.length - 1 ? stages[currentIndex + 1] : null;
  const budgetStr = formatBudget(profile?.budget_min, profile?.budget_max);
  const targetCities = profile?.target_cities || [];
  const savedCount = favoriteIds?.length || 0;
  const locationsCount = savedLocations.length;

  // Build context chips from buyer profile data
  const contextChips: { icon: React.ReactNode; label: string; href: string }[] = [];
  if (budgetStr) contextChips.push({ icon: <Banknote className="h-3.5 w-3.5" />, label: budgetStr, href: '/profile' });
  if (targetCities.length > 0) {
    const cityLabel = targetCities.length <= 2 ? targetCities.join(', ') : `${targetCities.length} cities`;
    contextChips.push({ icon: <Target className="h-3.5 w-3.5" />, label: cityLabel, href: '/profile' });
  }
  if (savedCount > 0) contextChips.push({ icon: <Heart className="h-3.5 w-3.5" />, label: `${savedCount} saved`, href: '/favorites' });
  if (locationsCount > 0) contextChips.push({ icon: <MapPin className="h-3.5 w-3.5" />, label: `${locationsCount} location${locationsCount !== 1 ? 's' : ''}`, href: '/profile' });

  return (
    <Layout>
      <div className="container py-6 md:py-10 max-w-3xl">
        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">My Buying Journey</h1>
              <p className="text-sm text-muted-foreground">
                Your personal roadmap. Click any stage to see what matters most right now.
              </p>
            </div>
          </div>

          {/* Context chips — show buyer's key data points */}
          {contextChips.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 ml-11">
              {contextChips.map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => navigate(chip.href)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  {chip.icon}
                  {chip.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Stepper */}
        <div className="rounded-2xl border border-border/50 bg-card shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08),0_2px_8px_-2px_rgba(0,0,0,0.04)] p-4 mb-6">
          <JourneyStepper
            currentStage={currentStage}
            onStageClick={setStage}
            disabled={isUpdating}
          />
        </div>

        {/* Stage header */}
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-foreground">{stageInfo.subtitle}</h2>
          <p className="text-sm text-muted-foreground mt-1">{stageInfo.insight}</p>
        </div>

        {/* Stage content grid */}
        <StageContent stage={currentStage} />

        {/* Bottom nudge */}
        <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:justify-between">
          {nextStage && (
            <button
              onClick={() => setStage(nextStage.key)}
              disabled={isUpdating}
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors disabled:opacity-50"
            >
              When you're ready: move to "{nextStage.label}"
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
          {currentStage === 'completing' && (
            <p className="text-sm text-primary font-medium">🎉 You made it — welcome home!</p>
          )}
          <button
            onClick={() => navigate('/tools?tool=workshop')}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Not sure where you are? Take the Readiness Check →
          </button>
        </div>
      </div>
    </Layout>
  );
}
