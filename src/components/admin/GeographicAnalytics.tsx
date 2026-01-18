import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, TrendingUp } from 'lucide-react';
import { GeographicData } from '@/hooks/useGeographicAnalytics';
import { 
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, 
  Tooltip, Cell 
} from 'recharts';

interface GeographicAnalyticsProps {
  data: GeographicData | undefined;
  isLoading?: boolean;
}

// BuyWise brand-compliant cool-tone palette
const COLORS = [
  'hsl(var(--primary))',      // Primary blue
  'hsl(213, 70%, 55%)',       // Lighter blue
  'hsl(213, 60%, 65%)',       // Even lighter
  'hsl(213, 50%, 75%)',       // Light blue
  'hsl(var(--muted-foreground))', // Muted for rest
];

export function GeographicAnalytics({ data, isLoading }: GeographicAnalyticsProps) {
  if (isLoading) {
    return (
      <Card className="rounded-2xl border-border/50">
        <CardHeader>
          <CardTitle>Geographic Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = (data?.topCities || []).slice(0, 8).map(city => ({
    name: city.city.length > 12 ? city.city.slice(0, 12) + '...' : city.city,
    fullName: city.city,
    views: city.totalViews,
    inquiries: city.totalInquiries,
    properties: city.propertyCount,
    conversion: city.conversionRate,
  }));

  return (
    <Card className="rounded-2xl border-border/50 overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Top Cities by Activity
          <span className="text-sm font-normal text-muted-foreground ml-auto">
            {data?.totalCities || 0} cities total
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {chartData.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center text-muted-foreground">
            No geographic data available
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart 
                data={chartData} 
                layout="vertical"
                margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
              >
                <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
                  width={60}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border border-border/50 rounded-xl shadow-lg p-3 text-sm">
                          <p className="font-semibold text-foreground">{data.fullName}</p>
                          <div className="mt-1 space-y-0.5 text-muted-foreground">
                            <p>Views: {data.views.toLocaleString()}</p>
                            <p>Inquiries: {data.inquiries}</p>
                            <p>Properties: {data.properties}</p>
                            <p>Conversion: {data.conversion.toFixed(2)}%</p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="views" radius={[0, 6, 6, 0]}>
                  {chartData.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[Math.min(index, COLORS.length - 1)]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            
            {/* Top 3 cities summary */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border/50">
              {(data?.topCities || []).slice(0, 3).map((city, index) => (
                <div key={city.city} className="text-center p-3 rounded-xl bg-primary/5">
                  <p className="text-xs text-primary font-semibold">#{index + 1}</p>
                  <p className="font-medium text-sm truncate text-foreground">{city.city}</p>
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
                    <TrendingUp className="h-3 w-3 text-primary" />
                    {city.conversionRate.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}