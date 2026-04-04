/**
 * ClaimableListingsBanner
 *
 * Shown on the agency dashboard when there are unclaimed listings
 * in the agency's operating cities that the agency can claim.
 * 
 * Logic: find published, unclaimed, sourced properties in the cities
 * this agency covers — show a count and link to claim them.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Building2, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ClaimableListingsBannerProps {
  agencyId: string;
  citiesCovered?: string[] | null;
}

export function ClaimableListingsBanner({ agencyId, citiesCovered }: ClaimableListingsBannerProps) {
  const { data: claimableCount = 0 } = useQuery({
    queryKey: ['claimable-listings-count', agencyId, citiesCovered],
    queryFn: async () => {
      let q = supabase
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .eq('is_published', true)
        .eq('is_claimed', false)
        .not('import_source', 'is', null);

      if (citiesCovered && citiesCovered.length > 0) {
        q = q.in('city', citiesCovered);
      }

      const { count, error } = await q;
      if (error) return 0;
      return count ?? 0;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: sampleListings = [] } = useQuery({
    queryKey: ['claimable-listings-sample', agencyId, citiesCovered],
    queryFn: async () => {
      let q = supabase
        .from('properties')
        .select('id, title, city, neighborhood, price, bedrooms, size_sqm, import_source')
        .eq('is_published', true)
        .eq('is_claimed', false)
        .not('import_source', 'is', null)
        .limit(3);

      if (citiesCovered && citiesCovered.length > 0) {
        q = q.in('city', citiesCovered);
      }

      const { data, error } = await q;
      if (error) return [];
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Don't show if no claimable listings
  if (claimableCount === 0) return null;

  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {claimableCount} listing{claimableCount > 1 ? 's' : ''} in your area may be yours
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            We found properties sourced from Yad2 and agency sites in your cities. 
            Claim them to add photos, receive buyer inquiries, and own your listings on BuyWiseIsrael.
          </p>
        </div>
      </div>

      {/* Sample listings */}
      {sampleListings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pl-12">
          {sampleListings.map((listing: any) => (
            <Link
              key={listing.id}
              to={`/property/${listing.id}`}
              className="rounded-lg border border-border bg-white p-3 hover:border-primary/30 hover:shadow-sm transition-all text-left"
            >
              <p className="text-xs font-medium text-foreground truncate">{listing.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {listing.city}{listing.neighborhood ? ` · ${listing.neighborhood}` : ''}
              </p>
              {listing.price > 0 && (
                <p className="text-xs font-semibold text-primary mt-1">
                  ₪{(listing.price / 1_000_000).toFixed(1)}M
                </p>
              )}
              <div className="mt-1.5">
                <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                  <Building2 className="w-2.5 h-2.5" />
                  Unclaimed
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="flex gap-2 pl-12">
        <Button asChild size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary/5">
          <Link to={`/listings?sourced_only=true`}>
            Browse all {claimableCount} listings
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
