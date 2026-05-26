import { formatDistanceToNow } from 'date-fns';
import { IntelFeedItem } from '@/hooks/useIntel';
import { CATEGORY_BY_ID } from '@/lib/intel/categories';
import { IntelImage } from './IntelImage';
import { cn } from '@/lib/utils';

interface Props {
  articles: IntelFeedItem[];
  title?: string;
}

export function IntelWatchlist({ articles, title = "What we're watching" }: Props) {
  if (!articles.length) return null;
  return (
    <aside>
      <p className="border-b border-border pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground">
        {title}
      </p>
      <ul className="divide-y divide-border/60">
        {articles.map((a) => (
          <li key={a.id}>
            <WatchRow article={a} />
          </li>
        ))}
      </ul>
    </aside>
  );
}

function WatchRow({ article }: { article: IntelFeedItem }) {
  const cat = CATEGORY_BY_ID[article.category] ?? CATEGORY_BY_ID.general;
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
      className="group flex items-start gap-3 py-3"
    >
      {article.image_url && (
        <div className="w-20 shrink-0 overflow-hidden rounded-sm">
          <IntelImage src={article.image_url} alt={article.headline} aspect="square" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h4
          className={cn(
            'text-[14px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary',
            'line-clamp-3',
          )}
          dir={isHebrew ? 'rtl' : 'ltr'}
        >
          {article.headline}
        </h4>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground tabular-nums">
          <span className="font-medium text-foreground/70">{article.source_name}</span>
          {when && <span>· {when}</span>}
          {article.take_body && <span className="font-semibold text-primary">· Take</span>}
        </div>
      </div>
    </a>
  );
}
