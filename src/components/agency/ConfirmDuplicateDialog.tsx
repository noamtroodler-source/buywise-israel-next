/**
 * ConfirmDuplicateDialog
 *
 * Shown by the property wizards when the pre-submission check finds a match.
 * Replaces the old DuplicateBlockDialog with a collaborative flow that
 * reflects how the Israeli market actually works — two agencies often
 * legitimately represent the same apartment.
 *
 * Four mutually-exclusive modes, driven by DuplicateCheckResult.kind:
 *
 *   intra_block      → Your agency already has this. Hard block with an
 *                       "Open existing draft" link. No submit path.
 *
 *   confirm_scrape    → Another agency's *scrape* already lists this.
 *                       Three paths:
 *                         • Same apartment → promote YOUR agency to primary
 *                           (old scrape agency demoted to secondary)
 *                         • Different unit → close dialog, jump wizard to
 *                           floor/apt step so the agent adds a discriminator
 *                         • Cancel → close, cancel submission
 *
 *   confirm_manual    → Another agency has MANUALLY listed this.
 *                       Three paths:
 *                         • Yes, we co-represent → insert as secondary,
 *                           primary stays put
 *                         • Different unit → jump back & add discriminator
 *                         • Not sure / dispute → file a primary_dispute AND
 *                           co-list; admin reviews
 *                         • Cancel → close, cancel submission
 *
 * Matches BuyWise design language: destructive-red circle only for the
 * hard-block case; neutral / primary for the confirm flows.
 */
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Building2,
  Loader2,
  Users,
  HomeIcon,
  AlertTriangle,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import type { DuplicateCheckResult } from '@/hooks/useDuplicateCheck';

type ConfirmAction = 'same_unit' | 'different_unit' | 'dispute' | 'cancel';

interface ConfirmDuplicateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: DuplicateCheckResult | null;
  attemptedAddress: string;
  attemptedCity: string | null;
  /** Called with the agent's choice. 'same_unit' / 'different_unit' / 'dispute' / 'cancel'.
   *  For confirm_scrape, 'dispute' is unused. */
  onChoice: (action: ConfirmAction, disputeReason?: string) => Promise<void> | void;
  /** Whether a choice is currently being acted on (so we can disable buttons). */
  isActing?: boolean;
  /** Route for the agent's "open existing draft" link in intra_block mode. */
  existingDraftHref?: string;
}

