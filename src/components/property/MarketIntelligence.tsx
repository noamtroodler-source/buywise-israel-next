import { useState, useCallback } from 'react';
import { BarChart3, ShieldCheck, Info, ArrowRight, Sparkles, ChevronDown } from 'lucide-react';
import { getIsraeliRoomCount } from '@/lib/israeliRoomCount';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { PropertyValueSnapshot } from './PropertyValueSnapshot';
import { RecentNearbySales } from './RecentNearbySales';
import { SpecBasedComps } from './SpecBasedComps';
import { MarketDataContext } from '@/components/shared/MarketDataContext';
import { useRoomSpecificCityPrice } from '@/hooks/useRoomSpecificCityPrice';
import { useNeighborhoodAvgPrice } from '@/hooks/useNeighborhoodPrices';
import { usePriceTier } from '@/hooks/usePriceTier';
import type { PriceTier } from '@/hooks/usePriceTier';
import { getMarketFit, type MarketFitResult } from '@/lib/marketFit';

interface MarketIntelligenceProps {
  property: {
    id: string;
    price: number;
    size_sqm: number | null;
    city: string;
    neighborhood?: string | null;
    listing_status: string;
    bedrooms: number | null;
    bathrooms?: number | null;
    floor?: number | null;
    total_floors?: number | null;
    year_built?: number | null;
    condition?: string | null;
    has_elevator?: boolean | null;
    parking?: number | null;
    has_balcony?: boolean | null;
    has_storage?: boolean | null;
    is_accessible?: boolean | null;
    entry_date?: string | null;
    original_price?: number | null;
    additional_rooms?: number | null;
    description?: string | null;
    features?: string[] | null;
    property_type?: string;
    furnished_status?: string | null;
    furniture_items?: string[] | null;
    featured_highlight?: string | null;
    premium_drivers?: string[] | null;
    premium_explanation?: string | null;
    market_fit_status?: string | null;
    created_at?: string;
    vaad_bayit_monthly?: number | null;
    latitude: number | null;
    longitude: number | null;
  };
  cityData: {
    average_price_sqm: number | null;
    yoy_price_change: number | null;
    arnona_rate_sqm: number | null;
    average_vaad_bayit: number | null;
    rental_3_room_min?: number | null;
    rental_3_room_max?: number | null;
    rental_4_room_min?: number | null;
    rental_4_room_max?: number | null;
    slug?: string;
  } | null | undefined;
}

