import { forwardRef } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  propertyId: string;
  propertyPrice?: number;
  className?: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
}

export const FavoriteButton = forwardRef<HTMLButtonElement, FavoriteButtonProps>(
  function FavoriteButton({ propertyId, propertyPrice, className, size = 'icon' }, ref) {
    const { isFavorite, toggleFavorite, isToggling } = useFavorites();

    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Guests can now favorite - stored in sessionStorage
      toggleFavorite(propertyId, propertyPrice);
    };

    const favorited = isFavorite(propertyId);

    return (
      <Button
        ref={ref}
        variant="ghost"
        size={size}
        className={cn(
          "h-8 w-8 rounded-md bg-background/80 hover:bg-background transition-colors",
          favorited ? "text-primary" : "text-muted-foreground hover:text-primary",
          className
        )}
        onClick={handleClick}
        disabled={isToggling}
      >
        <Heart className={cn("h-4 w-4", favorited && "fill-current")} />
      </Button>
    );
  }
);
