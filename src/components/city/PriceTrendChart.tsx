import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp } from 'lucide-react';
import { MarketData } from '@/types/projects';
import { CityComparisonSelector } from './CityComparisonSelector';
import { useCities } from '@/hooks/useCities';
import { useCityComparison } from '@/hooks/useMarketData';

interface PriceTrendChartProps {
  marketData: MarketData[];
  cityName: string;
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const LINE_COLORS = [
  'hsl(213 94% 45%)',  // Primary blue
  'hsl(38 92% 50%)',   // Amber
  'hsl(152 69% 40%)',  // Emerald
];

export function PriceTrendChart({ marketData, cityName }: PriceTrendChartProps) {
  const normalizedCityName = cityName.trim();
  const [period, setPeriod] = useState<'6m' | '1y' | 'all'>('6m');
  const [selectedCities, setSelectedCities] = useState<string[]>([normalizedCityName]);
  
  const { data: allCities = [] } = useCities();
  const { data: comparisonData = [] } = useCityComparison(selectedCities);

  // Reset selection when city changes
  useEffect(() => {
    setSelectedCities([normalizedCityName]);
  }, [normalizedCityName]);

  const availableCities = useMemo(() => {
    return allCities.map(c => ({ name: c.name, slug: c.slug }));
  }, [allCities]);

  // Only use monthly points with a month (keeps the chart stable and predictable)
  const monthlyMarketData = useMemo(() => {
    return marketData.filter((d) => d.data_type === 'monthly' && d.month != null);
  }, [marketData]);

  // Process data for multi-city chart
  const chartData = useMemo(() => {
    const dataToUse = selectedCities.length > 1 ? comparisonData : monthlyMarketData;

    // Group data by date across all cities
    const dateMap = new Map<string, { name: string; sortKey: string; [key: string]: string | number }>();

    dataToUse.forEach((d) => {
      const dateKey = `${d.year}-${String(d.month || 1).padStart(2, '0')}`;
      const displayKey = `${months[(d.month || 1) - 1]} ${d.year}`;

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { name: displayKey, sortKey: dateKey });
      }

      const entry = dateMap.get(dateKey)!;
      // Use cityName for single-city view to ensure key matches selectedCities
      const cityKey = (selectedCities.length === 1 ? normalizedCityName : d.city).trim();
      entry[cityKey] = d.average_price_sqm || 0;
    });

    // Sort by date and return
    return Array.from(dateMap.values()).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [monthlyMarketData, comparisonData, selectedCities, cityName]);

  // Filter based on period
  const filteredData = useMemo(() => {
    if (period === '6m') return chartData.slice(-6);
    if (period === '1y') return chartData.slice(-12);
    return chartData;
  }, [chartData, period]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3 min-w-[140px]">
          <p className="font-medium text-foreground mb-2 text-sm border-b border-border pb-1">{label}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-1.5">
                  <span 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-muted-foreground truncate max-w-[80px]">{entry.name}</span>
                </div>
                <span className="font-medium text-foreground">
                  ₪{entry.value?.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const isComparing = selectedCities.length > 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-foreground">
                <TrendingUp className="h-5 w-5 text-primary" />
                {isComparing ? 'Price Comparison' : `Price Trend in ${cityName}`}
              </CardTitle>
              <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
                <TabsList className="bg-muted">
                  <TabsTrigger value="6m" className="text-xs">6M</TabsTrigger>
                  <TabsTrigger value="1y" className="text-xs">1Y</TabsTrigger>
                  <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {/* City Comparison Selector */}
            <CityComparisonSelector
              currentCity={cityName}
              selectedCities={selectedCities}
              onCitiesChange={setSelectedCities}
              availableCities={availableCities}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {filteredData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
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
                  {(isComparing ? selectedCities : [normalizedCityName]).map((city, index) => {
                    const color = LINE_COLORS[index % LINE_COLORS.length];
                    return (
                      <Line
                        key={city}
                        type="monotone"
                        dataKey={city}
                        name={city}
                        stroke={color}
                        strokeWidth={2.5}
                        dot={{ fill: color, strokeWidth: 0, r: 3 }}
                        activeDot={{ r: 5, strokeWidth: 0 }}
                      />
                    );
                  })}
                </LineChart>
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
