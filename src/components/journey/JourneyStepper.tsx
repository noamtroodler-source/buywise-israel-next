import { Search, ListChecks, Eye, FileText, Scale, Home, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { JourneyStage, JOURNEY_STAGES } from '@/hooks/useBuyerJourneyStage';

const STAGE_ICONS: Record<JourneyStage, React.ReactNode> = {
  researching: <Search className="h-4 w-4" />,
  shortlisting: <ListChecks className="h-4 w-4" />,
  viewing: <Eye className="h-4 w-4" />,
  offer: <FileText className="h-4 w-4" />,
  legal: <Scale className="h-4 w-4" />,
  completing: <Home className="h-4 w-4" />,
};

interface JourneyStepperProps {
  currentStage: JourneyStage;
  onStageClick: (stage: JourneyStage) => void;
  disabled?: boolean;
}

export function JourneyStepper({ currentStage, onStageClick, disabled }: JourneyStepperProps) {
  const currentIndex = JOURNEY_STAGES.findIndex(s => s.key === currentStage);

  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      <div className="flex items-center min-w-[600px] gap-1">
        {JOURNEY_STAGES.map((stage, index) => {
          const isActive = stage.key === currentStage;
          const isPast = index < currentIndex;

          return (
            <div key={stage.key} className="flex items-center flex-1">
              <button
                onClick={() => onStageClick(stage.key)}
                disabled={disabled}
                className={cn(
                  'flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all w-full group',
                  'hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive && 'bg-primary/10',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {/* Icon circle */}
                <div
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center transition-all border-2',
                    isActive && 'bg-primary border-primary text-primary-foreground shadow-md',
                    isPast && 'bg-primary/20 border-primary/40 text-primary',
                    !isActive && !isPast && 'bg-muted border-border text-muted-foreground group-hover:border-primary/30'
                  )}
                >
                  {isPast ? <Check className="h-4 w-4" /> : STAGE_ICONS[stage.key]}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    'text-xs font-medium text-center leading-tight',
                    isActive && 'text-primary',
                    isPast && 'text-primary/70',
                    !isActive && !isPast && 'text-muted-foreground'
                  )}
                >
                  {stage.label}
                </span>
              </button>

              {/* Connector line */}
              {index < JOURNEY_STAGES.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 w-4 flex-shrink-0 -mx-1',
                    isPast ? 'bg-primary/40' : 'bg-border'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
