import { AlertTriangle, ArrowRight } from 'lucide-react';
import { StepValidationError } from '../PropertyWizardContext';

interface ValidationSummaryProps {
  errors: StepValidationError[];
  onGoToStep: (step: number) => void;
  stepOffset?: number;
}

export function ValidationSummary({ errors, onGoToStep, stepOffset = 0 }: ValidationSummaryProps) {
  if (errors.length === 0) return null;

  const totalErrors = errors.reduce((sum, e) => sum + e.errors.length, 0);

  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <h3 className="font-semibold text-destructive">
          {totalErrors} {totalErrors === 1 ? 'issue' : 'issues'} to fix before submitting
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
  );
}
