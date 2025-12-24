import { TrendingUp, TrendingDown, Minus, DollarSign, BarChart3, Home } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import { useFormatPrice, useFormatPricePerArea } from '@/contexts/PreferencesContext';

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
  const formatPrice = useFormatPrice();
  const formatPricePerArea = useFormatPricePerArea();
  
  const propertyPricePerSqm = sizeSqm ? Math.round(price / sizeSqm) : null;
  
  // Calculate comparison to area average
  const comparisonPercent = propertyPricePerSqm && averagePriceSqm 
    ? Math.round(((propertyPricePerSqm - averagePriceSqm) / averagePriceSqm) * 100)
    : null;

  // Determine if we have the 12-month trend data
  const hasTrendData = priceChange !== null && priceChange !== undefined;
  
  // Card component for reuse
  const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`p-4 rounded-lg bg-muted/30 border border-border/50 ${className}`}>
      {children}
    </div>
  );

  return (
    <CollapsibleSection 
      title="AI Value Snapshot" 
      icon={<BarChart3 className="h-5 w-5" />}
      defaultOpen={true}
    >
      {/* Top row - always 2 cards side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Price per m² */}
        {propertyPricePerSqm && (
          <Card>
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Price per area</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatPricePerArea(propertyPricePerSqm, 'ILS')}
            </p>
          </Card>
        )}

        {/* Area Benchmark */}
        {averagePriceSqm && (
          <Card>
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Home className="h-4 w-4" />
              <span className="text-sm">{city} Average</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatPricePerArea(averagePriceSqm, 'ILS')}
            </p>
          </Card>
        )}
      </div>

      {/* Bottom row - layout depends on whether we have trend data */}
      <div className={`mt-4 grid gap-4 ${hasTrendData ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {/* Comparison - centered when alone, left when with trend */}
        {comparisonPercent !== null && (
          <Card className={!hasTrendData ? 'sm:col-start-1 sm:col-end-2 sm:mx-auto sm:w-[calc(50%-0.5rem)]' : ''}>
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
          </Card>
        )}

        {/* 12-Month Trend */}
        {hasTrendData && (
          <Card>
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
          </Card>
        )}
      </div>
    </CollapsibleSection>
  );
}
