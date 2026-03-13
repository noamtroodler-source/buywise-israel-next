import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PropertyData {
  propertyId: string;
  title: string;
  views: number;
  saves: number;
  inquiries: number;
}

interface PropertyPerformanceChartProps {
  data: PropertyData[];
}

const machineTitlePattern = /^[a-z0-9_-]{16,}$/i;

const sanitizeListingTitle = (rawTitle: string, index: number) => {
  const normalized = rawTitle?.trim() || '';
  if (!normalized) return `Listing ${index + 1}`;
  if (machineTitlePattern.test(normalized) && !/\s/.test(normalized)) return `Listing ${index + 1}`;
  return normalized;
};

export function PropertyPerformanceChart({ data }: PropertyPerformanceChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Listing Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No listings to compare
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.slice(0, 6).map((item, idx) => ({
    ...item,
    point: idx + 1,
    title: sanitizeListingTitle(item.title, idx),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Listing Performance Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                dataKey="point"
                domain={[0, chartData.length + 1]}
                allowDecimals={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => (value >= 1 && value <= chartData.length ? `${value}` : '')}
                label={{ value: 'Listings', position: 'insideBottom', offset: -10, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                type="number"
                dataKey="views"
                allowDecimals={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                label={{ value: 'Views', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                cursor={{ stroke: 'hsl(var(--primary) / 0.25)', strokeDasharray: '4 4' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload as PropertyData & { point: number };
                  return (
                    <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                        <p>Views: <span className="font-medium text-foreground">{item.views}</span></p>
                        <p>Saves: <span className="font-medium text-foreground">{item.saves}</span></p>
                        <p>Inquiries: <span className="font-medium text-foreground">{item.inquiries}</span></p>
                      </div>
                    </div>
                  );
                }}
              />
              <Scatter
                name="Views"
                data={chartData}
                fill="hsl(var(--primary))"
                shape="circle"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Hover each blue dot to see the listing name and full metrics.</p>
      </CardContent>
    </Card>
  );
}
