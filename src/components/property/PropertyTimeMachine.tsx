import { useMemo } from 'react';
import { Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useHistoricalPrices, calculateCAGR } from '@/hooks/useHistoricalPrices';
import { useFormatPrice } from '@/contexts/PreferencesContext';
import { Skeleton } from '@/components/ui/skeleton';

interface PropertyTimeMachineProps {
  salePrice: number;
  city: string;
  sizeSqm?: number | null;
}

export function PropertyTimeMachine({ salePrice, city, sizeSqm }: PropertyTimeMachineProps) {
  const formatPrice = useFormatPrice();
  const citySlug = city.toLowerCase().replace(/\s+/g, '-');
  const { data: historicalPrices, isLoading } = useHistoricalPrices(citySlug, 10);

  const analysis = useMemo(() => {
    if (!historicalPrices || historicalPrices.length < 2 || !sizeSqm) return null;

    const currentYear = new Date().getFullYear();
    const currentPriceSqm = salePrice / sizeSqm;

    // Calculate what the property would have cost in past years
    const yearlyPrices = historicalPrices
      .filter(hp => hp.average_price_sqm && hp.year < currentYear)
      .map(hp => ({
        year: hp.year,
        estimatedPrice: Math.round((hp.average_price_sqm || 0) * sizeSqm),
        priceSqm: hp.average_price_sqm || 0,
      }))
      .slice(-5); // Last 5 years of historical data

    if (yearlyPrices.length === 0) return null;

    // Find the oldest year with data for appreciation calculation
    const oldestData = yearlyPrices[0];
    const yearsHeld = currentYear - oldestData.year;
    const totalAppreciation = salePrice - oldestData.estimatedPrice;
    const totalAppreciationPercent = ((salePrice - oldestData.estimatedPrice) / oldestData.estimatedPrice) * 100;
    const cagr = calculateCAGR(oldestData.estimatedPrice, salePrice, yearsHeld);

    return {
      yearlyPrices,
      oldestYear: oldestData.year,
      oldestPrice: oldestData.estimatedPrice,
      totalAppreciation,
      totalAppreciationPercent,
      cagr,
      yearsHeld,
    };
  }, [historicalPrices, salePrice, sizeSqm]);

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

  if (!analysis || !sizeSqm) {
    return null;
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-primary" />
          Real Estate Time Machine
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This property sold for <span className="font-semibold text-foreground">{formatPrice(salePrice)}</span>. 
          See what it would have cost in previous years:
        </p>

        {/* Historical price cards */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {analysis.yearlyPrices.map((yp) => {
            const diff = ((salePrice - yp.estimatedPrice) / yp.estimatedPrice) * 100;
            return (
              <div 
                key={yp.year} 
                className="p-3 rounded-lg bg-muted/50 text-center border border-border/50"
              >
                <p className="text-xs text-muted-foreground mb-1">{yp.year}</p>
                <p className="font-semibold text-sm">{formatPrice(yp.estimatedPrice)}</p>
                <p className="text-xs text-green-600 dark:text-green-400">+{diff.toFixed(0)}%</p>
              </div>
            );
          })}
        </div>

        {/* Appreciation summary */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm">
                If purchased in <span className="font-semibold">{analysis.oldestYear}</span>, this property would have appreciated{' '}
                <span className="font-semibold text-primary">{formatPrice(analysis.totalAppreciation)}</span>{' '}
                <span className="text-muted-foreground">(+{analysis.totalAppreciationPercent.toFixed(0)}%)</span> in {analysis.yearsHeld} years.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                CAGR: {analysis.cagr.toFixed(1)}% annually
              </p>
            </div>
          </div>
        </div>

        {/* Link to full tool */}
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link to={`/tools?tool=timemachine&city=${citySlug}`}>
            View Full Market History
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
