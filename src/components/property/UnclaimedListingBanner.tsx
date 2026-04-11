/**
 * UnclaimedListingBanner
 *
 * Shown on scraped listings that haven't been claimed by an agency.
 * Explains to buyers what they're looking at and invites agents to claim.
 * Branded for BuyWise Israel — transparency-first, trusted-friend voice.
 */

import { ExternalLink, Building2, Camera, ShieldCheck, Clock, ImageIcon, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UnclaimedListingBannerProps {
  sourceUrl?: string | null;
  sourceName?: string;
  lastCheckedAt?: string | null;
  hasImages?: boolean;
  className?: string;
  onClaimClick?: () => void;
}

export function UnclaimedListingBanner({
  sourceUrl,
  sourceName = 'an external portal',
  lastCheckedAt,
  hasImages = false,
  className,
  onClaimClick,
}: UnclaimedListingBannerProps) {
  const lastChecked = lastCheckedAt
    ? new Date(lastCheckedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-muted/40 px-5 py-4 space-y-3.5',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="w-4.5 h-4.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            BuyWise Sourced Listing
          </p>
          <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
            We found this listing on <span className="font-medium text-foreground">{sourceName}</span> and
            translated it for international buyers. Pricing and details come directly from the
            original source — we don't edit or embellish.
          </p>
        </div>
      </div>

      {/* Trust signals */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-0.5">
        {[
          { icon: ShieldCheck, text: 'Original data — nothing fabricated', color: 'text-primary' },
          {
            icon: hasImages ? ImageIcon : Camera,
            text: hasImages ? 'Photos from original listing' : 'No listing photos available',
            color: 'text-muted-foreground',
          },
          {
            icon: Clock,
            text: lastChecked ? `Last checked ${lastChecked}` : 'Availability unconfirmed',
            color: 'text-muted-foreground',
          },
        ].map(({ icon: Icon, text, color }) => (
          <div key={text} className={cn('flex items-center gap-1.5 text-xs', color)}>
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{text}</span>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="flex flex-wrap items-center gap-3 pt-0.5">
        {sourceUrl && (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View photos on original listing
          </a>
        )}
        {onClaimClick && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClaimClick}
            className="h-7 text-xs border-border"
          >
            <Building2 className="w-3 h-3 mr-1" />
            Agent? Claim this listing
          </Button>
        )}
      </div>

      {/* Legal disclaimer */}
      <p className="text-[10px] text-muted-foreground/70 leading-relaxed pt-0.5">
        This listing is sourced from publicly available data and is provided for informational purposes only.
        BuyWise Israel does not guarantee accuracy or current availability. Contact the listing agent for the latest details.
      </p>
    </div>
  );
}

// ─── Street View Fallback ────────────────────────────────────────────────────

interface StreetViewFallbackProps {
  address?: string | null;
  city?: string;
  latitude?: number | null;
  longitude?: number | null;
  neighborhood?: string | null;
  className?: string;
}

export function StreetViewFallback({
  address,
  city,
  latitude,
  longitude,
  neighborhood,
  className,
}: StreetViewFallbackProps) {
  const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Build Street View URL
  let streetViewUrl: string | null = null;

  if (googleMapsKey) {
    if (latitude && longitude) {
      // Best: use coordinates
      streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=800x400&location=${latitude},${longitude}&fov=90&heading=0&pitch=10&key=${googleMapsKey}`;
    } else if (address && city) {
      // Fallback: use address string
      const query = encodeURIComponent(`${address}, ${city}, Israel`);
      streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=800x400&location=${query}&fov=90&heading=0&pitch=10&key=${googleMapsKey}`;
    }
  }

  const locationLabel = address
    ? `${address}${city ? `, ${city}` : ''}`
    : neighborhood
    ? `${neighborhood}${city ? `, ${city}` : ''}`
    : city || 'Israel';

  if (!streetViewUrl) return null;

  return (
    <div className={cn('relative overflow-hidden rounded-xl', className)}>
      <img
        src={streetViewUrl}
        alt={`Street view of ${locationLabel}`}
        className="w-full h-full object-cover"
        onError={(e) => {
          // Hide the container if Street View fails (no street view available)
          const parent = (e.target as HTMLImageElement).closest('.street-view-container') as HTMLElement;
          if (parent) parent.style.display = 'none';
        }}
      />
      {/* Label overlay */}
      <div className="absolute bottom-3 left-3 right-3">
        <Badge
          variant="secondary"
          className="bg-black/60 text-white border-0 backdrop-blur-sm text-xs"
        >
          <Camera className="w-3 h-3 mr-1" />
          Street view · {locationLabel}
        </Badge>
      </div>
    </div>
  );
}

// ─── Claim Listing Dialog ────────────────────────────────────────────────────

import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ArrowRight } from 'lucide-react';

interface ClaimListingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  propertyTitle?: string;
}

export function ClaimListingDialog({
  open,
  onOpenChange,
  propertyId,
  propertyTitle,
}: ClaimListingDialogProps) {
  const navigate = useNavigate();

  const handleRegister = () => {
    onOpenChange(false);
    navigate(`/agency/register?claim=${propertyId}`);
  };

  const handleAdvertise = () => {
    onOpenChange(false);
    navigate(`/advertise?claim=${propertyId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Claim this listing</DialogTitle>
          <DialogDescription>
            {propertyTitle
              ? `Is "${propertyTitle}" your listing?`
              : 'Is this your listing?'}{' '}
            Register your agency on BuyWiseIsrael to claim it, add photos,
            and receive international buyer inquiries directly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {/* What claiming gets you */}
          <div className="rounded-lg bg-muted/50 px-4 py-3 space-y-2">
            {[
              'Add your photos and full listing details',
              'Receive buyer inquiries directly',
              'Your agency profile on every listing',
              'Access to all BuyWiseIsrael buyer leads',
            ].map((benefit) => (
              <div key={benefit} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <Button className="w-full" onClick={handleRegister}>
              Register your agency
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button variant="outline" className="w-full" onClick={handleAdvertise}>
              Learn more first
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Already registered?{' '}
            <a href="/agency/register" className="text-primary underline underline-offset-2">
              Sign in to your agency account
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
