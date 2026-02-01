import { Link } from 'react-router-dom';
import { BarChart3, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface InlineSignupCardProps {
  className?: string;
}

/**
 * A subtle signup card for calculator result areas.
 * Encourages guests to create an account to save their calculations.
 */
export function InlineSignupCard({ className }: InlineSignupCardProps) {
  const { user } = useAuth();
  
  // Only show to guests
  if (user) return null;

  return (
    <div className={cn(
      'p-4 rounded-xl bg-muted/30 border border-border/50 space-y-3',
      className
    )}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <BarChart3 className="h-4 w-4 text-primary" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            Want to save this calculation?
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Create a free account to save results, compare scenarios, and pick up where you left off on any device.
          </p>
        </div>
      </div>
      <Link 
        to="/auth?tab=signup&intent=save_calculation"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        Create free account
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
