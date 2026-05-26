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
}

export function IntelBeatTabs({ active, onChange }: Props) {
  return (
    <nav
      className="-mx-4 overflow-x-auto border-b border-border px-4"
      aria-label="Beat tabs"
    >
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
  );
}