export function ConfirmDuplicateDialog({
  open,
  onOpenChange,
  result,
  attemptedAddress,
  attemptedCity,
  onChoice,
  isActing = false,
  existingDraftHref,
}: ConfirmDuplicateDialogProps) {
  const [disputeMode, setDisputeMode] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  if (!result || result.kind === 'clear') return null;

  const closeAll = () => {
    setDisputeMode(false);
    setDisputeReason('');
    onOpenChange(false);
  };

  const handle = async (action: ConfirmAction) => {
    try {
      await onChoice(action, action === 'dispute' ? disputeReason.trim() : undefined);
      setDisputeMode(false);
      setDisputeReason('');
    } catch (e) {
      toast.error(`Something went wrong: ${(e as Error).message}`);
    }
  };

  // ── INTRA-AGENCY BLOCK ───────────────────────────────────────────────────
  if (result.kind === 'intra_block') {
    const match = result.match;
    const href =
      existingDraftHref ?? `/agent/properties?highlight=${encodeURIComponent(match.property_id)}`;
    const created = new Date(match.created_at);
    const dateStr = created.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    return (
      <Dialog open={open} onOpenChange={(o) => (!o ? closeAll() : null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-2">
              <ShieldAlert className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-center">You've already listed this</DialogTitle>
            <DialogDescription className="text-center">
              Your agency added this property on <strong>{dateStr}</strong>. Open the
              existing listing instead of creating a duplicate.
            </DialogDescription>
          </DialogHeader>

          <Alert className="bg-muted/50">
            <FileText className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <div className="font-medium text-foreground">
                {match.title || attemptedAddress}
              </div>
              {match.address && (
                <div className="text-muted-foreground text-xs mt-0.5">
                  {match.address}
                  {match.city ? `, ${match.city}` : ''}
                </div>
              )}
            </AlertDescription>
          </Alert>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-2">
            <Button variant="outline" onClick={closeAll} className="rounded-xl">
              Cancel
            </Button>
            <Button asChild className="rounded-xl">
              <Link to={href}>Open existing listing</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // ── CROSS-AGENCY CONFIRM (scrape or manual) ──────────────────────────────
  const match = result.match;
  const agencyName = match.existing_agency_name || 'another agency';
  const isManual = result.kind === 'confirm_manual';
  const iconBgClass = isManual ? 'bg-primary/10' : 'bg-muted';
  const iconColorClass = isManual ? 'text-primary' : 'text-muted-foreground';

  // Dispute sub-view (manual-vs-manual "Not sure" path)
  if (disputeMode) {
    return (
      <Dialog open={open} onOpenChange={(o) => (!o ? closeAll() : null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-semantic-amber/10 mb-2">
              <AlertTriangle className="h-6 w-6 text-semantic-amber" />
            </div>
            <DialogTitle className="text-center">File a dispute</DialogTitle>
            <DialogDescription className="text-center">
              Tell our team why you believe <strong>{agencyName}</strong> isn't the right
              primary agency for this property. We'll publish your listing as co-listed
              while we review.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="dispute-reason">Reason (optional but helpful)</Label>
            <Textarea
              id="dispute-reason"
              placeholder="e.g. We hold the exclusive mandate from the seller as of January 2026…"
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              rows={4}
              className="rounded-xl"
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setDisputeMode(false)}
              className="rounded-xl"
              disabled={isActing}
            >
              Back
            </Button>
            <Button
              onClick={() => handle('dispute')}
              className="rounded-xl"
              disabled={isActing}
            >
              {isActing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit dispute & co-list
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Primary view
  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? closeAll() : null)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div
            className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${iconBgClass} mb-2`}
          >
            <Users className={`h-6 w-6 ${iconColorClass}`} />
          </div>
          <DialogTitle className="text-center">
            {isManual ? 'Already listed by another agency' : 'This looks like an existing listing'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isManual ? (
              <>
                <strong>{agencyName}</strong> has manually listed this address. In Israel,
                multiple agencies often co-represent the same apartment — is that the case here?
              </>
            ) : (
              <>
                <strong>{agencyName}</strong> is already listed here (from a public
                scrape). If this is the same apartment you represent, you can claim it as
                primary — we'll show you as the lead agent and demote the scrape to "also
                listed by".
              </>
            )}
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

        <div className="space-y-2">
          {/* Primary action — same apartment */}
          <Button
            onClick={() => handle('same_unit')}
            disabled={isActing}
            className="w-full justify-start gap-3 rounded-xl h-auto py-3"
          >
            {isActing ? (
              <Loader2 className="h-5 w-5 animate-spin flex-shrink-0" />
            ) : (
              <HomeIcon className="h-5 w-5 flex-shrink-0" />
            )}
            <div className="text-left">
              <div className="font-semibold">
                {isManual ? 'Yes, we co-represent this' : "Yes, I'll claim this listing"}
              </div>
              <div className="text-xs opacity-90 font-normal">
                {isManual
                  ? "We'll add you as a co-listed agency. Primary stays with the other agency."
                  : "You become the primary agency. The scrape will show as 'also listed by'."}
              </div>
            </div>
          </Button>

          {/* Different unit */}
          <Button
            variant="outline"
            onClick={() => handle('different_unit')}
            disabled={isActing}
            className="w-full justify-start gap-3 rounded-xl h-auto py-3"
          >
            <Building2 className="h-5 w-5 flex-shrink-0" />
            <div className="text-left">
              <div className="font-semibold">No, different unit</div>
              <div className="text-xs text-muted-foreground font-normal">
                Same building, different apartment. We'll ask for the floor or apartment #.
              </div>
            </div>
          </Button>

          {/* Dispute (manual-vs-manual only) */}
          {isManual && (
            <Button
              variant="outline"
              onClick={() => setDisputeMode(true)}
              disabled={isActing}
              className="w-full justify-start gap-3 rounded-xl h-auto py-3"
            >
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-semantic-amber" />
              <div className="text-left">
                <div className="font-semibold">Not sure — dispute this</div>
                <div className="text-xs text-muted-foreground font-normal">
                  Our team reviews. Your listing publishes as co-listed in the meantime.
                </div>
              </div>
            </Button>
          )}
        </div>

        <DialogFooter className="sm:justify-center">
          <Button
            variant="ghost"
            onClick={() => handle('cancel')}
            disabled={isActing}
            className="rounded-xl"
          >
            Cancel submission
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
