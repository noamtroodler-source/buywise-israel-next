import { motion } from 'framer-motion';
import { Compass, Search, FileCheck, Key } from 'lucide-react';

export interface JourneyStage {
  key: string;
  label: string;
  description: string;
  icon: typeof Compass;
}

export const journeyStages: JourneyStage[] = [
  { 
    key: 'before_start', 
    label: 'Before You Start', 
    description: 'Basic terms everyone should know',
    icon: Compass 
  },
  { 
    key: 'during_research', 
    label: 'During Research', 
    description: 'Terms in listings & viewings',
    icon: Search 
  },
  { 
    key: 'making_offer', 
    label: 'Making an Offer', 
    description: 'Contract & negotiation terms',
    icon: FileCheck 
  },
  { 
    key: 'closing_after', 
    label: 'Closing & After', 
    description: 'Registration & ownership terms',
    icon: Key 
  },
];

interface JourneySelectorProps {
  activeStage: string | null;
  onStageClick: (stageKey: string | null) => void;
}

export function JourneySelector({ activeStage, onStageClick }: JourneySelectorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="container pb-6"
    >
      <p className="text-sm text-muted-foreground mb-3 text-center">Where are you in your journey?</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 max-w-3xl mx-auto">
        {journeyStages.map((stage) => {
          const Icon = stage.icon;
          const isActive = activeStage === stage.key;
          
          return (
            <button 
              key={stage.key}
              onClick={() => onStageClick(isActive ? null : stage.key)}
              className={`p-3 md:p-4 rounded-xl border transition-all text-left group ${
                isActive 
                  ? 'border-primary bg-primary/5 shadow-sm' 
                  : 'border-border bg-card hover:border-primary/50 hover:bg-card/80'
              }`}
            >
              <Icon className={`h-4 w-4 md:h-5 md:w-5 mb-1.5 md:mb-2 transition-transform group-hover:scale-110 ${
                isActive ? 'text-primary' : 'text-primary/70'
              }`} />
              <p className={`font-medium text-xs md:text-sm ${
                isActive ? 'text-primary' : 'text-foreground'
              }`}>
                {stage.label}
              </p>
              <p className="text-[10px] md:text-xs text-muted-foreground leading-snug">
                {stage.description}
              </p>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
