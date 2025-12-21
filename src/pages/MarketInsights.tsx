import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, MapPin, BarChart3, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLatestMarketData, useCityComparison } from '@/hooks/useMarketData';
import { useCities } from '@/hooks/useCities';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

const ISRAELI_CITIES = ['Tel Aviv', 'Jerusalem', 'Haifa', 'Netanya', 'Herzliya', 'Ra\'anana', 'Ashdod', 'Beer Sheva'];

export default function MarketInsights() {
  const [selectedCities, setSelectedCities] = useState<string[]>(['Tel Aviv', 'Jerusalem']);
  const { data: latestData = [], isLoading: latestLoading } = useLatestMarketData();
  const { data: comparisonData = [] } = useCityComparison(selectedCities);
  const { data: cities = [] } = useCities();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatPriceShort = (price: number) => {
    if (price >= 1000000) return `₪${(price / 1000000).toFixed(1)}M`;
    if (price >= 1000) return `₪${(price / 1000).toFixed(0)}K`;
    return `₪${price}`;
  };

  // Group latest data by city for comparison cards
  const cityStats = latestData.reduce((acc, item) => {
    if (!acc[item.city]) {
      acc[item.city] = item;
    }
    return acc;
  }, {} as Record<string, typeof latestData[0]>);

  // Prepare chart data
  const chartData = comparisonData.reduce((acc, item) => {
    const key = `${item.year}-${String(item.month || 1).padStart(2, '0')}`;
    if (!acc[key]) {
      acc[key] = { date: key };
    }
    acc[key][item.city] = item.average_price_sqm;
    return acc;
  }, {} as Record<string, any>);

  const chartDataArray = Object.values(chartData).sort((a: any, b: any) => 
    a.date.localeCompare(b.date)
  );

  const handleCityToggle = (city: string) => {
    setSelectedCities(prev => 
      prev.includes(city) 
        ? prev.filter(c => c !== city)
        : [...prev, city].slice(-4) // Max 4 cities
    );
  };

  return (
    <Layout>
      <div className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold text-foreground">Market Insights</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Track real estate market trends and compare prices across different cities in Israel.
            </p>
          </div>

          {/* City Stats Cards */}
          {latestLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : Object.keys(cityStats).length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">No market data yet</h2>
                <p className="text-muted-foreground">
                  Market insights will be available once data is added.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(cityStats).slice(0, 8).map(([city, data]) => (
                <Card key={city} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm">{city}</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">
                          {formatPriceShort(data.average_price_sqm || 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">per m²</p>
                      </div>
                      {data.price_change_percent && (
                        <div className={`flex items-center gap-0.5 text-sm font-medium ${
                          data.price_change_percent >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {data.price_change_percent >= 0 ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4" />
                          )}
                          {Math.abs(data.price_change_percent).toFixed(1)}%
                        </div>
                      )}
                    </div>
                    {data.median_price && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground">Median Price</p>
                        <p className="font-semibold">{formatPrice(data.median_price)}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* City Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                City Comparison
              </CardTitle>
              <CardDescription>
                Compare price trends across different cities (select up to 4)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* City Selector */}
              <div className="flex flex-wrap gap-2">
                {ISRAELI_CITIES.map((city) => (
                  <button
                    key={city}
                    onClick={() => handleCityToggle(city)}
                    className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                      selectedCities.includes(city)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>

              {/* Chart */}
              {chartDataArray.length > 0 ? (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartDataArray}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `₪${(value / 1000).toFixed(0)}K`}
                        className="text-muted-foreground"
                      />
                      <Tooltip 
                        formatter={(value: number) => [formatPriceShort(value), 'Price/m²']}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      {selectedCities.map((city, index) => {
                        const colors = ['#0066CC', '#FFB800', '#10B981', '#8B5CF6'];
                        return (
                          <Area
                            key={city}
                            type="monotone"
                            dataKey={city}
                            stroke={colors[index % colors.length]}
                            fill={colors[index % colors.length]}
                            fillOpacity={0.1}
                            strokeWidth={2}
                          />
                        );
                      })}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[400px] flex items-center justify-center bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground">Select cities to compare price trends</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-muted/50">
            <CardContent className="p-6">
              <h3 className="font-semibold text-foreground mb-2">About This Data</h3>
              <p className="text-sm text-muted-foreground">
                Market data is compiled from various public sources and represents general market trends. 
                Actual property prices may vary based on specific location, condition, and other factors. 
                Always consult with a licensed real estate professional for accurate property valuations.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
