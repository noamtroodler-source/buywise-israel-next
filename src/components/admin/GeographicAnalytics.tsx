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

const COLORS = [
  'hsl(var(--primary))',
  'hsl(190, 80%, 42%)',
  'hsl(258, 55%, 52%)',
  'hsl(var(--muted-foreground))',
];

export function GeographicAnalytics({ data, isLoading }: GeographicAnalyticsProps) {
  if (isLoading) {
    return (
      <Card>
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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Top Cities by Activity
          <span className="text-sm font-normal text-muted-foreground ml-auto">
            {data?.totalCities || 0} cities total
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
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
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fontSize: 11 }}
                  width={60}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
                          <p className="font-medium">{data.fullName}</p>
                          <p className="text-muted-foreground">Views: {data.views.toLocaleString()}</p>
                          <p className="text-muted-foreground">Inquiries: {data.inquiries}</p>
                          <p className="text-muted-foreground">Properties: {data.properties}</p>
                          <p className="text-muted-foreground">
                            Conversion: {data.conversion.toFixed(2)}%
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="views" radius={[0, 4, 4, 0]}>
                  {chartData.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      opacity={1 - (index * 0.08)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            
            {/* Top 3 cities summary */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t">
              {(data?.topCities || []).slice(0, 3).map((city, index) => (
                <div key={city.city} className="text-center p-2 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">#{index + 1}</p>
                  <p className="font-medium text-sm truncate">{city.city}</p>
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
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
