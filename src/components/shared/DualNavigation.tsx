import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DualNavigationProps {
  /** Label for the parent section link (e.g., "All Cities") */
  parentLabel: string;
  /** Path to the parent section (e.g., "/areas") */
  parentPath: string;
  /** Where to go if no browser history exists (defaults to parentPath) */
  fallbackPath?: string;
  /** Label for the back button (defaults to "Go back") */
  backLabel?: string;
  /** Additional className for the container */
  className?: string;
  /** Variant for different visual contexts */
  variant?: 'default' | 'overlay';
}

/**
 * DualNavigation provides two navigation options:
 * 1. A history-based "Go back" button that returns to the previous page
 * 2. A static link to the parent section for browsing similar items
 * 
 * This follows the industry pattern used by Zillow, Airbnb, etc.
 */
export function DualNavigation({
  parentLabel,
  parentPath,
  fallbackPath,
  backLabel = 'Go back',
  className,
  variant = 'default',
}: DualNavigationProps) {
  const navigate = useNavigate();

  // Check if there's meaningful history to go back to
  // history.length > 2 means there's at least one page before this one
  // (1 = new tab, 2 = direct navigation to this page)
  const canGoBack = typeof window !== 'undefined' && window.history.length > 2;

  const handleBack = () => {
    if (canGoBack) {
      navigate(-1);
    } else {
      navigate(fallbackPath || parentPath);
    }
  };

  const isOverlay = variant === 'overlay';

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4',
        isOverlay && 'text-white',
        className
      )}
    >
      {/* Left: Go back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBack}
        className={cn(
          '-ml-2 gap-1.5',
          isOverlay
            ? 'text-white/80 hover:text-white hover:bg-white/10'
            : 'hover:bg-primary/5'
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">{backLabel}</span>
        <span className="sm:hidden">Back</span>
      </Button>

      {/* Right: Parent section link */}
      <Link
        to={parentPath}
        className={cn(
          'flex items-center gap-1 text-sm font-medium transition-colors',
          isOverlay
            ? 'text-white/70 hover:text-white'
            : 'text-muted-foreground hover:text-primary'
        )}
      >
        {parentLabel}
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
