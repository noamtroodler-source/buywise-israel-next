import { Info, CheckCircle2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface GuestAssumptionsBannerProps {
  /** The derived buyer type label (e.g., "First-Time Buyer") */
  buyerTypeLabel: string;
  /** Whether mortgage is included */
  includeMortgage: boolean;
  /** Whether user is logged in */
  isLoggedIn: boolean;
  /** Whether user has completed their profile */
  hasCompletedProfile: boolean;
  /** Optional: Potential savings amount for Oleh teaser */
  potentialSavings?: number;
  /** Optional: Benefit summary for the current buyer type (e.g., tax exemption info) */
  benefitSummary?: string;
  /** Compact mode for tighter layouts */
  compact?: boolean;
  className?: string;
}

/**
 * GuestAssumptionsBanner
 * 
 * Shows different messaging based on user state:
 * - Guests: "Showing estimates for: First-Time Buyer, Paying in Full" with signup CTA
 * - Signed-In (incomplete profile): Similar to guest with "complete profile" CTA
 * - Signed-In (complete profile): "Personalized for You" with confidence messaging
 */
export function GuestAssumptionsBanner({
  buyerTypeLabel,
  includeMortgage,
  isLoggedIn,
  hasCompletedProfile,
  potentialSavings,
  benefitSummary,
  compact = false,
  className,
}: GuestAssumptionsBannerProps) {
  // Signed-in user with complete profile - show confidence banner
  if (isLoggedIn && hasCompletedProfile) {
    return (
      <div 
        className={cn(
          "flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20",
          compact && "p-2",
          className
        )}
      >
        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground">
              Personalized for You
            </span>
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
              {buyerTypeLabel}
            </Badge>
          </div>
          {!compact && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {includeMortgage 
                ? 'Mortgage estimates reflect your saved preferences' 
                : 'Calculated for cash purchase as per your settings'}
            </p>
          )}
        </div>
        <Link 
          to="/profile?tab=settings"
          className="text-xs text-primary hover:underline shrink-0"
        >
          Edit
        </Link>
      </div>
    );
  }

  // Guest or incomplete profile - show assumptions banner
  const financingLabel = includeMortgage ? 'with mortgage' : 'Paid in Full';
  
  return (
    <div className={cn("space-y-2", className)}>
      {/* Main assumptions banner */}
      <div 
        className={cn(
          "flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border/50",
          compact && "p-2"
        )}
      >
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground">
            Showing estimates for:{' '}
            <span className="font-medium text-foreground">{buyerTypeLabel}</span>
            <span className="mx-1 text-muted-foreground/50">·</span>
            <span className="font-medium text-foreground">{financingLabel}</span>
          </p>
          {/* Benefit context for the buyer type */}
          {benefitSummary && !compact && (
            <p className="text-xs text-muted-foreground mt-1">
              {benefitSummary}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Your situation different?{' '}
            <Link 
              to={isLoggedIn ? "/profile?tab=settings" : "/auth?tab=signup&intent=set_profile"}
              className="text-primary hover:underline"
            >
              {isLoggedIn ? 'Complete your profile' : 'Set up profile (free)'}
            </Link>
          </p>
        </div>
      </div>
      
      {/* Optional Oleh savings teaser - only show for guests when significant savings exist */}
      {!isLoggedIn && potentialSavings && potentialSavings >= 30000 && !compact && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-accent/30 border border-accent/50">
          <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              Are you a new immigrant (Oleh Hadash)?
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              You could save ₪{potentialSavings.toLocaleString()}+ in purchase tax.{' '}
              <Link 
                to="/auth?tab=signup&intent=set_profile"
                className="text-primary hover:underline"
              >
                Create profile to see your real costs
              </Link>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
