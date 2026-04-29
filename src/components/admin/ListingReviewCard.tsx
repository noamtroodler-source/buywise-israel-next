import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Bath,
  Bed,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileText,
  Home,
  Info,
  Layers,
  MapPin,
  MessageSquare,
  Ruler,
  ShieldCheck,
  Sparkles,
  Star,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { PropertyThumbnail } from '@/components/shared/PropertyThumbnail';
import { BenchmarkReviewResolution, PropertyForReview, PriceContextEvent, usePriceContextEvents } from '@/hooks/useListingReview';
import { useNearbySoldComps } from '@/hooks/useNearbySoldComps';
import { computeSpecCompStats, useSpecBasedSoldComps } from '@/hooks/useSpecBasedSoldComps';
import { useNeighborhoodAvgPrice } from '@/hooks/useNeighborhoodPrices';
import { supabase } from '@/integrations/supabase/client';
import { getIsraeliRoomCount } from '@/lib/israeliRoomCount';
import { detectPremiumDrivers } from '@/lib/marketFit';
import { computePriceContextCompRecency, computePriceContextSpecMatch, formatPriceContextValue, getPriceContext, getPriceContextPropertyClass, selectPriceContextComps, type PriceContextResult } from '@/lib/priceContext';
import { PropertyPreviewModal } from './PropertyPreviewModal';

interface ListingReviewCardProps {
  property: PropertyForReview;
  onApprove: (id: string, notes?: string, agentId?: string, propertyTitle?: string, featureThis?: boolean) => void;
  onRequestChanges: (id: string, reason: string, notes?: string, agentId?: string, propertyTitle?: string) => void;
  onReject: (id: string, reason: string, notes?: string, agentId?: string, propertyTitle?: string) => void;
  onBenchmarkReviewAction: (id: string, resolution: BenchmarkReviewResolution, notes?: string) => void;
  isLoading?: boolean;
}

type Benchmark = {
  averagePriceSqm: number | null;
  source: 'neighborhood' | 'city' | 'none';
  label: string;
};

type ReviewSeverity = 'pass' | 'note' | 'warning' | 'critical';

type ReviewCheck = {
  group: 'Basics' | 'Details' | 'Features' | 'Photos' | 'Description' | 'Market';
  label: string;
  detail: string;
  severity: ReviewSeverity;
  requestText?: string;
};

type MarketStatus = {
  label: string;
  tone: 'ready' | 'review' | 'warning' | 'critical';
  description: string;
};

type MarketReviewData = {
  benchmark: Benchmark | undefined;
  isBenchmarkLoading: boolean;
  comparableComps: Array<{
    id: string;
    sold_price: number;
    sold_date: string;
    rooms: number | null;
    size_sqm: number | null;
    price_per_sqm: number | null;
    property_type: string | null;
    distance_meters?: number;
    neighborhood?: string | null;
  }>;
  compsLoading: boolean;
  compStats: ReturnType<typeof computeSpecCompStats>;
  pricePerSqm: number | null;
  pricePerSqft: number | null;
  gapPercent: number | null;
  premiumDrivers: string[];
  priceContext: PriceContextResult;
  warnings: string[];
  hasCoordinates: boolean;
  confidence: 'High' | 'Medium' | 'Low';
  status: MarketStatus;
};

const statusStyles: Record<PropertyForReview['verification_status'], string> = {
  draft: 'bg-muted text-muted-foreground',
  pending_review: 'bg-semantic-amber text-semantic-amber-foreground',
  changes_requested: 'bg-semantic-amber/15 text-foreground border border-semantic-amber/30',
  approved: 'bg-semantic-green text-semantic-green-foreground',
  rejected: 'bg-semantic-red text-semantic-red-foreground',
};

const statusLabels: Record<PropertyForReview['verification_status'], string> = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  changes_requested: 'Changes Requested',
  approved: 'Approved',
  rejected: 'Rejected',
};

const severityConfig: Record<ReviewSeverity, { icon: typeof CheckCircle2; className: string; label: string }> = {
  pass: { icon: CheckCircle2, className: 'text-semantic-green', label: 'Pass' },
  note: { icon: Info, className: 'text-primary', label: 'Note' },
  warning: { icon: AlertTriangle, className: 'text-semantic-amber', label: 'Warning' },
  critical: { icon: XCircle, className: 'text-semantic-red', label: 'Critical' },
};

const quickReasons = [
  'Please add a fuller address with a street number so the map and nearby sales comparison are reliable.',
  'Please confirm the property size. Without sqm, buyers cannot evaluate price/sqm or market fit.',
  'Please add more listing photos so the buyer-facing gallery feels complete.',
  'Please improve the description with buyer-relevant context about condition, building, location, and standout features.',
  'Please add or confirm key features such as balcony, elevator, storage, parking, AC, and condition.',
  'Please explain the price premium with specific drivers such as renovation, view, floor, outdoor space, parking, or rare location.',
  'Please confirm the asking price because it appears high versus available market evidence.',
];

function useMarketBenchmark(property: PropertyForReview) {
  const israeliRooms = getIsraeliRoomCount(property.bedrooms, property.additional_rooms) ?? 4;
  const { data: neighborhoodPrice } = useNeighborhoodAvgPrice(
    property.city,
    property.neighborhood ?? undefined,
    israeliRooms,
  );

  const cityQuery = useQuery({
    queryKey: ['admin-market-benchmark', property.city],
    queryFn: async (): Promise<Benchmark> => {
      const { data: city } = await supabase
        .from('cities')
        .select('average_price_sqm')
        .eq('name', property.city)
        .maybeSingle();

      return {
        averagePriceSqm: city?.average_price_sqm ?? null,
        source: city?.average_price_sqm ? 'city' : 'none',
        label: city?.average_price_sqm ? `${property.city} city benchmark` : 'No benchmark available',
      };
    },
    enabled: Boolean(property.city),
    staleTime: 10 * 60 * 1000,
  });

  if (neighborhoodPrice?.avg_price_sqm) {
    return {
      ...cityQuery,
      data: {
        averagePriceSqm: neighborhoodPrice.avg_price_sqm,
        source: 'neighborhood' as const,
        label: `${property.neighborhood} neighborhood benchmark`,
      },
    };
  }

  return cityQuery;
}

