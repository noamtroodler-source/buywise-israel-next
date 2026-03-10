import { useState, useMemo } from 'react';
import { Star, Loader2, Crown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAgencyListingsManagement, type AgencyListing } from '@/hooks/useAgencyListings';
import {
  useFeaturedListings,
  useFoundingPartnerStatus,
  useToggleFeaturedListing,
} from '@/hooks/useFeaturedListings';
import { format } from 'date-fns';
import { FeaturedFAQ } from './FeaturedFAQ';

const FEATURED_PRICE_ILS = 299;

interface FeaturedListingsManagerProps {
  agencyId: string;
}

export function FeaturedListingsManager({ agencyId }: FeaturedListingsManagerProps) {
  const { data: listings = [], isLoading: listingsLoading } = useAgencyListingsManagement(agencyId);
  const { data: featuredListings = [], isLoading: featuredLoading } = useFeaturedListings(agencyId);
  const { data: foundingStatus } = useFoundingPartnerStatus(agencyId);
  const toggleMutation = useToggleFeaturedListing();

  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'activate' | 'deactivate';
    listing: AgencyListing | null;
    useFreeCredit: boolean;
  }>({ open: false, action: 'activate', listing: null, useFreeCredit: false });

  // Only show published/approved listings
  const publishedListings = listings.filter(
    (l) => l.verification_status === 'approved'
  );

  const filteredListings = useMemo(() => {
    if (!searchQuery.trim()) return publishedListings;
    const q = searchQuery.toLowerCase();
    return publishedListings.filter(
      (l) =>
        l.title?.toLowerCase().includes(q) ||
        l.city?.toLowerCase().includes(q)
    );
  }, [publishedListings, searchQuery]);

  // Map of property_id -> featured listing
  const featuredMap = new Map(
    featuredListings.map((fl) => [fl.property_id, fl])
  );

  // Compute summary
  const paidFeaturedCount = featuredListings.filter((fl) => !fl.is_free_credit).length;
  const freeFeaturedCount = featuredListings.filter((fl) => fl.is_free_credit).length;
  const totalMonthlyCost = paidFeaturedCount * FEATURED_PRICE_ILS;

  const hasFreeCredits = (foundingStatus?.freeCreditsRemaining ?? 0) > 0;

  const handleToggle = (listing: AgencyListing) => {
    const isFeatured = featuredMap.has(listing.id);
    const useFreeCredit = !isFeatured && hasFreeCredits;

    setConfirmDialog({
      open: true,
      action: isFeatured ? 'deactivate' : 'activate',
      listing,
      useFreeCredit,
    });
  };

  const handleConfirm = () => {
    if (!confirmDialog.listing) return;

    toggleMutation.mutate({
      agencyId,
      propertyId: confirmDialog.listing.id,
      action: confirmDialog.action,
      useFreeCredit: confirmDialog.useFreeCredit,
      creditRowId: foundingStatus?.currentCreditRow?.id,
      currentCreditsUsed: foundingStatus?.currentCreditRow?.credits_used,
    });

    setConfirmDialog({ open: false, action: 'activate', listing: null, useFreeCredit: false });
  };

  if (listingsLoading || featuredLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="rounded-2xl border-primary/10 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {featuredListings.length} Featured Listing{featuredListings.length !== 1 ? 's' : ''}
                </p>
                <p className="text-sm text-muted-foreground">
                  Monthly total: ₪{totalMonthlyCost.toLocaleString()}/mo
                  {freeFeaturedCount > 0 && (
                    <span className="ml-1 text-primary">
                      ({freeFeaturedCount} free credit{freeFeaturedCount !== 1 ? 's' : ''})
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Founding Partner Credits */}
      {foundingStatus?.isFoundingPartner && (
        <Card className="rounded-2xl border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
          <CardContent className="p-4 flex items-center gap-3">
            <Crown className="h-5 w-5 text-accent flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Founding Partner</p>
              <p className="text-sm text-muted-foreground">
                {foundingStatus.freeCreditsRemaining} of {foundingStatus.freeCreditsTotal} free featured credits remaining this month
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FAQ */}
      <FeaturedFAQ />

      {/* Listings Table */}
      <Card className="rounded-2xl border-primary/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Your Published Listings</CardTitle>
          {publishedListings.length > 3 && (
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 rounded-xl text-sm"
              />
            </div>
          )}
        </CardHeader>
        <CardContent>
          {publishedListings.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">
              No published listings yet. Listings must be approved before they can be featured.
            </p>
          ) : filteredListings.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">
              No listings match &ldquo;{searchQuery}&rdquo;
            </p>
          ) : (
            <div className="divide-y divide-border/50">
              {filteredListings.map((listing) => {
                const featured = featuredMap.get(listing.id);
                const isFeatured = !!featured;

                return (
                  <div
                    key={listing.id}
                    className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="h-14 w-14 rounded-xl bg-muted/50 overflow-hidden flex-shrink-0">
                      {listing.images?.[0] ? (
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
                          No img
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{listing.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{listing.city}</p>
                      {isFeatured && featured && (
                        <p className="text-xs text-primary mt-0.5">
                          Featured since {format(new Date(featured.started_at), 'MMM d, yyyy')}
                          {featured.is_free_credit && (
                            <Badge variant="outline" className="ml-2 text-[10px] py-0 h-4 border-accent/30 text-accent">
                              Free Credit
                            </Badge>
                          )}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {!isFeatured && (
                        <span className="text-xs text-muted-foreground hidden sm:block">
                          {hasFreeCredits ? 'Free Credit' : `₪${FEATURED_PRICE_ILS}/mo`}
                        </span>
                      )}
                      <Switch
                        checked={isFeatured}
                        onCheckedChange={() => handleToggle(listing)}
                        disabled={toggleMutation.isPending}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          !open && setConfirmDialog({ open: false, action: 'activate', listing: null, useFreeCredit: false })
        }
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === 'activate' ? 'Feature This Listing?' : 'Remove Featured Status?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === 'activate' ? (
                confirmDialog.useFreeCredit ? (
                  <>
                    This will use one of your founding partner free credits to feature{' '}
                    <strong>{confirmDialog.listing?.title}</strong>. No charge this month.
                  </>
                ) : (
                  <>
                    Featuring <strong>{confirmDialog.listing?.title}</strong> costs{' '}
                    <strong>₪{FEATURED_PRICE_ILS}/month</strong>. The listing will appear with a "Featured" badge
                    across the platform and receive priority placement in search results.
                  </>
                )
              ) : (
                <>
                  <strong>{confirmDialog.listing?.title}</strong> will immediately lose its "Featured" badge and
                  priority placement. You can re-feature it at any time.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} className="rounded-xl">
              {confirmDialog.action === 'activate'
                ? confirmDialog.useFreeCredit
                  ? 'Use Free Credit'
                  : `Feature — ₪${FEATURED_PRICE_ILS}/mo`
                : 'Remove Featured'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
