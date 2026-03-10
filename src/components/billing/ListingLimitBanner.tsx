import { Link } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowUpRight } from 'lucide-react';
import { useListingLimitCheck } from '@/hooks/useListingLimitCheck';

interface ListingLimitBannerProps {
  entityType: 'agency' | 'developer';
}

export function ListingLimitBanner({ entityType }: ListingLimitBannerProps) {
  const { canCreate, currentCount, maxListings, isLoading, needsSubscription, nextTierName, overageRate, isOverLimit } = useListingLimitCheck(entityType);
  const sub = undefined; // We derive free status from nextTierName
  const isFreeAtLimit = !needsSubscription && nextTierName === 'Starter' && isOverLimit;

  if (isLoading || canCreate) return null;

  const listingLabel = entityType === 'developer' ? 'projects' : 'listings';

  return (
    <Alert className="bg-primary/5 border-primary/20 rounded-xl">
      <AlertTriangle className="h-4 w-4 text-primary" />
      <AlertTitle className="text-foreground">
        {needsSubscription ? 'Subscription Required' : 'Listing Limit Reached'}
      </AlertTitle>
      <AlertDescription className="text-muted-foreground space-y-2">
        {needsSubscription ? (
          <p>You need an active subscription to create {listingLabel}.</p>
        ) : (
          <>
            <p>You've used {currentCount}/{maxListings} {listingLabel} on your current plan.</p>
            {overageRate !== null && (
              <p className="text-sm">
                Publishing additional {listingLabel} would cost ~₪{overageRate}/{entityType === 'developer' ? 'project' : 'listing'}/month.
              </p>
            )}
          </>
        )}
        <div className="mt-2">
          <Button size="sm" asChild className="rounded-xl">
            <Link to="/pricing">
              <ArrowUpRight className="h-4 w-4 mr-1.5" />
              {needsSubscription
                ? 'View Plans'
                : nextTierName
                ? `Upgrade to ${nextTierName}`
                : 'Upgrade Plan'}
            </Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
