import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Clock, TrendingUp, TrendingDown, Minus, RotateCcw, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ToolLayout } from '@/components/tools/shared/ToolLayout';
import { ResultCard } from '@/components/tools/shared/ResultCard';
import { ToolDisclaimer } from '@/components/tools/shared/ToolDisclaimer';
import { InfoBanner } from '@/components/tools/shared/InfoBanner';
import { useHistoricalPrices, useCityPriceComparison, calculateCAGR } from '@/hooks/useHistoricalPrices';
import { useCities } from '@/hooks/useCities';
import { useFormatPrice, useFormatPricePerArea } from '@/contexts/PreferencesContext';

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 2015;

export function RealEstateTimeMachine() {
  const [searchParams] = useSearchParams();
  const formatPrice = useFormatPrice();
  const formatPricePerArea = useFormatPricePerArea();
  const { data: cities } = useCities();
  
  // Get initial city from URL params or default
  const initialCity = searchParams.get('city') || 'tel-aviv';
  
  // State
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [compareCity, setCompareCity] = useState<string | null>(null);
  const [purchaseYear, setPurchaseYear] = useState(2019);
  const [inputMode, setInputMode] = useState<'price' | 'size'>('size');
  const [propertyPrice, setPropertyPrice] = useState(2500000);
  const [propertySize, setPropertySize] = useState(100);

  // Fetch historical data
  const { data: primaryCityData, isLoading: isPrimaryLoading } = useHistoricalPrices(selectedCity, 15);
  const { data: comparisonData, isLoading: isCompareLoading } = useCityPriceComparison(
    compareCity ? [selectedCity, compareCity] : [],
    MIN_YEAR,
    CURRENT_YEAR
  );

  // City options from database
  const cityOptions = useMemo(() => {
    if (!cities) return [];
    return cities.map(city => ({
      value: city.slug,
      label: city.name,
    }));
  }, [cities]);

  // Reset to defaults
  const handleReset = () => {
    setSelectedCity('tel-aviv');
    setCompareCity(null);
    setPurchaseYear(2019);
    setInputMode('size');
    setPropertyPrice(2500000);
    setPropertySize(100);
  };

  // Calculate results
  const results = useMemo(() => {
    if (!primaryCityData || primaryCityData.length === 0) return null;

    const purchaseYearData = primaryCityData.find(d => d.year === purchaseYear);
    const currentYearData = primaryCityData.find(d => d.year === CURRENT_YEAR) || 
                           primaryCityData[primaryCityData.length - 1];

    if (!purchaseYearData?.average_price_sqm || !currentYearData?.average_price_sqm) return null;

    // Calculate based on input mode
    let purchasePrice: number;
    let currentValue: number;
    let effectiveSize: number;

    if (inputMode === 'price') {
      effectiveSize = propertyPrice / purchaseYearData.average_price_sqm;
      purchasePrice = propertyPrice;
      currentValue = effectiveSize * currentYearData.average_price_sqm;
    } else {
      effectiveSize = propertySize;
      purchasePrice = propertySize * purchaseYearData.average_price_sqm;
      currentValue = propertySize * currentYearData.average_price_sqm;
    }

    const yearsHeld = (currentYearData.year || CURRENT_YEAR) - purchaseYear;
    const totalAppreciation = currentValue - purchasePrice;
    const totalAppreciationPercent = ((currentValue - purchasePrice) / purchasePrice) * 100;
    const cagr = calculateCAGR(purchasePrice, currentValue, yearsHeld);
    const avgYearlyGain = yearsHeld > 0 ? totalAppreciation / yearsHeld : 0;

    // Year-by-year breakdown
    const yearlyBreakdown = primaryCityData
      .filter(d => d.year >= purchaseYear && d.average_price_sqm)
      .map(d => {
        const value = effectiveSize * (d.average_price_sqm || 0);
        const prevYear = primaryCityData.find(p => p.year === d.year - 1);
        const prevValue = prevYear?.average_price_sqm ? effectiveSize * prevYear.average_price_sqm : value;
        const yoyChange = prevYear ? ((value - prevValue) / prevValue) * 100 : 0;
        return {
          year: d.year,
          value,
          yoyChange,
          isCurrentYear: d.year === (currentYearData.year || CURRENT_YEAR),
        };
      });

    return {
      purchasePrice,
      currentValue,
      totalAppreciation,
      totalAppreciationPercent,
      cagr,
      yearsHeld,
      avgYearlyGain,
      yearlyBreakdown,
      effectiveSize,
    };
  }, [primaryCityData, purchaseYear, inputMode, propertyPrice, propertySize]);

  // Chart data
  const chartData = useMemo(() => {
    if (!primaryCityData) return [];

    const getCityDisplayName = (slug: string) => {
      return cityOptions.find(c => c.value === slug)?.label || slug;
    };

    if (compareCity && comparisonData) {
      // Group comparison data by year
      const dataByYear = new Map<number, any>();
      
      comparisonData.forEach(d => {
        if (!dataByYear.has(d.year)) {
          dataByYear.set(d.year, { year: d.year });
        }
        const citySlug = d.city.toLowerCase().replace(/\s+/g, '-');
        dataByYear.get(d.year)[citySlug] = d.average_price_sqm;
      });

      return Array.from(dataByYear.values()).sort((a, b) => a.year - b.year);
    }

    return primaryCityData.map(d => ({
      year: d.year,
      [selectedCity]: d.average_price_sqm,
    }));
  }, [primaryCityData, comparisonData, compareCity, selectedCity, cityOptions]);

  const getCityLabel = (slug: string) => {
    return cityOptions.find(c => c.value === slug)?.label || slug;
  };

  const isLoading = isPrimaryLoading || (compareCity && isCompareLoading);

  // Left column - Inputs
  const leftColumn = (
    <Card>
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Your Property Details</h3>
          <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5 text-xs">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>

        {/* City Selection */}
        <div className="space-y-2">
          <Label>City</Label>
          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select a city" />
            </SelectTrigger>
            <SelectContent>
              {cityOptions.map((city) => (
                <SelectItem key={city.value} value={city.value}>
                  {city.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Purchase Year */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1.5">
              Purchase Year
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Select when you would have hypothetically purchased. Earlier years show more dramatic appreciation.</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </Label>
            <span className="text-sm font-medium text-primary">{purchaseYear}</span>
          </div>
          <Slider
            value={[purchaseYear]}
            onValueChange={(v) => setPurchaseYear(v[0])}
            min={MIN_YEAR}
            max={CURRENT_YEAR - 1}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{MIN_YEAR}</span>
            <span>{CURRENT_YEAR - 1}</span>
          </div>
        </div>

        {/* Input Mode Selection */}
        <div className="space-y-3">
          <Label>Property Value Input</Label>
          <RadioGroup value={inputMode} onValueChange={(v) => setInputMode(v as 'price' | 'size')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="size" id="size" />
              <Label htmlFor="size" className="font-normal cursor-pointer">I know the property size</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="price" id="price" />
              <Label htmlFor="price" className="font-normal cursor-pointer">I know the purchase price</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Size or Price Input */}
        {inputMode === 'size' ? (
          <div className="space-y-2">
            <Label>Property Size (sqm)</Label>
            <Input
              type="number"
              value={propertySize}
              onChange={(e) => setPropertySize(Number(e.target.value) || 0)}
              className="h-11"
              min={20}
              max={500}
            />
            {results && (
              <p className="text-xs text-muted-foreground">
                Est. price in {purchaseYear}: {formatPrice(results.purchasePrice)}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Purchase Price (₪)</Label>
            <Input
              type="number"
              value={propertyPrice}
              onChange={(e) => setPropertyPrice(Number(e.target.value) || 0)}
              className="h-11"
              min={100000}
              step={100000}
            />
            {results && (
              <p className="text-xs text-muted-foreground">
                Est. size: {results.effectiveSize.toFixed(0)} sqm
              </p>
            )}
          </div>
        )}

        <div className="border-t border-border pt-4 space-y-2">
          <Label className="flex items-center gap-1.5">
            Compare With Another City
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Compare how different cities appreciated over the same period</p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </Label>
          <Select value={compareCity || 'none'} onValueChange={(v) => setCompareCity(v === 'none' ? null : v)}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select city to compare" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {cityOptions.filter(c => c.value !== selectedCity).map((city) => (
                <SelectItem key={city.value} value={city.value}>
                  {city.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );

  // Right column - Results
  const rightColumn = (
    <Card>
      <CardContent className="p-6 space-y-6">
        <div className="text-center pb-4 border-b border-border">
          <p className="text-sm text-muted-foreground mb-1">
            If you bought in {getCityLabel(selectedCity)} in {purchaseYear}...
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : results ? (
          <>
            {/* Main Results */}
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Purchase Price ({purchaseYear})</span>
                <span className="font-semibold">{formatPrice(results.purchasePrice)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Current Value ({CURRENT_YEAR})</span>
                <span className="font-semibold">{formatPrice(results.currentValue)}</span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Appreciation</span>
                  <div className="text-right">
                    <span className="font-bold text-lg text-primary">
                      +{formatPrice(results.totalAppreciation)}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                      (+{results.totalAppreciationPercent.toFixed(0)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Insights */}
            <div className="grid grid-cols-3 gap-2">
              <ResultCard
                label="CAGR"
                value={`${results.cagr.toFixed(1)}%`}
                size="sm"
                variant="default"
              />
              <ResultCard
                label="Years Held"
                value={results.yearsHeld.toString()}
                size="sm"
                variant="default"
              />
              <ResultCard
                label="Per Year"
                value={formatPrice(results.avgYearlyGain)}
                size="sm"
                variant="default"
              />
            </div>

            {/* Price Trajectory Chart */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Price Trajectory (₪/sqm)
              </h4>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="year" className="text-xs" tick={{ fontSize: 10 }} />
                    <YAxis 
                      className="text-xs"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatPricePerArea(value)}
                      labelFormatter={(label) => `Year: ${label}`}
                    />
                    {compareCity && <Legend />}
                    <Line 
                      type="monotone" 
                      dataKey={selectedCity} 
                      name={getCityLabel(selectedCity)}
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                    />
                    {compareCity && (
                      <Line 
                        type="monotone" 
                        dataKey={compareCity} 
                        name={getCityLabel(compareCity)}
                        stroke="hsl(var(--muted-foreground))" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ fill: 'hsl(var(--muted-foreground))', r: 3 }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Year-by-Year Breakdown */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Year-by-Year Breakdown</h4>
              <div className="space-y-1 max-h-[180px] overflow-y-auto pr-2">
                {results.yearlyBreakdown.map((yb) => (
                  <div 
                    key={yb.year} 
                    className={`flex items-center justify-between py-1.5 px-2 rounded text-sm ${
                      yb.isCurrentYear ? 'bg-primary/10' : ''
                    }`}
                  >
                    <span className="text-muted-foreground">
                      {yb.year}{yb.isCurrentYear && ' ← Today'}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{formatPrice(yb.value)}</span>
                      {yb.yoyChange !== 0 && (
                        <span className={`text-xs ${yb.yoyChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {yb.yoyChange > 0 ? '+' : ''}{yb.yoyChange.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No historical data available for this city.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <ToolLayout
      title="Real Estate Time Machine"
      subtitle="See how Israeli property values have changed over time"
      icon={<Clock className="h-6 w-6" />}
      infoBanner={
        <InfoBanner variant="info">
          Explore historical appreciation to understand long-term market trends. Select a city and purchase year to see how your investment would have grown.
        </InfoBanner>
      }
      leftColumn={leftColumn}
      rightColumn={rightColumn}
      disclaimer={
        <ToolDisclaimer
          text="Historical prices are based on average price per square meter data. Individual properties may vary based on condition, location, and other factors. This tool provides estimates for informational purposes only."
        />
      }
    />
  );
}
