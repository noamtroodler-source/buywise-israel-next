import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useListingIntelligence } from '@/hooks/useAnalyticsData';
import { Loader2, Calendar, Clock, TrendingDown, Home } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';

interface ListingIntelligenceTabProps {
  dateRange: number;
}

export function ListingIntelligenceTab({ dateRange }: ListingIntelligenceTabProps) {
  const { data, isLoading } = useListingIntelligence(dateRange);

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
        No listing lifecycle data available yet. Data will populate as listings are created and updated.
      </div>
    );
  }

  const { cityData, overallMetrics } = data;

  return (
    <div className="space-y-6">
      {/* Overall Metrics */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overallMetrics.avgDaysOnMarket}</p>
                <p className="text-sm text-muted-foreground">Avg Days on Market</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-2/10">
                <Clock className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overallMetrics.avgDaysToFirstInquiry}</p>
                <p className="text-sm text-muted-foreground">Days to 1st Inquiry</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-3/10">
                <Home className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overallMetrics.totalActive}</p>
                <p className="text-sm text-muted-foreground">Active Listings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-2xl font-bold text-green-600">{overallMetrics.totalSold}</p>
              <p className="text-sm text-muted-foreground">Sold/Rented</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overallMetrics.avgPriceDrops}</p>
                <p className="text-sm text-muted-foreground">Price Reductions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* City Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Average Days on Market by City</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cityData.slice(0, 10)}>
                <XAxis dataKey="city" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === 'avgDaysOnMarket') return [value, 'Days on Market'];
                    if (name === 'avgDaysToFirstInquiry') return [value, 'Days to 1st Inquiry'];
                    return [value, name];
                  }}
                />
                <Bar dataKey="avgDaysOnMarket" fill="hsl(var(--primary))" name="Days on Market" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgDaysToFirstInquiry" fill="hsl(var(--chart-2))" name="Days to 1st Inquiry" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* City Details Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">City Market Intelligence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium">City</th>
                  <th className="text-right py-3 px-2 font-medium">Listings</th>
                  <th className="text-right py-3 px-2 font-medium">Avg DOM</th>
                  <th className="text-right py-3 px-2 font-medium">Days to Inquiry</th>
                  <th className="text-right py-3 px-2 font-medium">Avg Price Δ</th>
                  <th className="text-right py-3 px-2 font-medium">Sold</th>
                  <th className="text-right py-3 px-2 font-medium">Active</th>
                </tr>
              </thead>
              <tbody>
                {cityData.map((city) => (
                  <tr key={city.city} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 px-2 font-medium">{city.city}</td>
                    <td className="py-3 px-2 text-right">{city.totalListings}</td>
                    <td className="py-3 px-2 text-right">
                      {city.avgDaysOnMarket > 0 ? (
                        <span className={city.avgDaysOnMarket > 60 ? 'text-destructive' : ''}>
                          {city.avgDaysOnMarket}d
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {city.avgDaysToFirstInquiry > 0 ? `${city.avgDaysToFirstInquiry}d` : '-'}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {city.avgPriceChange !== 0 ? (
                        <span className={city.avgPriceChange < 0 ? 'text-destructive' : 'text-green-600'}>
                          {city.avgPriceChange > 0 ? '+' : ''}{city.avgPriceChange}%
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {city.soldCount}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <Badge variant="secondary">{city.activeCount}</Badge>
                    </td>
                  </tr>
                ))}
                {cityData.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      No city data available yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
