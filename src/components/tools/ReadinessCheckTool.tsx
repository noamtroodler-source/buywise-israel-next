import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Compass, ChevronRight, Check, X, BookOpen, Calculator, 
  ArrowLeft, RotateCcw, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type JourneyStage = 'curious' | 'learning' | 'searching' | 'ready';

interface ConfidenceCheck {
  id: string;
  label: string;
  description: string;
  resource: string;
  resourceType: 'guide' | 'tool';
  resourceLabel: string;
}

const stages: { id: JourneyStage; label: string; description: string }[] = [
  { id: 'curious', label: 'Just curious', description: 'Exploring from afar — no specific timeline' },
  { id: 'learning', label: 'Starting to get serious', description: 'Reading and learning about the market' },
  { id: 'searching', label: 'Actively searching', description: 'Looking at specific properties' },
  { id: 'ready', label: 'Ready to act', description: 'Ready to contact agents soon' },
];

const confidenceChecks: ConfidenceCheck[] = [
  {
    id: 'purchaseTax',
    label: 'I understand how purchase tax works in Israel',
    description: 'Mas Rechisha (purchase tax) varies based on property value and buyer status',
    resource: '/guides/purchase-tax',
    resourceType: 'guide',
    resourceLabel: 'Purchase Tax Guide',
  },
  {
    id: 'affordability',
    label: 'I know roughly what I can afford',
    description: 'Understanding your budget including all costs',
    resource: '/tools?tool=affordability',
    resourceType: 'tool',
    resourceLabel: 'Affordability Calculator',
  },
  {
    id: 'agentQuestions',
    label: 'I know what questions to ask an agent',
    description: 'Being prepared for conversations with professionals',
    resource: '/guides/talking-to-professionals',
    resourceType: 'guide',
    resourceLabel: 'Agent Preparation Guide',
  },
  {
    id: 'newVsResale',
    label: 'I understand the difference between new and resale',
    description: 'Each has different processes, costs, and considerations',
    resource: '/guides/new-vs-resale',
    resourceType: 'guide',
    resourceLabel: 'New vs Resale Guide',
  },
  {
    id: 'timeline',
    label: 'I have a general timeline in mind',
    description: 'Understanding how long the process typically takes',
    resource: '/tools?tool=totalcost',
    resourceType: 'tool',
    resourceLabel: 'Total Cost Calculator',
  },
];

const affirmations: Record<JourneyStage, string[]> = {
  curious: [
    "Taking time to understand is not a delay — it's how confident decisions are made.",
    "There's no rush. The right property will wait for the right buyer.",
  ],
  learning: [
    "You're doing exactly what smart buyers do: preparing before acting.",
    "Knowledge compounds. Every guide you read makes the next decision clearer.",
  ],
  searching: [
    "You've built a foundation. Now you can search with confidence.",
    "Searching without pressure leads to better decisions.",
  ],
  ready: [
    "You're prepared. When you reach out, you'll be a confident, informed buyer.",
    "Readiness isn't about speed — it's about clarity. You have that.",
  ],
};

type Step = 'stage' | 'checks' | 'result';

interface ReadinessResult {
  stage: JourneyStage;
  strengths: string[];
  gaps: ConfidenceCheck[];
  affirmation: string;
}

