import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  propertyId: string;
  propertyPrice?: number;
  className?: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
}

export function FavoriteButton({ propertyId, propertyPrice, className, size = 'icon' }: FavoriteButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite, isToggling } = useFavorites();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate('/auth?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    toggleFavorite(propertyId, propertyPrice);
  };

  const favorited = isFavorite(propertyId);

  return (
    <Button
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
