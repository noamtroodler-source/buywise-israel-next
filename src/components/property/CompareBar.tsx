import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCompare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompare } from '@/contexts/CompareContext';

export function CompareBar() {
  const { compareIds, clearCompare } = useCompare();

  if (compareIds.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg"
      >
        <div className="container py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <GitCompare className="h-4 w-4 text-primary" />
              <span>{compareIds.length} {compareIds.length === 1 ? 'property' : 'properties'} selected</span>
            </div>
            <div className="hidden sm:flex items-center gap-1">
              {compareIds.slice(0, 4).map((id, index) => (
                <div 
                  key={id} 
                  className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground"
                >
                  {index + 1}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCompare}
              className="text-muted-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
            <Button asChild size="sm" disabled={compareIds.length < 2}>
              <Link to="/compare">
                Compare Now
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
