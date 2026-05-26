import { ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { IntelFeedItem } from '@/hooks/useIntel';
import { CATEGORY_BY_ID } from '@/lib/intel/categories';
import { IntelTakeBlock } from './IntelTakeBlock';

interface Props {
  article: IntelFeedItem;
}

export function IntelTodaysTake({ article }: Props) {
  const cat = CATEGORY_BY_ID[article.category] ?? CATEGORY_BY_ID.general;
  const isHebrew = article.source_language === 'he';
  let when = '';
  try {
    when = formatDistanceToNow(new Date(article.published_at), { addSuffix: true });
  } catch { /* noop */ }

  return (
    <article className="group">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
        Today's Take · {cat.label}
      </p>
      <h2
        className="mt-3 font-serif text-3xl leading-[1.1] tracking-tight text-foreground md:text-[2.75rem]"
        dir={isHebrew ? 'rtl' : 'ltr'}
      >
        {article.headline}
      </h2>
      <div className="mt-3 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground tabular-nums">
        <span className="font-medium text-foreground/80">{article.source_name}</span>
        {when && <span>· {when}</span>}
        {isHebrew && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide">HE</span>
        )}
      </div>

      {article.excerpt && (
        <p
          className="mt-4 text-[17px] leading-relaxed text-muted-foreground"
          dir={isHebrew ? 'rtl' : 'ltr'}
        >
          {article.excerpt}
        </p>
      )}

      {article.take_body ? (
        <IntelTakeBlock
          label={article.take_label ?? 'BuyWise Take'}
          body={article.take_body}
        />
      ) : isHebrew ? (
        <p className="mt-4 text-sm italic text-muted-foreground">
          Hebrew source — English BuyWise Take coming shortly.
        </p>
      ) : null}

      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        Read on {article.source_name}
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </article>
  );
}
