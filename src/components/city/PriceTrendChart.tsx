import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp } from 'lucide-react';
import { CityComparisonSelector } from './CityComparisonSelector';
import { useCities } from '@/hooks/useCities';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PriceTrendChartProps {
  cityName: string;
}

const quarterLabels = ['Q1', 'Q2', 'Q3', 'Q4'];

const LINE_COLORS = [
  'hsl(213 94% 45%)',  // Primary blue
  'hsl(175 70% 40%)',  // Teal
  'hsl(221 83% 53%)',  // Secondary blue
];

function useCityPriceTrend(cityNames: string[]) {
  return useQuery({
    queryKey: ['city-price-trend', cityNames],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('city_price_history')
        .select('*')
        .in('city_en', cityNames.map(n => n.replace(/['']/g, '')))
        .eq('rooms', 0) // all-rooms aggregate only
        .order('year', { ascending: true })
        .order('quarter', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: cityNames.length > 0,
  });
}

export function PriceTrendChart({ cityName }: PriceTrendChartProps) {
  const normalizedCityName = cityName.trim();
  const [period, setPeriod] = useState<'2y' | '5y' | 'all'>('5y');
  const [selectedCities, setSelectedCities] = useState<string[]>([normalizedCityName]);
  
  const { data: allCities = [] } = useCities();
  const { data: rawData = [] } = useCityPriceTrend(selectedCities);

  // Reset selection when city changes
  useEffect(() => {
    setSelectedCities([normalizedCityName]);
  }, [normalizedCityName]);

  const availableCities = useMemo(() => {
    return allCities.map(c => ({ name: c.name, slug: c.slug }));
  }, [allCities]);

  // Process data: group by year+quarter, average across room types per city
  const chartData = useMemo(() => {
    const dateMap = new Map<string, { name: string; sortKey: string; [key: string]: string | number }>();

    for (const row of rawData) {
      if (!row.avg_price_nis) continue;
      const dateKey = `${row.year}-Q${row.quarter}`;
      const displayKey = `${quarterLabels[row.quarter - 1]} ${row.year}`;

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { name: displayKey, sortKey: dateKey });
      }

      const entry = dateMap.get(dateKey)!;
      const cityKey = row.city_en.trim();
      
      // Average if multiple room types for same city+quarter
      if (entry[cityKey]) {
        entry[cityKey] = Math.round(((entry[cityKey] as number) + row.avg_price_nis) / 2);
      } else {
        entry[cityKey] = row.avg_price_nis;
      }
    }

    return Array.from(dateMap.values()).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [rawData]);

  // Filter based on period
  const filteredData = useMemo(() => {
    if (period === '2y') return chartData.slice(-8); // 8 quarters = 2 years
    if (period === '5y') return chartData.slice(-20); // 20 quarters = 5 years
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
                  <TabsTrigger value="2y" className="text-xs">2Y</TabsTrigger>
                  <TabsTrigger value="5y" className="text-xs">5Y</TabsTrigger>
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
