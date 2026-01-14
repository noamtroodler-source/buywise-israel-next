import { useMemo, useState } from 'react';
import { Clock } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { HistoricalPrice, calculateCAGR } from '@/hooks/useHistoricalPrices';
import { useFormatPrice } from '@/contexts/PreferencesContext';

interface CityAppreciationExplorerProps {
  cityName: string;
  historicalPrices: HistoricalPrice[];
}

export function CityAppreciationExplorer({ cityName, historicalPrices }: CityAppreciationExplorerProps) {
  const formatPrice = useFormatPrice();
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
  const [selectedYear, setSelectedYear] = useState<string>(() => 
    String(availableYears[0] || 2010)
  );

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
    const year = parseInt(selectedYear);
    if (!year || !historicalPrices.length || !currentPriceSqm) return null;

    const historicalData = historicalPrices.find(hp => hp.year === year);
    if (!historicalData) return null;

    const historicalPriceSqm = historicalData.average_price_sqm || 
      (historicalData.average_price || 0) / AVG_APARTMENT_SIZE;
    
    if (!historicalPriceSqm) return null;

    const estimatedHistoricalPrice = Math.round(historicalPriceSqm * AVG_APARTMENT_SIZE);
    const estimatedCurrentPrice = Math.round(currentPriceSqm * AVG_APARTMENT_SIZE);
    const yearsHeld = currentYear - year;
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
  }, [selectedYear, historicalPrices, currentPriceSqm, currentYear]);

  if (availableYears.length < 2) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl bg-background border border-border/50 text-sm">
      <div className="flex items-center gap-2 shrink-0">
        <Clock className="h-4 w-4 text-primary shrink-0" />
        <span className="text-muted-foreground">If you bought in</span>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[80px] h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map(year => (
              <SelectItem key={year} value={String(year)}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {analysis && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-medium">{formatPrice(analysis.estimatedHistoricalPrice)}</span>
          <span className="text-muted-foreground">→</span>
          <span className="font-semibold text-primary">{formatPrice(analysis.estimatedCurrentPrice)}</span>
          <span className="text-muted-foreground">
            (+{formatPrice(analysis.totalAppreciation)} · {analysis.cagr.toFixed(1)}%/yr)
          </span>
        </div>
      )}
    </div>
  );
}