import { cn } from '@/lib/utils';
import { 
  DollarSign, 
  Scale, 
  Building, 
  HardHat, 
  MapPin,
  Home
} from 'lucide-react';

type QuestionCategory = 'pricing' | 'legal' | 'building' | 'construction' | 'neighborhood' | 'rental';

interface QuestionCategoryBadgeProps {
  category: string;
  className?: string;
}

const categoryConfig: Record<QuestionCategory, {
  label: string;
  icon: typeof DollarSign;
  className: string;
}> = {
  pricing: {
    label: 'Cost',
    icon: DollarSign,
    className: 'bg-primary/10 text-primary',
  },
  legal: {
    label: 'Legal',
    icon: Scale,
    className: 'bg-muted text-muted-foreground',
  },
  building: {
    label: 'Building',
    icon: Building,
    className: 'bg-primary/5 text-primary/80',
  },
  construction: {
    label: 'Construction',
    icon: HardHat,
    className: 'bg-muted text-foreground/70',
  },
  neighborhood: {
    label: 'Area',
    icon: MapPin,
    className: 'bg-primary/10 text-primary',
  },
  rental: {
    label: 'Rental',
    icon: Home,
    className: 'bg-muted text-muted-foreground',
  },
};

export function QuestionCategoryBadge({ category, className }: QuestionCategoryBadgeProps) {
  const config = categoryConfig[category as QuestionCategory];
  
  if (!config) return null;
  
  const Icon = config.icon;
  
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium',
      config.className,
      className
    )}>
      <Icon className="h-2.5 w-2.5" />
      {config.label}
    </span>
  );
}

export function getCategoryLabel(category: string): string {
  return categoryConfig[category as QuestionCategory]?.label || category;
}
