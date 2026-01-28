import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Save, User, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';

interface SaveResultsPromptProps {
  show: boolean;
  calculatorName: string;
  onDismiss: () => void;
  resultSummary?: string;
}

export function SaveResultsPrompt({ show, calculatorName, onDismiss, resultSummary }: SaveResultsPromptProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed state when show changes
  useEffect(() => {
    if (show) {
      setDismissed(false);
    }
  }, [show]);

  // Don't show if user is logged in or already dismissed
  if (user || dismissed || !show) return null;

  const handleSignUp = () => {
    navigate('/auth?tab=signup&intent=save_calculation');
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50"
      >
        <div className="bg-card border border-border shadow-xl rounded-xl p-4 relative">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Save className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 pr-4">
              <h4 className="font-medium text-foreground text-sm">
                Save your {calculatorName} results?
              </h4>
              {resultSummary && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {resultSummary}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Create an account to save calculations, set alerts, and track favorites.
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 mt-3">
            <Button 
              size="sm" 
              onClick={handleSignUp}
              className="flex-1 gap-1.5"
            >
              <User className="h-3.5 w-3.5" />
              Sign Up Free
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={handleDismiss}
              className="text-muted-foreground"
            >
              Later
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
