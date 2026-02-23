import { Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface MapLoadingIndicatorProps {
  visible: boolean;
}

export function MapLoadingIndicator({ visible }: MapLoadingIndicatorProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
        >
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-sm text-xs font-medium text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Updating…
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
