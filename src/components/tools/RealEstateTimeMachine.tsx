import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Simulated historical data
const historicalData: Record<string, { year: number; price: number }[]> = {
  'tel-aviv': [
    { year: 2015, price: 32000 },
    { year: 2016, price: 35000 },
    { year: 2017, price: 38000 },
    { year: 2018, price: 40000 },
    { year: 2019, price: 42000 },
    { year: 2020, price: 43000 },
    { year: 2021, price: 50000 },
    { year: 2022, price: 58000 },
    { year: 2023, price: 55000 },
    { year: 2024, price: 57000 },
  ],
  'jerusalem': [
    { year: 2015, price: 28000 },
    { year: 2016, price: 30000 },
    { year: 2017, price: 32000 },
    { year: 2018, price: 33000 },
    { year: 2019, price: 35000 },
    { year: 2020, price: 36000 },
    { year: 2021, price: 42000 },
    { year: 2022, price: 48000 },
    { year: 2023, price: 46000 },
    { year: 2024, price: 47000 },
  ],
  'haifa': [
    { year: 2015, price: 15000 },
    { year: 2016, price: 16000 },
    { year: 2017, price: 17000 },
    { year: 2018, price: 18000 },
    { year: 2019, price: 19000 },
    { year: 2020, price: 20000 },
    { year: 2021, price: 24000 },
    { year: 2022, price: 28000 },
    { year: 2023, price: 27000 },
    { year: 2024, price: 28000 },
  ],
  'beer-sheva': [
    { year: 2015, price: 10000 },
    { year: 2016, price: 11000 },
    { year: 2017, price: 12000 },
    { year: 2018, price: 13000 },
    { year: 2019, price: 14000 },
    { year: 2020, price: 15000 },
    { year: 2021, price: 18000 },
    { year: 2022, price: 21000 },
    { year: 2023, price: 20000 },
    { year: 2024, price: 21000 },
  ],
  'netanya': [
    { year: 2015, price: 18000 },
    { year: 2016, price: 20000 },
    { year: 2017, price: 22000 },
    { year: 2018, price: 24000 },
    { year: 2019, price: 25000 },
    { year: 2020, price: 26000 },
    { year: 2021, price: 32000 },
    { year: 2022, price: 38000 },
    { year: 2023, price: 36000 },
    { year: 2024, price: 37000 },
  ],
};

const cities = [
  { value: 'tel-aviv', label: 'Tel Aviv' },
  { value: 'jerusalem', label: 'Jerusalem' },
  { value: 'haifa', label: 'Haifa' },
  { value: 'beer-sheva', label: 'Beer Sheva' },
  { value: 'netanya', label: 'Netanya' },
];

export function RealEstateTimeMachine() {
  const [selectedCity, setSelectedCity] = useState('tel-aviv');
  const [compareCity, setCompareCity] = useState<string | null>(null);

  const cityData = historicalData[selectedCity] || [];
  const compareCityData = compareCity ? historicalData[compareCity] : null;

  const stats = useMemo(() => {
    if (cityData.length < 2) return null;
    
    const firstPrice = cityData[0].price;
    const lastPrice = cityData[cityData.length - 1].price;
    const totalChange = ((lastPrice - firstPrice) / firstPrice) * 100;
    const avgYearlyChange = totalChange / (cityData.length - 1);
    
    const lastYearPrice = cityData[cityData.length - 2]?.price || firstPrice;
    const yearOverYear = ((lastPrice - lastYearPrice) / lastYearPrice) * 100;

    // Peak and trough
    const prices = cityData.map(d => d.price);
    const peak = Math.max(...prices);
    const trough = Math.min(...prices);

    return {
      totalChange,
      avgYearlyChange,
      yearOverYear,
      peak,
      trough,
      currentPrice: lastPrice,
    };
  }, [cityData]);

  const chartData = useMemo(() => {
    return cityData.map((d) => {
      const comparePoint = compareCityData?.find(c => c.year === d.year);
      return {
        year: d.year,
        [selectedCity]: d.price,
        ...(comparePoint ? { [compareCity!]: comparePoint.price } : {}),
      };
    });
  }, [cityData, compareCityData, selectedCity, compareCity]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getCityLabel = (value: string) => cities.find(c => c.value === value)?.label || value;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Real Estate Time Machine
        </CardTitle>
        <CardDescription>
          Explore historical price trends across Israeli cities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Select City</Label>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.value} value={city.value}>
                    {city.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Compare With (Optional)</Label>
            <Select value={compareCity || 'none'} onValueChange={(v) => setCompareCity(v === 'none' ? null : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select city to compare" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {cities.filter(c => c.value !== selectedCity).map((city) => (
                  <SelectItem key={city.value} value={city.value}>
                    {city.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="year" className="text-xs" />
              <YAxis 
                className="text-xs"
                tickFormatter={(value) => `₪${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => `Year: ${label}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey={selectedCity} 
                name={getCityLabel(selectedCity)}
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
              {compareCity && (
                <Line 
                  type="monotone" 
                  dataKey={compareCity} 
                  name={getCityLabel(compareCity)}
                  stroke="hsl(var(--secondary-foreground))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: 'hsl(var(--secondary-foreground))' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted text-center">
              <p className="text-2xl font-bold">{formatCurrency(stats.currentPrice)}</p>
              <p className="text-sm text-muted-foreground">Current ₪/sqm</p>
            </div>
            
            <div className="p-4 rounded-lg bg-muted text-center">
              <div className="flex items-center justify-center gap-1">
                {stats.yearOverYear > 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-500" />
                ) : stats.yearOverYear < 0 ? (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                ) : (
                  <Minus className="h-5 w-5 text-muted-foreground" />
                )}
                <p className={`text-2xl font-bold ${stats.yearOverYear > 0 ? 'text-green-500' : stats.yearOverYear < 0 ? 'text-red-500' : ''}`}>
                  {stats.yearOverYear > 0 ? '+' : ''}{stats.yearOverYear.toFixed(1)}%
                </p>
              </div>
              <p className="text-sm text-muted-foreground">Year over Year</p>
            </div>

            <div className="p-4 rounded-lg bg-muted text-center">
              <p className="text-2xl font-bold text-primary">+{stats.totalChange.toFixed(0)}%</p>
              <p className="text-sm text-muted-foreground">Total Growth (10yr)</p>
            </div>

            <div className="p-4 rounded-lg bg-muted text-center">
              <p className="text-2xl font-bold">+{stats.avgYearlyChange.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Avg. Yearly</p>
            </div>
          </div>
        )}

        <p className="text-sm text-muted-foreground text-center">
          * Prices shown are average per square meter. Historical data is simulated for demonstration purposes.
        </p>
      </CardContent>
    </Card>
  );
}
