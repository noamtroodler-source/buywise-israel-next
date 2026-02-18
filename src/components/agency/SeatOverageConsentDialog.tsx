import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useOverageRate } from '@/hooks/useOverageRecords';

interface SeatOverageConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSeats: number;
  maxSeats: number;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function SeatOverageConsentDialog({
  open,
  onOpenChange,
  currentSeats,
  maxSeats,
  onConfirm,
  isLoading,
}: SeatOverageConsentDialogProps) {
  const [accepted, setAccepted] = useState(false);
  const { data: liveRate } = useOverageRate('agency', 'seat');
  const rate = liveRate ?? 100;

  const handleConfirm = () => {
    onConfirm();
    setAccepted(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setAccepted(false); onOpenChange(v); }}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-amber-500/15 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <DialogTitle>Seat Limit Reached</DialogTitle>
          </div>
          <DialogDescription className="pt-1">
            You're at your plan limit of <strong>{maxSeats}</strong> seats ({currentSeats}/{maxSeats} used).
            Approving this agent will add an overage seat.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1 text-sm">
          <p className="font-medium text-amber-700 dark:text-amber-400">Overage charge applies</p>
          <p className="text-muted-foreground">
            Each seat over your plan limit is billed at <strong>₪{rate}/seat/month</strong>.
            This will be reflected in your next billing cycle.
          </p>
        </div>

        <div className="flex items-start gap-3 pt-1">
          <Checkbox
            id="consent"
            checked={accepted}
            onCheckedChange={(v) => setAccepted(v === true)}
            className="mt-0.5"
          />
          <Label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer">
            I understand that approving this agent will incur an overage charge of ₪{rate}/month until
            I either remove a team member or upgrade my plan.
          </Label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!accepted || isLoading}
            className="rounded-xl"
          >
            Approve & Accept Charge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
