import { useState } from 'react';
import { motion } from 'framer-motion';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Line, LineChart, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp } from 'lucide-react';
import { MarketData } from '@/types/projects';
import { getComparisonColor } from './CityCompareSelector';

interface ComparisonData {
  city: string;
  data: MarketData[];
}

interface PriceTrendChartProps {
  marketData: MarketData[];
  cityName: string;
  comparisonData?: ComparisonData[];
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function PriceTrendChart({ marketData, cityName, comparisonData = [] }: PriceTrendChartProps) {
  const [period, setPeriod] = useState<'6m' | '1y' | 'all'>('6m');

  const hasComparison = comparisonData.length > 0;

  // Get all cities for the chart
  const allCities = [cityName, ...comparisonData.map(c => c.city)];

  // Combine all data into a unified chart format
  const buildChartData = () => {
    // Get all unique date points
    const allData = [
      ...marketData.map(d => ({ ...d, city: cityName })),
      ...comparisonData.flatMap(c => c.data.map(d => ({ ...d, city: c.city })))
    ];

    // Group by date
    const dateMap = new Map<string, Record<string, string | number | null>>();
    
    allData.forEach(d => {
      const dateKey = `${d.year}-${String(d.month || 1).padStart(2, '0')}`;
      const displayName = `${months[(d.month || 1) - 1]} ${d.year}`;
      
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { name: displayName });
      }
      
      const entry = dateMap.get(dateKey)!;
      entry[d.city] = d.average_price_sqm;
    });

    // Convert to array and sort
    return Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => value);
  };

  const chartData = buildChartData();

  // Filter based on period
  const filteredData = period === '6m' 
    ? chartData.slice(-6) 
    : period === '1y' 
      ? chartData.slice(-12) 
      : chartData;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3 min-w-[140px]">
          <p className="font-medium text-foreground mb-2 text-sm">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                <div 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-muted-foreground">{entry.dataKey}</span>
              </span>
              <span className="font-medium" style={{ color: entry.color }}>
                ₪{entry.value?.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    if (!payload) return null;
    return (
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-1.5 text-xs">
            <div 
              className="w-2.5 h-2.5 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
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
              {hasComparison ? 'Price Comparison' : `Price Trend in ${cityName}`}
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
                {hasComparison ? (
                  <LineChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                    <Legend content={<CustomLegend />} />
                    {allCities.map((city, index) => (
                      <Line
                        key={city}
                        type="monotone"
                        dataKey={city}
                        stroke={getComparisonColor(index)}
                        strokeWidth={index === 0 ? 3 : 2}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 2 }}
                      />
                    ))}
                  </LineChart>
                ) : (
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
                      dataKey={cityName}
                      stroke="hsl(213 94% 45%)"
                      strokeWidth={2}
                      fill="url(#priceGradient)"
                    />
                  </AreaChart>
                )}
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
