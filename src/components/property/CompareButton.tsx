import { forwardRef } from 'react';
import { GitCompare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompare, CompareCategory } from '@/contexts/CompareContext';
import { cn } from '@/lib/utils';

interface CompareButtonProps {
  propertyId: string;
  category: CompareCategory;
  className?: string;
}

export const CompareButton = forwardRef<HTMLButtonElement, CompareButtonProps>(
  function CompareButton({ propertyId, category, className }, ref) {
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
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className={cn(
        "bg-background/80 hover:bg-background transition-colors",
        isSelected 
          ? "text-primary" 
          : "text-muted-foreground hover:text-primary",
        className
      )}
    >
      <GitCompare className={cn("h-4 w-4", isSelected && "fill-current")} />
    </Button>
  );
});
