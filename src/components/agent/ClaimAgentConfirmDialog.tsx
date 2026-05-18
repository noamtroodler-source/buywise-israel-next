import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2, UserCheck, Sparkles } from 'lucide-react';

interface Props {
  open: boolean;
  candidate: {
    id: string;
    name: string;
    license_number: string | null;
    listing_count: number;
  } | null;
  agencyName?: string | null;
  isLoading: boolean;
  pendingChoice: 'claim' | 'new' | null;
  onConfirm: () => void;
  onDeny: () => void;
}

export function ClaimAgentConfirmDialog({
  open,
  candidate,
  agencyName,
  isLoading,
  pendingChoice,
  onConfirm,
  onDeny,
}: Props) {
  if (!candidate) return null;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <UserCheck className="h-6 w-6 text-primary" />
          </div>
          <AlertDialogTitle className="text-center">Is this you?</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            We found someone on {agencyName ? <span className="font-medium text-foreground">{agencyName}</span> : 'your agency'}'s roster who looks like a close match.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="rounded-xl border border-border bg-muted/40 p-4 my-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Name on roster</span>
            <span className="font-semibold">{candidate.name}</span>
          </div>
          {candidate.license_number && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">License</span>
              <span className="font-mono text-sm">{candidate.license_number}</span>
            </div>
          )}
          {candidate.listing_count > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t border-border text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>
                <span className="font-semibold">{candidate.listing_count}</span> listing{candidate.listing_count === 1 ? '' : 's'} already assigned — they'll appear in your dashboard once you claim this profile.
              </span>
            </div>
          )}
        </div>

        <AlertDialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading && pendingChoice === 'claim' ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Yes, that's me
          </Button>
          <Button
            onClick={onDeny}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading && pendingChoice === 'new' ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            No, I'm new here
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
