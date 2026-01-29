import { LucideIcon, Sparkles, Users, TrendingUp, ShieldCheck, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

type HintVariant = 'popular' | 'recommended' | 'expert-tip' | 'first-time' | 'custom';

interface ToolGuidanceHintProps {
  variant?: HintVariant;
  message?: string;
  icon?: LucideIcon;
  className?: string;
}

const variantConfig: Record<HintVariant, { icon: LucideIcon; defaultMessage: string; colorClass: string }> = {
  'popular': {
    icon: Users,
    defaultMessage: "Most buyers start here — it's the foundation for everything else.",
    colorClass: 'bg-primary/8 border-primary/15 text-primary',
  },
  'recommended': {
    icon: Sparkles,
    defaultMessage: "We recommend this early in your journey.",
    colorClass: 'bg-primary/8 border-primary/15 text-primary',
  },
  'first-time': {
    icon: ShieldCheck,
    defaultMessage: "Especially helpful if this is your first time buying in Israel.",
    colorClass: 'bg-primary/8 border-primary/15 text-primary',
  },
  'expert-tip': {
    icon: Lightbulb,
    defaultMessage: "Pro tip: Run this before speaking to a mortgage broker.",
    colorClass: 'bg-muted border-border text-muted-foreground',
  },
  'custom': {
    icon: Lightbulb,
    defaultMessage: '',
    colorClass: 'bg-muted border-border text-muted-foreground',
  },
};

/**
 * A warm, professional contextual hint that makes tools feel like 
 * a trusted guide rather than a dashboard.
 */
export function ToolGuidanceHint({
  variant = 'popular',
  message,
  icon,
  className,
}: ToolGuidanceHintProps) {
  const config = variantConfig[variant];
  const Icon = icon || config.icon;
  const displayMessage = message || config.defaultMessage;

  if (!displayMessage) return null;

  return (
    <div
      className={cn(
        'flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg border text-sm',
        config.colorClass,
        className
      )}
    >
      <Icon className="h-4 w-4 shrink-0 mt-0.5" />
      <span className="leading-relaxed">{displayMessage}</span>
    </div>
  );
}

/**
 * Inline hint for tool cards on the tools listing page
 */
export function ToolCardHint({ hint, className }: { hint: string; className?: string }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-xs text-primary font-medium',
      className
    )}>
      <Users className="h-3 w-3" />
      {hint}
    </span>
  );
}
