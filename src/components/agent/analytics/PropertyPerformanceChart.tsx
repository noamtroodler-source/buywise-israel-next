import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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

  // Truncate titles for better display; fall back to a short label if title looks like an ID
  const chartData = data.slice(0, 6).map((item, idx) => {
    const looksLikeId = /^[0-9a-f-]{20,}$/i.test(item.title.trim());
    const label = looksLikeId ? `Listing ${idx + 1}` : item.title;
    return {
      ...item,
      name: label.length > 20 ? label.substring(0, 20) + '…' : label,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Listing Performance Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend />
              <Bar
                dataKey="views"
                name="Views"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="saves"
                name="Saves"
                fill="hsl(var(--primary) / 0.6)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="inquiries"
                name="Inquiries"
                fill="hsl(var(--primary) / 0.3)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
