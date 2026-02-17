import { Link } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowUpRight } from 'lucide-react';
import { useListingLimitCheck } from '@/hooks/useListingLimitCheck';

interface ListingLimitBannerProps {
  entityType: 'agency' | 'developer';
}

export function ListingLimitBanner({ entityType }: ListingLimitBannerProps) {
  const { canCreate, currentCount, maxListings, isLoading, needsSubscription } = useListingLimitCheck(entityType);

  if (isLoading || canCreate) return null;

  return (
    <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 rounded-xl">
      <ShieldAlert className="h-4 w-4" />
      <AlertTitle className="text-foreground">
        {needsSubscription ? 'Subscription Required' : 'Listing Limit Reached'}
      </AlertTitle>
      <AlertDescription className="text-muted-foreground">
        {needsSubscription
          ? 'You need an active subscription to create listings.'
          : `You've used ${currentCount} of ${maxListings} listings on your current plan.`}
        <div className="mt-2">
          <Button size="sm" asChild className="rounded-xl">
            <Link to="/pricing">
              <ArrowUpRight className="h-4 w-4 mr-1.5" />
              {needsSubscription ? 'View Plans' : 'Upgrade Plan'}
            </Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
