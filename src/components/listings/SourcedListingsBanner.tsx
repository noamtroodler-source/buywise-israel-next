/**
 * SourcedListingsBanner
 *
 * Shown at the top of /listings when the "BuyWise Partners" filter is active.
 * Explains what BuyWise Partner listings are and builds buyer confidence.
 */

import { ShieldCheck, Info, CheckCircle2, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SourcedListingsBannerProps {
  className?: string;
}

export function SourcedListingsBanner({ className }: SourcedListingsBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className={cn(
      'rounded-xl border border-primary/25 bg-primary/5 px-4 py-4 space-y-3',
      className
    )}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
          <ShieldCheck className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            BuyWise Partner Listings
          </p>
          <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
            These are listings from vetted BuyWise Partner agencies — real estate professionals 
            who meet our standards for working with international buyers. 
            Each listing is real and verified by the partnered agency.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* What to expect */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pl-11">
        {[
          { icon: CheckCircle2, text: 'Vetted agencies experienced with international buyers' },
          { icon: CheckCircle2, text: 'Real listings with verified pricing & details' },
          { icon: Info, text: 'Contact the agent directly through BuyWise' },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
