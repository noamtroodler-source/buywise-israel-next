import { Radio, Compass, Eye } from 'lucide-react';

interface Props {
  label: string;
  body?: string | null;
  signal?: string | null;
  whyYouCare?: string | null;
  ourMove?: string | null;
  byline?: string;
}

/**
 * Renders a BuyWise Breakdown. When the structured beats are present
 * (signal / whyYouCare / ourMove), it shows them as three distinct beats
 * with small line-icons. Falls back to a single paragraph (body) for older
 * takes that haven't been re-drafted yet.
 */
export function IntelTakeBlock({ label, body, signal, whyYouCare, ourMove, byline = 'By the BuyWise desk' }: Props) {
  const hasBeats = !!(signal || whyYouCare || ourMove);

  return (
    <div className="mt-5 border-l-2 border-primary bg-primary/[0.04] pl-5 pr-4 py-4">
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
