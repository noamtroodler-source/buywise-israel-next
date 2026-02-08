import { cn } from '@/lib/utils';

interface CategoryToggleProps {
  value: 'buy' | 'rent';
  onChange: (value: 'buy' | 'rent') => void;
  buyCount?: number;
  rentCount?: number;
  className?: string;
}

export function CategoryToggle({ 
  value, 
  onChange, 
  buyCount, 
  rentCount,
  className 
}: CategoryToggleProps) {
  return (
    <div className={cn(
      "inline-flex items-center rounded-full border border-border/50 bg-muted/30 p-1",
      className
    )}>
      <button
        type="button"
        className={cn(
          "px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 rounded-full",
          value === 'buy' 
            ? "bg-primary text-primary-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground"
        )}
        onClick={() => onChange('buy')}
      >
        Buy
        {buyCount !== undefined && (
          <span className={cn(
            "text-xs px-1.5 py-0.5 rounded-full",
            value === 'buy' ? "bg-primary-foreground/20" : "bg-muted"
          )}>
            {buyCount}
          </span>
        )}
      </button>
      <button
        type="button"
        className={cn(
          "px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 rounded-full",
          value === 'rent' 
            ? "bg-primary text-primary-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground"
        )}
        onClick={() => onChange('rent')}
      >
        Rent
        {rentCount !== undefined && (
          <span className={cn(
            "text-xs px-1.5 py-0.5 rounded-full",
            value === 'rent' ? "bg-primary-foreground/20" : "bg-muted"
          )}>
            {rentCount}
          </span>
        )}
      </button>
    </div>
  );
}