import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface ClearDrawingButtonProps {
  visible: boolean;
  onClear: () => void;
}

export function ClearDrawingButton({ visible, onClear }: ClearDrawingButtonProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]"
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={onClear}
            className="bg-white shadow-lg border border-border hover:bg-destructive hover:text-destructive-foreground hover:border-destructive gap-1.5 px-3"
          >
            <X className="h-3.5 w-3.5" />
            Clear drawn area
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
