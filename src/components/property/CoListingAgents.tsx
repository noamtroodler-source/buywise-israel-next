/**
 * CoListingAgents
 *
 * Shown on property detail when multiple agencies list the same property.
 * Common in Israel — no exclusivity means the same apartment can appear
 * on Anglo Saxon, RE/MAX, and Yad2 simultaneously.
 *
 * Shows a tasteful "Also listed by" section under the main agent card.
 */

import { ExternalLink, Building2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CoAgent {
  id: string;
  source_url: string;
  source_type: string;
  agent?: {
    id: string;
    name: string;
    agency_name: string | null;
    phone: string | null;
    avatar_url: string | null;
    agency?: { id: string; name: string; logo_url: string | null } | null;
  } | null;
}

interface CoListingAgentsProps {
  coAgents: CoAgent[];
  className?: string;
}

const SOURCE_LABELS: Record<string, string> = {
  yad2: 'Yad2',
  madlan: 'Madlan',
  website: 'Agency site',
};

export function CoListingAgents({ coAgents, className }: CoListingAgentsProps) {
  if (!coAgents || coAgents.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Also listed by
      </p>
      <div className="space-y-2">
        {coAgents.map((coAgent) => {
          const agencyName =
            coAgent.agent?.agency?.name ||
            coAgent.agent?.agency_name ||
            'Agency';
          const agencyLogo = coAgent.agent?.agency?.logo_url;
          const sourceLabel = SOURCE_LABELS[coAgent.source_type] || coAgent.source_type;

          return (
            <div
              key={coAgent.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-muted/30 px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Avatar className="h-7 w-7 flex-shrink-0">
                  <AvatarImage src={agencyLogo || undefined} alt={agencyName} />
                  <AvatarFallback className="bg-muted text-xs">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{agencyName}</p>
                  {coAgent.agent?.name && (
                    <p className="text-xs text-muted-foreground truncate">{coAgent.agent.name}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant="outline" className="text-xs h-5 px-1.5">
                  {sourceLabel}
                </Badge>
                <a
                  href={coAgent.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  title="View original listing"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        This property is listed by multiple agencies — common in Israel where listings aren't exclusive.
      </p>
    </div>
  );
}
