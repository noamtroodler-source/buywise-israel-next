import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface JourneyStageProps {
  number: number;
  title: string;
  children: ReactNode;
}

export function JourneyStage({ number, title, children }: JourneyStageProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: number * 0.1 }}
      className="relative"
    >
      {/* Stage Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
          {number}
        </div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Stage Content */}
      <div className="grid md:grid-cols-2 gap-5">
        {children}
      </div>
    </motion.section>
  );
}