function formatPremiumDriver(driver: string) {
  return driver.replace(/[_/]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function MarketVerdictBadge({ avgComparison, compsCount, radiusUsedM, priceTier, marketFit }: { avgComparison: number | null; compsCount: number; radiusUsedM: number; priceTier?: PriceTier | null; marketFit: MarketFitResult }) {
  const radiusLabel = radiusUsedM >= 1000 ? '1km' : '500m';
  const isPositive = marketFit.state === 'normal_range' && (avgComparison ?? 0) <= 15;
  const isNeutral = marketFit.state === 'limited_comparable_match' || marketFit.state === 'above_recorded_sales';

  const badge = (
    <Badge
      variant={isNeutral ? 'secondary' : undefined}
      className={isNeutral ? 'text-xs' : isPositive ? 'bg-semantic-green text-semantic-green-foreground border-semantic-green' : 'bg-semantic-amber text-semantic-amber-foreground border-semantic-amber'}
    >
      {marketFit.label}
    </Badge>
  );

  const contextLine = priceTier && priceTier !== 'standard'
    ? `Comparing against similar ${priceTier}-tier properties`
    : marketFit.contextLine;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        {badge}
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <p className="text-xs">
              Based on {compsCount} government-recorded sale{compsCount > 1 ? 's' : ''} within {radiusLabel} over the past 12–24 months. Asking prices typically run 5–15% above final sale prices.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
      {contextLine && (
        <p className="text-xs text-muted-foreground pl-0.5">{contextLine}</p>
      )}
    </div>
  );
}

function BuyWiseTake({ marketFit, premiumDrivers, premiumExplanation }: { marketFit: MarketFitResult; premiumDrivers: string[]; premiumExplanation?: string | null }) {
  const [open, setOpen] = useState(false);
  const hasPremiumContext = premiumDrivers.length > 0 || Boolean(premiumExplanation?.trim());
  const take = hasPremiumContext
    ? 'Recorded sales may not fully capture the specific features and context that shape this listing’s price.'
    : marketFit.contextLine;

  return (
    <div className="rounded-xl border border-primary/15 bg-primary/5 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className="text-sm font-semibold text-foreground">BuyWise Take</p>
            <Badge variant="secondary" className="text-xs">{marketFit.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{take}</p>
        </div>
      </div>

      {hasPremiumContext && (
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-primary hover:text-primary">
              What recorded sales may not capture
              <ChevronDown className={`ml-1 h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-3">
            {premiumDrivers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {premiumDrivers.slice(0, 8).map((driver) => (
                  <Badge key={driver} variant="outline" className="rounded-lg bg-background/70">
                    {formatPremiumDriver(driver)}
                  </Badge>
                ))}
              </div>
            )}
            {premiumExplanation && (
              <p className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-3">
                {premiumExplanation}
              </p>
            )}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

export function MarketIntelligence({ property, cityData }: MarketIntelligenceProps) {
  const [verdictData, setVerdictData] = useState<{ avgComparison: number | null; compsCount: number; radiusUsedM: number; avgCompPriceSqm: number | null }>({
    avgComparison: null,
    compsCount: 0,
    radiusUsedM: 500,
    avgCompPriceSqm: null,
  });

  const handleVerdictComputed = useCallback((avgComparison: number | null, compsCount: number, radiusUsedM: number, avgCompPriceSqm: number | null) => {
    setVerdictData(prev => {
      if (prev.avgComparison === avgComparison && prev.compsCount === compsCount && prev.radiusUsedM === radiusUsedM && prev.avgCompPriceSqm === avgCompPriceSqm) return prev;
      return { avgComparison, compsCount, radiusUsedM, avgCompPriceSqm };
    });
  }, []);

  const citySlug = property.city?.toLowerCase().replace(/['']/g, '').replace(/\s+/g, '-') || '';

  // Convert BuyWise bedrooms + additional_rooms → Israeli gov standard room count
  const israeliRooms = getIsraeliRoomCount(property.bedrooms, property.additional_rooms);

  // Room-specific city average (overrides generic city avg when available)
  // Note: rooms param = Israeli standard total room count (bedrooms + additional)
  const { data: roomPrice } = useRoomSpecificCityPrice(property.city, israeliRooms);
  
  // Neighborhood-level average (highest priority for comparison card)
  // Note: rooms param = Israeli standard total room count
  const { data: neighborhoodPrice } = useNeighborhoodAvgPrice(
    property.city,
    property.neighborhood ?? undefined,
    israeliRooms ?? 4
  );

  const effectiveAvgPriceSqm = roomPrice?.avgPriceSqm ?? cityData?.average_price_sqm ?? null;

  // Price tier classification (replaces old isPremiumSegment hack)
  const propertyPricePerSqm = property.size_sqm ? Math.round(property.price / property.size_sqm) : null;
  const { tier: priceTier, tierLabel, tierAvgPriceSqm, tierAvgTotalPrice } = usePriceTier(
    property.city,
    israeliRooms,
    propertyPricePerSqm
  );
  const effectiveYoyChange = roomPrice?.yoyChange ?? cityData?.yoy_price_change ?? null;

  // Neighborhood avg price per sqm (falls back to city if unavailable)
  const neighborhoodAvgPriceSqm = neighborhoodPrice?.avg_price_sqm ?? null;

  const marketFit = getMarketFit({
    avgComparison: verdictData.avgComparison,
    compsCount: verdictData.compsCount,
    radiusUsedM: verdictData.radiusUsedM,
    property,
  });
  const premiumDrivers = Array.from(new Set([...(property.premium_drivers ?? []), ...marketFit.premiumDrivers]));

  return (
    <TooltipProvider>
      <div className="space-y-5">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Market Intelligence</h3>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-help">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span className="border-b border-dotted border-muted-foreground/30">
                  Government verified
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p className="font-medium mb-1">Official Transaction Records</p>
              <p className="text-xs text-muted-foreground">
                Market data sourced from Israel Tax Authority and Nadlan.gov.il — legally recorded sale prices.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Tier Badge */}
        {priceTier && priceTier !== 'standard' && (
          <div className="flex items-center gap-2">
            <Badge className={priceTier === 'luxury'
              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
              : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
            }>
              {tierLabel}
            </Badge>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="text-xs">
                  Price tier based on {priceTier === 'luxury' ? 'top' : 'middle'} third of government-recorded sale prices in {property.city} for similar room counts over the past 2 years.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Hero Verdict Badge */}
        <MarketVerdictBadge 
          avgComparison={verdictData.avgComparison} 
          compsCount={verdictData.compsCount}
          radiusUsedM={verdictData.radiusUsedM}
          priceTier={priceTier}
          marketFit={marketFit}
        />

        {/* Value Snapshot Cards (no header) */}
        <PropertyValueSnapshot
          price={property.price}
          sizeSqm={property.size_sqm}
          city={property.city}
          averagePriceSqm={tierAvgPriceSqm ?? effectiveAvgPriceSqm}
          priceChange={effectiveYoyChange}
          listingStatus={property.listing_status}
          bedrooms={israeliRooms}
          cityArnonaRate={cityData?.arnona_rate_sqm}
          cityAvgVaadBayit={cityData?.average_vaad_bayit}
          roomSpecificCityAvgPrice={tierAvgTotalPrice ?? roomPrice?.avgPrice ?? null}
          nearbyCompAvgPriceSqm={verdictData.avgCompPriceSqm}
          nearbyCompCount={verdictData.compsCount}
          nearbyCompRadiusM={verdictData.radiusUsedM}
          priceTier={priceTier}
          tierLabel={tierLabel}
          neighborhoodAvgPriceSqm={neighborhoodAvgPriceSqm}
          neighborhood={property.neighborhood}
          hideHeader
        />

        {/* Divider with evidence count */}
        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {verdictData.compsCount > 0 
              ? `Based on ${verdictData.compsCount} verified sale${verdictData.compsCount > 1 ? 's' : ''} within ${verdictData.radiusUsedM >= 1000 ? '1km' : '500m'}`
              : `Nearby sales within ${verdictData.radiusUsedM >= 1000 ? '1km' : '500m'}`
            }
          </span>
          <Separator className="flex-1" />
        </div>

        {/* Comps List — use spec-based when no coordinates (sourced listings with no address) */}
        {property.latitude && property.longitude ? (
          <RecentNearbySales
            latitude={property.latitude}
            longitude={property.longitude}
            city={property.city}
            propertyRooms={israeliRooms ?? undefined}
            propertyPrice={property.price}
            propertySizeSqm={property.size_sqm ?? undefined}
            hideHeader
            hideVerdict
            onVerdictComputed={handleVerdictComputed}
          />
        ) : (
          <SpecBasedComps
            city={property.city}
            neighborhood={property.neighborhood}
            bedrooms={property.bedrooms}
            sizeSqm={property.size_sqm}
            price={property.price}
            currency={(property as any).currency ?? 'ILS'}
            sourceRooms={(property as any).source_rooms}
          />
        )}

        {/* BuyWise Take — placed after evidence so it reads as a conclusion */}
        <BuyWiseTake
          marketFit={marketFit}
          premiumDrivers={premiumDrivers}
          premiumExplanation={property.premium_explanation}
        />

        {/* Data context — help buyers understand data limitations */}
        <MarketDataContext variant="compact" />

        {/* Explore city link */}
        <div className="flex justify-center pt-1">
          <Link 
            to={`/areas/${citySlug}`}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
          >
            Explore {property.city} Market Data
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </TooltipProvider>
  );
}
