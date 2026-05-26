import { AlertTriangle, Check } from 'lucide-react';
import { lintVoice, VoiceIssue } from '@/lib/intel/voice-rules';

interface Props {
  text: string;
  label?: string;
  className?: string;
}

const TYPE_LABEL: Record<VoiceIssue['type'], string> = {
  opener: 'Banned opener',
  phrase: 'AI cliché',
  term: 'Off-brand term',
  em_dash_overload: 'Too many em dashes',
};

/** Lightweight inline linter for editorial text. */
export function VoiceLinter({ text, label, className = '' }: Props) {
  const issues = lintVoice(text ?? '');
  if (!text?.trim()) return null;

  if (!issues.length) {
    return (
      <div className={`flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 ${className}`}>
        <Check className="h-3 w-3" />
        <span>{label ? `${label} — ` : ''}Voice check clean</span>
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {issues.slice(0, 4).map((i, idx) => (
        <div key={idx} className="flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-400">
          <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" />
          <span>
            <span className="font-semibold">{TYPE_LABEL[i.type]}:</span>{' '}
            <code className="rounded bg-amber-100/60 px-1 py-0.5 dark:bg-amber-950/40">{i.match}</code>
          </span>
        </div>
      ))}
      {issues.length > 4 && (
        <div className="text-[11px] text-muted-foreground">+ {issues.length - 4} more issues</div>
      )}
    </div>
  );
}
