import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Building2, Zap, ArrowRight, Info } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { MarketData } from '@/types/projects';
import { Link } from 'react-router-dom';

interface MarketRealityTabsProps {
  marketData: MarketData[];
  cityName: string;
  propertiesCount: number;
  propertyTypes?: { name: string; value: number }[];
}

const NATIONAL_AVG_PRICE_SQM = 32000; // National average for comparison

export function MarketRealityTabs({ 
  marketData, 
  cityName, 
  propertiesCount,
  propertyTypes = []
}: MarketRealityTabsProps) {
  const latestData = marketData[0];
  const pricePerSqm = latestData?.average_price_sqm || 0;
  const percentAboveNational = ((pricePerSqm - NATIONAL_AVG_PRICE_SQM) / NATIONAL_AVG_PRICE_SQM) * 100;
  
  // Default property types if none provided
  const defaultPropertyTypes = [
    { name: 'Apartments', value: 65 },
    { name: 'Houses', value: 20 },
    { name: 'Penthouses', value: 10 },
    { name: 'Commercial', value: 5 },
  ];
  
  const typesData = propertyTypes.length > 0 ? propertyTypes : defaultPropertyTypes;
  const COLORS = ['hsl(213, 94%, 45%)', 'hsl(45, 100%, 51%)', 'hsl(142, 76%, 36%)', 'hsl(215, 16%, 47%)'];

  const getPricePosition = () => {
    // Returns 0-100 position on affordability scale
    if (percentAboveNational >= 70) return 95;
    if (percentAboveNational >= 50) return 80;
    if (percentAboveNational >= 30) return 65;
    if (percentAboveNational >= 10) return 50;
    if (percentAboveNational >= 0) return 40;
    if (percentAboveNational >= -20) return 25;
    return 10;
  };

  const getMarketSpeed = () => {
    const transactions = latestData?.total_transactions || 0;
    if (transactions > 400) return { label: 'Very Active', color: 'text-emerald-600', days: '30-45' };
    if (transactions > 200) return { label: 'Active', color: 'text-primary', days: '45-60' };
    if (transactions > 100) return { label: 'Moderate', color: 'text-amber-600', days: '60-90' };
    return { label: 'Slow', color: 'text-muted-foreground', days: '90+' };
  };

  const marketSpeed = getMarketSpeed();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground">Market Reality</CardTitle>
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
                    style={{ left: `calc(${getPricePosition()}% - 8px)` }}
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

              <Button variant="outline" className="w-full" asChild>
                <Link to="/areas">
                  Compare Cities
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
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
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Market Activity Level</p>
                <p className={`text-3xl font-bold ${marketSpeed.color}`}>
                  {marketSpeed.label}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{propertiesCount}</p>
                  <p className="text-sm text-muted-foreground">Active Listings</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{marketSpeed.days}</p>
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
                        ? `With ${latestData.total_transactions} transactions last month, ${cityName} shows ${marketSpeed.label.toLowerCase()} market activity.`
                        : `${cityName} market data is being collected to provide accurate insights.`
                      }
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}
