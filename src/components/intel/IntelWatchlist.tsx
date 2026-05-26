import { useState } from 'react';
import { ChevronDown, ChevronRight, Radio, Compass, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  IntelFeedItem,
  displayHeadline,
  isDisplayedInEnglish,
  trackIntelClick,
} from '@/hooks/useIntel';
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
  const [open, setOpen] = useState(false);
  const headline = displayHeadline(article);
  const ltr = isDisplayedInEnglish(article);
  const hasTake = !!(article.signal || article.take_body);
  let when = '';
  try {
    when = formatDistanceToNow(new Date(article.published_at), { addSuffix: true });
  } catch { /* noop */ }

  return (
    <div className="py-3">
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        onClick={() => trackIntelClick(article)}
        className="group flex items-start gap-3"
      >
        {article.image_url && (
          <div className="w-20 shrink-0 overflow-hidden rounded-sm">
            <IntelImage src={article.image_url} alt={headline} aspect="square" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h4
            className={cn(
              'text-[14px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary',
              'line-clamp-3',
            )}
            dir={ltr ? 'ltr' : 'rtl'}
          >
            {headline}
          </h4>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground tabular-nums">
            <span className="font-medium text-foreground/70">{article.source_name}</span>
            {when && <span>· {when}</span>}
          </div>
        </div>
      </a>

      {hasTake && (
        <div className="mt-2 pl-[5.75rem]">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="group flex w-full items-start gap-1.5 rounded-sm border border-primary/25 bg-primary/[0.05] px-2 py-1.5 text-left transition-colors hover:bg-primary/[0.09]"
          >
            {open ? (
              <ChevronDown className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
            ) : (
              <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
            )}
            <span className="inline-flex shrink-0 items-center rounded-sm bg-primary px-1 py-px text-[9px] font-semibold uppercase tracking-[0.12em] text-primary-foreground">
              Take
            </span>
            <span
              className={cn(
                'text-[12px] leading-snug text-foreground',
                !open && 'line-clamp-2',
              )}
            >
              {article.signal || firstSentence(article.take_body ?? '')}
            </span>
          </button>

          {open && (
            <div className="mt-2 space-y-2 border-l-2 border-primary bg-primary/[0.04] px-3 py-2.5">
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
    </div>
  );
}

function Beat({ icon, label, text }: { icon: React.ReactNode; label: string; text: string }) {
  return (
    <div>
      <div className="mb-0.5 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-primary/80">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-[13px] leading-snug text-foreground">{text}</p>
    </div>
  );
}

function firstSentence(s: string): string {
  const m = s.trim().match(/^[\s\S]*?[.!?](?=\s|$)/);
  return (m?.[0] ?? s).trim();
}
