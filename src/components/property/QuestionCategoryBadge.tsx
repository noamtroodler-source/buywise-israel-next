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

// Uniform blue styling for all categories (brand-compliant)
const uniformBadgeStyle = 'bg-primary/10 text-primary border border-primary/20';

const categoryConfig: Record<QuestionCategory, {
  label: string;
  icon: typeof DollarSign;
}> = {
  pricing: {
    label: 'Cost',
    icon: DollarSign,
  },
  legal: {
    label: 'Legal',
    icon: Scale,
  },
  building: {
    label: 'Building',
    icon: Building,
  },
  construction: {
    label: 'Construction',
    icon: HardHat,
  },
  neighborhood: {
    label: 'Area',
    icon: MapPin,
  },
  rental: {
    label: 'Rental',
    icon: Home,
  },
};

export function QuestionCategoryBadge({ category, className }: QuestionCategoryBadgeProps) {
  const config = categoryConfig[category as QuestionCategory];
  
  if (!config) return null;
  
  const Icon = config.icon;
  
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium',
      uniformBadgeStyle,
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
