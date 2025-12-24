import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { DollarSign, Building2, Receipt, Info } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { MarketData } from '@/types/projects';

interface MarketRealityTabsProps {
  marketData: MarketData[];
  cityName: string;
  propertyTypes?: { name: string; value: number }[];
  arnonaRateSqm?: number | null;
}

const NATIONAL_AVG_PRICE_SQM = 32000; // National average for comparison
const NATIONAL_AVG_ARNONA = 25; // National average arnona rate per sqm

export function MarketRealityTabs({ 
  marketData, 
  cityName, 
  propertyTypes = [],
  arnonaRateSqm
}: MarketRealityTabsProps) {
  const [apartmentSize, setApartmentSize] = useState(80);
  
  const latestData = marketData[0];
  const pricePerSqm = latestData?.average_price_sqm || 0;
  const percentAboveNational = ((pricePerSqm - NATIONAL_AVG_PRICE_SQM) / NATIONAL_AVG_PRICE_SQM) * 100;
  
  // Arnona calculations
  const rate = arnonaRateSqm || NATIONAL_AVG_ARNONA;
  const monthlyEstimate = Math.round((rate * apartmentSize) / 12);
  const annualEstimate = Math.round(rate * apartmentSize);
  const arnonaVsNational = ((rate - NATIONAL_AVG_ARNONA) / NATIONAL_AVG_ARNONA) * 100;
  
  // Default listing types if none provided
  const defaultListingTypes = [
    { name: 'Resell', value: 55 },
    { name: 'Projects', value: 30 },
    { name: 'Long-term Rentals', value: 15 },
  ];
  
  const typesData = propertyTypes.length > 0 ? propertyTypes : defaultListingTypes;
  const COLORS = ['hsl(213, 94%, 45%)', 'hsl(142, 76%, 36%)', 'hsl(45, 100%, 51%)'];

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
              <TabsTrigger value="living" className="flex items-center gap-1.5">
                <Receipt className="h-4 w-4" />
                <span className="hidden sm:inline">Arnona</span>
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
                  <strong className="text-foreground">Resell properties lead</strong> {cityName}'s market. 
                  New projects offer modern options, while long-term rentals provide flexibility.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="living" className="mt-6 space-y-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Estimated Monthly Arnona</p>
                <p className="text-4xl font-bold text-foreground">
                  ₪{monthlyEstimate.toLocaleString()}
                  <span className="text-lg font-normal text-muted-foreground">/month</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  ₪{annualEstimate.toLocaleString()} annually
                </p>
              </div>

              {/* Size Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Apartment Size</span>
                  <span className="text-sm font-medium text-foreground">{apartmentSize} m²</span>
                </div>
                <Slider
                  value={[apartmentSize]}
                  onValueChange={(value) => setApartmentSize(value[0])}
                  min={40}
                  max={200}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>40 m²</span>
                  <span>200 m²</span>
                </div>
              </div>

              {/* Comparison */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Rate per m²</span>
                  <span className="font-medium text-foreground">₪{rate.toFixed(0)}/m²</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-muted-foreground">vs National Avg</span>
                  <span className={`text-sm font-medium ${arnonaVsNational > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {arnonaVsNational > 0 ? '+' : ''}{arnonaVsNational.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Insight Card */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">About Arnona</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Arnona is Israel's municipal property tax, paid by residents to fund local services. 
                      Rates vary by city and property size. New olim may qualify for discounts.
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
