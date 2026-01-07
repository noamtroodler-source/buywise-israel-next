import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Home, Zap, Calendar, Percent, ChartLine, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MarketData } from '@/types/projects';
import { CanonicalMetrics, getRentalRange } from '@/hooks/useCanonicalMetrics';
import { HistoricalPrice, calculateCAGR } from '@/hooks/useHistoricalPrices';

// National average for context (Israel-wide benchmark)
const NATIONAL_AVG_PRICE_SQM = 22800;
const NATIONAL_AVG_YIELD = 2.8;

interface MarketStatsCardsProps {
  marketData: MarketData[];
  cityName: string;
  citySlug?: string;
  canonicalMetrics?: CanonicalMetrics | null;
  historicalPrices?: HistoricalPrice[];
  cityData?: {
    average_price_sqm?: number | null;
    median_apartment_price?: number | null;
    yoy_price_change?: number | null;
    rental_3_room_min?: number | null;
    rental_3_room_max?: number | null;
    rental_4_room_min?: number | null;
    rental_4_room_max?: number | null;
  };
}

const getMonthName = (month: number | null) => {
  if (!month) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[month - 1] || '';
};

export function MarketStatsCards({ marketData, cityName, citySlug, canonicalMetrics, historicalPrices = [], cityData }: MarketStatsCardsProps) {
  const [selectedRooms, setSelectedRooms] = useState<number>(3);
  
  const latestData = marketData[0];
  const previousData = marketData[1];
  
  // Priority: Canonical metrics > cityData > marketData
  const pricePerSqm = canonicalMetrics?.average_price_sqm 
    ?? cityData?.average_price_sqm 
    ?? latestData?.average_price_sqm 
    ?? null;
    
  const medianPrice = canonicalMetrics?.median_apartment_price 
    ?? cityData?.median_apartment_price 
    ?? latestData?.median_price 
    ?? null;
    
  const priceChange = canonicalMetrics?.yoy_price_change 
    ?? cityData?.yoy_price_change 
    ?? latestData?.price_change_percent 
    ?? null;

  // Investment metrics
  const grossYield = canonicalMetrics?.gross_yield_percent ?? null;
  
  // Calculate 10-year growth from historical prices
  const calculateGrowthMetrics = () => {
    if (historicalPrices.length < 2) return null;
    
    const sortedPrices = [...historicalPrices].sort((a, b) => a.year - b.year);
    const firstValidPrice = sortedPrices.find(p => p.average_price_sqm && p.average_price_sqm > 0);
    const lastValidPrice = sortedPrices.reverse().find(p => p.average_price_sqm && p.average_price_sqm > 0);
    
    if (!firstValidPrice || !lastValidPrice || firstValidPrice.year === lastValidPrice.year) return null;
    
    const startPrice = firstValidPrice.average_price_sqm!;
    const endPrice = lastValidPrice.average_price_sqm!;
    const years = lastValidPrice.year - firstValidPrice.year;
    
    const totalAppreciation = ((endPrice - startPrice) / startPrice) * 100;
    const cagr = calculateCAGR(startPrice, endPrice, years);
    
    return {
      totalAppreciation: Math.round(totalAppreciation),
      cagr,
      years,
      startYear: firstValidPrice.year,
      endYear: lastValidPrice.year,
    };
  };

  const growthMetrics = calculateGrowthMetrics();

  // What your budget buys - approximate sqm at median price
  const typicalSqm = (medianPrice && pricePerSqm && pricePerSqm > 0) 
    ? Math.round(medianPrice / pricePerSqm) 
    : null;

  // National context comparison
  const priceVsNational = pricePerSqm 
    ? Math.round(((pricePerSqm - NATIONAL_AVG_PRICE_SQM) / NATIONAL_AVG_PRICE_SQM) * 100) 
    : null;

  const yieldVsNational = grossYield 
    ? (grossYield - NATIONAL_AVG_YIELD).toFixed(1) 
    : null;

  const formatPrice = (value: number | null) => {
    if (!value) return 'N/A';
    return `₪${(value / 1000).toFixed(1)}K`;
  };

  const formatMedianPrice = (value: number | null) => {
    if (!value) return 'N/A';
    if (value >= 1000000) {
      return `₪${(value / 1000000).toFixed(2)}M`;
    }
    return `₪${(value / 1000).toFixed(0)}K`;
  };

  const formatRentalPrice = (value: number) => {
    return `₪${value.toLocaleString()}`;
  };

  // Get rental range - priority: canonical > cityData
  const getSelectedRentalRange = () => {
    // First try canonical metrics
    if (canonicalMetrics) {
      const range = getRentalRange(canonicalMetrics, selectedRooms);
      if (range.min && range.max) {
        return `${formatRentalPrice(range.min)}–${formatRentalPrice(range.max)}`;
      }
    }
    
    // Fallback to cityData for rooms 3 and 4
    if (selectedRooms === 3 && cityData?.rental_3_room_min && cityData?.rental_3_room_max) {
      return `${formatRentalPrice(cityData.rental_3_room_min)}–${formatRentalPrice(cityData.rental_3_room_max)}`;
    }
    if (selectedRooms === 4 && cityData?.rental_4_room_min && cityData?.rental_4_room_max) {
      return `${formatRentalPrice(cityData.rental_4_room_min)}–${formatRentalPrice(cityData.rental_4_room_max)}`;
    }
    
    return 'N/A';
  };

  const rentalPriceRange = getSelectedRentalRange();
  const dataDate = latestData ? `${getMonthName(latestData.month)} ${latestData.year}` : null;
  const isCanonicalData = !!canonicalMetrics;

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {(dataDate || isCanonicalData) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              {isCanonicalData 
                ? 'Data from verified research report (Q4 2024)' 
                : `Data from ${dataDate}`}
              {priceChange !== null && ' • Year-over-year change'}
            </span>
          </div>
        )}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Price per m² Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="overflow-hidden hover:shadow-lg transition-shadow border-border/50 bg-card">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                {priceChange !== null && (
                  <div className={`flex items-center text-xs font-medium ${
                    priceChange > 0 ? 'text-primary' : priceChange < 0 ? 'text-muted-foreground' : 'text-muted-foreground'
                  }`}>
                    {priceChange > 0 ? (
                      <TrendingUp className="h-3 w-3 mr-0.5" />
                    ) : priceChange < 0 ? (
                      <TrendingDown className="h-3 w-3 mr-0.5" />
                    ) : null}
                    {priceChange !== 0 && (
                      <span title="Year-over-Year">
                        {Math.abs(priceChange).toFixed(1)}%
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">{formatPrice(pricePerSqm)}</p>
                <p className="text-sm font-medium text-foreground/80">Price per m²</p>
                <p className="text-xs text-muted-foreground">Average asking price</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

          {/* Median Price Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow border-border/50 bg-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Home className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-foreground">{formatMedianPrice(medianPrice)}</p>
                  <p className="text-sm font-medium text-foreground/80">Median Price</p>
                  <p className="text-xs text-muted-foreground">
                    {typicalSqm ? `~${typicalSqm}m² at this price` : 'Typical property value'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

        {/* Rental Price Range Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="overflow-hidden hover:shadow-lg transition-shadow border-border/50 bg-card">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Home className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">{rentalPriceRange}</p>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedRooms.toString()}
                    onValueChange={(value) => setSelectedRooms(parseInt(value))}
                  >
                    <SelectTrigger className="h-7 w-auto min-w-[90px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4, 5].map((rooms) => (
                        <SelectItem key={rooms} value={rooms.toString()}>
                          {rooms} rooms
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">rent</span>
                </div>
                <p className="text-xs text-muted-foreground">Typical monthly rent</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

          {/* Gross Yield Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow border-border/50 bg-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Percent className="h-4 w-4 text-primary" />
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="p-1 rounded-full hover:bg-muted/50 transition-colors">
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[250px] text-xs">
                      <p>Annual rental income as a percentage of property value. Higher yield = better immediate returns. Israel average is ~{NATIONAL_AVG_YIELD}%.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-foreground">
                    {grossYield !== null ? `${grossYield.toFixed(1)}%` : 'N/A'}
                  </p>
                  <p className="text-sm font-medium text-foreground/80">Gross Yield</p>
                  <p className="text-xs text-muted-foreground">
                    {grossYield !== null && yieldVsNational 
                      ? `${parseFloat(yieldVsNational) >= 0 ? 'Above' : 'Below'} national avg`
                      : 'Annual rental return'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* 10-Year Growth Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow border-border/50 bg-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <ChartLine className="h-4 w-4 text-primary" />
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="p-1 rounded-full hover:bg-muted/50 transition-colors">
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[250px] text-xs">
                      <p>Total price appreciation over the past decade. CAGR (Compound Annual Growth Rate) shows average yearly growth accounting for compounding.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-foreground">
                    {growthMetrics ? `+${growthMetrics.totalAppreciation}%` : 'N/A'}
                  </p>
                  <p className="text-sm font-medium text-foreground/80">
                    {growthMetrics ? `${growthMetrics.years}-Year Growth` : '10-Year Growth'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {growthMetrics ? `${growthMetrics.cagr}% CAGR` : 'Long-term appreciation'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* YoY Trend Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow border-border/50 bg-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  {priceChange !== null && (
                    <div className={`flex items-center text-xs font-medium ${
                      priceChange > 0 ? 'text-primary' : priceChange < 0 ? 'text-muted-foreground' : 'text-muted-foreground'
                    }`}>
                      {priceChange > 0 ? (
                        <TrendingUp className="h-3 w-3 mr-0.5" />
                      ) : priceChange < 0 ? (
                        <TrendingDown className="h-3 w-3 mr-0.5" />
                      ) : null}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-foreground">
                    {priceChange !== null ? `${priceChange > 0 ? '+' : ''}${priceChange.toFixed(1)}%` : 'Stable'}
                  </p>
                  <p className="text-sm font-medium text-foreground/80">YoY Trend</p>
                  <p className="text-xs text-muted-foreground">Current momentum</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* National Context Benchmark */}
        {priceVsNational !== null && (
          <div className="text-sm text-muted-foreground text-center pt-2 border-t border-border/30">
            {cityName} prices are{' '}
            <span className={priceVsNational > 0 ? 'font-medium text-foreground' : 'font-medium text-primary'}>
              {priceVsNational > 0 ? `${priceVsNational}% above` : `${Math.abs(priceVsNational)}% below`}
            </span>
            {' '}the national average of ₪{(NATIONAL_AVG_PRICE_SQM / 1000).toFixed(1)}K/m²
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
