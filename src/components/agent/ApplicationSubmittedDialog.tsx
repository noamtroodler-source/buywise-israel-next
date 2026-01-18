import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Mail } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

interface ApplicationSubmittedDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ApplicationSubmittedDialog({ open, onClose }: ApplicationSubmittedDialogProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      // Trigger confetti with brand colors
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#60a5fa', '#93c5fd'],
      });
    }
  }, [open]);

  const handleClose = () => {
    onClose();
    navigate('/');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center"
          >
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </motion.div>
          
          <DialogTitle className="text-2xl font-bold">
            Application Submitted!
          </DialogTitle>
          
          <DialogDescription className="text-base text-muted-foreground">
            Thank you for applying to become an agent on our platform.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
                Our team will review your application within 24-48 hours.
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
                You'll receive an email once your application is approved.
              </p>
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
