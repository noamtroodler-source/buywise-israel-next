import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { BarChart3, ShieldCheck, Info, ArrowRight, ChevronDown, CircleHelp, CheckCircle2, Calculator, Ruler, TrendingUp, ThumbsUp, ThumbsDown } from 'lucide-react';
import { getIsraeliRoomCount } from '@/lib/israeliRoomCount';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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
import { formatPriceContextValue, getPriceContext, type PriceContextResult, type PriceContextSpecMatchQuality } from '@/lib/priceContext';
import { PRICE_CONTEXT_DISCLAIMER, PRICE_CONTEXT_SIZE_NOTE } from '@/lib/priceContextDisclaimer';

const SESSION_KEY = 'analytics_session_id';
const SESSION_EXPIRY_KEY = 'analytics_session_expiry';
const SESSION_DURATION = 30 * 60 * 1000;

function getOrCreateAnalyticsSessionId() {
  const existingSession = sessionStorage.getItem(SESSION_KEY);
  const expiry = sessionStorage.getItem(SESSION_EXPIRY_KEY);

  if (existingSession && expiry && Date.now() < parseInt(expiry)) {
    sessionStorage.setItem(SESSION_EXPIRY_KEY, String(Date.now() + SESSION_DURATION));
    return existingSession;
  }

  const newSession = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  sessionStorage.setItem(SESSION_KEY, newSession);
  sessionStorage.setItem(SESSION_EXPIRY_KEY, String(Date.now() + SESSION_DURATION));
  return newSession;
}

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
    sqm_source?: string | null;
    ownership_type?: string | null;
    benchmark_review_status?: string | null;
    price_context_public_label?: string | null;
    price_context_confidence_tier?: string | null;
    price_context_percentage_suppressed?: boolean | null;
    price_context_badge_status?: string | null;
    created_at?: string;
    vaad_bayit_monthly?: number | null;
    currency?: string | null;
    source_rooms?: number | null;
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
  trackingEnabled?: boolean;
}

