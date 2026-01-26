import { ShieldCheck, Building2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  type SourceValue,
  getDisplayableSources,
  getAbbreviatedSources,
  hasGovernmentVerification,
} from '@/lib/utils/sourceFormatting';

interface InlineSourceBadgeProps {
  sources?: Record<string, SourceValue> | null;
  lastVerified?: string | null;
  variant?: 'subtle' | 'standard' | 'compact';
  className?: string;
}

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
  // Get displayable sources (filters out empty values and hidden categories)
  const displayableSources = getDisplayableSources(sources);
  const abbreviatedSources = getAbbreviatedSources(sources);
  const hasGovVerification = hasGovernmentVerification(sources);
  
  // Don't render if no meaningful sources
  if (displayableSources.length === 0 && !hasGovVerification) {
    return null;
  }

  // Format the date
  const formattedDate = lastVerified 
    ? new Date(lastVerified).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

  // Build inline display text
  const displaySources = abbreviatedSources.slice(0, 3).join(', ');
  const hasMoreSources = abbreviatedSources.length > 3;

  const baseStyles = cn(
    'inline-flex items-center gap-1.5 text-xs',
    variant === 'subtle' && 'text-muted-foreground',
    variant === 'standard' && 'text-muted-foreground bg-muted/50 px-2 py-1 rounded-md',
    variant === 'compact' && 'text-muted-foreground/70',
    className
  );

  const content = (
    <span className={baseStyles}>
      <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
      <span>
        {displaySources || 'Verified'}{hasMoreSources && ' +'}
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
              <ShieldCheck className="h-4 w-4 text-primary" />
              Verified Data Sources
            </div>
            
            {displayableSources.length > 0 && (
              <div className="space-y-1.5">
                {displayableSources.map(({ key, label, value }) => (
                  <div key={key} className="text-xs">
                    <span className="font-medium text-foreground/80">{label}:</span>{' '}
                    <span className="text-muted-foreground">{value}</span>
                  </div>
                ))}
              </div>
            )}
            
            {hasGovVerification && (
              <Badge variant="secondary" className="text-xs gap-1 mt-2">
                <Building2 className="h-3 w-3" />
                Government verified source
              </Badge>
            )}
            
            {formattedDate && (
              <p className="text-xs text-muted-foreground pt-1 border-t border-border/50">
                Last verified: {formattedDate}
              </p>
            )}
            
            {displayableSources.length === 0 && !hasGovVerification && (
              <p className="text-xs text-muted-foreground">
                Data sourced from official government and industry records
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
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
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
