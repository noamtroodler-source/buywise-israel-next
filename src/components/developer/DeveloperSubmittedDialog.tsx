import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { Hammer, Clock, Mail, LayoutList } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DeveloperSubmittedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeveloperSubmittedDialog({ open, onOpenChange }: DeveloperSubmittedDialogProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      // Trigger blue-tinted confetti celebration from both sides
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
    navigate('/developer');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center"
          >
            <Hammer className="w-10 h-10 text-primary" />
          </motion.div>
          <DialogTitle className="text-2xl">Developer Application Submitted!</DialogTitle>
          <DialogDescription className="text-base">
            Thank you for registering as a developer on our platform. We're excited to showcase your projects to potential buyers.
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
                Our team will review your developer application within 1-2 business days.
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
                You'll receive an email once your developer account has been approved.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
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
      </DialogContent>
    </Dialog>
  );
}
