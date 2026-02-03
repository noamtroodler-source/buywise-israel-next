import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { X, PenTool, MapPin, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'buywise-map-hints-seen';

interface Hint {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const HINTS: Hint[] = [
  {
    id: 'draw',
    icon: <PenTool className="h-4 w-4" />,
    title: 'Draw to search',
    description: 'Use the draw tool to search a specific area on the map',
  },
  {
    id: 'saved',
    icon: <MapPin className="h-4 w-4" />,
    title: 'Commute times',
    description: 'Save your work and favorite places to see commute times',
  },
];

interface MapOnboardingHintsProps {
  visible?: boolean;
  hasSavedLocations?: boolean;
}

export function MapOnboardingHints({ 
  visible = true,
  hasSavedLocations = false,
}: MapOnboardingHintsProps) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [hasSeenHints, setHasSeenHints] = useState(true);

  // Check localStorage on mount
  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (seen) {
      setDismissed(JSON.parse(seen));
      setHasSeenHints(true);
    } else {
      setHasSeenHints(false);
    }
  }, []);

  const dismissHint = useCallback((hintId: string) => {
    setDismissed(prev => {
      const updated = [...prev, hintId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const dismissAll = useCallback(() => {
    const allIds = HINTS.map(h => h.id);
    setDismissed(allIds);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allIds));
  }, []);

  // Filter hints based on context
  const activeHints = HINTS.filter(hint => {
    // Don't show dismissed hints
    if (dismissed.includes(hint.id)) return false;
    // Don't show saved locations hint if user has saved locations
    if (hint.id === 'saved' && hasSavedLocations) return false;
    return true;
  });

  // Don't render if not visible or no hints to show
  if (!visible || activeHints.length === 0 || hasSeenHints) {
    return null;
  }

  return (
    <div className="absolute top-20 left-4 z-[1000] max-w-xs">
      <AnimatePresence>
        {activeHints.slice(0, 1).map((hint, index) => (
          <motion.div
            key={hint.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ delay: index * 0.2 }}
            className={cn(
              "bg-background border rounded-lg shadow-lg p-3 mb-2",
              "flex items-start gap-3"
            )}
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {hint.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-medium text-sm">{hint.title}</h4>
                <button
                  onClick={() => dismissHint(hint.id)}
                  className="text-muted-foreground hover:text-foreground p-0.5"
                  aria-label="Dismiss hint"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {hint.description}
              </p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {activeHints.length > 0 && (
        <button
          onClick={dismissAll}
          className="text-xs text-muted-foreground hover:text-foreground ml-11"
        >
          Don't show hints
        </button>
      )}
    </div>
  );
}
