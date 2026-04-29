import { AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import { StepValidationError, StepValidationRecommendation } from '../PropertyWizardContext';

interface ValidationSummaryProps {
  errors: StepValidationError[];
  recommendations?: StepValidationRecommendation[];
  onGoToStep: (step: number) => void;
  stepOffset?: number;
}

export function ValidationSummary({ errors, recommendations = [], onGoToStep, stepOffset = 0 }: ValidationSummaryProps) {
  const totalErrors = errors.reduce((sum, e) => sum + e.errors.length, 0);
  const totalRecommendations = recommendations.reduce((sum, e) => sum + e.recommendations.length, 0);

  if (totalErrors === 0 && totalRecommendations === 0) return null;

  return (
    <div className="space-y-4">
      {totalErrors > 0 && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h3 className="font-semibold text-destructive">
              Must fix to submit
            </h3>
          </div>
          <div className="space-y-3">
            {errors.map((group) => (
              <button
                key={group.step}
                type="button"
                onClick={() => onGoToStep(group.step + stepOffset)}
                className="w-full text-left rounded-xl border border-border/50 bg-card/50 p-3 hover:bg-accent/50 transition-colors group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-foreground">{group.stepName}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <ul className="space-y-0.5">
                  {group.errors.map((err, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="text-destructive mt-0.5">•</span>
                      {err}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </div>
      )}

      {totalRecommendations > 0 && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold text-foreground">Recommended for buyer trust</h3>
              <p className="text-xs text-muted-foreground">You can submit now and improve these later.</p>
            </div>
          </div>
          <div className="space-y-3">
            {recommendations.map((group) => (
              <button
                key={group.step}
                type="button"
                onClick={() => onGoToStep(group.step + stepOffset)}
                className="w-full text-left rounded-xl border border-border/50 bg-card/50 p-3 hover:bg-accent/50 transition-colors group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-foreground">{group.stepName}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <ul className="space-y-0.5">
                  {group.recommendations.map((rec, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="text-primary mt-0.5">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
