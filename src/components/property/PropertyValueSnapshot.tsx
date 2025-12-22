import { TrendingUp, TrendingDown, Minus, DollarSign, BarChart3, Home } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';

interface PropertyValueSnapshotProps {
  price: number;
  sizeSqm?: number | null;
  city: string;
  averagePriceSqm?: number | null;
  priceChange?: number | null;
}

export function PropertyValueSnapshot({ 
  price, 
  sizeSqm, 
  city,
  averagePriceSqm,
  priceChange,
}: PropertyValueSnapshotProps) {
  const propertyPricePerSqm = sizeSqm ? Math.round(price / sizeSqm) : null;
  
  // Calculate comparison to area average
  const comparisonPercent = propertyPricePerSqm && averagePriceSqm 
    ? Math.round(((propertyPricePerSqm - averagePriceSqm) / averagePriceSqm) * 100)
    : null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <CollapsibleSection 
      title="AI Value Snapshot" 
      icon={<BarChart3 className="h-5 w-5" />}
      defaultOpen={true}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Price per m² */}
        {propertyPricePerSqm && (
          <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Price per m²</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(propertyPricePerSqm)}
            </p>
          </div>
        )}

        {/* Area Benchmark */}
        {averagePriceSqm && (
          <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Home className="h-4 w-4" />
              <span className="text-sm">{city} Average</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(averagePriceSqm)}/m²
            </p>
          </div>
        )}

        {/* Comparison */}
        {comparisonPercent !== null && (
          <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              {comparisonPercent > 0 ? (
                <TrendingUp className="h-4 w-4 text-orange-500" />
              ) : comparisonPercent < 0 ? (
                <TrendingDown className="h-4 w-4 text-green-500" />
              ) : (
                <Minus className="h-4 w-4" />
              )}
              <span className="text-sm">vs Area Average</span>
            </div>
            <p className={`text-2xl font-bold ${
              comparisonPercent > 0 
                ? 'text-orange-500' 
                : comparisonPercent < 0 
                  ? 'text-green-500' 
                  : 'text-foreground'
            }`}>
              {comparisonPercent > 0 ? '+' : ''}{comparisonPercent}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {comparisonPercent > 0 
                ? 'Above area average' 
                : comparisonPercent < 0 
                  ? 'Below area average' 
                  : 'At area average'}
            </p>
          </div>
        )}

        {/* 12-Month Trend */}
        {priceChange !== null && priceChange !== undefined && (
          <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              {priceChange > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : priceChange < 0 ? (
                <TrendingDown className="h-4 w-4 text-red-500" />
              ) : (
                <Minus className="h-4 w-4" />
              )}
              <span className="text-sm">12-Month Trend</span>
            </div>
            <p className={`text-2xl font-bold ${
              priceChange > 0 
                ? 'text-green-500' 
                : priceChange < 0 
                  ? 'text-red-500' 
                  : 'text-foreground'
            }`}>
              {priceChange > 0 ? '+' : ''}{priceChange}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Area price change
            </p>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}
