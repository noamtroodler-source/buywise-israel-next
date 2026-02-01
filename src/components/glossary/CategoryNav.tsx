import { motion } from 'framer-motion';
import { Star, Scale, Receipt, Landmark, Home, FileText, BookOpen } from 'lucide-react';

export const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof Scale }> = {
  legal: { label: 'Legal', icon: Scale },
  tax: { label: 'Tax & Finance', icon: Receipt },
  mortgage: { label: 'Mortgage', icon: Landmark },
  property: { label: 'Property', icon: Home },
  process: { label: 'Process', icon: FileText },
  general: { label: 'General', icon: BookOpen },
};

interface CategoryNavProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  savedCount: number;
}

export function CategoryNav({ 
  categories, 
  selectedCategory, 
  onCategoryChange, 
  savedCount 
}: CategoryNavProps) {
  const allCategories = [
    { key: 'all', label: 'All Terms', icon: BookOpen },
    { key: 'saved', label: 'Saved', icon: Star, count: savedCount },
    ...categories.map(cat => ({
      key: cat,
      label: CATEGORY_CONFIG[cat]?.label || cat,
      icon: CATEGORY_CONFIG[cat]?.icon || BookOpen,
    })),
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border py-3"
    >
      <div className="container">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          {allCategories.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.key;
            
            return (
              <button
                key={cat.key}
                onClick={() => onCategoryChange(cat.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{cat.label}</span>
                {'count' in cat && cat.count !== undefined && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-primary-foreground/20' : 'bg-primary/10 text-primary'
                  }`}>
                    {cat.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
