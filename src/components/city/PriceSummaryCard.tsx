import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Lightbulb, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PriceSummaryCardProps {
  marketData: Array<{
    average_price_sqm?: number | null;
  }>;
  cityName: string;
}

export function PriceSummaryCard({ marketData, cityName }: PriceSummaryCardProps) {
  const NATIONAL_AVG = 32000;
  const [affordabilityScale, setAffordabilityScale] = useState([50]);

  const latestPriceSqm = marketData[0]?.average_price_sqm || 0;
  const percentDiff = latestPriceSqm > 0 
    ? ((latestPriceSqm - NATIONAL_AVG) / NATIONAL_AVG * 100) 
    : 0;

  const formatPriceSqm = (price: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getAffordabilityLabel = (value: number) => {
    if (value < 20) return 'Very Tight Budget';
    if (value < 40) return 'Moderate Budget';
    if (value < 60) return 'Comfortable';
    if (value < 80) return 'Flexible Budget';
    return 'Premium Buyer';
  };

  const getAffordabilityInsight = (value: number) => {
    if (value < 30) {
      return `With a tight budget, ${cityName} may require looking at smaller apartments or peripheral neighborhoods.`;
    }
    if (value < 60) {
      return `A moderate budget opens up options in established neighborhoods with 2-3 room apartments.`;
    }
    return `With a flexible budget, you can explore premium locations and larger properties in ${cityName}.`;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <span>Price per m²</span>
          {percentDiff > 0 ? (
            <TrendingUp className="h-4 w-4 text-destructive" />
          ) : percentDiff < 0 ? (
            <TrendingDown className="h-4 w-4 text-green-600" />
          ) : (
            <Minus className="h-4 w-4 text-muted-foreground" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Price Display */}
        <div className="text-center">
          <p className="text-3xl font-bold text-foreground">
            {formatPriceSqm(latestPriceSqm)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {percentDiff > 0 ? (
              <span className="text-destructive font-medium">
                +{percentDiff.toFixed(0)}% above national avg
              </span>
            ) : percentDiff < 0 ? (
              <span className="text-green-600 font-medium">
                {percentDiff.toFixed(0)}% below national avg
              </span>
            ) : (
              <span>At national average</span>
            )}
          </p>
        </div>

        {/* Affordability Scale */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Your budget flexibility</span>
            <span className="text-xs text-muted-foreground">
              {getAffordabilityLabel(affordabilityScale[0])}
            </span>
          </div>
          <Slider
            value={affordabilityScale}
            onValueChange={setAffordabilityScale}
            max={100}
            step={10}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Tight</span>
            <span>Flexible</span>
          </div>
        </div>

        {/* Insight */}
        <div className="bg-muted/50 rounded-lg p-3 flex gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            {getAffordabilityInsight(affordabilityScale[0])}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
