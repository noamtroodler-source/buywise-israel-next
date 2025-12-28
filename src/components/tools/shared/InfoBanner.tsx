import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Info, Lightbulb, AlertTriangle } from 'lucide-react';

interface InfoBannerProps {
  children: ReactNode;
  variant?: 'info' | 'tip' | 'warning';
  className?: string;
}

const variantStyles = {
  info: {
    container: 'bg-primary/5 border-primary/20 text-foreground',
    icon: Info,
    iconClass: 'text-primary',
  },
  tip: {
    container: 'bg-accent/10 border-accent/30 text-foreground',
    icon: Lightbulb,
    iconClass: 'text-accent-foreground',
  },
  warning: {
    container: 'bg-warning/10 border-warning/30 text-foreground',
    icon: AlertTriangle,
    iconClass: 'text-warning-foreground',
  },
};

export function InfoBanner({ children, variant = 'info', className }: InfoBannerProps) {
  const styles = variantStyles[variant];
  const IconComponent = styles.icon;

  return (
    <div className={cn(
      "flex items-start gap-3 rounded-lg border p-4",
      styles.container,
      className
    )}>
      <IconComponent className={cn("h-5 w-5 mt-0.5 flex-shrink-0", styles.iconClass)} />
      <div className="text-sm">{children}</div>
    </div>
  );
}
