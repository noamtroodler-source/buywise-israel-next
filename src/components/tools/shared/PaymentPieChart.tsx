import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';

interface PaymentPieChartProps {
  principal: number;
  interest: number;
  formatValue: (value: number) => string;
  className?: string;
}

export function PaymentPieChart({ principal, interest, formatValue, className }: PaymentPieChartProps) {
  const data = [
    { name: 'Principal', value: principal, color: 'hsl(var(--primary))' },
    { name: 'Interest', value: interest, color: 'hsl(var(--muted-foreground))' },
  ];

  const total = principal + interest;

  return (
    <div className={cn("w-full", className)}>
      <div className="h-[180px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatValue(value)}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-sm font-bold">{formatValue(total)}</p>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex justify-center gap-6 mt-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: item.color }}
            />
            <div className="text-xs">
              <span className="text-muted-foreground">{item.name}: </span>
              <span className="font-medium">{((item.value / total) * 100).toFixed(0)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
