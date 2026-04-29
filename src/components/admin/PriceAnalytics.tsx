import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, TrendingUp, Home, Building, BadgeCheck, AlertTriangle, Gauge, MousePointerClick, ShieldCheck, EyeOff, ArrowRight, Ruler, FileWarning, Wrench } from 'lucide-react';
import { PriceAnalyticsData } from '@/hooks/usePriceAnalytics';
import { usePriceContextBlockers } from '@/hooks/useListingReview';
import { exportToCSV } from '@/lib/csvExport';
import { 
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, 
  Tooltip, Cell, PieChart, Pie 
} from 'recharts';

interface PriceAnalyticsProps {
  data: PriceAnalyticsData | undefined;
  isLoading?: boolean;
}

// BuyWise brand-compliant palette (blue tones only)
const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(var(--secondary))',
  'hsl(var(--muted))',
  'hsl(var(--border))',
  'hsl(var(--muted-foreground))',
];

export function PriceAnalytics({ data, isLoading }: PriceAnalyticsProps) {
  const { data: blockers = [], isLoading: blockersLoading } = usePriceContextBlockers();

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-border/50">
        <CardHeader>
          <CardTitle>Price Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `₪${(price / 1000000).toFixed(1)}M`;
    }
    return `₪${(price / 1000).toFixed(0)}K`;
  };

  const formatLabel = (value: string) => value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

  const context = data?.priceContext;
  const hasContextData = Boolean(context && (context.totalListings > 0 || context.moduleViews > 0));
  const exportPriceContextCsv = () => {
    if (!context) return;
    exportToCSV('price-context-kpis.csv', ['Metric', 'Value'], [
      ['Context complete rate', `${context.completionRate.toFixed(1)}%`],
      ['Module views', String(context.moduleViews)],
      ['Details open rate', `${context.detailsOpenRate.toFixed(1)}%`],
      ['Comparable views', String(context.comparableViews)],
      ['Saves after context view', String(context.savesAfterContextView)],
      ['Context inquiry conversion rate', `${context.inquiryConversionRate.toFixed(1)}%`],
      ['Trust helpful rate', `${context.helpfulFeedbackRate.toFixed(1)}%`],
      ['Premium context completion rate', `${context.premiumContextCompletionRate.toFixed(1)}%`],
      ['Benchmark review request rate', `${context.benchmarkReviewRequestRate.toFixed(1)}%`],
      ['Unknown sqm source rate', `${context.unknownSqmSourceRate.toFixed(1)}%`],
      ['Unknown ownership rate', `${context.unknownOwnershipRate.toFixed(1)}%`],
    ]);
  };
  const contextCards = [
    { label: 'Context Complete', value: `${(context?.completionRate || 0).toFixed(0)}%`, sub: `${context?.complete || 0} of ${context?.totalListings || 0} active listings`, icon: BadgeCheck },
    { label: 'Ranking Ready', value: `${(context?.rankingReadinessRate || 0).toFixed(0)}%`, sub: `${context?.rankingReady || 0} safe to prioritize`, icon: ShieldCheck },
    { label: 'Under Review', value: (context?.underReview || 0).toLocaleString(), sub: 'Agent benchmark challenges', icon: AlertTriangle },
    { label: 'Price Context Views', value: (context?.moduleViews || 0).toLocaleString(), sub: `${context?.buyerQuestionEngagements || 0} question interactions`, icon: MousePointerClick },
  ];

  const healthCards = [
    { label: 'High-gap listings', value: (context?.highGapListings || 0).toLocaleString(), sub: `${(context?.highGapRate || 0).toFixed(0)}% of active sale listings`, icon: FileWarning },
    { label: 'Unknown sqm source', value: `${(context?.unknownSqmSourceRate || 0).toFixed(0)}%`, sub: `${context?.unknownSqmSource || 0} listings need size-source cleanup`, icon: Ruler },
    { label: 'Unknown ownership', value: `${(context?.unknownOwnershipRate || 0).toFixed(0)}%`, sub: `${context?.unknownOwnership || 0} listings need ownership context`, icon: ShieldCheck },
    { label: 'Admin corrections', value: (context?.adminCorrectionEvents || 0).toLocaleString(), sub: `${(context?.adminCorrectionRate || 0).toFixed(1)} per 100 active listings`, icon: Wrench },
  ];

  const formatPriceCompact = (price: number, currency?: string | null) => `${currency || '₪'}${price.toLocaleString()}`;

  return (
    <Card className="rounded-2xl border-border/50 overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Price Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Price Context KPIs */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/20 p-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Price Context KPI dashboard</p>
              <p className="text-xs text-muted-foreground">Real listing, inquiry, save, lead-quality, and event data for the selected period.</p>
            </div>
            <Button variant="outline" size="sm" onClick={exportPriceContextCsv} disabled={!hasContextData}>Export CSV</Button>
          </div>
          {!hasContextData && (
            <div className="rounded-xl border border-border/50 bg-background p-4 text-sm text-muted-foreground">
              Not enough Price Context data yet. Metrics will populate after live listings receive module views, saves, inquiries, or review events.
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-4">
            {contextCards.map((card) => (
              <div key={card.label} className="rounded-xl border border-border/50 bg-muted/30 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                    <p className="mt-1 text-2xl font-bold text-foreground">{card.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p>
                  </div>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <card.icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-border/50 bg-background p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Gauge className="h-4 w-4 text-primary" />
                High-confidence inventory
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">{(context?.highConfidence || 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Eligible for stronger buyer-facing context when complete</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-background p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <EyeOff className="h-4 w-4 text-primary" />
                Percentages suppressed
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">{(context?.suppressionRate || 0).toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">{context?.suppressed || 0} listings keep raw gaps internal</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-background p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <AlertTriangle className="h-4 w-4 text-primary" />
                Boost safeguards
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">{(context?.blockedFromBoost || 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Blocked or under review listings excluded from Price Context boosts</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-border/50 bg-background p-3">
              <p className="text-xs font-medium text-muted-foreground">Buyer question engagement</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{(context?.questionEngagementRate || 0).toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Question clicks per Price Context view</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-background p-3">
              <p className="text-xs font-medium text-muted-foreground">Details open rate</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{(context?.detailsOpenRate || 0).toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">{context?.detailsOpened || 0} “How we calculated this” opens</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-background p-3">
              <p className="text-xs font-medium text-muted-foreground">Comparable views</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{(context?.comparableViews || 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Recorded-sale comp sections viewed</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-background p-3">
              <p className="text-xs font-medium text-muted-foreground">Post-context inquiries</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{(context?.postViewInquiries || 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Tracked inquiry actions after Price Context exposure</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-background p-3">
              <p className="text-xs font-medium text-muted-foreground">Context-to-inquiry CVR</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{(context?.inquiryConversionRate || 0).toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Inquiries per Price Context module view</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-background p-3">
              <p className="text-xs font-medium text-muted-foreground">Buyer trust feedback</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{(context?.helpfulFeedbackRate || 0).toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">{context?.helpfulFeedback || 0} helpful · {context?.notHelpfulFeedback || 0} not yet</p>
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Price Context data-health audit</p>
                <p className="text-xs text-muted-foreground">Internal cleanup signals for benchmark quality and admin review workload</p>
              </div>
              <Badge variant="outline">Admin only</Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              {healthCards.map((card) => (
                <div key={card.label} className="rounded-lg border border-border/50 bg-background p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                      <p className="mt-1 text-xl font-bold text-foreground">{card.value}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p>
                    </div>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <card.icon className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {(context?.correctionEvents || []).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {(context?.correctionEvents || []).slice(0, 4).map((item) => (
                  <Badge key={item.eventType} variant="secondary" className="rounded-lg">
                    {formatLabel(item.eventType)} · {item.count}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-border/50 p-4 lg:col-span-2">
              <p className="text-sm font-semibold text-foreground">Confidence distribution</p>
              <div className="mt-3 space-y-3">
                {(context?.confidenceDistribution || []).slice(0, 5).map((item) => (
                  <div key={item.tier} className="space-y-1">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate text-foreground">{formatLabel(item.tier)}</span>
                      <span className="shrink-0 text-muted-foreground">{item.count} · {item.percentage.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(item.percentage, 100)}%` }} />
                    </div>
                  </div>
                ))}
                {(context?.confidenceDistribution || []).length === 0 && (
                  <p className="text-sm text-muted-foreground">No confidence data available</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border/50 p-4">
              <p className="text-sm font-semibold text-foreground">Review signals</p>
              <div className="mt-3 space-y-3">
                {(context?.reviewReasons || []).slice(0, 3).map((item) => (
                  <div key={item.reason} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-foreground">{formatLabel(item.reason)}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{item.count}</span>
                  </div>
                ))}
                {(context?.recentEvents || []).slice(0, 3).map((item) => (
                  <div key={item.eventType} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">{formatLabel(item.eventType)}</span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{item.count}</span>
                  </div>
                ))}
                {(context?.reviewReasons || []).length === 0 && (context?.recentEvents || []).length === 0 && (
                  <p className="text-sm text-muted-foreground">No review activity in this range</p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Ranking blocker queue</p>
                <p className="text-xs text-muted-foreground">Live sale listings excluded from Price Context boosts</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/admin/listing-review">
                  Review queue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-3 space-y-2">
              {blockersLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : blockers.length > 0 ? (
                blockers.slice(0, 5).map((listing) => (
                  <div key={listing.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-muted/20 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{listing.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {[listing.neighborhood, listing.city].filter(Boolean).join(', ')} · {formatPriceCompact(listing.price, listing.currency)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="outline">{formatLabel(listing.price_context_badge_status || 'missing_context')}</Badge>
                      {(listing.benchmark_review_status === 'requested' || listing.benchmark_review_status === 'under_review') && (
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{formatLabel(listing.benchmark_review_status)}</Badge>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-lg bg-muted/20 p-3 text-sm text-muted-foreground">No active Price Context ranking blockers.</p>
              )}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6 pb-4 border-b border-border/50">
          <div className="text-center p-3 rounded-xl bg-primary/5">
            <p className="text-2xl font-bold text-foreground">{formatPrice(data?.avgPlatformPrice || 0)}</p>
            <p className="text-xs text-muted-foreground">Average Price</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-primary/5">
            <p className="text-2xl font-bold text-foreground">{formatPrice(data?.medianPrice || 0)}</p>
            <p className="text-xs text-muted-foreground">Median Price</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-primary/5">
            <p className="text-2xl font-bold text-foreground">
              ₪{((data?.avgPlatformPriceSqm || 0) / 1000).toFixed(1)}K
            </p>
            <p className="text-xs text-muted-foreground">Avg Price/sqm</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Price Range Distribution */}
          <div>
            <p className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
              <TrendingUp className="h-4 w-4 text-primary" />
              Price Distribution
            </p>
            {(data?.priceRanges || []).length > 0 ? (
              <div className="space-y-2">
                {(data?.priceRanges || []).map((range, index) => (
                  <div key={range.range} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{range.range}</span>
                      <span className="text-muted-foreground">
                        {range.count} ({range.percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${range.percentage}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[150px] flex items-center justify-center text-muted-foreground text-sm">
                No price data available
              </div>
            )}
          </div>

          {/* Bedroom Distribution */}
          <div>
            <p className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
              <Building className="h-4 w-4 text-primary" />
              Bedroom Distribution
            </p>
            {(data?.bedroomDistribution || []).length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie
                      data={data?.bedroomDistribution || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      paddingAngle={2}
                      dataKey="count"
                      nameKey="bedrooms"
                    >
                      {(data?.bedroomDistribution || []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="bg-background border border-border/50 rounded-xl shadow-lg p-2 text-sm">
                              <p className="font-semibold text-foreground">{item.bedrooms}</p>
                              <p className="text-muted-foreground">
                                {item.count} ({item.percentage.toFixed(0)}%)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {(data?.bedroomDistribution || []).map((item, index) => (
                    <div key={item.bedrooms} className="flex items-center gap-1 text-xs">
                      <div 
                        className="h-2 w-2 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-foreground">{item.bedrooms}: {item.count}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[150px] flex items-center justify-center text-muted-foreground text-sm">
                No bedroom data available
              </div>
            )}
          </div>
        </div>

        {/* City Prices */}
        {(data?.cityPrices || []).length > 0 && (
          <div className="mt-6 pt-4 border-t border-border/50">
            <p className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
              <Home className="h-4 w-4 text-primary" />
              Average Price by City ({data?.cityPrices?.length || 0} cities)
            </p>
            <div className="overflow-x-auto">
              <div style={{ minWidth: Math.max(400, (data?.cityPrices?.length || 0) * 60) }}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart 
                    data={data?.cityPrices || []}
                    margin={{ top: 5, right: 10, left: 10, bottom: 70 }}
                  >
                    <XAxis 
                      dataKey="city" 
                      tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => formatPrice(value)}
                      width={50}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="bg-background border border-border/50 rounded-xl shadow-lg p-2 text-sm">
                              <p className="font-semibold text-foreground">{item.city}</p>
                              <div className="text-muted-foreground space-y-0.5">
                                <p>Avg: {formatPrice(item.avgPrice)}</p>
                                <p>Per sqm: ₪{(item.avgPriceSqm / 1000).toFixed(1)}K</p>
                                <p>{item.count} listings</p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="avgPrice" radius={[6, 6, 0, 0]}>
                      {(data?.cityPrices || []).map((_, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}