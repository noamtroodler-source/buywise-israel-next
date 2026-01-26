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
  cityAvgVaadBayit?: number | null;
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
  cityAvgVaadBayit,
}: PropertyValueSnapshotProps) {
  const formatPrice = useFormatPrice();
  const formatPricePerArea = useFormatPricePerArea();
  
  const isRental = listingStatus === 'for_rent';
  
  // Calculate metrics based on listing type
  const propertyPricePerSqm = sizeSqm ? Math.round(price / sizeSqm) : null;
  
  // Calculate total monthly commitment for this property (rentals)
  const arnonaEstimate = useMemo(() => {
    if (!sizeSqm || !cityArnonaRate) return 0;
    return Math.round((cityArnonaRate * sizeSqm) / 12); // Monthly arnona
  }, [sizeSqm, cityArnonaRate]);

  const vaadBayit = vaadBayitMonthly ?? 450; // Default ₪450 if not specified
  const totalMonthlyCommitment = price + arnonaEstimate + vaadBayit;
  
  // For rentals: calculate city average rent and comparison
  const cityAvgRent = cityRentalMin && cityRentalMax 
    ? Math.round((cityRentalMin + cityRentalMax) / 2) 
    : null;
  
  // Estimate average apartment size by bedrooms for city arnona calculation
  const avgSizeByBedrooms: Record<number, number> = {
    2: 55,   // 2-room ~55 sqm
    3: 75,   // 3-room ~75 sqm  
    4: 100,  // 4-room ~100 sqm
    5: 130,  // 5-room ~130 sqm
  };
  const avgApartmentSize = avgSizeByBedrooms[bedrooms || 3] || 75;

  // City average arnona (monthly)
  const cityAvgArnonaMonthly = cityArnonaRate 
    ? Math.round((cityArnonaRate * avgApartmentSize) / 12) 
    : 0;

  // City average va'ad bayit (use actual or default)
  const cityVaad = cityAvgVaadBayit ?? 450;

  // City average TOTAL monthly (rent + arnona + va'ad)
  const cityAvgTotalMonthly = cityAvgRent 
    ? cityAvgRent + cityAvgArnonaMonthly + cityVaad 
    : null;
  
  // Compare total monthly (property vs city average)
  const rentalComparisonPercent = cityAvgTotalMonthly 
    ? Math.round(((totalMonthlyCommitment - cityAvgTotalMonthly) / cityAvgTotalMonthly) * 100)
    : null;
  
  // For purchases: calculate comparison to area average
  const purchaseComparisonPercent = propertyPricePerSqm && averagePriceSqm 
    ? Math.round(((propertyPricePerSqm - averagePriceSqm) / averagePriceSqm) * 100)
    : null;

  // Rental-specific cards
  if (isRental) {
    const hasCityAvg = !!cityAvgTotalMonthly;
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

          {/* City Average Total Monthly */}
          {cityAvgTotalMonthly && (
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Home className="h-4 w-4" />
                <span className="text-sm">{city} {bedrooms || 3}-Room Avg</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {formatPrice(cityAvgTotalMonthly, 'ILS')}/mo
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Rent + Arnona + Va'ad
              </p>
            </div>
          )}

          {/* Comparison to Market */}
          {rentalComparisonPercent !== null && (
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
              {rentalComparisonPercent > 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : rentalComparisonPercent < 0 ? (
                <TrendingDown className="h-4 w-4" />
              ) : (
                <Minus className="h-4 w-4" />
              )}
                <span className="text-sm">vs Market Rate</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
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
  // Combined card: show price vs market if we have both property price AND city average
  const hasPriceVsMarket = !!propertyPricePerSqm && !!averagePriceSqm;
  const hasTrend = priceChange !== null && priceChange !== undefined;
  
  // Don't render if no data at all
  if (!hasPriceVsMarket && !hasTrend) return null;
  
  // Always 2-column layout for purchases
  const gridCols = 'grid-cols-1 sm:grid-cols-2';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">AI Value Snapshot</h3>
      </div>
      
      <div className={`grid ${gridCols} gap-4`}>
        {/* Combined: Price vs. Market */}
        {hasPriceVsMarket && propertyPricePerSqm && averagePriceSqm && (
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Price vs. Market</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatPricePerArea(propertyPricePerSqm, 'ILS')}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {city} avg: {formatPricePerArea(averagePriceSqm, 'ILS')}
            </p>
            {purchaseComparisonPercent !== null && (
              <div className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                purchaseComparisonPercent > 0 
                  ? 'bg-muted text-muted-foreground' 
                  : purchaseComparisonPercent < 0 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-muted text-muted-foreground'
              }`}>
                {purchaseComparisonPercent > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : purchaseComparisonPercent < 0 ? (
                  <TrendingDown className="h-3 w-3" />
                ) : (
                  <Minus className="h-3 w-3" />
                )}
                <span>
                  {purchaseComparisonPercent > 0 ? '+' : ''}{purchaseComparisonPercent}% 
                  {purchaseComparisonPercent > 0 
                    ? ' above avg' 
                    : purchaseComparisonPercent < 0 
                      ? ' below avg' 
                      : ' at avg'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 12-Month Trend */}
        {priceChange !== null && priceChange !== undefined && (
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              {priceChange > 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : priceChange < 0 ? (
                <TrendingDown className="h-4 w-4" />
              ) : (
                <Minus className="h-4 w-4" />
              )}
              <span className="text-sm">12-Month Trend</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
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
