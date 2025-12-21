import { useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp } from 'lucide-react';
import { MarketData } from '@/types/projects';

interface PriceTrendChartProps {
  marketData: MarketData[];
  cityName: string;
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function PriceTrendChart({ marketData, cityName }: PriceTrendChartProps) {
  const [period, setPeriod] = useState<'6m' | '1y' | 'all'>('6m');

  // Sort data chronologically and format for chart
  const chartData = [...marketData]
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return (a.month || 0) - (b.month || 0);
    })
    .map(d => ({
      name: `${months[(d.month || 1) - 1]} ${d.year}`,
      pricePerSqm: d.average_price_sqm,
      medianPrice: d.median_price ? d.median_price / 1000000 : null,
      transactions: d.total_transactions,
    }));

  // Filter based on period
  const filteredData = period === '6m' 
    ? chartData.slice(-6) 
    : period === '1y' 
      ? chartData.slice(-12) 
      : chartData;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-foreground mb-1">{label}</p>
          <p className="text-sm text-primary">
            ₪{payload[0].value?.toLocaleString()}/m²
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <TrendingUp className="h-5 w-5 text-primary" />
              Price Trend in {cityName}
            </CardTitle>
            <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
              <TabsList className="bg-muted">
                <TabsTrigger value="6m" className="text-xs">6M</TabsTrigger>
                <TabsTrigger value="1y" className="text-xs">1Y</TabsTrigger>
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {filteredData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(213 94% 45%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(213 94% 45%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }} 
                    className="text-muted-foreground"
                    axisLine={{ className: 'stroke-border' }}
                    tickLine={{ className: 'stroke-border' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }} 
                    className="text-muted-foreground"
                    tickFormatter={(value) => `₪${(value / 1000).toFixed(0)}K`}
                    axisLine={{ className: 'stroke-border' }}
                    tickLine={{ className: 'stroke-border' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="pricePerSqm"
                    stroke="hsl(213 94% 45%)"
                    strokeWidth={2}
                    fill="url(#priceGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No price trend data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
