import { Radio, Compass, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  label: string;
  body?: string | null;
  signal?: string | null;
  whyYouCare?: string | null;
  ourMove?: string | null;
  byline?: string;
  id?: string;
}

/**
 * Renders a BuyWise Breakdown. When the structured beats are present
 * (signal / whyYouCare / ourMove), it shows them as three distinct beats
 * with small line-icons. Falls back to a single paragraph (body) for older
 * takes that haven't been re-drafted yet.
 */
export function IntelTakeBlock({ label, body, signal, whyYouCare, ourMove, byline = 'By the BuyWise desk', id }: Props) {
  const hasBeats = !!(signal || whyYouCare || ourMove);

  return (
    <div id={id} className="mt-5 border-l-2 border-primary bg-primary/[0.04] pl-5 pr-4 py-4 scroll-mt-24">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex items-center rounded-sm bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-foreground">
          {label}
        </span>
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{byline}</span>
      </div>

      {hasBeats ? (
        <div className="space-y-3">
          {signal && (
            <Beat icon={<Radio className="h-3 w-3" />} label="Signal" text={signal} />
          )}
          {whyYouCare && (
            <Beat icon={<Compass className="h-3 w-3" />} label="Why you care" text={whyYouCare} />
          )}
          {ourMove && (
            <Beat icon={<Eye className="h-3 w-3" />} label="Our move" text={ourMove} />
          )}
        </div>
      ) : body ? (
        <p className="text-[15px] leading-relaxed text-foreground whitespace-pre-line">{body}</p>
      ) : null}

      <p className="mt-3 text-[10px] uppercase tracking-wider text-muted-foreground/70">
        BuyWise editorial · not the original reporting
      </p>
    </div>
  );
}

function Beat({ icon, label, text }: { icon: React.ReactNode; label: string; text: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary/80">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-[15px] leading-relaxed text-foreground">{text}</p>
    </div>
  );
}

/** Short summary chip rendered ABOVE a headline so readers can't miss the Take. */
export function TakeChip({
  signal,
  body,
  targetId,
  className,
}: {
  signal?: string | null;
  body?: string | null;
  targetId?: string;
  className?: string;
}) {
  const text = (signal && signal.trim()) || (body && firstSentence(body)) || null;
  if (!text) return null;

  const onClick = (e: React.MouseEvent) => {
    if (!targetId) return;
    const el = document.getElementById(targetId);
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <a
      href={targetId ? `#${targetId}` : undefined}
      onClick={onClick}
      className={cn(
        'group inline-flex max-w-full items-center gap-2 rounded-sm border border-primary/30 bg-primary/[0.06] px-2.5 py-1.5 text-left transition-colors hover:bg-primary/10',
        className,
      )}
    >
      <span className="inline-flex shrink-0 items-center rounded-sm bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-foreground">
        Buyer Impact
      </span>
      <span className="truncate text-[13px] font-medium leading-snug text-foreground">
        {text}
      </span>
    </a>
  );
}

function firstSentence(s: string): string {
  const m = s.trim().match(/^[\s\S]*?[.!?](?=\s|$)/);
  return (m?.[0] ?? s).trim();
}
