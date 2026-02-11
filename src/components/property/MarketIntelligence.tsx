import { useState, useCallback } from 'react';
import { BarChart3, ShieldCheck, Info, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { PropertyValueSnapshot } from './PropertyValueSnapshot';
import { RecentNearbySales } from './RecentNearbySales';

interface MarketIntelligenceProps {
  property: {
    price: number;
    size_sqm: number | null;
    city: string;
    listing_status: string;
    bedrooms: number | null;
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

function MarketVerdictBadge({ avgComparison, compsCount }: { avgComparison: number | null; compsCount: number }) {
  if (avgComparison === null) {
    return (
      <Badge variant="secondary" className="text-xs">
        Limited market data
      </Badge>
    );
  }

  const badge = avgComparison >= -5 && avgComparison <= 10 ? (
    <Badge className="bg-primary text-primary-foreground border-primary">
      Priced in line with recent sales
    </Badge>
  ) : avgComparison > 10 && avgComparison <= 20 ? (
    <Badge className="bg-semantic-amber text-semantic-amber-foreground border-semantic-amber">
      Above average for this area (+{avgComparison.toFixed(0)}%)
    </Badge>
  ) : avgComparison > 20 ? (
    <Badge className="bg-semantic-red text-semantic-red-foreground border-semantic-red">
      Significantly above market (+{avgComparison.toFixed(0)}%)
    </Badge>
  ) : avgComparison < -5 ? (
    <Badge className="bg-primary text-primary-foreground border-primary">
      Below average — potential value ({avgComparison.toFixed(0)}%)
    </Badge>
  ) : null;

  return (
    <div className="flex items-center gap-2">
      {badge}
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <p className="text-xs">
            Based on {compsCount} nearby sale{compsCount > 1 ? 's' : ''} comparing price/m².
          </p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export function MarketIntelligence({ property, cityData }: MarketIntelligenceProps) {
  const [verdictData, setVerdictData] = useState<{ avgComparison: number | null; compsCount: number }>({
    avgComparison: null,
    compsCount: 0,
  });

  const handleVerdictComputed = useCallback((avgComparison: number | null, compsCount: number) => {
    setVerdictData(prev => {
      if (prev.avgComparison === avgComparison && prev.compsCount === compsCount) return prev;
      return { avgComparison, compsCount };
    });
  }, []);

  const citySlug = property.city?.toLowerCase().replace(/['']/g, '').replace(/\s+/g, '-') || '';
  const hasComps = property.latitude && property.longitude;

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

        {/* Hero Verdict Badge */}
        <MarketVerdictBadge 
          avgComparison={verdictData.avgComparison} 
          compsCount={verdictData.compsCount} 
        />

        {/* Value Snapshot Cards (no header) */}
        <PropertyValueSnapshot
          price={property.price}
          sizeSqm={property.size_sqm}
          city={property.city}
          averagePriceSqm={cityData?.average_price_sqm}
          priceChange={cityData?.yoy_price_change}
          listingStatus={property.listing_status}
          bedrooms={property.bedrooms}
          cityArnonaRate={cityData?.arnona_rate_sqm}
          cityAvgVaadBayit={cityData?.average_vaad_bayit}
          hideHeader
        />

        {/* Divider with evidence count */}
        {hasComps && (
          <>
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {verdictData.compsCount > 0 
                  ? `Based on ${verdictData.compsCount} verified sale${verdictData.compsCount > 1 ? 's' : ''} within 500m`
                  : 'Nearby sales within 500m'
                }
              </span>
              <Separator className="flex-1" />
            </div>

            {/* Comps List (no header, no verdict) */}
            <RecentNearbySales
              latitude={property.latitude}
              longitude={property.longitude}
              city={property.city}
              propertyRooms={property.bedrooms ?? undefined}
              propertyPrice={property.price}
              propertySizeSqm={property.size_sqm ?? undefined}
              hideHeader
              hideVerdict
              onVerdictComputed={handleVerdictComputed}
            />
          </>
        )}

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
