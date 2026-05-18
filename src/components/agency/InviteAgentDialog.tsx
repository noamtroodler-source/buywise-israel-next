import { useState } from 'react';
import { Copy, Check, Hash, Info } from 'lucide-react';
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
import { toast } from 'sonner';

interface InviteAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultInviteCode: string | null;
  onManageCodes: () => void;
}

export function InviteAgentDialog({ open, onOpenChange, defaultInviteCode, onManageCodes }: InviteAgentDialogProps) {
  const [copied, setCopied] = useState(false);
  const inviteLink = defaultInviteCode
    ? `${window.location.origin}/auth?role=agent&tab=signup&code=${defaultInviteCode}`
    : '';

  const copy = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success('Invite link copied');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite an agent to your agency</DialogTitle>
          <DialogDescription>
            Share this link with an agent. They'll create their account and join your agency automatically.
          </DialogDescription>
        </DialogHeader>

        {defaultInviteCode ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your invite code</span>
              </div>
              <p className="text-2xl font-bold font-mono tracking-wider text-foreground">
                {defaultInviteCode}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Shareable link</label>
              <div className="flex gap-2">
                <Input value={inviteLink} readOnly className="rounded-xl font-mono text-xs" />
                <Button
                  onClick={copy}
                  variant="outline"
                  className="rounded-xl border-primary/30 hover:bg-primary/10 flex-shrink-0"
                >
                  {copied ? (
                    <><Check className="h-4 w-4 mr-1" />Copied</>
                  ) : (
                    <><Copy className="h-4 w-4 mr-1" />Copy</>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                Send this link by email, WhatsApp, or however you normally reach the agent. Founding agencies have unlimited seats.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4">
            No default invite code yet. Create one from the Invites tab.
          </p>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" className="rounded-xl" onClick={onManageCodes}>
            Manage invite codes
          </Button>
          <Button className="rounded-xl" onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
