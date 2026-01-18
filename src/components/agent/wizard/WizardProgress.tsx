import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WizardProgressProps {
  currentStep: number;
  steps: { title: string; description: string }[];
}

export function WizardProgress({ currentStep, steps }: WizardProgressProps) {
  return (
    <div className="mb-6">
      {/* Mobile: Simple step indicator */}
      <div className="flex items-center justify-center gap-2 sm:hidden">
        <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-semibold">
          {currentStep + 1}
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

              return (
                <div key={step.title} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center font-semibold text-sm transition-all duration-300",
                        isCompleted && "bg-primary text-primary-foreground shadow-md",
                        isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-lg",
                        isUpcoming && "bg-muted/80 text-muted-foreground border border-border"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <p className={cn(
                        "text-xs font-medium transition-colors",
                        (isCompleted || isCurrent) ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {step.title}
                      </p>
                    </div>
                  </div>
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
