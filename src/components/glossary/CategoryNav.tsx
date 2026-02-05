import { motion } from 'framer-motion';
import { Scale, Receipt, Landmark, Home, FileText, BookOpen } from 'lucide-react';

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
    { key: 'all', label: 'All' },
    { key: 'saved', label: 'Saved', count: savedCount },
    ...categories.map(cat => ({
      key: cat,
      label: CATEGORY_CONFIG[cat]?.label || cat,
    })),
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border py-2"
    >
      <div className="container">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
          {allCategories.map((cat) => {
            const isActive = selectedCategory === cat.key;
            
            return (
              <button
                key={cat.key}
                onClick={() => onCategoryChange(cat.key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {cat.label}
                {'count' in cat && cat.count !== undefined && cat.count > 0 && (
                  <span className={`ml-1.5 text-xs ${
                    isActive ? 'opacity-80' : 'text-primary'
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
