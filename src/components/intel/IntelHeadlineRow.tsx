import { ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { IntelFeedItem } from '@/hooks/useIntel';
import { CATEGORY_BY_ID } from '@/lib/intel/categories';
import { cn } from '@/lib/utils';

interface Props {
  article: IntelFeedItem;
}

/** Compact, scannable single-line headline row used in the "Latest" list. */
export function IntelHeadlineRow({ article }: Props) {
  const cat = CATEGORY_BY_ID[article.category] ?? CATEGORY_BY_ID.general;
  const Icon = cat.icon;
  const isHebrew = article.source_language === 'he';

  let when = '';
  try {
    when = formatDistanceToNow(new Date(article.published_at), { addSuffix: true });
  } catch { /* noop */ }

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="group flex items-start gap-4 border-b border-border/60 py-4 last:border-b-0 hover:bg-muted/30 transition-colors -mx-2 px-2 rounded-sm"
    >
      <div className="flex-1 min-w-0">
        <h4
          className={cn(
            'text-[15px] font-medium leading-snug text-foreground group-hover:text-primary transition-colors',
          )}
          dir={isHebrew ? 'rtl' : 'ltr'}
        >
          {article.headline}
        </h4>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/70">{article.source_name}</span>
          {when && <span>· {when}</span>}
          <span className="inline-flex items-center gap-1 text-muted-foreground/80">
            · <Icon className="h-3 w-3" /> {cat.label}
          </span>
          {isHebrew && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
              HE
            </span>
          )}
        </div>
      </div>
      <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground/50 group-hover:text-primary transition-colors" />
    </a>
  );
}