function useMarketReview(property: PropertyForReview): MarketReviewData {
  const { data: benchmark, isLoading: isBenchmarkLoading } = useMarketBenchmark(property);
  const israeliRooms = property.source_rooms ?? getIsraeliRoomCount(property.bedrooms, property.additional_rooms);
  const hasCoordinates = Boolean(property.latitude && property.longitude);

  const { data: nearbyComps = [], isLoading: nearbyLoading } = useNearbySoldComps(
    property.latitude,
    property.longitude,
    property.city,
    {
      radiusKm: 0.75,
      monthsBack: 24,
      limit: 6,
      minRooms: israeliRooms ? israeliRooms - 1 : undefined,
      maxRooms: israeliRooms ? israeliRooms + 1 : undefined,
      enabled: hasCoordinates,
    },
  );

  const { data: specComps = [], isLoading: specLoading } = useSpecBasedSoldComps(
    property.city,
    property.bedrooms,
    property.size_sqm,
    property.neighborhood,
    property.source_rooms,
    property,
    { limit: 6, enabled: !hasCoordinates },
  );

  const pricePerSqm = property.price && property.size_sqm ? property.price / property.size_sqm : null;
  const pricePerSqft = pricePerSqm ? pricePerSqm / 10.7639 : null;
  const subjectClass = getPriceContextPropertyClass(property);
  const rawComparableComps = (hasCoordinates ? nearbyComps : specComps) as MarketReviewData['comparableComps'];
  const { comps: comparableComps, metadata: compClassMetadata } = selectPriceContextComps(rawComparableComps, subjectClass, 6);
  const compsLoading = hasCoordinates ? nearbyLoading : specLoading;
  const compStats = computeSpecCompStats(comparableComps, pricePerSqm);
  const specMatchMetadata = computePriceContextSpecMatch(comparableComps, israeliRooms ?? null, property.size_sqm ?? null);
  const recencyMetadata = computePriceContextCompRecency(comparableComps);
  const gapPercent = pricePerSqm && benchmark?.averagePriceSqm
    ? Math.round(((pricePerSqm - benchmark.averagePriceSqm) / benchmark.averagePriceSqm) * 100)
    : null;

  const detectedDrivers = detectPremiumDrivers({
    property_type: property.property_type,
    condition: property.condition,
    floor: property.floor,
    total_floors: property.total_floors,
    parking: property.parking,
    features: property.features,
    has_balcony: property.has_balcony,
    has_storage: property.has_storage,
    furnished_status: property.furnished_status,
    furniture_items: property.furniture_items,
    featured_highlight: property.featured_highlight,
    description: property.description,
  });
  const premiumDrivers = Array.from(new Set([...(property.premium_drivers ?? []), ...detectedDrivers]));
  const priceContext = getPriceContext({
    avgComparison: gapPercent,
    compsCount: comparableComps.length,
    radiusUsedM: hasCoordinates ? 750 : 1000,
    compRecencyMonths: recencyMetadata.avgRecencyMonths,
    compDispersionPercent: compStats?.dispersionPercent ?? null,
    compClassMatch: compClassMetadata.classMatch,
    roomMatchQuality: specMatchMetadata.roomMatchQuality,
    sizeMatchQuality: specMatchMetadata.sizeMatchQuality,
    avgCompPriceSqm: compStats?.avgPriceSqm ?? null,
    benchmarkPriceSqm: benchmark?.averagePriceSqm ?? null,
    pricePerSqm,
    property,
  });

  const warnings = [
    !property.size_sqm && 'Missing size, so price per sqm cannot be verified.',
    !benchmark?.averagePriceSqm && !isBenchmarkLoading && 'No city or neighborhood benchmark found.',
    !hasCoordinates && 'No map pin; using spec-matched sales instead of nearby sales.',
    !compsLoading && comparableComps.length < 3 && 'Fewer than 3 reliable sold comps found.',
    compStats?.vsSubjectPct != null && compStats.vsSubjectPct >= 35 && 'Listing is materially above sold-comp average.',
    gapPercent !== null && gapPercent >= 35 && premiumDrivers.length === 0 && 'High price gap without detected premium drivers.',
    gapPercent !== null && gapPercent >= 70 && !property.premium_explanation && 'Large premium needs a buyer-facing explanation.',
  ].filter(Boolean) as string[];

  const confidence: MarketReviewData['confidence'] = !pricePerSqm || (!benchmark?.averagePriceSqm && comparableComps.length < 3)
    ? 'Low'
    : hasCoordinates && comparableComps.length >= 3
      ? 'High'
      : 'Medium';

  const status: MarketStatus = !pricePerSqm
    ? { label: 'Cannot verify price/sqm', tone: 'critical', description: 'Size is required before Price Context can be trusted.' }
    : compStats?.vsSubjectPct != null && compStats.vsSubjectPct >= 35
      ? { label: 'Review premium', tone: 'warning', description: 'Asking price is materially above sold-comparison average.' }
      : gapPercent === null
        ? { label: 'Limited market data', tone: 'review', description: 'Benchmark evidence is incomplete, so review the available comps manually.' }
        : gapPercent < 15
          ? { label: 'Looks fair', tone: 'ready', description: 'Price/sqm is close to the available benchmark.' }
          : gapPercent < 35
            ? { label: 'Above benchmark', tone: 'review', description: 'Above benchmark but still within an active-listing review range.' }
            : { label: 'Premium review', tone: 'warning', description: 'The premium needs context before buyers see it.' };

  return {
    benchmark,
    isBenchmarkLoading,
    comparableComps,
    compsLoading,
    compStats,
    pricePerSqm,
    pricePerSqft,
    gapPercent,
    premiumDrivers,
    priceContext,
    warnings,
    hasCoordinates,
    confidence,
    status,
  };
}

function formatCurrency(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return '—';
  return `₪${Math.round(value).toLocaleString()}`;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Unknown date';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function formatEventDate(value: string | null | undefined) {
  if (!value) return 'Unknown time';
  const date = new Date(value);
  return `${formatDistanceToNow(date, { addSuffix: true })} • ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

function formatSubmittedAt(value: string | null | undefined) {
  if (!value) return 'Submission time unavailable';
  const date = new Date(value);
  return `${formatDistanceToNow(date, { addSuffix: true })} • ${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })} at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
}