export function ReadinessCheckTool() {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('stage');
  const [selectedStage, setSelectedStage] = useState<JourneyStage | null>(null);
  const [currentCheckIndex, setCurrentCheckIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<ReadinessResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleStageSelect = (stage: JourneyStage) => {
    setSelectedStage(stage);
    setStep('checks');
    setCurrentCheckIndex(0);
    setAnswers({});
  };

  const handleCheckAnswer = (checkId: string, answer: boolean) => {
    const newAnswers = { ...answers, [checkId]: answer };
    setAnswers(newAnswers);

    if (currentCheckIndex < confidenceChecks.length - 1) {
      setCurrentCheckIndex(currentCheckIndex + 1);
    } else {
      // Calculate result
      calculateResult(newAnswers);
    }
  };

  const calculateResult = (finalAnswers: Record<string, boolean>) => {
    if (!selectedStage) return;

    const strengths = confidenceChecks
      .filter(check => finalAnswers[check.id])
      .map(check => check.label);

    const gaps = confidenceChecks
      .filter(check => !finalAnswers[check.id]);

    const stageAffirmations = affirmations[selectedStage];
    const randomAffirmation = stageAffirmations[Math.floor(Math.random() * stageAffirmations.length)];

    setResult({
      stage: selectedStage,
      strengths,
      gaps,
      affirmation: randomAffirmation,
    });
    setStep('result');
  };

  const handleSaveSnapshot = async () => {
    if (!user || !result) {
      toast.error('Please sign in to save your snapshot');
      return;
    }

    setIsSaving(true);
    try {
      const snapshot = {
        stage: result.stage,
        completed_at: new Date().toISOString(),
        confidence_checks: answers,
        gaps_identified: result.gaps.map(g => g.id),
      };

      const { error } = await supabase
        .from('buyer_profiles')
        .update({ readiness_snapshot: snapshot })
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('Readiness snapshot saved to your profile');
    } catch (error) {
      console.error('Error saving snapshot:', error);
      toast.error('Failed to save snapshot');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setStep('stage');
    setSelectedStage(null);
    setCurrentCheckIndex(0);
    setAnswers({});
    setResult(null);
  };

  const progress = step === 'checks' 
    ? ((currentCheckIndex + 1) / confidenceChecks.length) * 100 
    : step === 'result' ? 100 : 0;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Compass className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl">Readiness Check</CardTitle>
        <p className="text-muted-foreground">
          Understand where you are in your journey — and what to focus on next.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {step !== 'stage' && (
          <Progress value={progress} className="h-1.5" />
        )}

        <AnimatePresence mode="wait">
          {/* Stage Selection */}
          {step === 'stage' && (
            <motion.div
              key="stage"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h3 className="font-medium text-center">Where are you in your thinking?</h3>
              <div className="space-y-2">
                {stages.map((stage) => (
                  <button
                    key={stage.id}
                    onClick={() => handleStageSelect(stage.id)}
                    className="w-full p-4 text-left rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{stage.label}</p>
                        <p className="text-sm text-muted-foreground">{stage.description}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Confidence Checks */}
          {step === 'checks' && (
            <motion.div
              key={`check-${currentCheckIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Question {currentCheckIndex + 1} of {confidenceChecks.length}
                </p>
                <h3 className="text-lg font-medium">
                  {confidenceChecks[currentCheckIndex].label}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {confidenceChecks[currentCheckIndex].description}
                </p>
              </div>

              <div className="flex gap-3 justify-center">
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1 max-w-[140px] gap-2"
                  onClick={() => handleCheckAnswer(confidenceChecks[currentCheckIndex].id, false)}
                >
                  <X className="h-4 w-4" />
                  Not yet
                </Button>
                <Button
                  size="lg"
                  className="flex-1 max-w-[140px] gap-2"
                  onClick={() => handleCheckAnswer(confidenceChecks[currentCheckIndex].id, true)}
                >
                  <Check className="h-4 w-4" />
                  Yes
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (currentCheckIndex > 0) {
                    setCurrentCheckIndex(currentCheckIndex - 1);
                  } else {
                    setStep('stage');
                  }
                }}
                className="mx-auto flex"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </motion.div>
          )}

          {/* Result */}
          {step === 'result' && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Stage Badge */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium">
                  <Sparkles className="h-4 w-4" />
                  {stages.find(s => s.id === result.stage)?.label}
                </div>
              </div>

              {/* Strengths */}
              {result.strengths.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">You're confident about:</h4>
                  <div className="space-y-1.5">
                    {result.strengths.map((strength, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-semantic-green flex-shrink-0" />
                        <span>{strength}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gaps */}
              {result.gaps.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Areas to explore:</h4>
                  <div className="space-y-2">
                    {result.gaps.map((gap) => (
                      <Link
                        key={gap.id}
                        to={gap.resource}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          {gap.resourceType === 'guide' ? (
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Calculator className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-sm">{gap.label}</span>
                        </div>
                        <span className="text-xs text-primary font-medium group-hover:underline">
                          {gap.resourceLabel} →
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Affirmation */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 text-center">
                <p className="text-sm text-foreground italic">
                  "{result.affirmation}"
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2">
                {user && (
                  <Button 
                    onClick={handleSaveSnapshot}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    {isSaving ? 'Saving...' : 'Save my snapshot'}
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={handleReset}
                  className={cn(user ? "flex-1" : "w-full")}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Start again
                </Button>
              </div>

              {!user && (
                <p className="text-xs text-muted-foreground text-center">
                  <Link to="/auth" className="text-primary hover:underline">Sign in</Link> to save your readiness snapshot
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
