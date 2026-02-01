import { Link } from 'react-router-dom';
import { Lightbulb, ArrowRight, type LucideIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface GuestSignupNudgeProps {
  icon?: LucideIcon;
  message: string;
  ctaText?: string;
  variant?: 'inline' | 'banner' | 'card';
  intent?: string;
  className?: string;
}

/**
 * A subtle, value-focused signup nudge that only displays for guests.
 * Used throughout the app to gently encourage account creation.
 */
export function GuestSignupNudge({
  icon: Icon = Lightbulb,
  message,
  ctaText = 'Create free account',
  variant = 'banner',
  intent,
  className,
}: GuestSignupNudgeProps) {
  const { user } = useAuth();
  
  // Build the auth URL with optional intent
  const authUrl = `/auth?tab=signup${intent ? `&intent=${intent}` : ''}`;
  
  // Only show to guests
  if (user) return null;

  if (variant === 'inline') {
    return (
      <p className={cn('text-xs text-muted-foreground flex items-center gap-1.5', className)}>
        <Icon className="h-3 w-3 shrink-0" />
        <span>{message}</span>
        <Link 
          to={authUrl} 
          className="text-primary hover:underline inline-flex items-center gap-0.5"
        >
          {ctaText}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </p>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn(
        'p-4 rounded-xl bg-muted/30 border border-border/50 space-y-2',
        className
      )}>
        <div className="flex items-start gap-2">
          <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            {message}
          </p>
        </div>
        <Link 
          to={authUrl}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {ctaText}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  // Default: banner variant
  return (
    <div className={cn(
      'flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-primary/5 border border-primary/10',
      className
    )}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4 text-primary shrink-0" />
        <span>{message}</span>
      </div>
      <Link 
        to={authUrl}
        className="text-sm font-medium text-primary hover:underline whitespace-nowrap flex items-center gap-1"
      >
        {ctaText}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