function formatPremiumDriver(driver: string) {
  return driver.replace(/[_/]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatNisPerSqm(value: number | null | undefined) {
  if (!value) return '—';
  return `₪${Math.round(value).toLocaleString()}/sqm`;
}

function MarketVerdictBadge({ compsCount, radiusUsedM, priceTier, priceContext }: { compsCount: number; radiusUsedM: number; priceTier?: PriceTier | null; priceContext: PriceContextResult }) {
  const radiusLabel = radiusUsedM >= 1000 ? '1km' : '500m';
  const isPositive = priceContext.publicLabel === 'In line with available benchmarks';
  const isNeutral = priceContext.percentageSuppressed || priceContext.confidenceTier !== 'strong_comparable_match';

  const badge = (
    <Badge
      variant={isNeutral ? 'secondary' : undefined}
      className={isNeutral ? 'text-xs' : isPositive ? 'bg-semantic-green text-semantic-green-foreground border-semantic-green' : 'bg-semantic-amber text-semantic-amber-foreground border-semantic-amber'}
    >
      {priceContext.displayGapPercent !== null
        ? `${priceContext.displayGapPercent > 0 ? '+' : ''}${priceContext.displayGapPercent}% vs selected benchmarks`
        : priceContext.publicLabel}
    </Badge>
  );

  const contextLine = priceTier && priceTier !== 'standard'
    ? `Comparing against similar ${priceTier}-tier properties`
    : priceContext.buyWiseTake;

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

function BuyWiseTake({ priceContext, premiumExplanation, propertyPricePerSqm, compsCount, radiusUsedM, sqmSource, ownershipType, onTrackInteraction }: { priceContext: PriceContextResult; premiumExplanation?: string | null; propertyPricePerSqm: number | null; compsCount: number; radiusUsedM: number; sqmSource?: string | null; ownershipType?: string | null; onTrackInteraction?: (eventName: string, properties?: Record<string, unknown>) => void }) {
  const [open, setOpen] = useState(false);
  const hasPremiumContext = priceContext.confirmedPremiumDrivers.length > 0 || priceContext.detectedPremiumDrivers.length > 0 || Boolean(premiumExplanation?.trim());
  const radiusLabel = radiusUsedM >= 1000 ? '1km' : `${radiusUsedM}m`;

  const handlePremiumOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      onTrackInteraction?.('price_context_premium_context_opened', {
        confirmed_driver_count: priceContext.confirmedPremiumDrivers.length,
        detected_driver_count: priceContext.detectedPremiumDrivers.length,
      });
    }
  };

  return (
    <div className="rounded-lg border border-primary/15 bg-primary/5 p-4 space-y-4">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <BarChart3 className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-foreground">BuyWise Price Context</p>
              <Badge variant="secondary" className="text-xs">{priceContext.publicLabel}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Recorded sales, local benchmark ranges, and property-specific context for International buyers.</p>
          </div>
          <p className="text-sm text-muted-foreground">{priceContext.buyWiseTake}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-border/70 bg-background/70 p-3">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Ruler className="h-3 w-3" /> Asking price / sqm</p>
              <p className="text-sm font-semibold text-foreground">{formatNisPerSqm(propertyPricePerSqm)}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/70 p-3">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Recorded local range</p>
              <p className="text-sm font-semibold text-foreground">
                {priceContext.benchmarkRange ? `${formatNisPerSqm(priceContext.benchmarkRange.min)}–${formatNisPerSqm(priceContext.benchmarkRange.max).replace('₪', '')}` : 'Directional only'}
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/70 p-3">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Comparable confidence</p>
              <p className="text-sm font-semibold text-foreground">{priceContext.confidenceLabel}</p>
            </div>
          </div>
        </div>
      </div>

      {hasPremiumContext && (
        <Collapsible open={open} onOpenChange={handlePremiumOpenChange}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-primary hover:text-primary">
              What recorded sales may not capture
              <ChevronDown className={`ml-1 h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-3">
            {(priceContext.confirmedPremiumDrivers.length > 0 || priceContext.detectedPremiumDrivers.length > 0) && (
              <div className="grid gap-3 sm:grid-cols-2">
                {priceContext.confirmedPremiumDrivers.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Confirmed by agency</p>
                    <div className="flex flex-wrap gap-2">
                      {priceContext.confirmedPremiumDrivers.slice(0, 8).map((driver) => <Badge key={driver} variant="outline" className="rounded-lg bg-background/70">{formatPremiumDriver(driver)}</Badge>)}
                    </div>
                  </div>
                )}
                {priceContext.detectedPremiumDrivers.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Detected from listing</p>
                    <div className="flex flex-wrap gap-2">
                      {priceContext.detectedPremiumDrivers.slice(0, 8).map((driver) => <Badge key={driver} variant="outline" className="rounded-lg bg-background/70">{formatPremiumDriver(driver)}</Badge>)}
                    </div>
                  </div>
                )}
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

      {priceContext.buyerQuestions.length > 0 && (
        <div className="rounded-lg border border-border/70 bg-background/70 p-3">
          <div className="mb-2 flex items-center gap-2">
            <CircleHelp className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">Questions worth asking</p>
              <p className="text-xs text-muted-foreground">Based on this listing’s pricing context and property details</p>
            </div>
          </div>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {priceContext.buyerQuestions.map((question, index) => (
              <li
                key={question}
                className="flex cursor-pointer gap-2 rounded-md px-1 py-0.5 transition-colors hover:bg-primary/5"
                onClick={() => onTrackInteraction?.('buyer_question_engaged', { question, question_index: index + 1 })}
              >
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span>{question}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Collapsible onOpenChange={(nextOpen) => nextOpen && onTrackInteraction?.('price_context_details_opened', { confidence_tier: priceContext.confidenceTier })}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground">
            <Calculator className="mr-1 h-3.5 w-3.5" /> How we calculated this
            <ChevronDown className="ml-1 h-3.5 w-3.5" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <div className="rounded-lg border border-border/70 bg-background/70 p-3 text-xs text-muted-foreground space-y-2">
            <p>Comp set summary: {compsCount > 0 ? `${compsCount} recorded sale${compsCount > 1 ? 's' : ''} within ${radiusLabel}` : 'local city or neighborhood benchmarks when listing-level comps are limited'}.</p>
            <p>Property class: {priceContext.propertyClassLabel}. Standard resale, premium, new-build, garden, penthouse, and house/villa listings are treated cautiously because they do not trade the same way.</p>
            <p>SQM source: {formatPriceContextValue(sqmSource)}. {PRICE_CONTEXT_SIZE_NOTE}</p>
            <p>Ownership type: {formatPriceContextValue(ownershipType)}. Ownership structure can affect buyer due diligence and how closely recorded resale benchmarks apply.</p>
            {priceContext.confidenceCaps.length > 0 && (
              <div>
                <p className="font-medium text-foreground">Limitations applied:</p>
                <ul className="mt-1 space-y-1 pl-4">
                  {priceContext.confidenceCaps.map((cap) => (
                    <li key={cap.code} className="list-disc">{cap.label}: {cap.detail}</li>
                  ))}
                </ul>
              </div>
            )}
            {priceContext.percentageSuppressionReason && <p>Display guardrail: {priceContext.percentageSuppressionReason}</p>}
            <p>{PRICE_CONTEXT_DISCLAIMER}</p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function PriceContextTrustFeedback({ priceContext, onTrackInteraction }: { priceContext: PriceContextResult; onTrackInteraction?: (eventName: string, properties?: Record<string, unknown>) => void }) {
  const [selection, setSelection] = useState<'helpful' | 'not_helpful' | null>(null);

  const handleSelect = (nextSelection: 'helpful' | 'not_helpful') => {
    setSelection(nextSelection);
    onTrackInteraction?.('price_context_trust_feedback_submitted', {
      feedback: nextSelection,
      helpful: nextSelection === 'helpful',
      confidence_tier: priceContext.confidenceTier,
      public_label: priceContext.publicLabel,
      property_class: priceContext.propertyClass,
      percentage_suppressed: priceContext.percentageSuppressed,
    });
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border/70 bg-background/70 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-foreground">Was this price context helpful?</p>
        <p className="text-xs text-muted-foreground">Your response helps improve buyer trust signals.</p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={selection === 'helpful' ? 'default' : 'outline'}
          className="h-8"
          disabled={selection === 'helpful'}
          onClick={() => handleSelect('helpful')}
        >
          <ThumbsUp className="mr-1.5 h-3.5 w-3.5" />
          Yes
        </Button>
        <Button
          type="button"
          size="sm"
          variant={selection === 'not_helpful' ? 'secondary' : 'outline'}
          className="h-8"
          disabled={selection === 'not_helpful'}
          onClick={() => handleSelect('not_helpful')}
        >
          <ThumbsDown className="mr-1.5 h-3.5 w-3.5" />
          Not yet
        </Button>
      </div>
    </div>
  );
}

export function MarketIntelligence({ property, cityData, trackingEnabled = true }: MarketIntelligenceProps) {
  const [verdictData, setVerdictData] = useState<{ avgComparison: number | null; compsCount: number; radiusUsedM: number; avgCompPriceSqm: number | null; compDispersionPercent: number | null; compClassMatch: 'same_class' | 'similar_class' | 'mixed_fallback' | 'no_comps' | null; roomMatchQuality: PriceContextSpecMatchQuality | null; sizeMatchQuality: PriceContextSpecMatchQuality | null; compRecencyMonths: number | null }>({
    avgComparison: null,
    compsCount: 0,
    radiusUsedM: 500,
    avgCompPriceSqm: null,
    compDispersionPercent: null,
    compClassMatch: null,
    roomMatchQuality: null,
    sizeMatchQuality: null,
    compRecencyMonths: null,
  });
  const { user } = useAuth();
  const location = useLocation();
  const trackedViewKey = useRef<string | null>(null);
  const trackedCompsKey = useRef<string | null>(null);

  const handleVerdictComputed = useCallback((avgComparison: number | null, compsCount: number, radiusUsedM: number, avgCompPriceSqm: number | null, compDispersionPercent: number | null = null, compClassMatch: 'same_class' | 'similar_class' | 'mixed_fallback' | 'no_comps' | null = null, roomMatchQuality: PriceContextSpecMatchQuality | null = null, sizeMatchQuality: PriceContextSpecMatchQuality | null = null, compRecencyMonths: number | null = null) => {
    setVerdictData(prev => {
      if (prev.avgComparison === avgComparison && prev.compsCount === compsCount && prev.radiusUsedM === radiusUsedM && prev.avgCompPriceSqm === avgCompPriceSqm && prev.compDispersionPercent === compDispersionPercent && prev.compClassMatch === compClassMatch && prev.roomMatchQuality === roomMatchQuality && prev.sizeMatchQuality === sizeMatchQuality && prev.compRecencyMonths === compRecencyMonths) return prev;
      return { avgComparison, compsCount, radiusUsedM, avgCompPriceSqm, compDispersionPercent, compClassMatch, roomMatchQuality, sizeMatchQuality, compRecencyMonths };
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

  const priceContext = getPriceContext({
    avgComparison: verdictData.avgComparison,
    compsCount: verdictData.compsCount,
    radiusUsedM: verdictData.radiusUsedM,
    compDispersionPercent: verdictData.compDispersionPercent,
    compRecencyMonths: verdictData.compRecencyMonths,
    compClassMatch: verdictData.compClassMatch,
    roomMatchQuality: verdictData.roomMatchQuality,
    sizeMatchQuality: verdictData.sizeMatchQuality,
    avgCompPriceSqm: verdictData.avgCompPriceSqm,
    benchmarkPriceSqm: tierAvgPriceSqm ?? neighborhoodAvgPriceSqm ?? effectiveAvgPriceSqm,
    pricePerSqm: propertyPricePerSqm,
    property,
  });

  const priceContextTrackingPayload = useMemo(() => ({
    property_id: property.id,
    property_city: property.city,
    listing_status: property.listing_status,
    public_label: priceContext.publicLabel,
    confidence_tier: priceContext.confidenceTier,
    confidence_score: priceContext.confidenceScore,
    percentage_suppressed: priceContext.percentageSuppressed,
    badge_status: priceContext.badgeStatus,
    property_class: priceContext.propertyClass,
    buyer_question_count: priceContext.buyerQuestions.length,
    premium_driver_count: priceContext.premiumDrivers.length,
    comps_count: verdictData.compsCount,
    radius_used_m: verdictData.radiusUsedM,
  }), [property.id, property.city, property.listing_status, priceContext.publicLabel, priceContext.confidenceTier, priceContext.confidenceScore, priceContext.percentageSuppressed, priceContext.badgeStatus, priceContext.propertyClass, priceContext.buyerQuestions.length, priceContext.premiumDrivers.length, verdictData.compsCount, verdictData.radiusUsedM]);

  useEffect(() => {
    if (!trackingEnabled) return;
    const viewKey = `${property.id}:${priceContext.confidenceTier}:${priceContext.publicLabel}:${verdictData.compsCount}:${verdictData.radiusUsedM}`;
    if (trackedViewKey.current === viewKey) return;

    trackedViewKey.current = viewKey;
    supabase.from('user_events').insert({
      session_id: getOrCreateAnalyticsSessionId(),
      user_id: user?.id || null,
      user_role: user ? 'user' : 'anonymous',
      event_type: 'view',
      event_name: 'price_context_module_viewed',
      event_category: 'engagement',
      page_path: location.pathname,
      component: 'MarketIntelligence',
      properties: priceContextTrackingPayload,
    }).then(({ error }) => {
      if (error) console.debug('Price Context view tracking error:', error);
    });
  }, [trackingEnabled, property.id, priceContext.confidenceTier, priceContext.publicLabel, verdictData.compsCount, verdictData.radiusUsedM, user, location.pathname, priceContextTrackingPayload]);

  const handlePriceContextInteraction = useCallback((eventName: string, properties?: Record<string, unknown>) => {
    if (!trackingEnabled) return;
    supabase.from('user_events').insert({
      session_id: getOrCreateAnalyticsSessionId(),
      user_id: user?.id || null,
      user_role: user ? 'user' : 'anonymous',
      event_type: 'click',
      event_name: eventName,
      event_category: 'engagement',
      page_path: location.pathname,
      component: 'MarketIntelligence',
      properties: {
        ...priceContextTrackingPayload,
        ...properties,
      },
    }).then(({ error }) => {
      if (error) console.debug('Price Context interaction tracking error:', error);
    });
  }, [trackingEnabled, user, location.pathname, priceContextTrackingPayload]);

  const handleCompsViewed = useCallback((payload: { compsCount: number; radiusUsedM: number; source: string }) => {
    const key = `${property.id}:${payload.source}:${payload.compsCount}:${payload.radiusUsedM}`;
    if (trackedCompsKey.current === key) return;
    trackedCompsKey.current = key;
    handlePriceContextInteraction('price_context_comparable_sales_viewed', payload);
  }, [property.id, handlePriceContextInteraction]);

  return (
    <TooltipProvider>
      <div className="space-y-5">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">BuyWise Price Context</h3>
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
              ? 'bg-semantic-amber text-semantic-amber-foreground border-semantic-amber'
              : 'bg-primary/10 text-primary border-primary/20'
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
          compsCount={verdictData.compsCount}
          radiusUsedM={verdictData.radiusUsedM}
          priceTier={priceTier}
          priceContext={priceContext}
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
            subjectProperty={property}
            hideHeader
            hideVerdict
            onVerdictComputed={handleVerdictComputed}
            onCompsViewed={handleCompsViewed}
          />
        ) : (
          <SpecBasedComps
            city={property.city}
            neighborhood={property.neighborhood}
            bedrooms={property.bedrooms}
            sizeSqm={property.size_sqm}
            price={property.price}
            currency={property.currency ?? 'ILS'}
            sourceRooms={property.source_rooms}
            subjectProperty={property}
            onVerdictComputed={handleVerdictComputed}
            onCompsViewed={handleCompsViewed}
          />
        )}

        {/* BuyWise Take — placed after evidence so it reads as a conclusion */}
        <BuyWiseTake
          priceContext={priceContext}
          premiumExplanation={property.premium_explanation}
          propertyPricePerSqm={propertyPricePerSqm}
          compsCount={verdictData.compsCount}
          radiusUsedM={verdictData.radiusUsedM}
          onTrackInteraction={handlePriceContextInteraction}
        />

        <PriceContextTrustFeedback
          priceContext={priceContext}
          onTrackInteraction={handlePriceContextInteraction}
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
