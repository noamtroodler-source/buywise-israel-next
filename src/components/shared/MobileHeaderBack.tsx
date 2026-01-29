import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';

interface MobileHeaderBackProps {
  title?: string;
  subtitle?: string;
  showShare?: boolean;
  onShare?: () => void;
  className?: string;
}

/**
 * Mobile header with back button for detail pages
 * Sticks to top and provides consistent navigation
 */
export function MobileHeaderBack({
  title,
  subtitle,
  showShare = false,
  onShare,
  className,
}: MobileHeaderBackProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { light } = useHapticFeedback();

  const handleBack = () => {
    light();
    // Check if we have history to go back to
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      // Fallback to appropriate listing page
      if (location.pathname.includes('/projects/')) {
        navigate('/projects');
      } else if (location.pathname.includes('/property/')) {
        navigate('/listings');
      } else {
        navigate('/');
      }
    }
  };

  const handleShare = () => {
    light();
    onShare?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "sticky top-16 z-30 bg-background/95 backdrop-blur-sm border-b border-border md:hidden -mx-4 px-4 py-3",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full shrink-0"
          onClick={handleBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {(title || subtitle) && (
          <div className="flex-1 min-w-0 text-center">
            {title && (
              <p className="text-sm font-medium text-foreground truncate">
                {title}
              </p>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {showShare ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full shrink-0"
            onClick={handleShare}
          >
            <Share2 className="h-5 w-5" />
          </Button>
        ) : (
          <div className="w-10" /> // Spacer to center title
        )}
      </div>
    </motion.div>
  );
}
