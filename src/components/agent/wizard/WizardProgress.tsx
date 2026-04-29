import { Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WizardProgressProps {
  currentStep: number;
  steps: { title: string; description: string }[];
  onStepClick?: (step: number) => void;
  /** Map of step index → error count. Steps with errors show a warning indicator. */
  stepErrors?: Record<number, number>;
  /** Highest step index allowed to show errors. Use currentStep - 1 for fresh wizards. */
  maxErrorStepIndex?: number;
}

export function WizardProgress({ currentStep, steps, onStepClick, stepErrors, maxErrorStepIndex = Number.POSITIVE_INFINITY }: WizardProgressProps) {
  const currentStepErrors = currentStep <= maxErrorStepIndex ? (stepErrors?.[currentStep] ?? 0) : 0;

  return (
    <div className="mb-6">
      {/* Mobile: Simple step indicator */}
      <div className="flex items-center justify-center gap-2 sm:hidden">
        <div className="relative">
          <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-semibold">
            {currentStep + 1}
          </div>
          {currentStepErrors > 0 && (
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive" />
          )}
        </div>
        <div>
          <span className="text-sm font-medium">
            {steps[currentStep].title}
          </span>
          <p className="text-xs text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>
      </div>

      {/* Desktop: Full progress bar */}
      <div className="hidden sm:block">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-muted/30 to-transparent border border-primary/10 p-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              const isUpcoming = index > currentStep;
              const errorCount = index <= maxErrorStepIndex ? (stepErrors?.[index] ?? 0) : 0;
              const hasErrors = errorCount > 0;

              return (
                <div key={step.title} className="flex items-center flex-1">
                  <button
                    type="button"
                    onClick={() => onStepClick?.(index)}
                    disabled={!onStepClick}
                    className={cn(
                      "flex flex-col items-center flex-shrink-0",
                      onStepClick && "cursor-pointer hover:opacity-80 transition-opacity"
                    )}
                  >
                    <div className="relative">
                      <div
                        className={cn(
                          "w-11 h-11 rounded-xl flex items-center justify-center font-semibold text-sm transition-all duration-300",
                          isCompleted && !hasErrors && "bg-primary text-primary-foreground shadow-md",
                          isCompleted && hasErrors && "bg-destructive/10 text-destructive border border-destructive/30 shadow-md",
                          isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-lg",
                          isUpcoming && !hasErrors && "bg-muted/80 text-muted-foreground border border-border",
                          isUpcoming && hasErrors && "bg-destructive/10 text-destructive border border-destructive/30"
                        )}
                      >
                        {isCompleted && !hasErrors ? (
                          <Check className="h-5 w-5" />
                        ) : isCompleted && hasErrors ? (
                          <AlertCircle className="h-5 w-5" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      {hasErrors && !isCurrent && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                          {errorCount}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <p className={cn(
                        "text-xs font-medium transition-colors",
                        hasErrors && !isCurrent && "text-destructive",
                        !hasErrors && (isCompleted || isCurrent) && "text-foreground",
                        !hasErrors && isUpcoming && "text-muted-foreground"
                      )}>
                        {step.title}
                      </p>
                    </div>
                  </button>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      "flex-1 h-1 mx-3 rounded-full transition-colors",
                      isCompleted ? "bg-primary" : "bg-muted"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
