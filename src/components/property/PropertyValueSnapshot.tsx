import { TrendingUp, TrendingDown, Minus, DollarSign, BarChart3, Home, Calendar } from 'lucide-react';
import { useFormatPrice, useFormatPricePerArea } from '@/contexts/PreferencesContext';
import { useMemo } from 'react';

interface PropertyValueSnapshotProps {
  price: number;
  sizeSqm?: number | null;
  city: string;
  averagePriceSqm?: number | null;
  priceChange?: number | null;
  listingStatus?: string;
  bedrooms?: number | null;
  cityRentalMin?: number | null;
  cityRentalMax?: number | null;
  vaadBayitMonthly?: number | null;
  cityArnonaRate?: number | null;
}

export function PropertyValueSnapshot({ 
  price, 
  sizeSqm, 
  city,
  averagePriceSqm,
  priceChange,
  listingStatus,
  bedrooms,
  cityRentalMin,
  cityRentalMax,
  vaadBayitMonthly,
  cityArnonaRate,
}: PropertyValueSnapshotProps) {
  const formatPrice = useFormatPrice();
  const formatPricePerArea = useFormatPricePerArea();
  
  const isRental = listingStatus === 'for_rent';
  
  // Calculate metrics based on listing type
  const propertyPricePerSqm = sizeSqm ? Math.round(price / sizeSqm) : null;
  
  // For rentals: calculate city average rent and comparison
  const cityAvgRent = cityRentalMin && cityRentalMax 
    ? Math.round((cityRentalMin + cityRentalMax) / 2) 
    : null;
  
  const rentalComparisonPercent = cityAvgRent 
    ? Math.round(((price - cityAvgRent) / cityAvgRent) * 100)
    : null;
  
  // For purchases: calculate comparison to area average
  const purchaseComparisonPercent = propertyPricePerSqm && averagePriceSqm 
    ? Math.round(((propertyPricePerSqm - averagePriceSqm) / averagePriceSqm) * 100)
    : null;

  // Calculate total monthly commitment for rentals
  const arnonaEstimate = useMemo(() => {
    if (!sizeSqm || !cityArnonaRate) return 0;
    return Math.round((cityArnonaRate * sizeSqm) / 12); // Monthly arnona
  }, [sizeSqm, cityArnonaRate]);

  const vaadBayit = vaadBayitMonthly ?? 450; // Default ₪450 if not specified
  const totalMonthlyCommitment = price + arnonaEstimate + vaadBayit;

  // Rental-specific cards
  if (isRental) {
    const hasCityAvg = !!cityAvgRent;
    const hasComparison = rentalComparisonPercent !== null;
    // Always show Total Monthly card for rentals
    const cardCount = [true, hasCityAvg, hasComparison].filter(Boolean).length;
    
    const gridCols = cardCount === 3 
      ? 'grid-cols-1 sm:grid-cols-3' 
      : cardCount === 2
        ? 'grid-cols-1 sm:grid-cols-2'
        : 'grid-cols-1';

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">AI Rental Snapshot</h3>
        </div>
        
        <div className={`grid ${gridCols} gap-4`}>
          {/* Total Monthly Commitment */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Total Monthly</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatPrice(totalMonthlyCommitment, 'ILS')}/mo
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Rent + Arnona + Va'ad
            </p>
          </div>

          {/* City Rental Average */}
          {cityAvgRent && (
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Home className="h-4 w-4" />
                <span className="text-sm">{city} {bedrooms || 3}-Room Avg</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                ₪{cityAvgRent.toLocaleString()}/mo
              </p>
            </div>
          )}

          {/* Comparison to Market */}
          {rentalComparisonPercent !== null && (
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
              {rentalComparisonPercent > 0 ? (
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              ) : rentalComparisonPercent < 0 ? (
                <TrendingDown className="h-4 w-4 text-primary" />
              ) : (
                <Minus className="h-4 w-4" />
              )}
                <span className="text-sm">vs Market Rate</span>
              </div>
              <p className={`text-2xl font-bold ${
                rentalComparisonPercent > 0 
                  ? 'text-muted-foreground' 
                  : rentalComparisonPercent < 0 
                    ? 'text-primary' 
                    : 'text-foreground'
              }`}>
                {rentalComparisonPercent > 0 ? '+' : ''}{rentalComparisonPercent}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {rentalComparisonPercent > 0 
                  ? 'Above market rate' 
                  : rentalComparisonPercent < 0 
                    ? 'Below market rate' 
                    : 'At market rate'}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Purchase properties (for_sale, sold)
  const hasPropertyPrice = !!propertyPricePerSqm;
  const hasAreaAverage = !!averagePriceSqm;
  const hasComparison = purchaseComparisonPercent !== null;
  const hasTrend = priceChange !== null && priceChange !== undefined;
  const cardCount = [hasPropertyPrice, hasAreaAverage, hasComparison, hasTrend].filter(Boolean).length;
  
  // Don't render if no data
  if (cardCount === 0) return null;
  
  const gridCols = cardCount === 3 
    ? 'grid-cols-1 sm:grid-cols-3' 
    : 'grid-cols-1 sm:grid-cols-2';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">AI Value Snapshot</h3>
      </div>
      
      <div className={`grid ${gridCols} gap-4`}>
        {/* Price per m² */}
        {propertyPricePerSqm && (
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Price per area</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatPricePerArea(propertyPricePerSqm, 'ILS')}
            </p>
          </div>
        )}

        {/* Area Benchmark */}
        {averagePriceSqm && (
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Home className="h-4 w-4" />
              <span className="text-sm">{city} Average</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatPricePerArea(averagePriceSqm, 'ILS')}
            </p>
          </div>
        )}

        {/* Comparison */}
        {purchaseComparisonPercent !== null && (
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              {purchaseComparisonPercent > 0 ? (
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              ) : purchaseComparisonPercent < 0 ? (
                <TrendingDown className="h-4 w-4 text-primary" />
              ) : (
                <Minus className="h-4 w-4" />
              )}
              <span className="text-sm">vs Area Average</span>
            </div>
            <p className={`text-2xl font-bold ${
              purchaseComparisonPercent > 0 
                ? 'text-muted-foreground' 
                : purchaseComparisonPercent < 0 
                  ? 'text-primary' 
                  : 'text-foreground'
            }`}>
              {purchaseComparisonPercent > 0 ? '+' : ''}{purchaseComparisonPercent}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {purchaseComparisonPercent > 0 
                ? 'Above area average' 
                : purchaseComparisonPercent < 0 
                  ? 'Below area average' 
                  : 'At area average'}
            </p>
          </div>
        )}

        {/* 12-Month Trend */}
        {priceChange !== null && priceChange !== undefined && (
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              {priceChange > 0 ? (
                <TrendingUp className="h-4 w-4 text-primary" />
              ) : priceChange < 0 ? (
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Minus className="h-4 w-4" />
              )}
              <span className="text-sm">12-Month Trend</span>
            </div>
            <p className={`text-2xl font-bold ${
              priceChange > 0 
                ? 'text-primary' 
                : priceChange < 0 
                  ? 'text-muted-foreground' 
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
    </div>
  );
}
