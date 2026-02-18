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
          'px-4 py-2 rounded-lg text-sm font-medium transition-all flex flex-col items-center leading-tight',
          cycle === 'annual'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <span>Annual</span>
        <span className={cn('text-[11px] font-semibold', cycle === 'annual' ? 'text-primary' : 'text-primary/60')}>
          Save 20%
        </span>
      </button>
    </div>
  );
}
