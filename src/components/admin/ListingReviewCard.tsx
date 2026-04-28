import { useState } from 'react';
import { 
  Check, X, MessageSquare, Eye, MapPin, Bed, Bath, 
  Ruler, User, Building2, ChevronDown, ChevronUp, Star,
  BarChart3, AlertTriangle, ShieldCheck, Sparkles, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { PropertyForReview } from '@/hooks/useListingReview';
import { formatDistanceToNow } from 'date-fns';
import { PropertyPreviewModal } from './PropertyPreviewModal';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { detectPremiumDrivers } from '@/lib/marketFit';
import { getIsraeliRoomCount } from '@/lib/israeliRoomCount';
import { useNeighborhoodAvgPrice } from '@/hooks/useNeighborhoodPrices';

interface ListingReviewCardProps {
  property: PropertyForReview;
  onApprove: (id: string, notes?: string, agentId?: string, propertyTitle?: string, featureThis?: boolean) => void;
  onRequestChanges: (id: string, reason: string, notes?: string, agentId?: string, propertyTitle?: string) => void;
  onReject: (id: string, reason: string, notes?: string, agentId?: string, propertyTitle?: string) => void;
  isLoading?: boolean;
}

type Benchmark = {
  averagePriceSqm: number | null;
  source: 'neighborhood' | 'city' | 'none';
  label: string;
};

function useMarketBenchmark(property: PropertyForReview) {
  const israeliRooms = getIsraeliRoomCount(property.bedrooms, null) ?? 4;
  const { data: neighborhoodPrice } = useNeighborhoodAvgPrice(
    property.city,
    property.neighborhood ?? undefined,
    israeliRooms,
  );

  const cityQuery = useQuery({
    queryKey: ['admin-market-benchmark', property.city, property.neighborhood],
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

function formatNumber(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return '—';
  return `₪${Math.round(value).toLocaleString()}`;
}

function formatDriver(driver: string) {
  return driver.replace(/[_/]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function MarketSanityPanel({ property, reviewed, onReviewedChange }: { property: PropertyForReview; reviewed: boolean; onReviewedChange: (reviewed: boolean) => void }) {
  const { data: benchmark, isLoading } = useMarketBenchmark(property);
  const pricePerSqm = property.price && property.size_sqm ? property.price / property.size_sqm : null;
  const pricePerSqft = pricePerSqm ? pricePerSqm / 10.7639 : null;
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
  const missingWarnings = [
    !property.size_sqm && 'Missing size, so price per sqm cannot be verified',
    !benchmark?.averagePriceSqm && 'No city/neighborhood benchmark found',
    gapPercent !== null && gapPercent >= 35 && premiumDrivers.length === 0 && 'High price gap without premium drivers',
    gapPercent !== null && gapPercent >= 70 && !property.premium_explanation && 'Large premium needs a buyer-facing explanation',
    !property.images?.length && 'No photos attached',
  ].filter(Boolean) as string[];
  const status = gapPercent === null
    ? { label: 'Needs data', className: 'bg-muted text-muted-foreground', icon: Info }
    : gapPercent < 15
      ? { label: 'Looks fair', className: 'bg-semantic-green text-semantic-green-foreground', icon: ShieldCheck }
      : gapPercent < 35
        ? { label: 'Above benchmark', className: 'bg-secondary text-secondary-foreground', icon: BarChart3 }
        : { label: 'Premium review', className: 'bg-semantic-amber text-semantic-amber-foreground', icon: AlertTriangle };
  const StatusIcon = status.icon;

  return (
    <div className="rounded-lg border border-border bg-muted/25 p-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold text-foreground">Market Sanity</h4>
          <Badge className={status.className}>
            <StatusIcon className="mr-1 h-3 w-3" />
            {status.label}
          </Badge>
        </div>
        {gapPercent !== null && (
          <span className="text-xs text-muted-foreground">
            {gapPercent > 0 ? '+' : ''}{gapPercent}% vs {benchmark?.source === 'neighborhood' ? 'neighborhood' : 'city'} benchmark
          </span>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-md border bg-background p-2">
          <p className="text-xs text-muted-foreground">Listing price</p>
          <p className="text-sm font-semibold">{formatNumber(pricePerSqm)}/sqm</p>
          <p className="text-xs text-muted-foreground">{formatNumber(pricePerSqft)}/sqft</p>
        </div>
        <div className="rounded-md border bg-background p-2">
          <p className="text-xs text-muted-foreground">Benchmark</p>
          <p className="text-sm font-semibold">{isLoading ? 'Checking…' : `${formatNumber(benchmark?.averagePriceSqm)}/sqm`}</p>
          <p className="text-xs text-muted-foreground">{benchmark?.label ?? 'City/neighborhood data'}</p>
        </div>
        <div className="rounded-md border bg-background p-2">
          <p className="text-xs text-muted-foreground">Saved context</p>
          <p className="text-sm font-semibold">{property.market_fit_status?.replace(/_/g, ' ') || 'Not set'}</p>
          <p className="text-xs text-muted-foreground line-clamp-1">{property.market_fit_review_reason || 'Admin should verify before approval'}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {premiumDrivers.length > 0 ? premiumDrivers.slice(0, 8).map((driver) => (
            <Badge key={driver} variant="outline" className="bg-background">
              <Sparkles className="mr-1 h-3 w-3 text-primary" />
              {formatDriver(driver)}
            </Badge>
          )) : (
            <span className="text-xs text-muted-foreground">No premium drivers detected yet.</span>
          )}
        </div>
        {property.premium_explanation && (
          <p className="border-l-2 border-primary/30 pl-3 text-xs text-muted-foreground">{property.premium_explanation}</p>
        )}
        {missingWarnings.length > 0 && (
          <div className="rounded-md border border-semantic-amber/40 bg-semantic-amber/10 p-2">
            <p className="mb-1 text-xs font-medium text-foreground">Review warnings</p>
            <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
              {missingWarnings.map((warning) => <li key={warning}>{warning}</li>)}
            </ul>
          </div>
        )}
      </div>

      {property.verification_status === 'pending_review' && (
        <label className="flex items-center gap-2 rounded-md border bg-background p-2 text-sm cursor-pointer">
          <Checkbox checked={reviewed} onCheckedChange={(checked) => onReviewedChange(checked === true)} />
          <span>I reviewed market sanity for this listing</span>
        </label>
      )}
    </div>
  );
}

export function ListingReviewCard({ 
  property, 
  onApprove, 
  onRequestChanges, 
  onReject,
  isLoading 
}: ListingReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showChangesDialog, setShowChangesDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [reason, setReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [featureThis, setFeatureThis] = useState(false);
  const [marketSanityReviewed, setMarketSanityReviewed] = useState(property.verification_status !== 'pending_review');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(price);
  };

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

  const getStatusBadge = () => {
    const statusStyles = {
      draft: 'bg-muted text-muted-foreground',
      pending_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      changes_requested: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      approved: 'bg-primary/10 text-primary',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };

    const statusLabels = {
      draft: 'Draft',
      pending_review: 'Pending Review',
      changes_requested: 'Changes Requested',
      approved: 'Approved',
      rejected: 'Rejected',
    };

    return (
      <Badge className={statusStyles[property.verification_status]}>
        {statusLabels[property.verification_status]}
      </Badge>
    );
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row">
            {/* Image Section */}
            <div className="lg:w-48 h-48 lg:h-auto flex-shrink-0">
              <img
                src={property.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400'}
                alt={property.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Main Content */}
            <div className="flex-1 p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusBadge()}
                    {property.submitted_at && (
                      <span className="text-xs text-muted-foreground">
                        Submitted {formatDistanceToNow(new Date(property.submitted_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg line-clamp-1">{property.title}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{property.city}{property.neighborhood && `, ${property.neighborhood}`}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">{formatPrice(property.price)}</p>
                  <p className="text-xs text-muted-foreground capitalize">{property.property_type.replace('_', ' ')}</p>
                </div>
              </div>

              {/* Property Details */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                {property.bedrooms && (
                  <span className="flex items-center gap-1">
                    <Bed className="h-4 w-4" />
                    {property.bedrooms} beds
                  </span>
                )}
                {property.bathrooms && (
                  <span className="flex items-center gap-1">
                    <Bath className="h-4 w-4" />
                    {property.bathrooms} baths
                  </span>
                )}
                {property.size_sqm && (
                  <span className="flex items-center gap-1">
                    <Ruler className="h-4 w-4" />
                    {property.size_sqm} sqm
                  </span>
                )}
              </div>

              {/* Agent Info */}
              {property.agent && (
                <div className="flex items-center gap-2 text-sm mb-3 pb-3 border-b">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{property.agent.name}</span>
                  {property.agent.agency_name && (
                    <>
                      <Building2 className="h-4 w-4 text-muted-foreground ml-2" />
                      <span className="text-muted-foreground">{property.agent.agency_name}</span>
                    </>
                  )}
                  {property.agent.is_verified && (
                    <Badge variant="outline" className="text-xs">Verified</Badge>
                  )}
                </div>
              )}

              {/* Expandable Details */}
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="mb-2">
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Show More Details
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-3 pt-2 border-t">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Address</h4>
                      <p className="text-sm text-muted-foreground">{property.address}</p>
                    </div>
                    {property.description && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Description</h4>
                        <p className="text-sm text-muted-foreground line-clamp-4">{property.description}</p>
                      </div>
                    )}
                    {property.images && property.images.length > 1 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">All Photos ({property.images.length})</h4>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {property.images.map((img, i) => (
                            <img
                              key={i}
                              src={img}
                              alt={`Photo ${i + 1}`}
                              className="h-20 w-20 object-cover rounded flex-shrink-0"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {property.rejection_reason && (
                      <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded">
                        <h4 className="text-sm font-medium text-orange-800 dark:text-orange-400 mb-1">
                          Previous Feedback
                        </h4>
                        <p className="text-sm text-orange-700 dark:text-orange-300">{property.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <MarketSanityPanel
                property={property}
                reviewed={marketSanityReviewed}
                onReviewedChange={setMarketSanityReviewed}
              />

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t mt-3">
                <Button
                  onClick={handleApprove}
                  disabled={isLoading || !marketSanityReviewed}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-1" />
                  {marketSanityReviewed ? 'Approve' : 'Review market sanity first'}
                </Button>
                
                {/* Feature checkbox - only show for pending listings */}
                {property.verification_status === 'pending_review' && (
                  <label className="flex items-center gap-2 text-sm cursor-pointer px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors">
                    <Checkbox 
                      checked={featureThis} 
                      onCheckedChange={(checked) => setFeatureThis(checked === true)}
                    />
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-muted-foreground">Feature this</span>
                  </label>
                )}
                
                <Button
                  variant="outline"
                  onClick={() => setShowChangesDialog(true)}
                  disabled={isLoading}
                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Request Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowRejectDialog(true)}
                  disabled={isLoading}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-auto"
                  onClick={() => setShowPreviewModal(true)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Request Changes Dialog */}
      <Dialog open={showChangesDialog} onOpenChange={setShowChangesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>
              Explain what changes the agent needs to make before this listing can be approved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Feedback for Agent *</label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Please add more photos, price seems incorrect, description needs more detail..."
                className="mt-1"
                rows={4}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Internal Notes (optional)</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Notes only visible to admins..."
                className="mt-1"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangesDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRequestChanges}
              disabled={!reason.trim()}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Send Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Listing</DialogTitle>
            <DialogDescription>
              This listing will be rejected. The agent will be notified with your reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Rejection Reason *</label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Duplicate listing, inappropriate content, suspicious pricing..."
                className="mt-1"
                rows={4}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Internal Notes (optional)</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Notes only visible to admins..."
                className="mt-1"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleReject}
              disabled={!reason.trim()}
              variant="destructive"
            >
              Reject Listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <PropertyPreviewModal 
        property={property} 
        open={showPreviewModal} 
        onOpenChange={setShowPreviewModal} 
      />
    </>
  );
}
