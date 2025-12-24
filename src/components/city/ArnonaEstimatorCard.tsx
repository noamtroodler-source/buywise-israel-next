import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Lightbulb, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ArnonaEstimatorCardProps {
  cityName: string;
  arnonaRateSqm?: number | null;
}

export function ArnonaEstimatorCard({ cityName, arnonaRateSqm }: ArnonaEstimatorCardProps) {
  const NATIONAL_AVG_RATE = 12;
  const rate = arnonaRateSqm || 15;
  const [apartmentSize, setApartmentSize] = useState([80]);

  const monthlyArnona = rate * apartmentSize[0];
  const yearlyArnona = monthlyArnona * 12;
  const percentDiff = ((rate - NATIONAL_AVG_RATE) / NATIONAL_AVG_RATE * 100);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <span>Arnona Estimate</span>
          {percentDiff > 5 ? (
            <TrendingUp className="h-4 w-4 text-destructive" />
          ) : percentDiff < -5 ? (
            <TrendingDown className="h-4 w-4 text-green-600" />
          ) : (
            <Minus className="h-4 w-4 text-muted-foreground" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Size Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Apartment size</span>
            <span className="text-sm font-bold">{apartmentSize[0]} m²</span>
          </div>
          <Slider
            value={apartmentSize}
            onValueChange={setApartmentSize}
            min={40}
            max={200}
            step={10}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>40 m²</span>
            <span>200 m²</span>
          </div>
        </div>

        {/* Arnona Display */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Monthly</p>
            <p className="text-xl font-bold text-foreground">
              {formatCurrency(monthlyArnona)}
            </p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Yearly</p>
            <p className="text-xl font-bold text-foreground">
              {formatCurrency(yearlyArnona)}
            </p>
          </div>
        </div>

        {/* Rate Comparison */}
        <div className="text-center text-sm">
          <span className="text-muted-foreground">Rate: </span>
          <span className="font-medium">{formatCurrency(rate)}/m²</span>
          {percentDiff > 5 ? (
            <span className="text-destructive ml-2">
              (+{percentDiff.toFixed(0)}% vs avg)
            </span>
          ) : percentDiff < -5 ? (
            <span className="text-green-600 ml-2">
              ({percentDiff.toFixed(0)}% vs avg)
            </span>
          ) : (
            <span className="text-muted-foreground ml-2">(Near average)</span>
          )}
        </div>

        {/* Insight */}
        <div className="bg-muted/50 rounded-lg p-3 flex gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Arnona (municipal tax) in {cityName} covers services like waste collection, 
            street lighting, and local infrastructure. Rates vary by zone and property type.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
