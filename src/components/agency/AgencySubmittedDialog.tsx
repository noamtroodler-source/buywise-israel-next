import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Building2, Clock, Mail } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface AgencySubmittedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgencySubmittedDialog({ open, onOpenChange }: AgencySubmittedDialogProps) {
  const navigate = useNavigate();

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
    navigate('/');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl">Agency Application Submitted!</DialogTitle>
          <DialogDescription className="text-base">
            Thank you for registering your agency on our platform. We're excited to have you join our network of trusted real estate agencies.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Review in Progress</p>
              <p className="text-sm text-muted-foreground">
                Our team will review your agency application within 1-2 business days.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Email Notification</p>
              <p className="text-sm text-muted-foreground">
                You'll receive an email once your agency has been approved.
              </p>
            </div>
          </div>
        </div>

        <Button onClick={handleClose} className="w-full h-11 rounded-xl">
          Got it
        </Button>
      </DialogContent>
    </Dialog>
  );
}
