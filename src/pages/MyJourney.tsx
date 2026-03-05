import { Layout } from '@/components/layout/Layout';
import { Loader2, Compass, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBuyerJourneyStage } from '@/hooks/useBuyerJourneyStage';
import { JourneyStepper } from '@/components/journey/JourneyStepper';
import { StageContent } from '@/components/journey/StageContent';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function MyJourney() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentStage, stageInfo, stages, setStage, isLoading, isUpdating, hasProfile, currentIndex } = useBuyerJourneyStage();

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

  return (
    <Layout>
      <div className="container py-6 md:py-10 max-w-3xl">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Compass className="h-5 w-5 text-primary" />
            <h1 className="text-xl md:text-2xl font-bold text-foreground">My Buying Journey</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Your personal roadmap. Click any stage to see what matters most right now.
          </p>
        </div>

        {/* Stepper */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <JourneyStepper
              currentStage={currentStage}
              onStageClick={setStage}
              disabled={isUpdating}
            />
          </CardContent>
        </Card>

        {/* Stage header */}
        <div className="mb-6">
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
