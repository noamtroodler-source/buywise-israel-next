/**
 * MergedSourcesBadges
 * --------------------
 * Compact source-origin badges for a property. Renders one chip per source
 * (Yad2 / Madlan / Website) so agencies can see where their listing data
 * came from at a glance.
 */
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface Props {
  primarySource?: string | null; // properties.import_source
  mergedUrls?: string[] | null;  // properties.merged_source_urls
  className?: string;
}

function detectSource(url: string): 'yad2' | 'madlan' | 'website' {
  const u = url.toLowerCase();
  if (u.includes('yad2.co.il')) return 'yad2';
  if (u.includes('madlan.co.il')) return 'madlan';
  return 'website';
}

const LABELS: Record<string, string> = {
  yad2: 'Yad2',
  madlan: 'Madlan',
  website: 'Website',
  website_scrape: 'Website',
};

const STYLES: Record<string, string> = {
  yad2: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  madlan: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
  website: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  website_scrape: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
};

export function MergedSourcesBadges({ primarySource, mergedUrls, className }: Props) {
  const sources = new Set<string>();
  if (primarySource) sources.add(primarySource === 'website_scrape' ? 'website' : primarySource);
  (mergedUrls || []).forEach((u) => sources.add(detectSource(u)));

  if (sources.size === 0) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn('flex flex-wrap items-center gap-1', className)}>
          {Array.from(sources).map((s) => (
            <Badge
              key={s}
              variant="outline"
              className={cn('text-[10px] px-1.5 py-0 font-medium', STYLES[s] || '')}
            >
              {LABELS[s] || s}
            </Badge>
          ))}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">
          Listing data merged from {sources.size} source{sources.size > 1 ? 's' : ''}.
          Website content is preferred; portals enrich missing details.
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
