import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, TrendingUp, ArrowRightLeft, DollarSign, AlertTriangle } from 'lucide-react';
import { usePriceHistoryAnalytics } from '@/hooks/usePriceHistoryAnalytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { SampleSizeWarning } from './SampleSizeWarning';

interface PriceIntelligenceTabProps {
  dateRange: number;
}

export function PriceIntelligenceTab({ dateRange }: PriceIntelligenceTabProps) {
  const { data, isLoading } = usePriceHistoryAnalytics(dateRange);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-32" />
          </Card>
        ))}
      </div>
    );
  }

  const priceMetrics = data?.priceMetrics;
  const statusMetrics = data?.statusMetrics;
  
  // Calculate sample size for warnings
  const totalSamples = (priceMetrics?.totalPriceChanges || 0) + (statusMetrics?.totalStatusChanges || 0);

  return (
    <div className="space-y-6">
      {/* Sample Size Warning */}
      <div className="flex justify-end">
        <SampleSizeWarning sampleSize={totalSamples} showLabel />
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Price Changes</p>
                <p className="text-3xl font-bold">{priceMetrics?.totalPriceChanges || 0}</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Change</p>
                <p className="text-3xl font-bold">{priceMetrics?.avgChangePercent.toFixed(1) || 0}%</p>
              </div>
              {(priceMetrics?.avgChangePercent || 0) < 0 ? (
                <TrendingDown className="h-8 w-8 text-red-500/60" />
              ) : (
                <TrendingUp className="h-8 w-8 text-green-500/60" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Status Changes</p>
                <p className="text-3xl font-bold">{statusMetrics?.totalStatusChanges || 0}</p>
              </div>
              <ArrowRightLeft className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sold/Rented</p>
                <p className="text-3xl font-bold">{(statusMetrics?.soldCount || 0) + (statusMetrics?.rentedCount || 0)}</p>
              </div>
              <Badge variant="default" className="bg-green-500/20 text-green-700">
                Closed
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Price Increases vs Decreases */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Price Movements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="font-medium">Increases</span>
              </div>
              <p className="text-3xl font-bold text-green-600">{priceMetrics?.priceIncreases || 0}</p>
            </div>
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <span className="font-medium">Decreases</span>
              </div>
              <p className="text-3xl font-bold text-red-600">{priceMetrics?.priceDecreases || 0}</p>
            </div>
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Index Adjustments</span>
              </div>
              <p className="text-3xl font-bold text-blue-600">{priceMetrics?.indexAdjustments || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Price Changes by City */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Price Changes by City</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.priceChangeByCity && data.priceChangeByCity.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.priceChangeByCity} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="city" type="category" className="text-xs" width={100} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="changes" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Changes" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No city data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Price Change Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Price Change Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.priceChangeTrend && data.priceChangeTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.priceChangeTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line type="monotone" dataKey="increases" stroke="hsl(142 76% 36%)" strokeWidth={2} dot={false} name="Increases" />
                  <Line type="monotone" dataKey="decreases" stroke="hsl(0 84% 60%)" strokeWidth={2} dot={false} name="Decreases" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No trend data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Transitions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status Transitions</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.statusTransitions && data.statusTransitions.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {data.statusTransitions.map((transition, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{transition.from}</Badge>
                    <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="default">{transition.to}</Badge>
                  </div>
                  <span className="font-bold">{transition.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No status transitions recorded</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
