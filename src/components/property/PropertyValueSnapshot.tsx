import { TrendingUp, TrendingDown, Minus, DollarSign, BarChart3, Home, Calendar } from 'lucide-react';
import { useFormatPrice, useFormatPricePerArea, useAreaLabel } from '@/contexts/PreferencesContext';
import { useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { FALLBACK_CONSTANTS } from '@/lib/calculations/constants';

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
  /** When set, labels will say "vs {city} {roomCount}-Room Avg" */
  roomCount?: number | null;
  /** When true, skip the section header (used when embedded in MarketIntelligence) */
  hideHeader?: boolean;
  /** Neighborhood avg price per sqm (takes priority over city avg in middle card) */
  neighborhoodAvgPriceSqm?: number | null;
  /** Neighborhood name for label (e.g. "Arnona") */
  neighborhoodName?: string | null;
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
  roomCount,
  hideHeader = false,
  neighborhoodAvgPriceSqm,
  neighborhoodName,
}: PropertyValueSnapshotProps) {
  const formatPrice = useFormatPrice();
  const formatPricePerArea = useFormatPricePerArea();
  const { perArea } = useAreaLabel();
  
  const isRental = listingStatus === 'for_rent';
  
  // Calculate metrics based on listing type
  const propertyPricePerSqm = sizeSqm ? Math.round(price / sizeSqm) : null;
  
  // Calculate total monthly commitment for this property (rentals)
  const arnonaEstimate = useMemo(() => {
    if (!sizeSqm || !cityArnonaRate) return 0;
    return Math.round((cityArnonaRate * sizeSqm) / 12); // Monthly arnona
  }, [sizeSqm, cityArnonaRate]);

  const vaadBayit = vaadBayitMonthly ?? FALLBACK_CONSTANTS.VAAD_BAYIT_DEFAULT;
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
  const cityVaad = cityAvgVaadBayit ?? FALLBACK_CONSTANTS.VAAD_BAYIT_DEFAULT;

  // City average TOTAL monthly (rent + arnona + va'ad)
  const cityAvgTotalMonthly = cityAvgRent 
    ? cityAvgRent + cityAvgArnonaMonthly + cityVaad 
    : null;
  
  // Compare total monthly (property vs city average)
  const rentalComparisonPercent = cityAvgTotalMonthly 
    ? Math.round(((totalMonthlyCommitment - cityAvgTotalMonthly) / cityAvgTotalMonthly) * 100)
    : null;
  
  // For purchases: calculate comparison to neighborhood or city average
  // Prefer neighborhood when available, fall back to city
  const comparisonAvgSqm = neighborhoodAvgPriceSqm ?? averagePriceSqm;
  const comparisonLabel = neighborhoodAvgPriceSqm && neighborhoodName
    ? neighborhoodName
    : city;
  const isNeighborhoodComparison = !!(neighborhoodAvgPriceSqm && neighborhoodName);

  const purchaseComparisonPercent = propertyPricePerSqm && comparisonAvgSqm
    ? Math.round(((propertyPricePerSqm - comparisonAvgSqm) / comparisonAvgSqm) * 100)
    : null;

  // Rental-specific cards
  if (isRental) {
    // Always show all 3 cards for rentals

    return (
      <div className="space-y-4">
        {!hideHeader && (
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">AI Rental Snapshot</h3>
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Home className="h-4 w-4" />
              <span className="text-sm">{city} {bedrooms || 3}-Room Avg</span>
            </div>
            {cityAvgTotalMonthly ? (
              <>
                <p className="text-2xl font-bold text-foreground">
                  {formatPrice(cityAvgTotalMonthly, 'ILS')}/mo
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Rent + Arnona + Va'ad
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-semibold text-muted-foreground/60">No data yet</p>
                <p className="text-xs text-muted-foreground mt-1">City rental data unavailable</p>
              </>
            )}
          </div>

          {/* Comparison to Market */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              {rentalComparisonPercent !== null ? (
                rentalComparisonPercent > 0 ? (
                  <TrendingUp className="h-4 w-4 text-semantic-red" />
                ) : rentalComparisonPercent < 0 ? (
                  <TrendingDown className="h-4 w-4 text-semantic-green" />
                ) : (
                  <Minus className="h-4 w-4" />
                )
              ) : (
                <Minus className="h-4 w-4 text-muted-foreground/40" />
              )}
              <span className="text-sm">vs Market Rate</span>
            </div>
            {rentalComparisonPercent !== null ? (
              <>
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
              </>
            ) : (
              <>
                <p className="text-lg font-semibold text-muted-foreground/60">No data yet</p>
                <p className="text-xs text-muted-foreground mt-1">Market comparison unavailable</p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Purchase properties (for_sale, sold)
  return (
    <div className={hideHeader ? undefined : "space-y-4"}>
      {!hideHeader && (
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">AI Value Snapshot</h3>
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: This Property (Price/m²) */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm">This Property</span>
          </div>
          {propertyPricePerSqm ? (
            <>
              <p className="text-2xl font-bold text-foreground">
                {formatPricePerArea(propertyPricePerSqm, 'ILS')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Price {perArea}
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold text-muted-foreground/60">No data yet</p>
              <p className="text-xs text-muted-foreground mt-1">Size not listed</p>
            </>
          )}
        </div>

        {/* Card 2: vs City Average */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            {purchaseComparisonPercent !== null ? (
              purchaseComparisonPercent > 0 ? (
                <TrendingUp className="h-4 w-4 text-semantic-red" />
              ) : purchaseComparisonPercent < 0 ? (
                <TrendingDown className="h-4 w-4 text-semantic-green" />
              ) : (
                <Minus className="h-4 w-4" />
              )
            ) : (
              <Minus className="h-4 w-4 text-muted-foreground/40" />
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                    <span className="text-sm cursor-help border-b border-dotted border-muted-foreground/30">
                      vs {comparisonLabel} {roomCount ? `${roomCount}-Room ` : ''}Avg
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="font-medium mb-1">Price vs {isNeighborhoodComparison ? 'Neighborhood' : (roomCount ? `${roomCount}-Room ` : 'City ')}Average</p>
                    <p className="text-xs text-muted-foreground">
                      Compares this property's price per m² against the {isNeighborhoodComparison ? `average ${roomCount ? `${roomCount}-room ` : ''}sale price in ${comparisonLabel}` : `average ${roomCount ? `${roomCount}-room ` : ''}sale price in ${city}`}, based on {isNeighborhoodComparison ? '3 years of' : 'recent'} government-recorded transactions. A positive % means priced above average; negative means below.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {purchaseComparisonPercent !== null && comparisonAvgSqm ? (
              <>
                <p className="text-2xl font-bold text-foreground">
                  {purchaseComparisonPercent > 0 ? '+' : ''}{purchaseComparisonPercent}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {comparisonLabel}: {formatPricePerArea(comparisonAvgSqm, 'ILS')}
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-semibold text-muted-foreground/60">No data yet</p>
                <p className="text-xs text-muted-foreground mt-1">{isNeighborhoodComparison ? 'Neighborhood' : 'City'} average unavailable</p>
              </>
            )}
        </div>

        {/* Card 3: 12-Month Trend */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            {priceChange !== null && priceChange !== undefined ? (
              priceChange > 0 ? (
                <TrendingUp className="h-4 w-4 text-semantic-green" />
              ) : priceChange < 0 ? (
                <TrendingDown className="h-4 w-4 text-semantic-red" />
              ) : (
                <Minus className="h-4 w-4" />
              )
            ) : (
              <Minus className="h-4 w-4 text-muted-foreground/40" />
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-sm cursor-help border-b border-dotted border-muted-foreground/30">
                    12-Month Trend
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="font-medium mb-1">Area Price Trend</p>
                  <p className="text-xs text-muted-foreground">
                    How much property prices in {city} have changed over the past 12 months, based on government transaction data.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {priceChange !== null && priceChange !== undefined ? (
            <>
              <p className="text-2xl font-bold text-foreground">
                {priceChange > 0 ? '+' : ''}{priceChange}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {city} avg prices
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold text-muted-foreground/60">No data yet</p>
              <p className="text-xs text-muted-foreground mt-1">Trend data unavailable</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
