import { formatDistanceToNow } from 'date-fns';
import { IntelFeedItem } from '@/hooks/useIntel';
import { CATEGORY_BY_ID } from '@/lib/intel/categories';

interface Props {
  articles: IntelFeedItem[];
}

export function IntelBriefing({ articles }: Props) {
  if (!articles.length) return null;
  return (
    <section>
      <header className="mb-4 flex items-end justify-between border-b border-border pb-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground">
          The Briefing
        </p>
        <p className="hidden text-xs text-muted-foreground sm:block">
          One-line BuyWise read on three stories worth your attention.
        </p>
      </header>
      <div className="grid gap-8 md:grid-cols-3 md:divide-x md:divide-border/60">
        {articles.slice(0, 3).map((a, i) => (
          <BriefItem key={a.id} article={a} className={i === 0 ? '' : 'md:pl-6'} />
        ))}
      </div>
    </section>
  );
}

function BriefItem({ article, className = '' }: { article: IntelFeedItem; className?: string }) {
  const cat = CATEGORY_BY_ID[article.category] ?? CATEGORY_BY_ID.general;
  const isHebrew = article.source_language === 'he';
  let when = '';
  try {
    when = formatDistanceToNow(new Date(article.published_at), { addSuffix: true });
  } catch { /* noop */ }

  return (
    <article className={className}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
        {cat.label}
      </p>
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="mt-2 block"
      >
        <h3
          className="text-lg font-semibold leading-snug text-foreground hover:text-primary"
          dir={isHebrew ? 'rtl' : 'ltr'}
        >
          {article.headline}
        </h3>
      </a>
      {article.take_body && (
        <p className="mt-2 font-serif text-[15px] italic leading-relaxed text-foreground/80">
          {firstSentence(article.take_body)}
        </p>
      )}
      <p className="mt-3 text-[11px] uppercase tracking-wider text-muted-foreground tabular-nums">
        {article.source_name}{when && ` · ${when}`}
      </p>
    </article>
  );
}

function firstSentence(s: string) {
  const m = s.match(/^[\s\S]*?[.!?](?=\s|$)/);
  return (m?.[0] ?? s).trim();
}
