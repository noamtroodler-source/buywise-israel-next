import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
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
 * DualNavigation provides two navigation options grouped on the left:
 * 1. A history-based "Go back" button (primary) that returns to the previous page
 * 2. A static link to the parent section (secondary) for browsing similar items
 * 
 * This follows the industry pattern used by Amazon, YouTube, etc.
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
        'flex items-center gap-2',
        isOverlay && 'text-white',
        className
      )}
    >
      {/* Primary: Go back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBack}
        className={cn(
          '-ml-2 gap-1.5',
          isOverlay
            ? 'text-white/90 hover:text-white hover:bg-white/10'
            : 'hover:bg-primary/5'
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">{backLabel}</span>
        <span className="sm:hidden">Back</span>
      </Button>

      {/* Separator */}
      <span
        className={cn(
          'text-sm',
          isOverlay ? 'text-white/40' : 'text-muted-foreground/40'
        )}
      >
        ·
      </span>

      {/* Secondary: Parent section link */}
      <Link
        to={parentPath}
        className={cn(
          'text-sm transition-colors',
          isOverlay
            ? 'text-white/60 hover:text-white'
            : 'text-muted-foreground/70 hover:text-foreground'
        )}
      >
        {parentLabel}
      </Link>
    </div>
  );
}
