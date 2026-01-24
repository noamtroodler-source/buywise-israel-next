import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, TrendingUp, Home, Building } from 'lucide-react';
import { PriceAnalyticsData } from '@/hooks/usePriceAnalytics';
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
  'hsl(213, 70%, 55%)',
  'hsl(213, 60%, 65%)',
  'hsl(213, 50%, 75%)',
  'hsl(213, 40%, 85%)',
  'hsl(var(--muted-foreground))',
];

export function PriceAnalytics({ data, isLoading }: PriceAnalyticsProps) {
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

  return (
    <Card className="rounded-2xl border-border/50 overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Price Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
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