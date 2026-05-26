import { formatDistanceToNow } from 'date-fns';
import {
  IntelFeedItem,
  displayHeadline,
  isDisplayedInEnglish,
  trackIntelClick,
} from '@/hooks/useIntel';
import { CATEGORY_BY_ID } from '@/lib/intel/categories';
import { IntelImage } from './IntelImage';
import { TakeChip } from './IntelTakeBlock';

interface Props {
  articles: IntelFeedItem[];
}

export function IntelBriefing({ articles }: Props) {
  if (!articles.length) return null;
  return (
    <section>
      <header className="mb-5 flex items-end justify-between border-b border-border pb-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground">
          The Briefing
        </p>
        <p className="hidden text-xs text-muted-foreground sm:block">
          Three stories. One BuyWise read on each.
        </p>
      </header>
      <div className="grid gap-8 md:grid-cols-3">
        {articles.slice(0, 3).map((a) => (
          <BriefItem key={a.id} article={a} />
        ))}
      </div>
    </section>
  );
}

function BriefItem({ article }: { article: IntelFeedItem }) {
  const cat = CATEGORY_BY_ID[article.category] ?? CATEGORY_BY_ID.general;
  const headline = displayHeadline(article);
  const ltr = isDisplayedInEnglish(article);
  let when = '';
  try {
    when = formatDistanceToNow(new Date(article.published_at), { addSuffix: true });
  } catch { /* noop */ }

  const onOpen = () => trackIntelClick(article);
  const hasTake = !!(article.signal || article.take_body);

  return (
    <article className="group">
      <a href={article.url} target="_blank" rel="noopener noreferrer nofollow" onClick={onOpen} className="block">
        <IntelImage src={article.image_url} alt={headline} aspect="video" rounded />
      </a>
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
        {cat.label}
      </p>

      {hasTake && (
        <div className="mt-2">
          <TakeChip signal={article.signal} body={article.take_body} />
        </div>
      )}

      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        onClick={onOpen}
        className="mt-2 block"
      >
        <h3
          className="text-[17px] font-bold leading-snug text-foreground transition-colors hover:text-primary"
          dir={ltr ? 'ltr' : 'rtl'}
        >
          {headline}
        </h3>
      </a>
      {article.take_body && (
        <p className="mt-2 border-l-2 border-primary/60 pl-3 text-sm leading-relaxed text-foreground/80">
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
