import { ExternalLink, Globe, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOutboundTracking } from '@/hooks/useOutboundTracking';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SourceAttributionBadgeProps {
  propertyId?: string | null;
  importSource?: string | null;       // 'yad2' | 'madlan' | null (agency website)
  sourceUrl?: string | null;          // primary source URL
  mergedSourceUrls?: string[] | null; // all source URLs if cross-referenced
  sourceAgencyName?: string | null;   // for website-sourced listings
  /** 'card' → compact inline text; 'detail' → fuller clickable row */
  page?: 'card' | 'detail';
  className?: string;
}

/** Map a URL or import_source value to a human-readable platform name */
function getPlatformName(url: string, importSource?: string | null): string {
  if (url.includes('yad2.co.il')) return 'Yad2';
  if (url.includes('madlan.co.il')) return 'Madlan';
  if (importSource === 'yad2') return 'Yad2';
  if (importSource === 'madlan') return 'Madlan';
  return 'Agency website';
}

/** Derive all unique source entries we can link to */
function buildSources(
  importSource: string | null | undefined,
  sourceUrl: string | null | undefined,
  mergedSourceUrls: string[] | null | undefined,
  sourceAgencyName: string | null | undefined,
): Array<{ name: string; url: string; platform: string }> {
  const allUrls: string[] = [];

  if (mergedSourceUrls?.length) {
    allUrls.push(...mergedSourceUrls);
  } else if (sourceUrl) {
    allUrls.push(sourceUrl);
  }

  if (!allUrls.length) return [];

  return allUrls.map((url) => ({
    url,
    platform: getPlatformName(url, importSource),
    name:
      importSource !== 'yad2' && importSource !== 'madlan' && sourceAgencyName
        ? sourceAgencyName
        : getPlatformName(url, importSource),
  }));
}

/**
 * Shows "📍 Cross-referenced" (multiple sources) or "📍 Source: Yad2" (single)
 * for scraped listings, with tracked outbound links.
 *
 * Only renders when `importSource` is present (scraped listing).
 */
export function SourceAttributionBadge({
  propertyId,
  importSource,
  sourceUrl,
  mergedSourceUrls,
  sourceAgencyName,
  page = 'detail',
  className,
}: SourceAttributionBadgeProps) {
  const { trackOutbound } = useOutboundTracking();

  if (!importSource) return null;

  const sources = buildSources(importSource, sourceUrl, mergedSourceUrls, sourceAgencyName);
  const isCrossReferenced = sources.length > 1;
  const label = isCrossReferenced
    ? 'Cross-referenced'
    : sources.length === 1
    ? `Source: ${sources[0].name}`
    : 'Aggregated listing';

  const handleSourceClick = (e: React.MouseEvent, url: string, platform: string) => {
    e.preventDefault();
    e.stopPropagation();
    trackOutbound({
      propertyId,
      source: platform.toLowerCase(),
      sourceUrl: url,
      page,
    });
  };

  // ── CARD VARIANT ────────────────────────────────────────────────────
  if (page === 'card') {
    const CardIcon = isCrossReferenced ? Layers : Globe;
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (sources.length === 1) {
                  handleSourceClick(e, sources[0].url, sources[0].platform);
                }
              }}
              className={cn(
                'flex items-center gap-1 text-xs text-muted-foreground/60',
                sources.length === 1 && 'hover:text-muted-foreground transition-colors cursor-pointer',
                sources.length > 1 && 'cursor-default',
                className,
              )}
            >
              <CardIcon className="h-3 w-3 flex-shrink-0" />
              <span>{label}</span>
              {sources.length === 1 && (
                <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs max-w-[220px]">
            {isCrossReferenced ? (
              <div className="space-y-1.5">
                <p className="font-medium text-foreground">Found on multiple platforms</p>
                {sources.map((s) => (
                  <button
                    key={s.url}
                    onClick={(e) => handleSourceClick(e, s.url, s.platform)}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors w-full text-left"
                  >
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    {s.name}
                  </button>
                ))}
              </div>
            ) : (
              <p>Aggregated from {sources[0]?.name ?? 'external source'} — click to view original</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // ── DETAIL VARIANT ───────────────────────────────────────────────────
  const DetailIcon = isCrossReferenced ? Layers : Globe;
  return (
    <div className={cn('flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground', className)}>
      <DetailIcon className="h-3 w-3 flex-shrink-0" />
      {isCrossReferenced ? (
        <>
          <span className="font-medium text-foreground">Cross-referenced</span>
          <span>— found on</span>
          {sources.map((s, i) => (
            <span key={s.url} className="inline-flex items-center gap-0.5">
              {i > 0 && <span className="mx-0.5 text-muted-foreground/50">·</span>}
              <button
                onClick={(e) => handleSourceClick(e, s.url, s.platform)}
                className="underline underline-offset-2 text-foreground hover:text-primary transition-colors inline-flex items-center gap-0.5"
              >
                {s.name}
                <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
              </button>
            </span>
          ))}
        </>
      ) : sources.length === 1 ? (
        <>
          <span>Aggregated from</span>
          <button
            onClick={(e) => handleSourceClick(e, sources[0].url, sources[0].platform)}
            className="underline underline-offset-2 text-foreground hover:text-primary transition-colors inline-flex items-center gap-0.5 font-medium"
          >
            {sources[0].name}
            <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
          </button>
        </>
      ) : (
        <span>Aggregated listing</span>
      )}
    </div>
  );
}
