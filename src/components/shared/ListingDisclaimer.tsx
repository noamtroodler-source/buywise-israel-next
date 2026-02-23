import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ListingDisclaimerProps {
  variant?: 'search' | 'detail';
  className?: string;
}

export function ListingDisclaimer({ variant = 'search', className }: ListingDisclaimerProps) {
  const text = variant === 'detail'
    ? 'Listing details are provided by the advertising agent or developer. While we work to ensure accuracy, we recommend verifying all information independently. Market data is sourced from government records and may reflect reporting delays.'
    : 'Listing information is provided by advertisers. Verify details before making decisions.';

  return (
    <div className={cn("flex items-start justify-center gap-2 text-xs text-muted-foreground/70 max-w-2xl mx-auto px-4", className)}>
      <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
      <p>{text}</p>
    </div>
  );
}
