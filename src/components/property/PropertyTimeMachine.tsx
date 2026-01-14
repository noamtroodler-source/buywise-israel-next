import { useMemo, useState, useEffect } from 'react';
import { Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useHistoricalPrices, calculateCAGR } from '@/hooks/useHistoricalPrices';
import { useFormatPrice } from '@/contexts/PreferencesContext';
import { Skeleton } from '@/components/ui/skeleton';

interface PropertyTimeMachineProps {
  salePrice: number;
  city: string;
  sizeSqm?: number | null;
  listingStatus?: 'for_sale' | 'sold' | 'for_rent';
}

export function PropertyTimeMachine({ salePrice, city, sizeSqm, listingStatus = 'sold' }: PropertyTimeMachineProps) {
  const formatPrice = useFormatPrice();
  const citySlug = city.toLowerCase().replace(/\s+/g, '-');
  
  // Fetch ALL historical data (no year limit)
  const { data: historicalPrices, isLoading } = useHistoricalPrices(citySlug);
  
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // Derive available years from data
  const availableYears = useMemo(() => {
    if (!historicalPrices) return [];
    return historicalPrices
      .filter(hp => hp.average_price_sqm || hp.average_price)
      .map(hp => hp.year)
      .sort((a, b) => a - b);
  }, [historicalPrices]);

  // Default to oldest available year
  useEffect(() => {
    if (availableYears.length && !selectedYear) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  const currentYear = new Date().getFullYear();
  const AVG_APARTMENT_SIZE = 90;

  const analysis = useMemo(() => {
    if (!selectedYear || !historicalPrices?.length || !sizeSqm) return null;

    const historicalData = historicalPrices.find(hp => hp.year === selectedYear);
    if (!historicalData) return null;

    const historicalPriceSqm = historicalData.average_price_sqm || 
      (historicalData.average_price || 0) / AVG_APARTMENT_SIZE;
    
    if (!historicalPriceSqm) return null;

    const estimatedHistoricalPrice = Math.round(historicalPriceSqm * sizeSqm);
    const yearsHeld = currentYear - selectedYear;
    const totalAppreciation = salePrice - estimatedHistoricalPrice;
    const totalAppreciationPercent = ((salePrice - estimatedHistoricalPrice) / estimatedHistoricalPrice) * 100;
    const cagr = calculateCAGR(estimatedHistoricalPrice, salePrice, yearsHeld);

    return {
      estimatedHistoricalPrice,
      yearsHeld,
      totalAppreciation,
      totalAppreciationPercent,
      cagr,
    };
  }, [selectedYear, historicalPrices, salePrice, sizeSqm, currentYear]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!sizeSqm || availableYears.length < 2) {
    return null;
  }

  // Dynamic framing based on listing status
  const isSold = listingStatus === 'sold';
  const priceLabel = isSold ? 'sold for' : 'listed at';
  const hypotheticalPrefix = isSold ? '' : 'If a similar property was ';

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-primary" />
          Historical Value Context
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">
          This property {priceLabel} <span className="font-semibold text-foreground">{formatPrice(salePrice)}</span>.{' '}
          {hypotheticalPrefix}See what it might have cost in past years based on {city} averages:
        </p>

        {/* Year Selector Slider */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{availableYears[0]}</span>
            <span className="font-semibold text-primary text-lg">{selectedYear}</span>
            <span className="text-muted-foreground">{availableYears[availableYears.length - 1]}</span>
          </div>
          <Slider
            value={[selectedYear || availableYears[0]]}
            onValueChange={([value]) => setSelectedYear(value)}
            min={availableYears[0]}
            max={availableYears[availableYears.length - 1]}
            step={1}
            className="w-full"
          />
          <p className="text-xs text-center text-muted-foreground">
            Drag to explore different years
          </p>
        </div>

        {/* Results */}
        {analysis && (
          <>
            {/* Appreciation summary */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    {isSold ? 'If purchased' : 'If bought'} in <span className="font-semibold">{selectedYear}</span> at an estimated{' '}
                    <span className="font-semibold">{formatPrice(analysis.estimatedHistoricalPrice)}</span>,{' '}
                    it would have appreciated{' '}
                    <span className="font-semibold text-primary">{formatPrice(analysis.totalAppreciation)}</span>{' '}
                    <span className="text-muted-foreground">(+{analysis.totalAppreciationPercent.toFixed(0)}%)</span>{' '}
                    in {analysis.yearsHeld} years.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Compound annual growth rate: <span className="font-medium">{analysis.cagr.toFixed(1)}%</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Quick comparison cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/50 text-center border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Est. {selectedYear} price</p>
                <p className="font-semibold">{formatPrice(analysis.estimatedHistoricalPrice)}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10 text-center border border-primary/20">
                <p className="text-xs text-muted-foreground mb-1">Today's price</p>
                <p className="font-semibold text-primary">{formatPrice(salePrice)}</p>
              </div>
            </div>
          </>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground italic">
          Estimates based on {city} city-wide averages. Actual values vary significantly by neighborhood and property condition.
        </p>

        {/* Link to city market page */}
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link to={`/areas/${citySlug}`}>
            Explore {city} Market Data
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
