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
import { Textarea } from '@/components/ui/textarea';

interface RuledOutReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason?: string) => void;
  propertyTitle?: string;
}

export function RuledOutReasonDialog({
  open,
  onOpenChange,
  onConfirm,
  propertyTitle,
}: RuledOutReasonDialogProps) {
  const [reason, setReason] = useState('');

  const handleConfirm = (withReason: boolean) => {
    onConfirm(withReason ? reason : undefined);
    setReason('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Moving to Ruled Out</DialogTitle>
          <DialogDescription>
            {propertyTitle && (
              <span className="font-medium text-foreground">{propertyTitle}</span>
            )}
            <br />
            Would you like to add a note about why you're ruling this out? (Optional)
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="e.g., Too far from train station, over budget, needs too much renovation..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleConfirm(false)}
          >
            Skip
          </Button>
          <Button
            onClick={() => handleConfirm(true)}
            disabled={!reason.trim()}
          >
            Save Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}