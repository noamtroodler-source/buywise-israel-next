import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Phone, MessageCircle, Share2, Heart, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';

interface MobileQuickActionsProps {
  onCall?: () => void;
  onMessage?: () => void;
  onShare?: () => void;
  onFavorite?: () => void;
  isFavorited?: boolean;
  showAfterScroll?: number;
  className?: string;
}

/**
 * Floating quick action button for mobile property/project detail pages
 * Expands into a menu of actions on tap
 */
export function MobileQuickActions({
  onCall,
  onMessage,
  onShare,
  onFavorite,
  isFavorited = false,
  showAfterScroll = 200,
  className,
}: MobileQuickActionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { medium, light } = useHapticFeedback();
  const location = useLocation();

  // Show FAB after scrolling past threshold
  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > showAfterScroll);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showAfterScroll]);

  // Close when navigating away
  useEffect(() => {
    setIsExpanded(false);
  }, [location.pathname]);

  const handleToggle = () => {
    medium();
    setIsExpanded(!isExpanded);
  };

  const handleAction = (action?: () => void) => {
    light();
    action?.();
    setIsExpanded(false);
  };

  const actions = [
    { icon: Phone, label: 'Call', onClick: onCall, show: !!onCall },
    { icon: MessageCircle, label: 'Message', onClick: onMessage, show: !!onMessage },
    { icon: Share2, label: 'Share', onClick: onShare, show: !!onShare },
    { icon: Heart, label: isFavorited ? 'Saved' : 'Save', onClick: onFavorite, show: !!onFavorite, active: isFavorited },
  ].filter(a => a.show);

  if (actions.length === 0) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className={cn(
            "fixed bottom-20 right-4 z-40 md:hidden",
            className
          )}
        >
          {/* Expanded Actions */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-16 right-0 flex flex-col gap-2 items-end mb-2"
              >
                {actions.map((action, index) => (
                  <motion.div
                    key={action.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-2"
                  >
                    <span className="text-sm font-medium bg-background/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg border border-border">
                      {action.label}
                    </span>
                    <Button
                      variant="secondary"
                      size="icon"
                      className={cn(
                        "h-12 w-12 rounded-full shadow-lg",
                        action.active && "bg-primary text-primary-foreground hover:bg-primary/90"
                      )}
                      onClick={() => handleAction(action.onClick)}
                    >
                      <action.icon className={cn(
                        "h-5 w-5",
                        action.active && action.icon === Heart && "fill-current"
                      )} />
                    </Button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main FAB */}
          <Button
            size="icon"
            className={cn(
              "h-14 w-14 rounded-full shadow-xl transition-all duration-200",
              isExpanded 
                ? "bg-muted text-foreground hover:bg-muted/80" 
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
            onClick={handleToggle}
          >
            <motion.div
              animate={{ rotate: isExpanded ? 45 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {isExpanded ? (
                <X className="h-6 w-6" />
              ) : (
                <Phone className="h-6 w-6" />
              )}
            </motion.div>
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
