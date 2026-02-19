import { useState, useEffect } from 'react';
import { Sparkles, Clock, Percent, Coins, BookOpen, Copy, CheckCircle, X, ArrowRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerClose,
} from '@/components/ui/drawer';
import { toast } from 'sonner';

const MODAL_SEEN_KEY = 'founding_modal_seen';
const PROMO_CODE = 'FOUNDING2026';

const BENEFITS = [
  { icon: Clock, text: '60-day free trial on any plan' },
  { icon: Percent, text: '25% off for 10 months after trial' },
  { icon: Coins, text: '800 visibility credits (~₪16,000 value)' },
  { icon: BookOpen, text: 'Featured case study on launch' },
];

interface FoundingProgramModalProps {
  onActivate: (code: string) => void;
}

function ModalBody({ onActivate, onClose }: { onActivate: (code: string) => void; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(PROMO_CODE);
    setCopied(true);
    toast.success('Promo code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleActivate = () => {
    localStorage.setItem(MODAL_SEEN_KEY, '1');
    onActivate(PROMO_CODE);
    onClose();
    setTimeout(() => {
      document.getElementById('founding')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  const handleViewPlans = () => {
    localStorage.setItem(MODAL_SEEN_KEY, '1');
    onClose();
  };

  return (
    <div className="px-6 pb-6 pt-2 flex flex-col items-center text-center">
      {/* Icon */}
      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>

      {/* Headline */}
      <h2 className="text-xl font-bold text-foreground mb-1">Founding Program</h2>
      <p className="text-sm text-muted-foreground mb-6">Limited Time — Early Access</p>

      {/* Benefits */}
      <ul className="w-full space-y-2.5 mb-6 text-left">
        {BENEFITS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm text-foreground">{text}</span>
          </li>
        ))}
      </ul>

      {/* Code chip */}
      <div className="w-full mb-6">
        <p className="text-xs text-muted-foreground mb-2">Your promo code:</p>
        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors group"
        >
          <span className="font-mono font-bold text-base text-primary tracking-widest">{PROMO_CODE}</span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground group-hover:text-primary transition-colors">
            {copied ? <CheckCircle className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </span>
        </button>
      </div>

      {/* CTAs */}
      <div className="w-full flex flex-col sm:flex-row gap-2">
        <Button className="flex-1 gap-2" onClick={handleActivate}>
          Activate Now
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" className="flex-1" onClick={handleViewPlans}>
          View Plans
        </Button>
      </div>
    </div>
  );
}

export function FoundingProgramModal({ onActivate }: FoundingProgramModalProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const seen = localStorage.getItem(MODAL_SEEN_KEY);
    if (seen) return;

    const timer = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    localStorage.setItem(MODAL_SEEN_KEY, '1');
    setOpen(false);
  };

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
        <DrawerContent className="pb-safe">
          <div className="relative pt-2">
            <DrawerClose asChild>
              <button
                onClick={handleClose}
                className="absolute right-4 top-2 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </DrawerClose>
            <ModalBody onActivate={onActivate} onClose={handleClose} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <div className="relative pt-6">
          <DialogClose asChild>
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity z-10"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
          <ModalBody onActivate={onActivate} onClose={handleClose} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
