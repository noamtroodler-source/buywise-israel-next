import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { DollarSign, Building2, Receipt, Info, Plus, X, Search } from 'lucide-react';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';
import { MarketData } from '@/types/projects';
import { useCities } from '@/hooks/useCities';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface MarketRealityTabsProps {
  marketData: MarketData[];
  cityName: string;
  citySlug?: string;
  propertyTypes?: { name: string; value: number }[];
  arnonaRateSqm?: number | null;
}

const NATIONAL_AVG_PRICE_SQM = 32000; // National average for comparison
const NATIONAL_AVG_ARNONA = 25; // National average arnona rate per sqm

export function MarketRealityTabs({ 
  marketData, 
  cityName, 
  citySlug = '',
  propertyTypes = [],
  arnonaRateSqm
}: MarketRealityTabsProps) {
  const [apartmentSize, setApartmentSize] = useState(80);
  const [selectedCities, setSelectedCities] = useState<string[]>([cityName]);
  const [searchQuery, setSearchQuery] = useState('');
  const [popoverOpen, setPopoverOpen] = useState(false);
  
  const { data: allCities = [] } = useCities();
  
  const latestData = marketData[0];
  const pricePerSqm = latestData?.average_price_sqm || 0;
  const percentAboveNational = ((pricePerSqm - NATIONAL_AVG_PRICE_SQM) / NATIONAL_AVG_PRICE_SQM) * 100;
  
  // Get comparison cities data
  const comparisonCities = useMemo(() => {
    return selectedCities.map(cityNameItem => {
      const cityData = allCities.find(c => c.name === cityNameItem);
      return {
        name: cityNameItem,
        pricePerSqm: cityData?.average_price_sqm || 0,
        isCurrent: cityNameItem === cityName
      };
    }).filter(c => c.pricePerSqm > 0);
  }, [selectedCities, allCities, cityName]);

  const maxPrice = Math.max(...comparisonCities.map(c => c.pricePerSqm), pricePerSqm);

  // Filtered cities for search
  const filteredCities = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return allCities
      .filter(c => c.name.toLowerCase().includes(query))
      .sort((a, b) => {
        // Current city first, then selected cities, then alphabetically
        if (a.name === cityName) return -1;
        if (b.name === cityName) return 1;
        const aSelected = selectedCities.includes(a.name);
        const bSelected = selectedCities.includes(b.name);
        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [allCities, searchQuery, selectedCities, cityName]);

  const handleCityToggle = (cityNameItem: string) => {
    if (cityNameItem === cityName) return; // Can't deselect current city
    setSelectedCities(prev => {
      if (prev.includes(cityNameItem)) {
        return prev.filter(c => c !== cityNameItem);
      }
      if (prev.length >= 3) return prev; // Max 3 cities
      return [...prev, cityNameItem];
    });
  };

  const handleRemoveCity = (cityNameItem: string) => {
    if (cityNameItem === cityName) return;
    setSelectedCities(prev => prev.filter(c => c !== cityNameItem));
  };
  
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

  const getPricePosition = (priceVal: number) => {
    // Returns 0-100 position on affordability scale based on price vs national average
    const percentAbove = ((priceVal - NATIONAL_AVG_PRICE_SQM) / NATIONAL_AVG_PRICE_SQM) * 100;
    if (percentAbove >= 70) return 95;
    if (percentAbove >= 50) return 80;
    if (percentAbove >= 30) return 65;
    if (percentAbove >= 10) return 50;
    if (percentAbove >= 0) return 40;
    if (percentAbove >= -20) return 25;
    return 10;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      {/* Section Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground">Market Reality</h2>
        <p className="text-muted-foreground mt-1">What the numbers say about {cityName}</p>
      </div>

      {/* Full-width Tabs */}
      <Tabs defaultValue="prices" className="w-full">
        <TabsList className="w-full max-w-md grid grid-cols-3 bg-muted mb-8">
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
                <p className={`text-sm mt-2 font-medium ${percentAboveNational >= 0 ? 'text-amber-600' : 'text-primary'}`}>
                  {percentAboveNational >= 0 ? '+' : ''}{percentAboveNational.toFixed(0)}% vs national average
                </p>
              </div>

              {/* Affordability Slider with Comparison Markers */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Affordable</span>
                  <span>Premium</span>
                </div>
                <div className="relative h-3 rounded-full bg-gradient-to-r from-primary via-amber-500 to-red-500">
                  <TooltipProvider delayDuration={0}>
                    {/* Current city marker - always visible and highlighted */}
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <div 
                          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 border-primary rounded-full shadow-lg transition-all z-20 cursor-pointer ring-2 ring-primary/30"
                          style={{ left: `calc(${getPricePosition(pricePerSqm)}% - 10px)` }}
                        />
                      </TooltipTrigger>
                      <TooltipContent className="bg-background border-border">
                        <p className="font-medium">{cityName}</p>
                        <p className="text-primary">₪{pricePerSqm.toLocaleString()}/m²</p>
                      </TooltipContent>
                    </UITooltip>
                    
                    {/* Comparison city markers */}
                    {comparisonCities.filter(c => !c.isCurrent).map((city) => (
                      <UITooltip key={city.name}>
                        <TooltipTrigger asChild>
                          <div 
                            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-muted border-2 border-muted-foreground/60 rounded-full shadow transition-all cursor-pointer hover:scale-110 z-10"
                            style={{ left: `calc(${getPricePosition(city.pricePerSqm)}% - 8px)` }}
                          />
                        </TooltipTrigger>
                        <TooltipContent className="bg-background border-border">
                          <p className="font-medium">{city.name}</p>
                          <p className="text-muted-foreground">₪{city.pricePerSqm.toLocaleString()}/m²</p>
                        </TooltipContent>
                      </UITooltip>
                    ))}
                  </TooltipProvider>
                </div>
              </div>

              {/* City Price Comparison */}
              <div className="space-y-3">
                {/* Selected cities badges and add button */}
                <div className="flex flex-wrap items-center gap-2">
                  {selectedCities.map((city) => (
                    <Badge 
                      key={city} 
                      variant={city === cityName ? "default" : "secondary"}
                      className="flex items-center gap-1"
                    >
                      {city}
                      {city === cityName ? (
                        <span className="text-xs opacity-70 ml-1">(current)</span>
                      ) : (
                        <button 
                          onClick={() => handleRemoveCity(city)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                  
                  {selectedCities.length < 3 && (
                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-6 px-2 text-xs gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          Compare City
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-0 bg-background border-border z-50" align="start">
                        <div className="p-2 border-b border-border">
                          <div className="flex items-center gap-2 px-2">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search cities..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="h-8 border-0 p-0 focus-visible:ring-0"
                            />
                          </div>
                        </div>
                        <div className="max-h-[250px] overflow-y-auto">
                          {filteredCities.map((city) => {
                            const isSelected = selectedCities.includes(city.name);
                            const isCurrent = city.name === cityName;
                            const isDisabled = isCurrent || (selectedCities.length >= 3 && !isSelected);
                            
                            return (
                              <div
                                key={city.id}
                                className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50 ${
                                  isDisabled ? 'opacity-50' : ''
                                }`}
                                onClick={() => !isDisabled && handleCityToggle(city.name)}
                              >
                                <Checkbox 
                                  checked={isSelected}
                                  disabled={isDisabled}
                                  className="pointer-events-none"
                                />
                                <span className="flex-1">{city.name}</span>
                                {isCurrent && (
                                  <span className="text-xs text-muted-foreground">(current)</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>

              </div>

              {/* Insight Card */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">What This Means For You</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {comparisonCities.length > 1 
                        ? (() => {
                            const sortedCities = [...comparisonCities].sort((a, b) => b.pricePerSqm - a.pricePerSqm);
                            const currentRank = sortedCities.findIndex(c => c.isCurrent) + 1;
                            if (currentRank === 1) {
                              return `${cityName} has the highest prices among selected cities. Consider looking at ${sortedCities[1]?.name} for more affordable options.`;
                            }
                            return `${cityName} is ${currentRank === sortedCities.length ? 'the most affordable' : `#${currentRank}`} among selected cities.`;
                          })()
                        : percentAboveNational > 50 
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
                    <RechartsTooltip 
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
                <div className="flex items-center justify-center gap-1.5 mb-2">
                  <p className="text-sm text-muted-foreground">Estimated Monthly Arnona</p>
                  <TooltipProvider delayDuration={0}>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[260px] bg-background border-border">
                        <p className="font-medium mb-1">About Arnona</p>
                        <p className="text-xs text-muted-foreground">
                          Israel's municipal property tax, paid by residents to fund local services. 
                          Rates vary by city and property size. New olim may qualify for discounts.
                        </p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </div>
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
                  <span className={`text-sm font-medium ${arnonaVsNational > 0 ? 'text-amber-600' : 'text-primary'}`}>
                    {arnonaVsNational > 0 ? '+' : ''}{arnonaVsNational.toFixed(0)}%
                  </span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
    </motion.div>
  );
}
