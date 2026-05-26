import { useState } from 'react';
import { ChevronDown, ChevronRight, Radio, Compass, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  IntelFeedItem,
  displayHeadline,
  isDisplayedInEnglish,
  isTranslatedFromHebrew,
  trackIntelClick,
} from '@/hooks/useIntel';
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
    <section className="min-w-0">
      <header className="mb-3 flex items-end justify-between border-b border-border pb-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground">
          Latest
        </p>
        <p className="text-xs text-muted-foreground tabular-nums">
          {articles.length} stories
        </p>
      </header>
      <ul className="min-w-0">
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
  const [open, setOpen] = useState(false);
  const cat = CATEGORY_BY_ID[article.category] ?? CATEGORY_BY_ID.general;
  const headline = displayHeadline(article);
  const ltr = isDisplayedInEnglish(article);
  const translated = isTranslatedFromHebrew(article);
  const hasTake = !!(article.signal || article.take_body);
  let when = '';
  try {
    when = formatDistanceToNow(new Date(article.published_at), { addSuffix: true });
  } catch { /* noop */ }

  return (
    <li className={cn('group min-w-0', zebra && 'bg-muted/30')}>
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        onClick={() => trackIntelClick(article)}
        className="flex min-w-0 items-baseline gap-3 px-3 py-2.5 sm:gap-4"
      >
        <span className="hidden w-24 shrink-0 text-[11px] uppercase tracking-wider text-muted-foreground tabular-nums sm:inline">
          {when || '—'}
        </span>
        <span className="hidden w-24 shrink-0 truncate text-[11px] font-medium uppercase tracking-wider text-foreground/70 sm:inline">
          {article.source_name}
        </span>
        <h4
          className="min-w-0 flex-1 break-words text-[14.5px] leading-snug text-foreground transition-colors group-hover:text-primary"
          dir={ltr ? 'ltr' : 'rtl'}
        >
          {headline}
          {translated && (
            <span className="ml-2 align-middle text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
              HE→EN
            </span>
          )}
        </h4>
        <span className="hidden shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground md:inline">
          {cat.label}
        </span>
      </a>
      <div className="mt-0.5 flex items-center gap-2 px-3 pb-2 text-[11px] text-muted-foreground tabular-nums sm:hidden">
        <span className="font-medium text-foreground/70">{article.source_name}</span>
        {when && <span>· {when}</span>}
      </div>

      {hasTake && (
        <div className="min-w-0 px-3 pb-3">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="flex w-full min-w-0 max-w-full items-start gap-1.5 rounded-sm border border-primary/25 bg-primary/[0.05] px-2 py-1.5 text-left transition-colors hover:bg-primary/[0.09]"
          >
            {open ? (
              <ChevronDown className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
            ) : (
              <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
            )}
            <span className="inline-flex shrink-0 items-center rounded-sm bg-primary px-1 py-px text-[9px] font-semibold uppercase tracking-[0.12em] text-primary-foreground">
              Buyer Impact
            </span>
            <span className={cn('min-w-0 flex-1 break-words text-[12px] leading-snug text-foreground', !open && 'line-clamp-1')}>
              {article.signal || firstSentence(article.take_body ?? '')}
            </span>
          </button>

          {open && (
            <div className="mt-2 min-w-0 space-y-2 break-words border-l-2 border-primary bg-primary/[0.04] px-3 py-2.5">
              {article.signal && <Beat icon={<Radio className="h-3 w-3" />} label="Signal" text={article.signal} />}
              {article.why_you_care && <Beat icon={<Compass className="h-3 w-3" />} label="Why you care" text={article.why_you_care} />}
              {article.our_move && <Beat icon={<Eye className="h-3 w-3" />} label="Our move" text={article.our_move} />}
              {!article.signal && !article.why_you_care && !article.our_move && article.take_body && (
                <p className="text-[13px] leading-relaxed text-foreground whitespace-pre-line">{article.take_body}</p>
              )}
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function Beat({ icon, label, text }: { icon: React.ReactNode; label: string; text: string }) {
  return (
    <div className="min-w-0">
      <div className="mb-0.5 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-primary/80">
        {icon}
        <span>{label}</span>
      </div>
      <p className="break-words text-[13px] leading-snug text-foreground">{text}</p>
    </div>
  );
}

function firstSentence(s: string): string {
  const m = s.trim().match(/^[\s\S]*?[.!?](?=\s|$)/);
  return (m?.[0] ?? s).trim();
}
