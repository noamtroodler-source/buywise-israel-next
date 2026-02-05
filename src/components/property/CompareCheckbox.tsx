import { forwardRef } from 'react';
import { Check } from 'lucide-react';
import { useCompare, CompareCategory } from '@/contexts/CompareContext';
import { cn } from '@/lib/utils';

interface CompareCheckboxProps {
  propertyId: string;
  category: CompareCategory;
  className?: string;
}

/**
 * An always-visible checkbox for adding properties to compare.
 * Shows in the top-left corner of property cards on the Favorites page.
 */
export const CompareCheckbox = forwardRef<HTMLButtonElement, CompareCheckboxProps>(
  function CompareCheckbox({ propertyId, category, className }, ref) {
    const { addToCompare, removeFromCompare, isInCompare } = useCompare();
    const isSelected = isInCompare(propertyId);

    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (isSelected) {
        removeFromCompare(propertyId);
      } else {
        addToCompare(propertyId, category);
      }
    };

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        className={cn(
          "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200",
          isSelected 
            ? "bg-primary border-primary text-primary-foreground" 
            : "bg-white/90 border-muted-foreground/40 hover:border-primary hover:bg-white",
          className
        )}
        aria-label={isSelected ? "Remove from compare" : "Add to compare"}
      >
        {isSelected && <Check className="h-4 w-4" strokeWidth={3} />}
      </button>
    );
  }
);
