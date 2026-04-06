/**
 * SourcedListingsBanner
 *
 * Shown at the top of /listings when the "Sourced listings" filter is active.
 * Explains what sourced listings are, sets expectations, and gives buyers
 * confidence to engage despite incomplete data.
 */

import { Building2, Info, ExternalLink, CheckCircle2, X } from 'lucide-react';
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
      'rounded-xl border border-semantic-amber/25 bg-semantic-amber/5 px-4 py-4 space-y-3',
      className
    )}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-semantic-amber/15 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Building2 className="w-4 h-4 text-semantic-amber" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Showing aggregated listings
          </p>
          <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
            These properties are pulled automatically from Yad2, Madlan, and agency websites.
            They're real listings — but some details may be incomplete and availability isn't guaranteed.
            Each listing links back to its original source.
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
          { icon: CheckCircle2, text: 'Factual data only — prices, sizes, locations' },
          { icon: CheckCircle2, text: 'Links back to original listing on source site' },
          { icon: Info, text: 'Claim this listing → agency can add full details' },
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
