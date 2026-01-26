import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import { Building2, TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react';
import { useCityAnalytics, CityMetrics } from '@/hooks/useCityAnalytics';
import { 
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, 
  Tooltip, Cell, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SampleSizeWarning } from './SampleSizeWarning';

interface CityAnalyticsTabProps {
  days?: number;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(213, 70%, 55%)',
  'hsl(213, 60%, 65%)',
  'hsl(213, 50%, 75%)',
  'hsl(213, 40%, 85%)',
];

type SortField = 'city' | 'listings' | 'avgPrice' | 'avgPriceSqm' | 'totalViews' | 'totalInquiries' | 'conversionRate' | 'avgDaysOnMarket';
type SortDirection = 'asc' | 'desc';

export function CityAnalyticsTab({ days = 30 }: CityAnalyticsTabProps) {
  const { data, isLoading } = useCityAnalytics(days);
  const [sortField, setSortField] = useState<SortField>('listings');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `₪${(price / 1000000).toFixed(1)}M`;
    }
    return `₪${(price / 1000).toFixed(0)}K`;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedCities = [...(data?.cities || [])].sort((a, b) => {
    let aVal: number | string = a[sortField] ?? 0;
    let bVal: number | string = b[sortField] ?? 0;
    
    if (sortField === 'city') {
      return sortDirection === 'asc' 
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    }
    
    return sortDirection === 'asc' 
      ? Number(aVal) - Number(bVal)
      : Number(bVal) - Number(aVal);
  });

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-0 font-semibold hover:bg-transparent"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  // Prepare data for demand/supply scatter
  const scatterData = (data?.cities || []).map(city => ({
    ...city,
    x: city.listings, // supply
    y: city.totalViews, // demand
    z: city.avgPrice,
  }));

  // Calculate total listings for sample size
  const totalListings = (data?.cities || []).reduce((sum, c) => sum + c.listings, 0);
  const totalViews = (data?.cities || []).reduce((sum, c) => sum + c.totalViews, 0);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">{data?.totalCities || 0}</p>
            <p className="text-sm text-muted-foreground">Total Cities</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-foreground">
              {totalListings}
            </p>
            <p className="text-sm text-muted-foreground">Total Listings</p>
            <SampleSizeWarning sampleSize={totalListings} className="mt-2" />
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-foreground">
              {totalViews.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">Total Views</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-foreground">
              {(data?.cities || []).reduce((sum, c) => sum + c.totalInquiries, 0)}
            </p>
            <p className="text-sm text-muted-foreground">Total Inquiries</p>
          </CardContent>
        </Card>
      </div>

      {/* Full City Table */}
      <Card className="rounded-2xl border-border/50">
        <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            All Cities ({data?.totalCities || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="max-h-[500px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead><SortButton field="city">City</SortButton></TableHead>
                  <TableHead className="text-right"><SortButton field="listings">Listings</SortButton></TableHead>
                  <TableHead className="text-right"><SortButton field="avgPrice">Avg Price</SortButton></TableHead>
                  <TableHead className="text-right"><SortButton field="avgPriceSqm">Price/sqm</SortButton></TableHead>
                  <TableHead className="text-right"><SortButton field="totalViews">Views</SortButton></TableHead>
                  <TableHead className="text-right"><SortButton field="totalInquiries">Inquiries</SortButton></TableHead>
                  <TableHead className="text-right"><SortButton field="conversionRate">Conversion</SortButton></TableHead>
                  <TableHead className="text-right"><SortButton field="avgDaysOnMarket">Avg DOM</SortButton></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCities.map((city, index) => (
                  <TableRow key={city.city}>
                    <TableCell className="font-medium">{city.city}</TableCell>
                    <TableCell className="text-right">{city.listings}</TableCell>
                    <TableCell className="text-right">{formatPrice(city.avgPrice)}</TableCell>
                    <TableCell className="text-right">
                      {city.avgPriceSqm > 0 ? `₪${(city.avgPriceSqm / 1000).toFixed(1)}K` : '-'}
                    </TableCell>
                    <TableCell className="text-right">{city.totalViews.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{city.totalInquiries}</TableCell>
                    <TableCell className="text-right">
                      <span className={city.conversionRate > 3 ? 'text-green-600' : ''}>
                        {city.conversionRate.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {city.avgDaysOnMarket !== null ? `${Math.round(city.avgDaysOnMarket)} days` : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        {/* Price Comparison Chart */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Average Price by City
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-y-auto max-h-[400px]">
              <ResponsiveContainer width="100%" height={Math.max(300, (data?.cities?.length || 0) * 28)}>
                <BarChart 
                  data={[...(data?.cities || [])].sort((a, b) => b.avgPrice - a.avgPrice)}
                  layout="vertical"
                  margin={{ top: 5, right: 40, left: 80, bottom: 5 }}
                >
                  <XAxis 
                    type="number" 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => formatPrice(value)}
                  />
                  <YAxis 
                    dataKey="city" 
                    type="category" 
                    tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
                    width={75}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload as CityMetrics;
                        return (
                          <div className="bg-background border border-border/50 rounded-xl shadow-lg p-3 text-sm">
                            <p className="font-semibold text-foreground">{item.city}</p>
                            <p className="text-muted-foreground">Avg: {formatPrice(item.avgPrice)}</p>
                            <p className="text-muted-foreground">{item.listings} listings</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="avgPrice" radius={[0, 6, 6, 0]}>
                    {(data?.cities || []).map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Demand vs Supply Matrix */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-primary" />
              Demand vs Supply
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={350}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="Listings"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  label={{ value: 'Supply (# Listings)', position: 'bottom', offset: 20, fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="Views"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  label={{ value: 'Demand (Views)', angle: -90, position: 'left', offset: 10, fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <ZAxis type="number" dataKey="z" range={[50, 400]} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload as CityMetrics & { x: number; y: number };
                      return (
                        <div className="bg-background border border-border/50 rounded-xl shadow-lg p-3 text-sm">
                          <p className="font-semibold text-foreground">{item.city}</p>
                          <p className="text-muted-foreground">{item.x} listings (supply)</p>
                          <p className="text-muted-foreground">{item.y.toLocaleString()} views (demand)</p>
                          <p className="text-muted-foreground">{formatPrice(item.avgPrice)} avg price</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter 
                  data={scatterData} 
                  fill="hsl(var(--primary))"
                  fillOpacity={0.6}
                />
              </ScatterChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Bubble size = average price. Upper-left = undersupplied (high demand, low listings)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
