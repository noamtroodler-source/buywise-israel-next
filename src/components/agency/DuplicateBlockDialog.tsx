/**
 * DuplicateBlockDialog — shown when an agency tries to manually add a listing
 * that's already published (manually) by another agency. Blocks submission
 * and offers two actions:
 *   1. Mark as different unit (encourages user to enter floor/apt)
 *   2. Request co-listing (creates a co_listing_request — admin reviews)
 */
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert, Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRequestCoListing, type DuplicateMatch } from '@/hooks/useDuplicateCheck';

interface DuplicateBlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: DuplicateMatch | null;
  requestingAgencyId: string;
  attemptedAddress: string;
  attemptedCity: string | null;
  attemptedNeighborhood: string | null;
  /** Called when user picks "different unit" — wizard should jump to details step */
  onMarkDifferentUnit: () => void;
}

export function DuplicateBlockDialog({
  open,
  onOpenChange,
  match,
  requestingAgencyId,
  attemptedAddress,
  attemptedCity,
  attemptedNeighborhood,
  onMarkDifferentUnit,
}: DuplicateBlockDialogProps) {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [message, setMessage] = useState('');
  const requestCoListing = useRequestCoListing();

  if (!match) return null;

  const agencyName = match.existing_agency_name || 'another agency';

  const handleRequest = async () => {
    try {
      await requestCoListing.mutateAsync({
        requestingAgencyId,
        existingPropertyId: match.property_id,
        existingAgencyId: match.existing_agency_id,
        attemptedAddress,
        attemptedCity,
        attemptedNeighborhood,
        similarityScore: match.similarity_score,
        message: message.trim() || undefined,
      });
      toast.success('Co-listing request submitted. Our team will review within 1–2 business days.');
      onOpenChange(false);
      setShowRequestForm(false);
      setMessage('');
    } catch (e) {
      toast.error(`Failed to submit request: ${(e as Error).message}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 mb-2">
            <ShieldAlert className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <DialogTitle className="text-center">This property is already listed</DialogTitle>
          <DialogDescription className="text-center">
            <strong>{agencyName}</strong> has already published a listing at this address.
            To keep the platform clean, we don't allow duplicate listings.
          </DialogDescription>
        </DialogHeader>

        <Alert className="bg-muted/50">
          <Building2 className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <div className="font-medium text-foreground">{attemptedAddress}</div>
            {attemptedCity && <div className="text-muted-foreground">{attemptedCity}</div>}
            <div className="text-xs text-muted-foreground mt-2">
              Match confidence: {match.similarity_score}%
            </div>
          </AlertDescription>
        </Alert>

        {!showRequestForm ? (
          <div className="space-y-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">What would you like to do?</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>
                <strong>Different unit?</strong> Enter the floor number and/or apartment number
                so we can tell them apart.
              </li>
              <li>
                <strong>You also represent this seller?</strong> Request co-listing access
                and our team will verify with the existing agency.
              </li>
            </ul>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="colist-msg">Message to our review team (optional)</Label>
            <Textarea
              id="colist-msg"
              placeholder="e.g. We're co-representing this seller alongside the listing agency..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          {!showRequestForm ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  onMarkDifferentUnit();
                }}
                className="rounded-xl"
              >
                It's a different unit
              </Button>
              <Button onClick={() => setShowRequestForm(true)} className="rounded-xl">
                Request co-listing
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setShowRequestForm(false)}
                className="rounded-xl"
                disabled={requestCoListing.isPending}
              >
                Back
              </Button>
              <Button
                onClick={handleRequest}
                className="rounded-xl"
                disabled={requestCoListing.isPending}
              >
                {requestCoListing.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Submit request
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
