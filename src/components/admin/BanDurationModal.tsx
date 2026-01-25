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
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Ban, AlertTriangle } from 'lucide-react';

type BanDuration = '1d' | '1w' | '1m' | 'permanent';

interface BanDurationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  onConfirm: (duration: BanDuration, reason?: string) => void;
  isLoading?: boolean;
}

export function BanDurationModal({
  open,
  onOpenChange,
  userName,
  onConfirm,
  isLoading,
}: BanDurationModalProps) {
  const [duration, setDuration] = useState<BanDuration>('1d');
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(duration, reason || undefined);
  };

  const durationLabels: Record<BanDuration, string> = {
    '1d': '1 Day',
    '1w': '1 Week',
    '1m': '1 Month',
    'permanent': 'Permanent',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-destructive" />
            Ban User
          </DialogTitle>
          <DialogDescription>
            Ban <span className="font-semibold">{userName}</span> from the platform
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Ban Duration</Label>
            <RadioGroup
              value={duration}
              onValueChange={(value) => setDuration(value as BanDuration)}
              className="grid grid-cols-2 gap-2"
            >
              {(Object.keys(durationLabels) as BanDuration[]).map((key) => (
                <div key={key} className="flex items-center space-x-2">
                  <RadioGroupItem value={key} id={`duration-${key}`} />
                  <Label 
                    htmlFor={`duration-${key}`} 
                    className={`cursor-pointer ${key === 'permanent' ? 'text-destructive' : ''}`}
                  >
                    {durationLabels[key]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              placeholder="Enter reason for ban..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {duration === 'permanent' && (
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Permanent bans cannot be automatically lifted. Only an admin can unban this user.
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm} 
            disabled={isLoading}
          >
            {isLoading ? 'Banning...' : 'Ban User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
