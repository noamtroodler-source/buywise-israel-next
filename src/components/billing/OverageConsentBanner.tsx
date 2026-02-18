import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertTriangle, ArrowUpRight, TrendingUp } from 'lucide-react';
import { useOverageRate } from '@/hooks/useOverageRecords';
import { useListingLimitCheck } from '@/hooks/useListingLimitCheck';

interface OverageConsentBannerProps {
  entityType: 'agency' | 'developer';
  /** Called when user toggles consent — parent uses this to gate the submit button */
  onConsentChange: (accepted: boolean) => void;
}

export function OverageConsentBanner({ entityType, onConsentChange }: OverageConsentBannerProps) {
  const [accepted, setAccepted] = useState(false);
  const resourceType = entityType === 'developer' ? 'project' : 'listing';
  const { canCreate, isOverLimit, currentCount, maxListings, isLoading, needsSubscription, nextTierName } = useListingLimitCheck(entityType);
  const { data: liveRate } = useOverageRate(entityType, resourceType);

  const listingLabel = entityType === 'developer' ? 'projects' : 'listings';
  const singularLabel = entityType === 'developer' ? 'project' : 'listing';

  // Hard block: no subscription
  if (needsSubscription) {
    return (
      <Alert className="bg-primary/5 border-primary/20 rounded-xl">
        <AlertTriangle className="h-4 w-4 text-primary" />
        <AlertTitle className="text-foreground">Subscription Required</AlertTitle>
        <AlertDescription className="text-muted-foreground space-y-2">
          <p>You need an active subscription to create {listingLabel}.</p>
          <div className="mt-2">
            <Button size="sm" asChild className="rounded-xl">
              <Link to="/pricing">
                <ArrowUpRight className="h-4 w-4 mr-1.5" />
                View Plans
              </Link>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Not over limit — nothing to show
  if (isLoading || !isOverLimit) return null;

  const overageUnits = maxListings !== null ? Math.max(0, currentCount - maxListings + 1) : 1;
  const rate = liveRate ?? (entityType === 'developer' ? 500 : 150);
  const estimatedCharge = overageUnits * rate;

  const handleChange = (checked: boolean) => {
    setAccepted(checked);
    onConsentChange(checked);
  };

  return (
    <Alert className="bg-amber-500/10 border-amber-500/30 rounded-xl">
      <TrendingUp className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-foreground">You're over your plan limit</AlertTitle>
      <AlertDescription className="text-muted-foreground space-y-3">
        <p>
          You've used <strong className="text-foreground">{currentCount}/{maxListings}</strong> {listingLabel} on your current plan.
          Adding this {singularLabel} will incur an overage charge.
        </p>
        <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
          Estimated overage: {overageUnits} × ₪{rate} = <strong>₪{estimatedCharge}</strong> / month
        </p>
        <p className="text-xs text-muted-foreground">
          This will appear on your next monthly statement.
        </p>

        <div className="flex items-start gap-2 pt-1">
          <Checkbox
            id="overage-consent"
            checked={accepted}
            onCheckedChange={handleChange}
            className="mt-0.5"
          />
          <Label htmlFor="overage-consent" className="text-sm text-foreground cursor-pointer leading-snug">
            I understand and accept the overage charge of ₪{estimatedCharge}/month for this {singularLabel}.
          </Label>
        </div>

        {nextTierName && (
          <div className="pt-1">
            <Button size="sm" variant="outline" asChild className="rounded-xl text-xs h-8">
              <Link to="/pricing">
                <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
                Upgrade to {nextTierName} to avoid overages
              </Link>
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
