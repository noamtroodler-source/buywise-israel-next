import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { IntelFeedItem } from '@/hooks/useIntel';
import { CATEGORY_BY_ID } from '@/lib/intel/categories';
import { cn } from '@/lib/utils';

interface Props {
  articles: IntelFeedItem[];
  pageSize?: number;
}

export function IntelLongList({ articles, pageSize = 30 }: Props) {
  const [shown, setShown] = useState(pageSize);
  if (!articles.length) return null;
  const visible = articles.slice(0, shown);
  const more = articles.length > shown;

  return (
    <section>
      <header className="mb-3 flex items-end justify-between border-b border-border pb-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground">
          Latest
        </p>
        <p className="text-xs text-muted-foreground tabular-nums">
          {articles.length} stories
        </p>
      </header>
      <ul>
        {visible.map((a, i) => (
          <LongRow key={a.id} article={a} zebra={i % 2 === 1} />
        ))}
      </ul>
      {more && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setShown((s) => s + pageSize)}
            className="rounded-sm border border-border px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Load more
          </button>
        </div>
      )}
    </section>
  );
}

function LongRow({ article, zebra }: { article: IntelFeedItem; zebra: boolean }) {
  const cat = CATEGORY_BY_ID[article.category] ?? CATEGORY_BY_ID.general;
  const isHebrew = article.source_language === 'he';
  let when = '';
  try {
    when = formatDistanceToNow(new Date(article.published_at), { addSuffix: true });
  } catch { /* noop */ }

  return (
    <li className={cn('group', zebra && 'bg-muted/30')}>
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="flex items-baseline gap-3 px-3 py-2.5 sm:gap-4"
      >
        <span className="hidden w-24 shrink-0 text-[11px] uppercase tracking-wider text-muted-foreground tabular-nums sm:inline">
          {when || '—'}
        </span>
        <span className="hidden w-24 shrink-0 truncate text-[11px] font-medium uppercase tracking-wider text-foreground/70 sm:inline">
          {article.source_name}
        </span>
        <h4
          className="flex-1 text-[14.5px] leading-snug text-foreground transition-colors group-hover:text-primary"
          dir={isHebrew ? 'rtl' : 'ltr'}
        >
          {article.headline}
        </h4>
        <span className="hidden shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground md:inline">
          {cat.label}
        </span>
      </a>
      <div className="mt-0.5 flex items-center gap-2 px-3 pb-2 text-[11px] text-muted-foreground tabular-nums sm:hidden">
        <span className="font-medium text-foreground/70">{article.source_name}</span>
        {when && <span>· {when}</span>}
      </div>
    </li>
  );
}