function formatLabel(value: string | null | undefined) {
  if (!value) return '—';
  return value.replace(/[_/]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function addCheck(checks: ReviewCheck[], check: ReviewCheck) {
  checks.push(check);
}

function buildReviewChecks(property: PropertyForReview, market: MarketReviewData): ReviewCheck[] {
  const checks: ReviewCheck[] = [];
  const photos = property.images?.length ?? 0;
  const descriptionLength = property.description?.trim().length ?? 0;
  const isRent = property.listing_status === 'for_rent';
  const isLand = property.property_type === 'land';
  const address = property.address?.trim() ?? '';
  const featureSignals = [
    property.condition,
    property.ac_type,
    property.has_balcony,
    property.has_elevator,
    property.has_storage,
    (property.parking ?? 0) > 0,
    ...(property.features ?? []),
  ].filter(Boolean).length;

  addCheck(checks, {
    group: 'Basics',
    label: 'Title',
    detail: property.title?.length >= 20 ? 'Buyer-facing title is descriptive.' : 'Title is short and may feel generic.',
    severity: property.title?.length >= 20 ? 'pass' : 'warning',
    requestText: 'Please make the title more descriptive for buyers.',
  });
  addCheck(checks, {
    group: 'Basics',
    label: 'Price',
    detail: property.price > 0 ? `${formatPrice(property.price)} submitted in ILS.` : 'No valid asking price.',
    severity: property.price > 0 ? 'pass' : 'critical',
    requestText: 'Please add a valid asking price.',
  });
  addCheck(checks, {
    group: 'Basics',
    label: 'Neighborhood',
    detail: property.neighborhood ? property.neighborhood : 'Missing neighborhood weakens buyer context and market matching.',
    severity: property.neighborhood ? 'pass' : 'warning',
    requestText: 'Please add the correct neighborhood.',
  });
  addCheck(checks, {
    group: 'Basics',
    label: 'Full address',
    detail: address && /\d/.test(address) ? address : 'Address does not appear to include a street number.',
    severity: address && /\d/.test(address) ? 'pass' : 'warning',
    requestText: 'Please add the full address with street number.',
  });
  addCheck(checks, {
    group: 'Basics',
    label: 'Map pin',
    detail: property.latitude && property.longitude ? 'Map pin is available for nearby sales matching.' : 'No coordinates; market review falls back to spec-based comps.',
    severity: property.latitude && property.longitude ? 'pass' : 'warning',
    requestText: 'Please confirm the address/map pin so nearby sales can be used.',
  });

  addCheck(checks, {
    group: 'Details',
    label: isLand ? 'Lot size' : 'Size',
    detail: isLand
      ? property.lot_size_sqm ? `${property.lot_size_sqm} sqm lot.` : 'Lot size is missing.'
      : property.size_sqm ? `${property.size_sqm} sqm, ${formatCurrency(market.pricePerSqm)}/sqm.` : 'Size is missing, so price/sqm cannot be shown.',
    severity: (isLand ? property.lot_size_sqm : property.size_sqm) ? 'pass' : 'critical',
    requestText: isLand ? 'Please add the lot size.' : 'Please add the property size in sqm.',
  });
  addCheck(checks, {
    group: 'Details',
    label: 'Room count',
    detail: property.source_rooms
      ? `${property.source_rooms} Israeli rooms from source.`
      : `${getIsraeliRoomCount(property.bedrooms, property.additional_rooms) ?? 'Unknown'} Israeli rooms calculated from submitted fields.`,
    severity: property.bedrooms != null || property.source_rooms != null ? 'pass' : 'warning',
    requestText: 'Please confirm the room count.',
  });
  addCheck(checks, {
    group: 'Details',
    label: 'Floor details',
    detail: property.floor != null || property.total_floors != null
      ? `Floor ${property.floor ?? '—'} of ${property.total_floors ?? '—'}.`
      : 'Floor information is missing.',
    severity: ['apartment', 'penthouse', 'mini_penthouse', 'duplex', 'garden_apartment'].includes(property.property_type) && property.floor == null ? 'warning' : 'pass',
    requestText: 'Please add floor and total floors.',
  });

  addCheck(checks, {
    group: 'Features',
    label: 'Feature richness',
    detail: `${featureSignals} buyer-relevant feature signals detected.`,
    severity: featureSignals >= 5 ? 'pass' : featureSignals >= 3 ? 'note' : 'warning',
    requestText: 'Please add or confirm key features such as balcony, elevator, storage, parking, AC, and condition.',
  });
  addCheck(checks, {
    group: 'Features',
    label: 'Condition',
    detail: property.condition ? formatLabel(property.condition) : 'Condition is missing.',
    severity: property.condition ? 'pass' : 'warning',
    requestText: 'Please confirm the property condition.',
  });
  addCheck(checks, {
    group: 'Features',
    label: isRent ? 'Rental terms' : 'Ownership extras',
    detail: isRent
      ? [property.lease_term, property.furnished_status, property.pets_policy].filter(Boolean).length >= 2
        ? 'Rental terms are mostly present.'
        : 'Rental lease, furnishing, or pets fields are thin.'
      : `Parking ${property.parking ?? 0}, balcony ${property.has_balcony ? 'yes' : 'not marked'}, storage ${property.has_storage ? 'yes' : 'not marked'}.`,
    severity: isRent && [property.lease_term, property.furnished_status, property.pets_policy].filter(Boolean).length < 2 ? 'warning' : 'pass',
    requestText: isRent ? 'Please add lease term, furnishing status, and pets policy.' : undefined,
  });

  const photoTarget = isRent ? 4 : 6;
  addCheck(checks, {
    group: 'Photos',
    label: 'Photo count',
    detail: `${photos} photo${photos === 1 ? '' : 's'} attached; target is ${photoTarget}+ for this listing type.`,
    severity: photos === 0 ? 'critical' : photos < Math.min(3, photoTarget) ? 'warning' : photos < photoTarget ? 'note' : 'pass',
    requestText: 'Please add more listing photos so buyers can properly evaluate the property.',
  });

  addCheck(checks, {
    group: 'Description',
    label: 'Description depth',
    detail: `${descriptionLength} characters; target is 100+ with useful buyer context.`,
    severity: descriptionLength >= 100 ? 'pass' : descriptionLength >= 50 ? 'warning' : 'critical',
    requestText: 'Please improve the description with details about condition, building, location, and standout features.',
  });
  addCheck(checks, {
    group: 'Description',
    label: 'Premium explanation',
    detail: property.premium_explanation || (market.premiumDrivers.length ? 'Premium drivers detected from listing fields.' : 'No premium context detected.'),
    severity: market.gapPercent !== null && market.gapPercent >= 35 && !property.premium_explanation && market.premiumDrivers.length === 0 ? 'warning' : 'pass',
    requestText: 'Please explain the price premium with specific drivers such as renovation, view, floor, outdoor space, parking, or rare location.',
  });

  addCheck(checks, {
    group: 'Market',
    label: 'Market intelligence',
    detail: market.status.description,
    severity: market.status.tone === 'ready' ? 'pass' : market.status.tone === 'critical' ? 'critical' : 'warning',
    requestText: market.status.tone !== 'ready' ? 'Please confirm the price and add any premium context that helps buyers understand the listing.' : undefined,
  });
  addCheck(checks, {
    group: 'Market',
    label: 'Sold comps',
    detail: market.compsLoading ? 'Checking sold comps…' : `${market.comparableComps.length} comparable sale${market.comparableComps.length === 1 ? '' : 's'} available.`,
    severity: market.compsLoading || market.comparableComps.length >= 3 ? 'pass' : market.comparableComps.length > 0 ? 'note' : 'warning',
    requestText: market.comparableComps.length < 3 ? 'Please verify the address and core specs so market comparison is more reliable.' : undefined,
  });

  return checks;
}

function summarizeAudit(checks: ReviewCheck[]) {
  const criticalCount = checks.filter((check) => check.severity === 'critical').length;
  const warningCount = checks.filter((check) => check.severity === 'warning').length;
  const noteCount = checks.filter((check) => check.severity === 'note').length;
  const score = Math.max(0, Math.round(100 - criticalCount * 16 - warningCount * 7 - noteCount * 3));

  const status = criticalCount > 0
    ? { label: 'Critical missing data', tone: 'critical' as const, description: 'Do not approve until core buyer-facing gaps are resolved.' }
    : score >= 85
      ? { label: 'Ready to approve', tone: 'ready' as const, description: 'Core listing, photos, and market context look publishable.' }
      : score >= 70
        ? { label: 'Review recommended', tone: 'review' as const, description: 'Mostly ready, but a few items deserve a closer look.' }
        : { label: 'Needs changes', tone: 'warning' as const, description: 'The buyer-facing page may feel incomplete.' };

  return { score, status, criticalCount, warningCount, noteCount };
}

function toneBadgeClass(tone: 'ready' | 'review' | 'warning' | 'critical') {
  if (tone === 'ready') return 'bg-semantic-green text-semantic-green-foreground';
  if (tone === 'critical') return 'bg-semantic-red text-semantic-red-foreground';
  if (tone === 'warning') return 'bg-semantic-amber text-semantic-amber-foreground';
  return 'bg-primary/10 text-primary border border-primary/20';
}

function QualityScorePanel({ summary }: { summary: ReturnType<typeof summarizeAudit> }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Buyer-quality score</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-3xl font-bold text-foreground">{summary.score}</span>
            <span className="text-sm text-muted-foreground">/100</span>
          </div>
        </div>
        <Badge className={toneBadgeClass(summary.status.tone)}>{summary.status.label}</Badge>
      </div>
      <Progress value={summary.score} className="mt-3 h-2" indicatorClassName={summary.status.tone === 'ready' ? 'bg-semantic-green' : summary.status.tone === 'critical' ? 'bg-semantic-red' : summary.status.tone === 'warning' ? 'bg-semantic-amber' : 'bg-primary'} />
      <p className="mt-3 text-sm text-muted-foreground">{summary.status.description}</p>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-md bg-muted/60 p-2">
          <p className="font-semibold text-semantic-red">{summary.criticalCount}</p>
          <p className="text-muted-foreground">critical</p>
        </div>
        <div className="rounded-md bg-muted/60 p-2">
          <p className="font-semibold text-semantic-amber">{summary.warningCount}</p>
          <p className="text-muted-foreground">warnings</p>
        </div>
        <div className="rounded-md bg-muted/60 p-2">
          <p className="font-semibold text-primary">{summary.noteCount}</p>
          <p className="text-muted-foreground">notes</p>
        </div>
      </div>
    </div>
  );
}

function MetricTile({ label, value, detail, icon: Icon }: { label: string; value: string; detail?: string; icon: typeof Home }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <p className="text-xs font-medium">{label}</p>
      </div>
      <p className="text-sm font-semibold text-foreground">{value}</p>
      {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}

function OverviewPanel({ property, market, checks }: { property: PropertyForReview; market: MarketReviewData; checks: ReviewCheck[] }) {
  const topIssues = checks.filter((check) => check.severity === 'critical' || check.severity === 'warning').slice(0, 5);

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile icon={Ruler} label="Price/sqm" value={`${formatCurrency(market.pricePerSqm)}/sqm`} detail={`${formatCurrency(market.pricePerSqft)}/sqft`} />
          <MetricTile icon={MapPin} label="Location" value={property.neighborhood || property.city || 'Missing'} detail={property.address || 'No address'} />
          <MetricTile icon={Camera} label="Photos" value={`${property.images?.length ?? 0} attached`} detail={property.images?.length ? 'Open any photo for preview' : 'Photos required'} />
          <MetricTile icon={BarChart3} label="Market" value={market.status.label} detail={`${market.confidence} confidence`} />
        </div>

        <div className="rounded-lg border border-border bg-background p-4">
          <div className="mb-3 flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-primary" />
            <h4 className="font-semibold text-foreground">Priority review items</h4>
          </div>
          {topIssues.length > 0 ? (
            <div className="space-y-2">
              {topIssues.map((issue) => {
                const Icon = severityConfig[issue.severity].icon;
                return (
                  <div key={`${issue.group}-${issue.label}`} className="flex items-start gap-2 rounded-md bg-muted/50 p-2">
                    <Icon className={`mt-0.5 h-4 w-4 ${severityConfig[issue.severity].className}`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{issue.label}</p>
                      <p className="text-xs text-muted-foreground">{issue.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No major quality gaps detected from submitted fields.</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <h4 className="font-semibold text-foreground">Buyer page fit</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              Review whether the published page will feel complete, visually credible, and supported by real market evidence.
            </p>
          </div>
        </div>
        <Separator className="my-4" />
        <div className="space-y-2 text-sm">
          <ReadinessLine ready={(property.images?.length ?? 0) >= 4} text="Gallery has enough visual context" />
          <ReadinessLine ready={Boolean(property.size_sqm && market.pricePerSqm)} text="Price/sqm cards can render correctly" />
          <ReadinessLine ready={market.comparableComps.length > 0 || Boolean(market.benchmark?.averagePriceSqm)} text="Market module has real evidence" />
          <ReadinessLine ready={(property.description?.length ?? 0) >= 100} text="Description has buyer-facing depth" />
          <ReadinessLine ready={market.gapPercent == null || market.gapPercent < 35 || market.premiumDrivers.length > 0 || Boolean(property.premium_explanation)} text="Premium is supported by context" />
        </div>
      </div>
    </div>
  );
}

function ReadinessLine({ ready, text }: { ready: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      {ready ? <CheckCircle2 className="h-4 w-4 text-semantic-green" /> : <AlertTriangle className="h-4 w-4 text-semantic-amber" />}
      <span className={ready ? 'text-foreground' : 'text-muted-foreground'}>{text}</span>
    </div>
  );
}

function DataAuditPanel({ checks }: { checks: ReviewCheck[] }) {
  const groups: ReviewCheck['group'][] = ['Basics', 'Details', 'Features', 'Photos', 'Description', 'Market'];

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {groups.map((group) => {
        const groupChecks = checks.filter((check) => check.group === group);
        return (
          <div key={group} className="rounded-lg border border-border bg-background p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h4 className="font-semibold text-foreground">{group}</h4>
              <Badge variant="outline">{groupChecks.filter((check) => check.severity === 'pass').length}/{groupChecks.length} pass</Badge>
            </div>
            <div className="space-y-2">
              {groupChecks.map((check) => {
                const Icon = severityConfig[check.severity].icon;
                return (
                  <div key={`${group}-${check.label}`} className="flex items-start gap-2 rounded-md bg-muted/40 p-2">
                    <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${severityConfig[check.severity].className}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{check.label}</p>
                      <p className="text-xs text-muted-foreground">{check.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PhotoPanel({ property, onPhotoClick }: { property: PropertyForReview; onPhotoClick: (index: number) => void }) {
  const photos = property.images ?? [];
  const photoTarget = property.listing_status === 'for_rent' ? 4 : 6;
  const tone = photos.length === 0 ? 'critical' : photos.length < photoTarget ? 'warning' : 'ready';

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,420px)_1fr]">
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => photos.length && onPhotoClick(0)}
          className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border bg-muted text-left focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <PropertyThumbnail
            src={photos[0]}
            alt={`${property.title} cover photo`}
            city={property.city}
            neighborhood={property.neighborhood}
            className="h-full w-full"
          />
          {photos.length > 0 && (
            <Badge className="absolute bottom-3 left-3 bg-background/90 text-foreground backdrop-blur-sm">Cover photo</Badge>
          )}
        </button>
        <div className="rounded-lg border border-border bg-background p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">Gallery readiness</p>
              <p className="text-xs text-muted-foreground">Target: {photoTarget}+ photos for this listing type.</p>
            </div>
            <Badge className={toneBadgeClass(tone)}>{photos.length} photos</Badge>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-background p-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h4 className="font-semibold text-foreground">Photo review</h4>
          <Badge variant="outline">Click to inspect</Badge>
        </div>
        {photos.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5">
            {photos.slice(0, 15).map((img, index) => (
              <button
                key={`${img}-${index}`}
                type="button"
                onClick={() => onPhotoClick(index)}
                className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted text-left focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label={`Open listing photo ${index + 1}`}
              >
                <PropertyThumbnail
                  src={img}
                  alt={`${property.title} photo ${index + 1}`}
                  city={property.city}
                  neighborhood={property.neighborhood}
                  className="h-full w-full transition-transform group-hover:scale-105"
                />
                <span className="absolute left-1 top-1 rounded-sm bg-background/90 px-1.5 py-0.5 text-[10px] font-medium text-foreground">{index + 1}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex min-h-48 items-center justify-center rounded-md border border-dashed border-border bg-muted/40 p-6 text-center">
            <div>
              <Camera className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium text-foreground">No photos attached</p>
              <p className="text-xs text-muted-foreground">Request changes before publishing a buyer-visible listing.</p>
            </div>
          </div>
        )}
        {photos.length > 15 && <p className="mt-2 text-xs text-muted-foreground">Showing first 15 of {photos.length}. Open preview to inspect the full gallery.</p>}
      </div>
    </div>
  );
}

function PriceContextHistoryPanel({ events, isLoading }: { events: PriceContextEvent[]; isLoading: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="font-semibold text-foreground">Price Context audit history</h4>
          <p className="text-xs text-muted-foreground">Internal trail of review decisions and public-display state.</p>
        </div>
        <Badge variant="outline">{isLoading ? 'Loading…' : `${events.length} event${events.length === 1 ? '' : 's'}`}</Badge>
      </div>

      {events.length > 0 ? (
        <div className="space-y-2">
          {events.map((event) => (
            <div key={event.id} className="rounded-md border border-border/70 bg-muted/25 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{formatLabel(event.event_type)}</p>
                  <p className="text-xs text-muted-foreground">{formatEventDate(event.created_at)} • {formatLabel(event.actor_type)}</p>
                </div>
                <Badge variant="secondary">{event.public_label ?? 'No public label'}</Badge>
              </div>
              <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                <span>Confidence: <strong className="text-foreground">{formatPriceContextValue(event.confidence_tier)}</strong></span>
                <span>Percentage: <strong className="text-foreground">{event.percentage_suppressed ? 'Suppressed' : 'Allowed'}</strong></span>
                <span>Raw gap: <strong className="text-foreground">{event.raw_gap_percent != null ? `${event.raw_gap_percent}%` : 'Not stored'}</strong></span>
              </div>
              {event.reason && <p className="mt-2 border-l-2 border-primary/30 pl-3 text-xs text-muted-foreground">{event.reason}</p>}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {isLoading ? 'Loading Price Context events…' : 'No Price Context audit events have been logged for this listing yet.'}
        </p>
      )}
    </div>
  );
}

function MarketPanel({ property, market, reviewed, onReviewedChange, onBenchmarkReviewAction, isLoading }: { property: PropertyForReview; market: MarketReviewData; reviewed: boolean; onReviewedChange: (reviewed: boolean) => void; onBenchmarkReviewAction: (resolution: BenchmarkReviewResolution, notes?: string) => void; isLoading?: boolean }) {
  const { data: events = [], isLoading: eventsLoading } = usePriceContextEvents(property.id);
  const [reviewNotes, setReviewNotes] = useState(property.benchmark_review_notes ?? '');
  const reviewOpen = property.benchmark_review_status === 'requested' || property.benchmark_review_status === 'under_review';

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <MetricTile icon={Ruler} label="Listing price" value={`${formatCurrency(market.pricePerSqm)}/sqm`} detail={`${formatCurrency(market.pricePerSqft)}/sqft`} />
        <MetricTile icon={BarChart3} label="Benchmark" value={market.isBenchmarkLoading ? 'Checking…' : `${formatCurrency(market.benchmark?.averagePriceSqm)}/sqm`} detail={market.benchmark?.label ?? 'City/neighborhood data'} />
        <MetricTile icon={ShieldCheck} label="Confidence" value={market.priceContext.confidenceLabel} detail={`${market.priceContext.confidenceScore}/100 internal score`} />
      </div>

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-semibold text-foreground">Price Context diagnostics</h4>
              <Badge className={toneBadgeClass(market.priceContext.badgeEligible ? 'ready' : market.priceContext.badgeStatus === 'blocked' ? 'warning' : 'review')}>
                {market.priceContext.badgeEligible ? 'Badge eligible' : formatPriceContextValue(market.priceContext.badgeStatus)}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Internal raw gaps stay here; buyers see the safer public label.</p>
          </div>
          <Badge variant="secondary">Public: {market.priceContext.publicLabel}</Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-md border border-border bg-background/80 p-3">
            <p className="text-xs text-muted-foreground">Raw benchmark gap</p>
            <p className="text-lg font-semibold text-foreground">{market.gapPercent !== null ? `${market.gapPercent > 0 ? '+' : ''}${market.gapPercent}%` : '—'}</p>
          </div>
          <div className="rounded-md border border-border bg-background/80 p-3">
            <p className="text-xs text-muted-foreground">Public percentage</p>
            <p className="text-lg font-semibold text-foreground">{market.priceContext.displayGapPercent !== null ? `${market.priceContext.displayGapPercent}%` : 'Suppressed'}</p>
          </div>
          <div className="rounded-md border border-border bg-background/80 p-3">
            <p className="text-xs text-muted-foreground">Property class</p>
            <p className="text-sm font-semibold text-foreground">{market.priceContext.propertyClassLabel}</p>
          </div>
          <div className="rounded-md border border-border bg-background/80 p-3">
            <p className="text-xs text-muted-foreground">Size / ownership</p>
            <p className="text-sm font-semibold text-foreground">{formatPriceContextValue(property.sqm_source)} • {formatPriceContextValue(property.ownership_type)}</p>
          </div>
        </div>
        {(market.priceContext.percentageSuppressionReason || market.priceContext.confidenceReasons.length > 0) && (
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div className="rounded-md border border-border bg-background/80 p-3">
              <p className="text-sm font-medium text-foreground">Display rule</p>
              <p className="mt-1 text-sm text-muted-foreground">{market.priceContext.percentageSuppressionReason ?? 'Strong standard-resale match allows public percentage display.'}</p>
            </div>
            <div className="rounded-md border border-border bg-background/80 p-3">
              <p className="text-sm font-medium text-foreground">Confidence reasons</p>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                {market.priceContext.confidenceReasons.slice(0, 4).map((reason) => <li key={reason}>{reason}</li>)}
              </ul>
            </div>
          </div>
        )}
        {market.priceContext.confidenceCaps.length > 0 && (
          <div className="mt-3 rounded-md border border-border bg-background/80 p-3">
            <p className="text-sm font-medium text-foreground">Confidence cap audit</p>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              {market.priceContext.confidenceCaps.map((cap) => (
                <div key={cap.code} className="rounded-md border border-border/70 bg-muted/30 p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{cap.label}</p>
                    <Badge variant={cap.severity === 'critical' ? 'destructive' : 'secondary'} className="text-xs">
                      {cap.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{cap.detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {reviewOpen && (
        <div className="rounded-lg border border-semantic-amber/40 bg-semantic-amber/10 p-4">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h4 className="font-semibold text-foreground">Benchmark review request</h4>
              <p className="text-sm text-muted-foreground">{property.benchmark_review_reason || 'No structured reason provided.'}</p>
            </div>
            <Badge variant="outline">{formatLabel(property.benchmark_review_status)}</Badge>
          </div>
          {property.benchmark_review_notes && <p className="mb-3 border-l-2 border-primary/30 pl-3 text-sm text-muted-foreground">{property.benchmark_review_notes}</p>}
          <Textarea value={reviewNotes} onChange={(event) => setReviewNotes(event.target.value)} placeholder="Admin resolution notes…" rows={3} className="mb-3 bg-background" />
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <Button variant="outline" disabled={isLoading} onClick={() => onBenchmarkReviewAction('under_review', reviewNotes)}>Mark under review</Button>
            <Button variant="outline" disabled={isLoading} onClick={() => onBenchmarkReviewAction('accepted', reviewNotes)}>Accept benchmark</Button>
            <Button variant="outline" disabled={isLoading} onClick={() => onBenchmarkReviewAction('data_corrected', reviewNotes)}>Data corrected</Button>
            <Button variant="outline" disabled={isLoading} onClick={() => onBenchmarkReviewAction('confidence_softened', reviewNotes)}>Soften confidence</Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-background p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-foreground">Sold comps</h4>
              <Badge className={toneBadgeClass(market.status.tone)}>{market.status.label}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{market.hasCoordinates ? 'Nearby sales within 750m' : 'Spec-matched sales by city, rooms, and size'}</p>
          </div>
          <Badge variant="outline">
            {market.compsLoading ? 'Checking…' : market.compStats ? `${formatCurrency(market.compStats.avgPriceSqm)}/sqm avg` : 'No comps'}
          </Badge>
        </div>

        {market.compStats?.vsSubjectPct != null && (
          <p className="mb-3 text-sm text-muted-foreground">
            Listing is {market.compStats.vsSubjectPct > 0 ? '+' : ''}{market.compStats.vsSubjectPct}% vs sold-comp average from {market.compStats.count} comp{market.compStats.count === 1 ? '' : 's'}.
          </p>
        )}

        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {market.comparableComps.slice(0, 6).map((comp) => (
            <div key={comp.id} className="rounded-md border border-border/70 bg-muted/25 p-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-foreground">{formatCurrency(comp.price_per_sqm)}/sqm</span>
                <span className="text-muted-foreground">{formatDate(comp.sold_date)}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground">
                <span>{formatCurrency(comp.sold_price)}</span>
                {comp.size_sqm && <span>{comp.size_sqm} sqm</span>}
                {comp.rooms && <span>{comp.rooms} rooms</span>}
                {comp.distance_meters != null && <span>{Math.round(comp.distance_meters)}m away</span>}
                {comp.neighborhood && <span>{comp.neighborhood}</span>}
              </div>
            </div>
          ))}
        </div>

        {!market.compsLoading && market.comparableComps.length === 0 && (
          <p className="text-sm text-muted-foreground">No reliable sold transactions found for this listing context.</p>
        )}
      </div>

      <div className="rounded-lg border border-border bg-background p-4">
        <h4 className="mb-3 font-semibold text-foreground">Premium context</h4>
        <div className="flex flex-wrap gap-2">
          {market.premiumDrivers.length > 0 ? market.premiumDrivers.slice(0, 10).map((driver) => (
            <Badge key={driver} variant="outline" className="bg-card">
              <Sparkles className="mr-1 h-3 w-3 text-primary" />
              {formatLabel(driver)}
            </Badge>
          )) : <span className="text-sm text-muted-foreground">No premium drivers detected from submitted fields.</span>}
        </div>
        {property.premium_explanation && (
          <p className="mt-3 border-l-2 border-primary/30 pl-3 text-sm text-muted-foreground">{property.premium_explanation}</p>
        )}
        {market.warnings.length > 0 && (
          <div className="mt-3 rounded-md border border-semantic-amber/40 bg-semantic-amber/10 p-3">
            <p className="mb-1 text-sm font-medium text-foreground">Market review warnings</p>
            <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
              {market.warnings.map((warning) => <li key={warning}>{warning}</li>)}
            </ul>
          </div>
        )}
      </div>

      <PriceContextHistoryPanel events={events} isLoading={eventsLoading} />

      {property.verification_status === 'pending_review' && (
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background p-3 text-sm">
          <Checkbox checked={reviewed} onCheckedChange={(checked) => onReviewedChange(checked === true)} />
          <span>I reviewed Price Context and buyer-page context for this listing</span>
        </label>
      )}
    </div>
  );
}

function BuyerPageFitPanel({ property, market, checks }: { property: PropertyForReview; market: MarketReviewData; checks: ReviewCheck[] }) {
  const moduleRows = [
    { label: 'Hero gallery', ready: (property.images?.length ?? 0) >= 4, detail: `${property.images?.length ?? 0} photos submitted.` },
    { label: 'Price Context', ready: Boolean(property.size_sqm && (market.benchmark?.averagePriceSqm || market.comparableComps.length)), detail: `${market.priceContext.publicLabel} • ${market.priceContext.confidenceLabel}` },
    { label: 'Price/sqm snapshot', ready: Boolean(property.size_sqm && property.price), detail: market.pricePerSqm ? `${formatCurrency(market.pricePerSqm)}/sqm can display.` : 'Missing size or price.' },
    { label: 'Buyer description', ready: (property.description?.length ?? 0) >= 100, detail: `${property.description?.length ?? 0} characters submitted.` },
    { label: 'Pricing Context Complete badge', ready: market.priceContext.badgeEligible, detail: market.priceContext.badgeEligible ? 'Buyer-safe context is complete.' : 'Needs size source, ownership type, or premium explanation.' },
  ];
  const suggestedRequests = Array.from(new Set(checks.map((check) => check.requestText).filter(Boolean))).slice(0, 6);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <div className="rounded-lg border border-border bg-background p-4">
        <div className="mb-4 flex items-center gap-2">
          <Eye className="h-4 w-4 text-primary" />
          <h4 className="font-semibold text-foreground">Public page readiness</h4>
        </div>
        <div className="space-y-3">
          {moduleRows.map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-3 rounded-md bg-muted/40 p-3">
              <div className="flex items-start gap-2">
                {row.ready ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-semantic-green" /> : <AlertTriangle className="mt-0.5 h-4 w-4 text-semantic-amber" />}
                <div>
                  <p className="text-sm font-medium text-foreground">{row.label}</p>
                  <p className="text-xs text-muted-foreground">{row.detail}</p>
                </div>
              </div>
              <Badge variant={row.ready ? 'outline' : 'secondary'}>{row.ready ? 'Ready' : 'Thin'}</Badge>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-background p-4">
        <h4 className="font-semibold text-foreground">Suggested change requests</h4>
        <p className="mt-1 text-xs text-muted-foreground">Use these as a checklist when sending feedback to the agency.</p>
        <div className="mt-3 space-y-2">
          {suggestedRequests.length > 0 ? suggestedRequests.map((text) => (
            <div key={text} className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">{text}</div>
          )) : (
            <p className="text-sm text-muted-foreground">No obvious buyer-page gaps detected.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function DecisionPanel({
  property,
  summary,
  marketReviewed,
  featureThis,
  setFeatureThis,
  isLoading,
  onApprove,
  onRequestChanges,
  onReject,
  onPreview,
}: {
  property: PropertyForReview;
  summary: ReturnType<typeof summarizeAudit>;
  marketReviewed: boolean;
  featureThis: boolean;
  setFeatureThis: (value: boolean) => void;
  isLoading?: boolean;
  onApprove: () => void;
  onRequestChanges: () => void;
  onReject: () => void;
  onPreview: () => void;
}) {
  const approveLabel = summary.status.tone === 'ready' ? 'Approve' : 'Approve anyway';

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-3">
        <p className="text-sm font-semibold text-foreground">Decision</p>
        <p className="text-xs text-muted-foreground">Publish only after photos, data quality, and market context make sense.</p>
      </div>
      <div className="space-y-2">
        <Button
          onClick={onApprove}
          disabled={isLoading || !marketReviewed}
          className="w-full bg-semantic-green text-semantic-green-foreground hover:bg-semantic-green/90"
        >
          <Check className="mr-2 h-4 w-4" />
          {marketReviewed ? approveLabel : 'Review market first'}
        </Button>
        {property.verification_status === 'pending_review' && (
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-2 text-sm hover:bg-muted/50">
            <Checkbox checked={featureThis} onCheckedChange={(checked) => setFeatureThis(checked === true)} />
            <Star className="h-4 w-4 text-semantic-amber" />
            <span className="text-muted-foreground">Feature this on homepage</span>
          </label>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={onRequestChanges} disabled={isLoading} className="border-semantic-amber/50 text-foreground hover:bg-semantic-amber/10">
            <MessageSquare className="mr-2 h-4 w-4" />
            Changes
          </Button>
          <Button variant="outline" onClick={onReject} disabled={isLoading} className="border-semantic-red/50 text-foreground hover:bg-semantic-red/10">
            <X className="mr-2 h-4 w-4" />
            Reject
          </Button>
        </div>
        <Button variant="ghost" onClick={onPreview} className="w-full">
          <Eye className="mr-2 h-4 w-4" />
          Buyer preview
        </Button>
      </div>
    </div>
  );
}

function FeedbackDialog({
  open,
  onOpenChange,
  title,
  description,
  reasonLabel,
  reason,
  setReason,
  adminNotes,
  setAdminNotes,
  onSubmit,
  submitLabel,
  submitClassName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  reasonLabel: string;
  reason: string;
  setReason: (value: string) => void;
  adminNotes: string;
  setAdminNotes: (value: string) => void;
  onSubmit: () => void;
  submitLabel: string;
  submitClassName: string;
}) {
  const appendReason = (text: string) => {
    setReason(reason.trim() ? `${reason.trim()}\n- ${text}` : `- ${text}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Quick reasons</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {quickReasons.map((text) => (
                <Button key={text} type="button" variant="outline" size="sm" className="h-auto whitespace-normal text-left text-xs" onClick={() => appendReason(text)}>
                  {text}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">{reasonLabel} *</label>
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Add clear, actionable feedback for the agency..."
              className="mt-1"
              rows={5}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Internal Notes (optional)</label>
            <Textarea
              value={adminNotes}
              onChange={(event) => setAdminNotes(event.target.value)}
              placeholder="Notes only visible to admins..."
              className="mt-1"
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSubmit} disabled={!reason.trim()} className={submitClassName}>{submitLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ListingReviewCard({ property, onApprove, onRequestChanges, onReject, onBenchmarkReviewAction, isLoading }: ListingReviewCardProps) {
  const [showChangesDialog, setShowChangesDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [reason, setReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [featureThis, setFeatureThis] = useState(false);
  const [marketReviewed, setMarketReviewed] = useState(property.verification_status !== 'pending_review');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const market = useMarketReview(property);
  const checks = useMemo(() => buildReviewChecks(property, market), [property, market]);
  const summary = useMemo(() => summarizeAudit(checks), [checks]);
  const israeliRooms = property.source_rooms ?? getIsraeliRoomCount(property.bedrooms, property.additional_rooms);

  const handleApprove = () => {
    onApprove(property.id, adminNotes || undefined, property.agent?.id, property.title, featureThis);
  };

  const handleRequestChanges = () => {
    if (!reason.trim()) return;
    onRequestChanges(property.id, reason, adminNotes || undefined, property.agent?.id, property.title);
    setShowChangesDialog(false);
    setReason('');
    setAdminNotes('');
  };

  const handleReject = () => {
    if (!reason.trim()) return;
    onReject(property.id, reason, adminNotes || undefined, property.agent?.id, property.title);
    setShowRejectDialog(false);
    setReason('');
    setAdminNotes('');
  };

  const openPhotoPreview = (index: number) => {
    setSelectedPhotoIndex(index);
    setShowPreviewModal(true);
  };

  return (
    <>
      <Card className="overflow-hidden border-border shadow-card">
        <CardContent className="p-0">
          <div className="border-b border-border bg-muted/30 p-4 lg:p-5">
            <div className="grid gap-4 lg:grid-cols-[160px_1fr_300px]">
              <button
                type="button"
                onClick={() => openPhotoPreview(0)}
                className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted text-left focus:outline-none focus:ring-2 focus:ring-ring lg:aspect-square"
              >
                <PropertyThumbnail
                  src={property.images?.[0]}
                  alt={property.title}
                  city={property.city}
                  neighborhood={property.neighborhood}
                  className="h-full w-full"
                />
                <Badge className="absolute bottom-2 left-2 bg-background/90 text-foreground backdrop-blur-sm">
                  <Camera className="mr-1 h-3 w-3" />
                  {property.images?.length ?? 0}
                </Badge>
              </button>

              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={statusStyles[property.verification_status]}>{statusLabels[property.verification_status]}</Badge>
                  <Badge className={toneBadgeClass(summary.status.tone)}>{summary.status.label}</Badge>
                </div>

                <div>
                  <h3 className="line-clamp-2 text-xl font-semibold text-foreground">{property.title}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{property.city}{property.neighborhood ? `, ${property.neighborhood}` : ''}</span>
                    <span className="capitalize">{formatLabel(property.property_type)}</span>
                    <span className="capitalize">{formatLabel(property.listing_status)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Bed className="h-4 w-4" />{property.bedrooms ?? '—'} beds</span>
                  <span className="inline-flex items-center gap-1"><Bath className="h-4 w-4" />{property.bathrooms ?? '—'} baths</span>
                  <span className="inline-flex items-center gap-1"><Layers className="h-4 w-4" />{israeliRooms ?? '—'} Israeli rooms</span>
                  <span className="inline-flex items-center gap-1"><Ruler className="h-4 w-4" />{property.size_sqm ?? '—'} sqm</span>
                </div>

                {property.agent && (
                  <div className="grid gap-2 rounded-lg border border-border bg-background/80 p-3 text-sm sm:grid-cols-2">
                    <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4 shrink-0" />
                      <span className="shrink-0 text-xs font-medium uppercase tracking-wide">Agent</span>
                      <span className="truncate font-semibold text-foreground">{property.agent.name}</span>
                      {property.agent.is_verified && <Badge variant="outline" className="shrink-0">Verified</Badge>}
                    </div>
                    <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4 shrink-0" />
                      <span className="shrink-0 text-xs font-medium uppercase tracking-wide">Agency</span>
                      <span className="truncate font-semibold text-foreground">{property.primary_agency?.name || property.agent.agency_name || 'No agency shown'}</span>
                    </div>
                    <div className="flex min-w-0 items-center gap-2 text-muted-foreground sm:col-span-2">
                      <ClipboardCheck className="h-4 w-4 shrink-0" />
                      <span className="shrink-0 text-xs font-medium uppercase tracking-wide">Submitted for review</span>
                      <span className="truncate font-semibold text-foreground">{formatSubmittedAt(property.submitted_at)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <QualityScorePanel summary={summary} />
                <DecisionPanel
                  property={property}
                  summary={summary}
                  marketReviewed={marketReviewed}
                  featureThis={featureThis}
                  setFeatureThis={setFeatureThis}
                  isLoading={isLoading}
                  onApprove={handleApprove}
                  onRequestChanges={() => setShowChangesDialog(true)}
                  onReject={() => setShowRejectDialog(true)}
                  onPreview={() => setShowPreviewModal(true)}
                />
              </div>
            </div>
          </div>

          <div className="p-4 lg:p-5">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="mb-4 h-auto w-full justify-start overflow-x-auto rounded-lg bg-muted/70 p-1">
                <TabsTrigger value="overview" className="gap-2"><Home className="h-4 w-4" />Overview</TabsTrigger>
                <TabsTrigger value="audit" className="gap-2"><ClipboardCheck className="h-4 w-4" />Data Audit</TabsTrigger>
                <TabsTrigger value="photos" className="gap-2"><Camera className="h-4 w-4" />Photos</TabsTrigger>
                <TabsTrigger value="market" className="gap-2"><BarChart3 className="h-4 w-4" />Market</TabsTrigger>
                <TabsTrigger value="buyer" className="gap-2"><FileText className="h-4 w-4" />Buyer Page</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-0">
                <OverviewPanel property={property} market={market} checks={checks} />
              </TabsContent>
              <TabsContent value="audit" className="mt-0">
                <DataAuditPanel checks={checks} />
              </TabsContent>
              <TabsContent value="photos" className="mt-0">
                <PhotoPanel property={property} onPhotoClick={openPhotoPreview} />
              </TabsContent>
              <TabsContent value="market" className="mt-0">
                <MarketPanel
                  property={property}
                  market={market}
                  reviewed={marketReviewed}
                  onReviewedChange={setMarketReviewed}
                  onBenchmarkReviewAction={(resolution, notes) => onBenchmarkReviewAction(property.id, resolution, notes)}
                  isLoading={isLoading}
                />
              </TabsContent>
              <TabsContent value="buyer" className="mt-0">
                <BuyerPageFitPanel property={property} market={market} checks={checks} />
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      <FeedbackDialog
        open={showChangesDialog}
        onOpenChange={setShowChangesDialog}
        title="Request Changes"
        description="Send clear, actionable feedback before this listing can be approved."
        reasonLabel="Feedback for Agent"
        reason={reason}
        setReason={setReason}
        adminNotes={adminNotes}
        setAdminNotes={setAdminNotes}
        onSubmit={handleRequestChanges}
        submitLabel="Send Feedback"
        submitClassName="bg-semantic-amber text-semantic-amber-foreground hover:bg-semantic-amber/90"
      />

      <FeedbackDialog
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        title="Reject Listing"
        description="Reject only when this listing should not continue through the publishing workflow."
        reasonLabel="Rejection Reason"
        reason={reason}
        setReason={setReason}
        adminNotes={adminNotes}
        setAdminNotes={setAdminNotes}
        onSubmit={handleReject}
        submitLabel="Reject Listing"
        submitClassName="bg-semantic-red text-semantic-red-foreground hover:bg-semantic-red/90"
      />

      <PropertyPreviewModal
        property={property}
        open={showPreviewModal}
        onOpenChange={setShowPreviewModal}
        initialImageIndex={selectedPhotoIndex}
      />
    </>
  );
}
