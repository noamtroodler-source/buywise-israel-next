import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Building2, Zap, Info } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { MarketData } from '@/types/projects';
import { CityCompareSelector, getComparisonColor, getComparisonTextClass } from './CityCompareSelector';

interface ComparisonData {
  city: string;
  data: MarketData[];
  propertiesCount: number;
}

interface MarketRealityTabsProps {
  marketData: MarketData[];
  cityName: string;
  propertiesCount: number;
  propertyTypes?: { name: string; value: number }[];
  comparisonData?: ComparisonData[];
  selectedCities?: string[];
  onCitiesChange?: (cities: string[]) => void;
}

const NATIONAL_AVG_PRICE_SQM = 32000; // National average for comparison

export function MarketRealityTabs({ 
  marketData, 
  cityName, 
  propertiesCount,
  propertyTypes = [],
  comparisonData = [],
  selectedCities = [],
  onCitiesChange
}: MarketRealityTabsProps) {
  const latestData = marketData[0];
  const pricePerSqm = latestData?.average_price_sqm || 0;
  const percentAboveNational = ((pricePerSqm - NATIONAL_AVG_PRICE_SQM) / NATIONAL_AVG_PRICE_SQM) * 100;
  
  const hasComparison = comparisonData.length > 0;

  // All cities data for comparison
  const allCitiesData = [
    { city: cityName, data: marketData, propertiesCount },
    ...comparisonData
  ];

  // Default property types if none provided
  const defaultPropertyTypes = [
    { name: 'Apartments', value: 65 },
    { name: 'Houses', value: 20 },
    { name: 'Penthouses', value: 10 },
    { name: 'Commercial', value: 5 },
  ];
  
  const typesData = propertyTypes.length > 0 ? propertyTypes : defaultPropertyTypes;
  const COLORS = ['hsl(213, 94%, 45%)', 'hsl(45, 100%, 51%)', 'hsl(142, 76%, 36%)', 'hsl(215, 16%, 47%)'];

  const getPricePosition = (percent: number) => {
    // Returns 0-100 position on affordability scale
    if (percent >= 70) return 95;
    if (percent >= 50) return 80;
    if (percent >= 30) return 65;
    if (percent >= 10) return 50;
    if (percent >= 0) return 40;
    if (percent >= -20) return 25;
    return 10;
  };

  const getMarketSpeed = (transactions: number) => {
    if (transactions > 400) return { label: 'Very Active', color: 'text-emerald-600', days: '30-45' };
    if (transactions > 200) return { label: 'Active', color: 'text-primary', days: '45-60' };
    if (transactions > 100) return { label: 'Moderate', color: 'text-amber-600', days: '60-90' };
    return { label: 'Slow', color: 'text-muted-foreground', days: '90+' };
  };

  const getCityStats = (data: MarketData[]) => {
    const latest = data[0];
    const price = latest?.average_price_sqm || 0;
    const percent = ((price - NATIONAL_AVG_PRICE_SQM) / NATIONAL_AVG_PRICE_SQM) * 100;
    const transactions = latest?.total_transactions || 0;
    return { price, percent, transactions, speed: getMarketSpeed(transactions) };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground mb-3">
            {hasComparison ? 'Market Comparison' : 'Market Reality'}
          </CardTitle>
          {onCitiesChange && (
            <CityCompareSelector
              currentCity={cityName}
              selectedCities={selectedCities}
              onCitiesChange={onCitiesChange}
              maxCities={3}
            />
          )}
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="prices" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted">
              <TabsTrigger value="prices" className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">Prices</span>
              </TabsTrigger>
              <TabsTrigger value="types" className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Types</span>
              </TabsTrigger>
              <TabsTrigger value="speed" className="flex items-center gap-1.5">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Speed</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="prices" className="mt-6 space-y-6">
              {hasComparison ? (
                // Comparison view - show all cities side by side
                <div className="space-y-4">
                  {allCitiesData.map((cityData, index) => {
                    const stats = getCityStats(cityData.data);
                    return (
                      <div key={cityData.city} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: getComparisonColor(index) }}
                            />
                            <span className="font-medium text-foreground">{cityData.city}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-foreground">
                              ₪{stats.price.toLocaleString()}/m²
                            </span>
                            <span className={`text-xs ml-2 ${stats.percent >= 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {stats.percent >= 0 ? '+' : ''}{stats.percent.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        {/* Mini affordability slider */}
                        <div className="relative h-2 rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500">
                          <div 
                            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 rounded-full shadow-sm transition-all"
                            style={{ 
                              left: `calc(${getPricePosition(stats.percent)}% - 6px)`,
                              borderColor: getComparisonColor(index)
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="flex justify-between text-xs text-muted-foreground pt-2">
                    <span>Affordable</span>
                    <span>Premium</span>
                  </div>
                </div>
              ) : (
                // Single city view
                <>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Average Price per Square Meter</p>
                    <p className="text-4xl font-bold text-foreground">
                      ₪{pricePerSqm.toLocaleString()}
                      <span className="text-lg font-normal text-muted-foreground">/m²</span>
                    </p>
                    <p className={`text-sm mt-2 font-medium ${percentAboveNational >= 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {percentAboveNational >= 0 ? '+' : ''}{percentAboveNational.toFixed(0)}% vs national average
                    </p>
                  </div>

                  {/* Affordability Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Affordable</span>
                      <span>Premium</span>
                    </div>
                    <div className="relative h-3 rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500">
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-foreground rounded-full shadow-lg transition-all"
                        style={{ left: `calc(${getPricePosition(percentAboveNational)}% - 8px)` }}
                      />
                    </div>
                  </div>

                  {/* Insight Card */}
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">What This Means For You</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {percentAboveNational > 50 
                            ? `${cityName} is a premium market. Expect higher prices but also strong property value retention.`
                            : percentAboveNational > 0
                              ? `${cityName} prices are above average. Look for value in emerging neighborhoods.`
                              : `${cityName} offers competitive pricing compared to major cities.`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="types" className="mt-6">
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {typesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => `${value}%`}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Apartments dominate</strong> {cityName}'s real estate market, 
                  typical for urban Israeli markets. Houses and penthouses command premium prices.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="speed" className="mt-6 space-y-6">
              {hasComparison ? (
                // Comparison view - grid of stats
                <div className="space-y-4">
                  {allCitiesData.map((cityData, index) => {
                    const stats = getCityStats(cityData.data);
                    return (
                      <div 
                        key={cityData.city} 
                        className="bg-muted/50 rounded-lg p-4"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: getComparisonColor(index) }}
                          />
                          <span className="font-medium text-foreground">{cityData.city}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div>
                            <p className={`text-lg font-bold ${stats.speed.color}`}>{stats.speed.label}</p>
                            <p className="text-xs text-muted-foreground">Activity</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-foreground">{stats.speed.days}</p>
                            <p className="text-xs text-muted-foreground">Days to Sell</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-foreground">{cityData.propertiesCount}</p>
                            <p className="text-xs text-muted-foreground">Listings</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Single city view
                <>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Market Activity Level</p>
                    <p className={`text-3xl font-bold ${getMarketSpeed(latestData?.total_transactions || 0).color}`}>
                      {getMarketSpeed(latestData?.total_transactions || 0).label}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-foreground">{propertiesCount}</p>
                      <p className="text-sm text-muted-foreground">Active Listings</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-foreground">{getMarketSpeed(latestData?.total_transactions || 0).days}</p>
                      <p className="text-sm text-muted-foreground">Avg. Days to Sell</p>
                    </div>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Zap className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">Market Insight</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {latestData?.total_transactions 
                            ? `With ${latestData.total_transactions} transactions last month, ${cityName} shows ${getMarketSpeed(latestData.total_transactions).label.toLowerCase()} market activity.`
                            : `${cityName} market data is being collected to provide accurate insights.`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}
