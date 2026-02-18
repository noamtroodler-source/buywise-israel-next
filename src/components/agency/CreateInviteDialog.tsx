import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { Loader2, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useCreateInviteCode } from '@/hooks/useAgencyManagement';
import { useSeatLimitCheck } from '@/hooks/useSeatLimitCheck';
import { Users } from 'lucide-react';

interface CreateInviteDialogProps {
  agencyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateInviteDialog({ agencyId, open, onOpenChange }: CreateInviteDialogProps) {
  const [label, setLabel] = useState('');
  const [hasMaxUses, setHasMaxUses] = useState(false);
  const [maxUses, setMaxUses] = useState(10);
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryDays, setExpiryDays] = useState(30);
  
  const createInvite = useCreateInviteCode();
  const { currentSeats, maxSeats, isOverLimit, overageMockPrice } = useSeatLimitCheck();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createInvite.mutate({
      agencyId,
      label: label.trim() || undefined,
      maxUses: hasMaxUses && maxUses > 0 ? maxUses : undefined,
      expiresAt: hasExpiry && expiryDays > 0 ? addDays(new Date(), expiryDays).toISOString() : undefined,
    }, {
      onSuccess: () => {
        // Reset form
        setLabel('');
        setHasMaxUses(false);
        setMaxUses(10);
        setHasExpiry(false);
        setExpiryDays(30);
        onOpenChange(false);
      },
    });
  };

  const expiryDate = hasExpiry ? addDays(new Date(), expiryDays) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Invite Code</DialogTitle>
            <DialogDescription>
              Create a custom invite code with optional restrictions
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-6">
            {/* Seat usage info */}
            {isOverLimit ? (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm">
                <Users className="h-4 w-4 flex-shrink-0 text-destructive mt-0.5" />
                <span className="text-destructive">
                  You are currently over your seat limit. Any agent who joins via this code will add to your overage charges at ₪{overageMockPrice}/seat/month.
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 text-sm text-muted-foreground">
                <Users className="h-4 w-4 flex-shrink-0" />
                {maxSeats === null 
                  ? <span>Unlimited seats available</span>
                  : <span>{currentSeats}/{maxSeats} seats used · {Math.max(0, maxSeats - currentSeats)} remaining</span>
                }
              </div>
            )}

            {/* Label */}
            <div className="space-y-2">
              <Label htmlFor="label">Label (optional)</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., March Hiring Event"
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                A name to help you remember what this code is for
              </p>
            </div>

            {/* Max Uses */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Limit Uses</Label>
                  <p className="text-xs text-muted-foreground">
                    Set a maximum number of times this code can be used
                  </p>
                </div>
                <Switch checked={hasMaxUses} onCheckedChange={setHasMaxUses} />
              </div>
              
              {hasMaxUses && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={maxUses}
                    onChange={(e) => setMaxUses(parseInt(e.target.value) || 1)}
                    min={1}
                    max={1000}
                    className="w-24 rounded-xl"
                  />
                  <span className="text-sm text-muted-foreground">uses</span>
                </div>
              )}
            </div>

            {/* Expiration */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Set Expiration</Label>
                  <p className="text-xs text-muted-foreground">
                    Code will stop working after this date
                  </p>
                </div>
                <Switch checked={hasExpiry} onCheckedChange={setHasExpiry} />
              </div>
              
              {hasExpiry && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={expiryDays}
                      onChange={(e) => setExpiryDays(parseInt(e.target.value) || 1)}
                      min={1}
                      max={365}
                      className="w-24 rounded-xl"
                    />
                    <span className="text-sm text-muted-foreground">days from now</span>
                  </div>
                  {expiryDate && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Expires: {format(expiryDate, 'PPP')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={createInvite.isPending} className="rounded-xl">
              {createInvite.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Code'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
