import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Database, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TableStats {
  name: string;
  count: number;
  label: string;
  description: string;
  isActive: boolean;
}

export function DataHealthCard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['data-health-stats'],
    queryFn: async () => {
      const [
        userEventsRes,
        searchAnalyticsRes,
        listingLifecycleRes,
        advertiserActivityRes,
        propertyViewsRes,
        propertyInquiriesRes,
        recentlyViewedRes,
      ] = await Promise.all([
        supabase.from('user_events').select('id', { count: 'exact', head: true }),
        supabase.from('search_analytics').select('id', { count: 'exact', head: true }),
        supabase.from('listing_lifecycle').select('id', { count: 'exact', head: true }),
        supabase.from('advertiser_activity').select('id', { count: 'exact', head: true }),
        supabase.from('property_views').select('id', { count: 'exact', head: true }),
        supabase.from('property_inquiries').select('id', { count: 'exact', head: true }),
        supabase.from('recently_viewed').select('id', { count: 'exact', head: true }),
      ]);

      return {
        userEvents: userEventsRes.count || 0,
        searchAnalytics: searchAnalyticsRes.count || 0,
        listingLifecycle: listingLifecycleRes.count || 0,
        advertiserActivity: advertiserActivityRes.count || 0,
        propertyViews: propertyViewsRes.count || 0,
        propertyInquiries: propertyInquiriesRes.count || 0,
        recentlyViewed: recentlyViewedRes.count || 0,
      };
    },
    staleTime: 30000,
  });

  const tables: TableStats[] = [
    {
      name: 'user_events',
      count: stats?.userEvents || 0,
      label: 'User Events',
      description: 'Click, scroll, navigation events',
      isActive: (stats?.userEvents || 0) > 0,
    },
    {
      name: 'search_analytics',
      count: stats?.searchAnalytics || 0,
      label: 'Search Analytics',
      description: 'Search queries and conversions',
      isActive: (stats?.searchAnalytics || 0) > 0,
    },
    {
      name: 'listing_lifecycle',
      count: stats?.listingLifecycle || 0,
      label: 'Listing Lifecycle',
      description: 'Days on market, price changes',
      isActive: (stats?.listingLifecycle || 0) > 0,
    },
    {
      name: 'advertiser_activity',
      count: stats?.advertiserActivity || 0,
      label: 'Advertiser Activity',
      description: 'Agent/developer dashboard actions',
      isActive: (stats?.advertiserActivity || 0) > 0,
    },
    {
      name: 'property_views',
      count: stats?.propertyViews || 0,
      label: 'Property Views',
      description: 'Property page views',
      isActive: (stats?.propertyViews || 0) > 0,
    },
    {
      name: 'property_inquiries',
      count: stats?.propertyInquiries || 0,
      label: 'Property Inquiries',
      description: 'Contact form submissions',
      isActive: (stats?.propertyInquiries || 0) > 0,
    },
  ];

  const activeCount = tables.filter(t => t.isActive).length;
  const totalCount = tables.length;

  return (
    <Card className="rounded-2xl border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="h-5 w-5 text-primary" />
            Data Health Monitor
          </CardTitle>
          <Badge 
            variant={activeCount === totalCount ? "default" : "secondary"}
            className={cn(
              activeCount === totalCount 
                ? "bg-primary/10 text-primary" 
                : "bg-muted text-muted-foreground"
            )}
          >
            {activeCount}/{totalCount} Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {tables.map((table) => (
              <div
                key={table.name}
                className={cn(
                  "p-3 rounded-xl border transition-colors",
                  table.isActive 
                    ? "border-primary/20 bg-primary/5" 
                    : "border-border bg-muted/30"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  {table.isActive ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium text-foreground">
                    {table.label}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={cn(
                    "text-2xl font-bold",
                    table.isActive ? "text-primary" : "text-muted-foreground"
                  )}>
                    {table.count.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground">records</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {table.description}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Summary Message */}
        <div className="mt-4 p-3 rounded-xl bg-muted/50 flex items-start gap-3">
          <Activity className="h-5 w-5 text-primary mt-0.5" />
          <div className="text-sm">
            {activeCount === totalCount ? (
              <p className="text-foreground">
                <span className="font-medium text-primary">All tracking systems active.</span>{' '}
                Data is flowing into all analytics tables.
              </p>
            ) : (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">{totalCount - activeCount} tracking systems pending.</span>{' '}
                Some tables are empty - tracking hooks may need integration or user activity is required.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
