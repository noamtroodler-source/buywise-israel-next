import { useState } from 'react';
import { Shield, ExternalLink, ChevronDown, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TOOL_SOURCES, formatEffectiveDate, type ToolSourceConfig } from '@/lib/calculations/toolSources';

interface SourceAttributionProps {
  toolType: string;
  className?: string;
  defaultExpanded?: boolean;
  variant?: 'full' | 'compact' | 'inline';
}

export function SourceAttribution({ 
  toolType, 
  className,
  defaultExpanded = false,
  variant = 'full'
}: SourceAttributionProps) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const config = TOOL_SOURCES[toolType];
  
  if (!config) return null;

  // Inline variant - simple one-liner
  if (variant === 'inline') {
    return (
      <div className={cn(
        "flex items-center gap-2 text-xs text-muted-foreground",
        className
      )}>
        <Shield className="h-3 w-3" />
        <span>
          Sources: {config.primarySources.map(s => s.name.split('(')[0].trim()).join(', ')} · Updated {config.lastVerified}
        </span>
      </div>
    );
  }

  // Compact variant - clickable summary
  if (variant === 'compact') {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button className={cn(
            "w-full flex items-center justify-between gap-2 p-3 rounded-lg",
            "bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors",
            "text-sm text-muted-foreground",
            className
          )}>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary/70" />
              <span>
                Sources: {config.primarySources.map(s => s.name.split(' ')[0]).join(', ')} · {config.lastVerified}
              </span>
            </div>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              isOpen && "rotate-180"
            )} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 p-4 rounded-lg bg-muted/20 border border-border/30 space-y-3">
            <SourceList sources={config.primarySources} />
            <VerificationBadge lastVerified={config.lastVerified} categories={config.categories} />
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  // Full variant - always visible with collapsible details
  return (
    <div className={cn(
      "rounded-lg border border-border/50 bg-muted/20 overflow-hidden",
      className
    )}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">Data Sources & Verification</p>
                <p className="text-xs text-muted-foreground">
                  {config.primarySources.length} official source{config.primarySources.length > 1 ? 's' : ''} · Last verified {config.lastVerified}
                </p>
              </div>
            </div>
            <ChevronDown className={cn(
              "h-5 w-5 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )} />
          </button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4">
            <div className="h-px bg-border/50" />
            
            {/* Source List */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Official Sources
              </p>
              <SourceList sources={config.primarySources} />
            </div>
            
            {/* Verification Badge */}
            <VerificationBadge 
              lastVerified={config.lastVerified} 
              categories={config.categories} 
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

interface SourceListProps {
  sources: ToolSourceConfig['primarySources'];
}

function SourceList({ sources }: SourceListProps) {
  return (
    <ul className="space-y-2">
      {sources.map((source, index) => (
        <li key={index} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
            {source.url ? (
              <a 
                href={source.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                {source.name}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <span className="text-foreground">{source.name}</span>
            )}
          </div>
          {source.effectiveDate && (
            <span className="text-xs text-muted-foreground">
              Effective {formatEffectiveDate(source.effectiveDate)}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

interface VerificationBadgeProps {
  lastVerified: string;
  categories: string[];
}

function VerificationBadge({ lastVerified, categories }: VerificationBadgeProps) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
      <div className="text-xs text-muted-foreground">
        <span className="text-foreground font-medium">Data verified {lastVerified}</span>
        <span className="mx-1">·</span>
        <span>Covers: {categories.join(', ')}</span>
      </div>
    </div>
  );
}

export type { ToolSourceConfig };
