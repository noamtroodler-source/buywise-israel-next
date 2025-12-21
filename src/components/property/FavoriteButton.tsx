import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  propertyId: string;
  className?: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
}

export function FavoriteButton({ propertyId, className, size = 'icon' }: FavoriteButtonProps) {
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

    toggleFavorite(propertyId);
  };

  const favorited = isFavorite(propertyId);

  return (
    <Button
      variant="ghost"
      size={size}
      className={cn(
        "bg-background/80 hover:bg-background transition-colors",
        favorited ? "text-destructive" : "text-muted-foreground hover:text-destructive",
        className
      )}
      onClick={handleClick}
      disabled={isToggling}
    >
      <Heart className={cn("h-4 w-4", favorited && "fill-current")} />
    </Button>
  );
}
