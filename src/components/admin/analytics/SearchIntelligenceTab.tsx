import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSearchIntelligence } from '@/hooks/useAnalyticsData';
import { Loader2, Search, TrendingUp, AlertTriangle, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Badge } from '@/components/ui/badge';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

interface SearchIntelligenceTabProps {
  dateRange: number;
}

export function SearchIntelligenceTab({ dateRange }: SearchIntelligenceTabProps) {
  const { data, isLoading } = useSearchIntelligence(dateRange);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No search data available yet. Data will appear as users search the platform.
      </div>
    );
  }

  const { topCities, priceRangeDemand, topFeatures, zeroResultSearches, conversion } = data;

  const formatPrice = (price: number) => {
    if (price >= 1000000) return `₪${(price / 1000000).toFixed(1)}M`;
    if (price >= 1000) return `₪${(price / 1000).toFixed(0)}K`;
    return `₪${price}`;
  };

  return (
    <div className="space-y-6">
      {/* Conversion Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{conversion.totalSearches.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Searches</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-2xl font-bold">{conversion.clickRate.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Click-through Rate</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {conversion.searchesWithClicks} searches with clicks
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-2xl font-bold">{conversion.saveRate.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Save Rate</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {conversion.searchesWithSaves} led to saves
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{zeroResultSearches}</p>
                <p className="text-sm text-muted-foreground">Zero Results</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Cities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Most Searched Cities (Demand Signal)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {topCities.map((city, idx) => (
                <div key={city.city} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-5">{idx + 1}</span>
                    <div>
                      <p className="font-medium">{city.city}</p>
                      {city.avgPriceMin > 0 && city.avgPriceMax > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Avg range: {formatPrice(city.avgPriceMin)} - {formatPrice(city.avgPriceMax)}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary">{city.searchCount} searches</Badge>
                </div>
              ))}
              {topCities.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-4">No city data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Price Range Demand */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Price Range Demand</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priceRangeDemand} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="range" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip 
                    formatter={(value: number) => [value.toLocaleString(), 'Searches']}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Most Requested Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {topFeatures.map((feature, idx) => (
              <Badge 
                key={feature.feature} 
                variant={idx < 3 ? 'default' : 'outline'}
                className="text-sm py-1 px-3"
              >
                {feature.feature}
                <span className="ml-2 opacity-70">({feature.count})</span>
              </Badge>
            ))}
            {topFeatures.length === 0 && (
              <p className="text-muted-foreground text-sm">No feature data yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
