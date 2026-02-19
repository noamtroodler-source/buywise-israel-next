import { useState } from 'react';
import { Sparkles, Copy, CheckCircle, X, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

const RIBBON_DISMISSED_KEY = 'founding_ribbon_dismissed';
const PROMO_CODE = 'FOUNDING2026';

interface FoundingPromoRibbonProps {
  onSeeDetails?: () => void;
}

export function FoundingPromoRibbon({ onSeeDetails }: FoundingPromoRibbonProps) {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(RIBBON_DISMISSED_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [copied, setCopied] = useState(false);

  if (dismissed) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(PROMO_CODE);
    setCopied(true);
    toast.success('Promo code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(RIBBON_DISMISSED_KEY, '1');
    } catch {
      // ignore
    }
    setDismissed(true);
  };

  const handleSeeDetails = () => {
    if (onSeeDetails) {
      onSeeDetails();
    } else {
      document.getElementById('founding')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div
      className="sticky top-0 z-40 w-full bg-primary text-primary-foreground"
      style={{ minHeight: 48 }}
    >
      <div className="container flex items-center justify-between gap-2 py-2.5 px-4">
        {/* Left: icon + text */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Sparkles className="h-3.5 w-3.5 flex-shrink-0 opacity-90" />
          <span className="text-xs sm:text-sm font-medium truncate">
            <span className="font-semibold">Founding Program</span>
            <span className="hidden sm:inline opacity-80"> · 60-day free trial + 25% off + ₪16,000 in credits</span>
          </span>
        </div>

        {/* Center: code + copy */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="hidden xs:inline text-xs opacity-80">Code:</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 border border-primary-foreground/20 transition-colors"
            aria-label="Copy promo code"
          >
            <span className="font-mono text-xs font-bold tracking-wider">{PROMO_CODE}</span>
            {copied
              ? <CheckCircle className="h-3 w-3 flex-shrink-0" />
              : <Copy className="h-3 w-3 flex-shrink-0 opacity-70" />}
          </button>
        </div>

        {/* Right: see details + dismiss */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleSeeDetails}
            className="hidden sm:flex items-center gap-0.5 text-xs opacity-80 hover:opacity-100 transition-opacity underline-offset-2 hover:underline whitespace-nowrap"
          >
            See details
            <ChevronDown className="h-3 w-3" />
          </button>
          <button
            onClick={handleDismiss}
            className="ml-1 p-1 rounded opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Dismiss ribbon"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
