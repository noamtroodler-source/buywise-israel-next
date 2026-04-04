/**
 * UnclaimedListingBanner
 *
 * Shown on scraped listings that haven't been claimed by an agency.
 * Explains to buyers what they're looking at and invites agents to claim.
 */

import { ExternalLink, Building2, Camera, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface UnclaimedListingBannerProps {
  sourceUrl?: string | null;
  sourceName?: string; // "Yad2", "Madlan", or agency website name
  lastCheckedAt?: string | null;
  className?: string;
  onClaimClick?: () => void;
}

export function UnclaimedListingBanner({
  sourceUrl,
  sourceName = 'an external portal',
  lastCheckedAt,
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
        'rounded-xl border border-amber-200 bg-amber-50/60 px-5 py-4 space-y-3',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
          <Building2 className="w-4 h-4 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-900">
            Sourced listing — not yet verified
          </p>
          <p className="text-sm text-amber-800 mt-0.5 leading-relaxed">
            This listing was pulled from{' '}
            <span className="font-medium">{sourceName}</span> to help
            international buyers discover more options. Details may not
            reflect current availability.
          </p>
        </div>
      </div>

      {/* What this means */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
        {[
          { icon: CheckCircle2, text: 'Factual data only — no fabrication' },
          { icon: Camera, text: 'No listing photos yet' },
          {
            icon: ExternalLink,
            text: lastChecked
              ? `Last verified ${lastChecked}`
              : 'Availability unconfirmed',
          },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2 text-xs text-amber-700">
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{text}</span>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="flex flex-wrap gap-2 pt-1">
        {sourceUrl && (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 hover:text-amber-900 underline underline-offset-2"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View original listing
          </a>
        )}
        {onClaimClick && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClaimClick}
            className="h-7 text-xs border-amber-300 text-amber-800 hover:bg-amber-100 hover:border-amber-400"
          >
            Agent? Claim this listing
          </Button>
        )}
      </div>
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

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    agency_name: '',
    verification_note: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('listing_claim_requests').insert({
        property_id: propertyId,
        claimant_name: form.name,
        claimant_email: form.email,
        claimant_phone: form.phone || null,
        agency_name: form.agency_name || null,
        verification_note: form.verification_note || null,
        status: 'pending',
      });

      if (error) throw error;

      toast.success("Claim request submitted! We'll review it within 24 hours.");
      onOpenChange(false);
      setForm({ name: '', email: '', phone: '', agency_name: '', verification_note: '' });
    } catch (err) {
      console.error('Claim submission error:', err);
      toast.error('Failed to submit claim. Please try again or contact us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Claim this listing</DialogTitle>
          <DialogDescription>
            {propertyTitle
              ? `Are you the listing agent for "${propertyTitle}"?`
              : 'Are you the agent or agency for this property?'}{' '}
            Claiming it lets you add photos, update details, and receive buyer
            inquiries directly.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="claim-name">Your name *</Label>
              <Input
                id="claim-name"
                placeholder="David Cohen"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="claim-email">Email *</Label>
              <Input
                id="claim-email"
                type="email"
                placeholder="david@agency.co.il"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="claim-phone">Phone</Label>
              <Input
                id="claim-phone"
                type="tel"
                placeholder="+972 50 000 0000"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="claim-agency">Agency name</Label>
              <Input
                id="claim-agency"
                placeholder="Anglo Saxon Jerusalem"
                value={form.agency_name}
                onChange={(e) => setForm((f) => ({ ...f, agency_name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="claim-note">
                How can we verify you're the agent?{' '}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                id="claim-note"
                placeholder="e.g. My listing ID on Yad2 is 12345678, or my license number is..."
                value={form.verification_note}
                onChange={(e) =>
                  setForm((f) => ({ ...f, verification_note: e.target.value }))
                }
                rows={2}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || !form.name || !form.email}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit claim'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
