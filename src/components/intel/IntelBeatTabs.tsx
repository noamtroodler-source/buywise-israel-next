import { Sparkles } from 'lucide-react';
import { IntelCategory } from '@/hooks/useIntel';
import { cn } from '@/lib/utils';

export interface Beat {
  id: IntelCategory | 'all';
  label: string;
}

export const BEATS: Beat[] = [
  { id: 'all', label: 'All' },
  { id: 'mortgage-rates', label: 'Mortgages' },
  { id: 'tax-legal', label: 'Tax & Legal' },
  { id: 'property-market', label: 'Market' },
  { id: 'city-spotlight', label: 'Cities' },
  { id: 'new-developments', label: 'Developments' },
  { id: 'aliyah-immigration', label: 'Aliyah' },
  { id: 'policy-regulation', label: 'Policy' },
  { id: 'macro-economy', label: 'Macro' },
];

interface Props {
  active: IntelCategory | 'all';
  onChange: (id: IntelCategory | 'all') => void;
  takesOnly?: boolean;
  onToggleTakesOnly?: (next: boolean) => void;
  takesCount?: number;
}

export function IntelBeatTabs({ active, onChange, takesOnly = false, onToggleTakesOnly, takesCount }: Props) {
  return (
    <div className="border-b border-border">
      <div className="flex items-center justify-between gap-4">
        <nav className="-mx-4 min-w-0 flex-1 overflow-x-auto px-4" aria-label="Beat tabs">
          <ul className="flex min-w-max items-center gap-6">
            {BEATS.map((b) => {
              const isActive = b.id === active;
              return (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => onChange(b.id)}
                    className={cn(
                      'relative whitespace-nowrap py-3 text-sm font-medium transition-colors',
                      isActive
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {b.label}
                    <span
                      className={cn(
                        'absolute inset-x-0 -bottom-px h-0.5 bg-primary transition-opacity',
                        isActive ? 'opacity-100' : 'opacity-0',
                      )}
                      aria-hidden
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {onToggleTakesOnly && (
          <button
            type="button"
            onClick={() => onToggleTakesOnly(!takesOnly)}
            aria-pressed={takesOnly}
            className={cn(
              'hidden shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors sm:inline-flex',
              takesOnly
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border text-muted-foreground hover:border-primary hover:text-foreground',
            )}
          >
            <Sparkles className="h-3 w-3" />
            With BuyWise Take
            {typeof takesCount === 'number' && takesCount > 0 && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                  takesOnly ? 'bg-primary-foreground/20' : 'bg-muted',
                )}
              >
                {takesCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Mobile toggle */}
      {onToggleTakesOnly && (
        <div className="flex justify-end pb-2 sm:hidden">
          <button
            type="button"
            onClick={() => onToggleTakesOnly(!takesOnly)}
            aria-pressed={takesOnly}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors',
              takesOnly
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border text-muted-foreground',
            )}
          >
            <Sparkles className="h-3 w-3" />
            With BuyWise Take
            {typeof takesCount === 'number' && takesCount > 0 && (
              <span className="tabular-nums">· {takesCount}</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
