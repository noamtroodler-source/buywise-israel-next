import { useMemo, useState } from 'react';
import { Clock, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HistoricalPrice, calculateCAGR } from '@/hooks/useHistoricalPrices';
import { useFormatPrice } from '@/contexts/PreferencesContext';

interface CityAppreciationExplorerProps {
  cityName: string;
  historicalPrices: HistoricalPrice[];
}

export function CityAppreciationExplorer({ cityName, historicalPrices }: CityAppreciationExplorerProps) {
  const formatPrice = useFormatPrice();
  const [sizeSqm, setSizeSqm] = useState(90);
  
  const currentYear = new Date().getFullYear();
  const AVG_APARTMENT_SIZE = 90;

  // Derive available years from data
  const availableYears = useMemo(() => {
    return historicalPrices
      .filter(hp => hp.average_price_sqm || hp.average_price)
      .map(hp => hp.year)
      .sort((a, b) => a - b);
  }, [historicalPrices]);

  // Default to oldest available year
  const [selectedYear, setSelectedYear] = useState<number>(() => availableYears[0] || 2010);

  // Get current price per sqm (most recent data)
  const currentPriceSqm = useMemo(() => {
    const sorted = [...historicalPrices]
      .filter(hp => hp.average_price_sqm || hp.average_price)
      .sort((a, b) => b.year - a.year);
    
    if (!sorted.length) return 0;
    const latest = sorted[0];
    return latest.average_price_sqm || (latest.average_price || 0) / AVG_APARTMENT_SIZE;
  }, [historicalPrices]);

  const analysis = useMemo(() => {
    if (!selectedYear || !historicalPrices.length || !currentPriceSqm) return null;

    const historicalData = historicalPrices.find(hp => hp.year === selectedYear);
    if (!historicalData) return null;

    const historicalPriceSqm = historicalData.average_price_sqm || 
      (historicalData.average_price || 0) / AVG_APARTMENT_SIZE;
    
    if (!historicalPriceSqm) return null;

    const estimatedHistoricalPrice = Math.round(historicalPriceSqm * sizeSqm);
    const estimatedCurrentPrice = Math.round(currentPriceSqm * sizeSqm);
    const yearsHeld = currentYear - selectedYear;
    const totalAppreciation = estimatedCurrentPrice - estimatedHistoricalPrice;
    const totalAppreciationPercent = ((estimatedCurrentPrice - estimatedHistoricalPrice) / estimatedHistoricalPrice) * 100;
    const cagr = calculateCAGR(estimatedHistoricalPrice, estimatedCurrentPrice, yearsHeld);

    return {
      estimatedHistoricalPrice,
      estimatedCurrentPrice,
      yearsHeld,
      totalAppreciation,
      totalAppreciationPercent,
      cagr,
    };
  }, [selectedYear, historicalPrices, sizeSqm, currentPriceSqm, currentYear]);

  if (availableYears.length < 2) {
    return null;
  }

  return (
    <section className="py-12 bg-background">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border-primary/20 max-w-2xl mx-auto">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Clock className="h-5 w-5 text-primary" />
                What If I Bought Here?
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                See how property values in {cityName} have grown over time
              </p>
            </CardHeader>

            <CardContent className="space-y-6 pt-4">
              {/* Year Selector */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">If you bought in...</Label>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{availableYears[0]}</span>
                  <span className="text-muted-foreground">{availableYears[availableYears.length - 1]}</span>
                </div>
                <Slider
                  value={[selectedYear]}
                  onValueChange={([value]) => setSelectedYear(value)}
                  min={availableYears[0]}
                  max={availableYears[availableYears.length - 1]}
                  step={1}
                  className="w-full"
                />
                <div className="text-center">
                  <span className="text-3xl font-bold text-primary">{selectedYear}</span>
                </div>
              </div>

              {/* Apartment Size Input */}
              <div className="space-y-2">
                <Label htmlFor="size-input" className="text-sm font-medium">Apartment size</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="size-input"
                    type="number"
                    value={sizeSqm}
                    onChange={(e) => setSizeSqm(Math.max(20, Math.min(500, parseInt(e.target.value) || 90)))}
                    min={20}
                    max={500}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">sqm</span>
                </div>
              </div>

              {/* Results */}
              {analysis && (
                <>
                  {/* Price comparison cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg text-center border border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">Estimated {selectedYear} price</p>
                      <p className="text-xl font-bold">{formatPrice(analysis.estimatedHistoricalPrice)}</p>
                    </div>
                    <div className="p-4 bg-primary/10 rounded-lg text-center border border-primary/20">
                      <p className="text-xs text-muted-foreground mb-1">Today's estimated value</p>
                      <p className="text-xl font-bold text-primary">{formatPrice(analysis.estimatedCurrentPrice)}</p>
                    </div>
                  </div>

                  {/* Appreciation Summary */}
                  <div className="p-4 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <TrendingUp className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold">
                          +{formatPrice(analysis.totalAppreciation)}{' '}
                          <span className="text-muted-foreground font-normal text-sm">
                            (+{analysis.totalAppreciationPercent.toFixed(0)}%)
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          in {analysis.yearsHeld} years ({analysis.cagr.toFixed(1)}% annually)
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Disclaimer */}
              <p className="text-xs text-muted-foreground italic text-center">
                Based on {cityName} city-wide averages. Actual returns vary by neighborhood and property.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
