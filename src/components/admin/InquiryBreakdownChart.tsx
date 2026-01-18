import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare } from 'lucide-react';

interface InquiryBreakdownChartProps {
  data: { type: string; count: number }[];
  isLoading?: boolean;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(190, 80%, 42%)',
  'hsl(258, 55%, 52%)',
  'hsl(var(--muted-foreground))',
];

export function InquiryBreakdownChart({ data, isLoading }: InquiryBreakdownChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Inquiry Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const totalInquiries = data.reduce((sum, item) => sum + item.count, 0);

  const chartConfig = {
    whatsapp: { label: "WhatsApp", color: COLORS[0] },
    call: { label: "Call", color: COLORS[1] },
    email: { label: "Email", color: COLORS[2] },
    form: { label: "Form", color: COLORS[3] },
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <MessageSquare className="h-5 w-5 text-primary" />
          Inquiry Breakdown (30 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {totalInquiries === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            No inquiries in this period
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[250px]">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="count"
                nameKey="type"
                label={({ type, count }) => `${type}: ${count}`}
                labelLine={false}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ChartContainer>
        )}
        <div className="flex justify-center gap-4 mt-4">
          {data.map((item, index) => (
            <div key={item.type} className="flex items-center gap-1.5">
              <div 
                className="h-3 w-3 rounded-full" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-xs text-muted-foreground">{item.type}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
