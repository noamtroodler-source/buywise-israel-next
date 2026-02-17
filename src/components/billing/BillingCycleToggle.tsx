import { cn } from '@/lib/utils';

interface BillingCycleToggleProps {
  cycle: 'monthly' | 'annual';
  onChange: (cycle: 'monthly' | 'annual') => void;
}

export function BillingCycleToggle({ cycle, onChange }: BillingCycleToggleProps) {
  return (
    <div className="inline-flex items-center rounded-xl bg-muted p-1 gap-1">
      <button
        type="button"
        onClick={() => onChange('monthly')}
        className={cn(
          'px-4 py-2 rounded-lg text-sm font-medium transition-all',
          cycle === 'monthly'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onChange('annual')}
        className={cn(
          'px-4 py-2 rounded-lg text-sm font-medium transition-all relative',
          cycle === 'annual'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Annual
        <span className="ml-1.5 inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-semibold">
          Save 20%
        </span>
      </button>
    </div>
  );
}
