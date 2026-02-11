import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface ResultCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'danger' | 'default';
  };
  variant?: 'primary' | 'default' | 'muted';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  className?: string;
}

const variantStyles = {
  primary: 'bg-primary/10 border-primary/20',
  default: 'bg-card border-border',
  muted: 'bg-muted/50 border-border',
};

const badgeVariantStyles = {
  success: 'bg-semantic-green text-semantic-green-foreground border-semantic-green',
  warning: 'bg-semantic-amber text-semantic-amber-foreground border-semantic-amber',
  danger: 'bg-semantic-red text-semantic-red-foreground border-semantic-red',
  default: 'bg-muted text-muted-foreground border-border',
};

const sizeStyles = {
  sm: { container: 'p-3', label: 'text-xs', value: 'text-lg' },
  md: { container: 'p-4', label: 'text-sm', value: 'text-2xl' },
  lg: { container: 'p-5', label: 'text-sm', value: 'text-3xl' },
};

export function ResultCard({
  label,
  value,
  sublabel,
  badge,
  variant = 'default',
  size = 'md',
  icon,
  className,
}: ResultCardProps) {
  const styles = sizeStyles[size];
  
  return (
    <div
      className={cn(
        "rounded-xl border",
        variantStyles[variant],
        styles.container,
        className
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <span className={cn("text-muted-foreground font-medium", styles.label)}>
            {label}
          </span>
        </div>
        {badge && (
          <Badge 
            variant="outline" 
            className={cn("text-xs font-medium", badgeVariantStyles[badge.variant])}
          >
            {badge.text}
          </Badge>
        )}
      </div>
      <p className={cn(
        "font-bold",
        styles.value,
        variant === 'primary' ? 'text-primary' : 'text-foreground'
      )}>
        {value}
      </p>
      {sublabel && (
        <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>
      )}
    </div>
  );
}
