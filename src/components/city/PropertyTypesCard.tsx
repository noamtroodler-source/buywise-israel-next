import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface PropertyTypesCardProps {
  cityName: string;
  propertyTypes?: { resell: number; projects: number; rentals: number };
}

export function PropertyTypesCard({ cityName, propertyTypes }: PropertyTypesCardProps) {
  const data = propertyTypes || { resell: 45, projects: 35, rentals: 20 };
  
  const chartData = [
    { name: 'Resell', value: data.resell, color: 'hsl(var(--primary))' },
    { name: 'Projects', value: data.projects, color: 'hsl(var(--chart-2))' },
    { name: 'Rentals', value: data.rentals, color: 'hsl(var(--chart-3))' },
  ];

  const dominantType = chartData.reduce((a, b) => a.value > b.value ? a : b);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Property Types</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`${value}%`, '']}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend 
                iconType="circle"
                wrapperStyle={{ fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Insight */}
        <div className="bg-muted/50 rounded-lg p-3 flex gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            {dominantType.name === 'Resell' 
              ? `${cityName} is dominated by resale properties (${dominantType.value}%), indicating a mature market with established neighborhoods.`
              : dominantType.name === 'Projects'
              ? `New construction projects make up ${dominantType.value}% of ${cityName}'s market — great for buyers wanting modern amenities.`
              : `Rental properties are prominent in ${cityName} (${dominantType.value}%), making it attractive for investors.`
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
