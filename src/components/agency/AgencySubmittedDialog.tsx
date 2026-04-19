import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { Building2, Clock, Mail, LayoutList, Link2, Check, Copy } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AgencySubmittedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inviteCode?: string;
}

export function AgencySubmittedDialog({ open, onOpenChange, inviteCode }: AgencySubmittedDialogProps) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const inviteLink = inviteCode 
    ? `${window.location.origin}/auth?tab=signup&role=agent&code=${inviteCode}` 
    : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success('Invite link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  useEffect(() => {
    if (open) {
      // Trigger blue-tinted confetti celebration
      const duration = 3000;
      const end = Date.now() + duration;

      const colors = ['#3b82f6', '#60a5fa', '#93c5fd', '#1d4ed8', '#2563eb'];

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    }
  }, [open]);

  const handleClose = () => {
    onOpenChange(false);
    navigate('/agency');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-[calc(100vw-2rem)] w-[calc(100vw-2rem)] sm:w-full max-h-[90vh] overflow-hidden rounded-2xl [&>*]:min-w-0">
        <div className="overflow-y-auto max-h-[calc(90vh-3rem)] -mr-2 pr-2">
        <DialogHeader className="text-center space-y-4 items-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center"
          >
            <Building2 className="w-10 h-10 text-primary" />
          </motion.div>
          <DialogTitle className="text-2xl text-center">Agency Application Submitted!</DialogTitle>
          <DialogDescription className="text-base text-center">
            Thank you for registering your agency on our platform. We're excited to have you join our network of trusted real estate agencies.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl border border-border/50"
          >
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Review in Progress</p>
              <p className="text-sm text-muted-foreground">
                Our team will review your agency application within 1-2 business days.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl border border-border/50"
          >
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Email Notification</p>
              <p className="text-sm text-muted-foreground">
                You'll receive an email once your agency has been approved.
              </p>
            </div>
          </motion.div>

          {inviteCode && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-start gap-3 p-3 bg-primary/[0.06] rounded-xl border border-primary/20"
            >
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Link2 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Invite Your Agents</p>
                <p className="text-sm text-muted-foreground mb-2">
                  Share this link with your agents so they can join your team — they can start signing up right away.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopy}
                    className="shrink-0 rounded-lg h-8 gap-1.5 px-2.5"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span className="text-xs">{copied ? 'Copied' : 'Copy'}</span>
                  </Button>
                  <code className="flex-1 min-w-0 text-xs bg-muted/80 rounded-lg px-3 py-2 truncate border border-border/50">
                    {inviteCode}
                  </code>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-start gap-3 p-3 bg-primary/[0.04] rounded-xl border border-primary/15"
          >
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <LayoutList className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">While you wait — explore pricing</p>
              <p className="text-sm text-muted-foreground">
                Plans start from just ₪299/mo. Pick yours before you're approved and hit the ground running on day one.
              </p>
              <button
                onClick={() => window.open('/pricing', '_blank')}
                className="mt-1.5 text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
              >
                Explore Plans →
              </button>
            </div>
          </motion.div>
        </div>

        <Button onClick={handleClose} className="w-full h-11 rounded-xl">
          Got it
        </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
