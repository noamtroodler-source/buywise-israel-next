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
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  legal: {
    label: 'Legal',
    icon: Scale,
    className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  building: {
    label: 'Building',
    icon: Building,
    className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  },
  construction: {
    label: 'Construction',
    icon: HardHat,
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  neighborhood: {
    label: 'Area',
    icon: MapPin,
    className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  },
  rental: {
    label: 'Rental',
    icon: Home,
    className: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
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
