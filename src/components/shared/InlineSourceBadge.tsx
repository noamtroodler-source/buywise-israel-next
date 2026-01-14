import { ShieldCheck, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// Support both flat string and nested {date, source} formats
type SourceValue = string | { date?: string; source?: string };

interface InlineSourceBadgeProps {
  sources?: Record<string, SourceValue> | null;
  lastVerified?: string | null;
  variant?: 'subtle' | 'standard' | 'compact';
  className?: string;
}

// Extract the source string from either format
const getSourceString = (value: SourceValue): string => {
  if (typeof value === 'string') return value;
  return value?.source || '';
};

// Format source value for display (includes date if available)
const formatSourceDisplay = (value: SourceValue): string => {
  if (typeof value === 'string') return value;
  const parts: string[] = [];
  if (value?.source) parts.push(value.source);
  if (value?.date) parts.push(`(${value.date})`);
  return parts.join(' ') || '';
};

/**
 * Compact inline source attribution badge for displaying at data points.
 * Shows abbreviated sources + verification date with optional tooltip for details.
 */
export function InlineSourceBadge({ 
  sources, 
  lastVerified, 
  variant = 'subtle',
  className 
}: InlineSourceBadgeProps) {
  // Don't render if no sources
  if (!sources || Object.keys(sources).length === 0) {
    return null;
  }

  // Format the date
  const formattedDate = lastVerified 
    ? new Date(lastVerified).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

  // Extract unique source names (abbreviate common ones)
  const sourceAbbreviations: Record<string, string> = {
    'Central Bureau of Statistics': 'CBS',
    'Israel Tax Authority': 'ITA',
    'Bank of Israel': 'BoI',
    'Municipality': 'Muni',
    'Madlan': 'Madlan',
    'Kantahome': 'Kantahome',
  };

  const abbreviateSource = (source: string): string => {
    for (const [full, abbrev] of Object.entries(sourceAbbreviations)) {
      if (source.toLowerCase().includes(full.toLowerCase())) {
        return abbrev;
      }
    }
    // Return first word or abbreviation
    const words = source.split(/[,\s]+/).filter(Boolean);
    return words[0]?.substring(0, 10) || source;
  };

  const uniqueSources = [...new Set(
    Object.values(sources)
      .map(v => getSourceString(v))
      .filter(Boolean)
      .map(abbreviateSource)
  )];
  const displaySources = uniqueSources.slice(0, 3).join(', ');
  const hasMoreSources = uniqueSources.length > 3;

  // Full source details for tooltip
  const fullSourceList = Object.entries(sources).map(([key, value]) => ({
    label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    value: formatSourceDisplay(value),
  }));

  const baseStyles = cn(
    'inline-flex items-center gap-1.5 text-xs',
    variant === 'subtle' && 'text-muted-foreground',
    variant === 'standard' && 'text-muted-foreground bg-muted/50 px-2 py-1 rounded-md',
    variant === 'compact' && 'text-muted-foreground/70',
    className
  );

  const content = (
    <span className={baseStyles}>
      <ShieldCheck className="h-3.5 w-3.5 text-green-600 shrink-0" />
      <span>
        {displaySources}{hasMoreSources && ' +'}
        {formattedDate && <span className="opacity-70"> · {formattedDate}</span>}
      </span>
    </span>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help">{content}</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs p-3" side="bottom">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              Verified Data Sources
            </div>
            <div className="space-y-1.5">
              {fullSourceList.map(({ label, value }) => (
                <div key={label} className="text-xs">
                  <span className="font-medium text-foreground/80">{label}:</span>{' '}
                  <span className="text-muted-foreground">{value}</span>
                </div>
              ))}
            </div>
            {formattedDate && (
              <p className="text-xs text-muted-foreground pt-1 border-t border-border/50">
                Last verified: {formattedDate}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Simple verification badge for Quick Stats strip
 */
export function VerificationBadge({ 
  hasVerifiedData,
  lastVerified,
  className 
}: { 
  hasVerifiedData: boolean;
  lastVerified?: string | null;
  className?: string;
}) {
  if (!hasVerifiedData) return null;

  const formattedDate = lastVerified 
    ? new Date(lastVerified).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    : null;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn(
            'inline-flex items-center gap-1 text-xs text-muted-foreground cursor-help',
            className
          )}>
            <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
            <span className="hidden sm:inline">Verified{formattedDate && ` ${formattedDate}`}</span>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Data verified from official government and industry sources</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
