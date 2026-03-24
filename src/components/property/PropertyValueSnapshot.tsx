import { TrendingUp, TrendingDown, Minus, DollarSign, BarChart3, Home, Calendar, Lightbulb } from 'lucide-react';
import { useFormatPrice, useFormatPricePerArea, useAreaLabel } from '@/contexts/PreferencesContext';
import { useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { FALLBACK_CONSTANTS } from '@/lib/calculations/constants';
import type { PriceTier } from '@/hooks/usePriceTier';

interface PropertyValueSnapshotProps {
  price: number;
  sizeSqm?: number | null;
  city: string;
  averagePriceSqm?: number | null;
  priceChange?: number | null;
  listingStatus?: string;
  /** Israeli government standard room count (bedrooms + additional rooms). Use getIsraeliRoomCount(). */
  bedrooms?: number | null;
  cityRentalMin?: number | null;
  cityRentalMax?: number | null;
  vaadBayitMonthly?: number | null;
  cityArnonaRate?: number | null;
  cityAvgVaadBayit?: number | null;
  /** Room-specific city average total price (1-year avg for 3/4/5-room) */
  roomSpecificCityAvgPrice?: number | null;
  /** When true, skip the section header (used when embedded in MarketIntelligence) */
  hideHeader?: boolean;
  /** Average price/sqm from nearby sold comps */
  nearbyCompAvgPriceSqm?: number | null;
  /** Number of nearby comps used */
  nearbyCompCount?: number;
  /** Search radius used for comps (meters) */
  nearbyCompRadiusM?: number;
  /** Price tier classification from usePriceTier */
  priceTier?: PriceTier | null;
  /** Display label for tier (e.g. "Premium", "Luxury") */
  tierLabel?: string | null;
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
  roomSpecificCityAvgPrice,
  hideHeader = false,
  neighborhoodAvgPriceSqm,
  neighborhoodName,
  priceTier,
  tierLabel,
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
  // When tier data is available, averagePriceSqm already reflects tier-specific avg
  const comparisonAvgSqm = neighborhoodAvgPriceSqm ?? averagePriceSqm;
  const tierSuffix = priceTier && priceTier !== 'standard' && tierLabel ? ` ${tierLabel}` : '';
  const comparisonLabel = neighborhoodAvgPriceSqm && neighborhoodName
    ? neighborhoodName
    : `${city}${tierSuffix}`;
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
            <h3 className="text-lg font-semibold text-foreground">Rental Snapshot</h3>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded bg-amber-50 dark:bg-amber-950/40 cursor-help">
                    <Lightbulb className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs text-xs leading-relaxed">
                  BuyWise Estimate · Total monthly combines listed rent + estimated arnona (municipal rate × property size) + Va'ad Bayit. City average uses verified rental data from Madlan/GPG research. Arnona and Va'ad are estimates — actual amounts vary by building.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-xs text-muted-foreground mt-1 cursor-help">
                    Rent + Arnona + Va'ad <span className="text-muted-foreground/60">(est.)</span>
                  </p>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">Va'ad Bayit typical ranges: Walk-up ₪80–150, Elevator ₪150–400, Luxury ₪800–2,000+/mo. Arnona estimated from municipal rates.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
                <TrendingUp className="h-4 w-4 text-semantic-amber" />
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
                <TrendingUp className="h-4 w-4 text-semantic-amber" />
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
                      vs {comparisonLabel} Avg
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="font-medium mb-1">Price vs {isNeighborhoodComparison ? 'Neighborhood' : 'City'} Average</p>
                    <p className="text-xs text-muted-foreground">
                      Compares this property's price {perArea} against the average sale price in {comparisonLabel}, based on the past year of government-recorded transactions. A positive % means priced above average; negative means below.
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
                {!isNeighborhoodComparison && priceTier && priceTier !== 'standard' && tierLabel && purchaseComparisonPercent > 0 && (
                  <p className="text-[10px] text-muted-foreground/70 mt-1 italic">
                    Compared to {tierLabel.toLowerCase()}-tier avg
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-lg font-semibold text-muted-foreground/60">No data yet</p>
                <p className="text-xs text-muted-foreground mt-1">{isNeighborhoodComparison ? 'Neighborhood' : 'City'} average unavailable</p>
              </>
            )}
        </div>

        {/* Card 3: Room-Specific City Price Comparison */}
        {(() => {
          const hasRoomData = bedrooms != null && bedrooms >= 3 && bedrooms <= 5 && roomSpecificCityAvgPrice != null;
          const roomCompPercent = hasRoomData
            ? Math.round(((price - roomSpecificCityAvgPrice!) / roomSpecificCityAvgPrice!) * 100)
            : null;

          return (
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                {roomCompPercent !== null ? (
                  roomCompPercent > 0 ? (
                    <TrendingUp className="h-4 w-4 text-semantic-amber" />
                  ) : roomCompPercent < 0 ? (
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
                        {hasRoomData ? `vs ${city}${tierSuffix} ${bedrooms}-Room Avg` : `vs ${city} Avg`}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="font-medium mb-1">City Price Comparison</p>
                      <p className="text-xs text-muted-foreground">
                        {hasRoomData
                          ? priceTier && priceTier !== 'standard' && tierLabel
                            ? `Compares this listing against the average ${tierLabel.toLowerCase()}-tier ${bedrooms}-room sale price in ${city}. Properties are grouped into Standard, Premium, and Luxury tiers based on price-per-m² percentiles from government transaction data (last 2 years). This ensures an apples-to-apples comparison.`
                            : `Compares this listing's price against the average ${bedrooms}-room apartment sale price in ${city}, based on government transaction data.`
                          : `Room-specific price comparison is available for 3, 4, and 5-room apartments.`}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {roomCompPercent !== null ? (
                <>
                  <p className="text-2xl font-bold text-foreground">
                    {roomCompPercent > 0 ? '+' : ''}{roomCompPercent}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {city} avg: {formatPrice(roomSpecificCityAvgPrice!, 'ILS')}
                  </p>
                  {priceTier && priceTier !== 'standard' && tierLabel && roomCompPercent > 0 && (
                    <p className="text-[10px] text-muted-foreground/70 mt-1 italic">
                      Compared to {tierLabel.toLowerCase()}-tier avg
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-lg font-semibold text-muted-foreground/60">No data yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {bedrooms != null && (bedrooms < 3 || bedrooms > 5)
                      ? `We track 3–5 room averages — ${bedrooms}-room data isn't available yet`
                      : 'Room-specific city data unavailable'}
                  </p>
                </>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
