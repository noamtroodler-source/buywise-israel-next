import { memo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Building2, CalendarCheck } from 'lucide-react';
import { Project } from '@/types/projects';
import { PropertyThumbnail } from '@/components/shared/PropertyThumbnail';
import { ProjectFavoriteButton } from '@/components/project/ProjectFavoriteButton';
import { CarouselDots } from '@/components/shared/CarouselDots';
import { Badge } from '@/components/ui/badge';
import { useFormatPrice } from '@/contexts/PreferencesContext';
import { cn } from '@/lib/utils';

interface MapProjectCardProps {
  project: Project;
  isHovered?: boolean;
  onHover?: () => void;
  onHoverEnd?: () => void;
}

export const MapProjectCard = memo(function MapProjectCard({
  project,
  isHovered,
  onHover,
  onHoverEnd,
}: MapProjectCardProps) {
  const formatPrice = useFormatPrice();
  const [imageIndex, setImageIndex] = useState(0);
  const [isCardHovered, setIsCardHovered] = useState(false);

  const images = project.images?.length ? project.images : [null];
  const totalImages = images.length;

  const prevImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageIndex(i => (i - 1 + totalImages) % totalImages);
  }, [totalImages]);

  const nextImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageIndex(i => (i + 1) % totalImages);
  }, [totalImages]);

  const priceDisplay = project.price_from
    ? `From ${formatPrice(project.price_from, project.currency)}`
    : 'Contact for pricing';

  const completionYear = project.completion_date
    ? new Date(project.completion_date).getFullYear()
    : null;

  const stats = [
    project.available_units > 0 ? `${project.available_units} units available` : null,
    completionYear ? `Est. ${completionYear}` : null,
  ].filter(Boolean).join(' · ');

  const location = [project.neighborhood, project.city].filter(Boolean).join(', ');

  return (
    <Link
      to={`/projects/${project.slug}`}
      className={cn(
        "group block rounded-lg border bg-card overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        isHovered ? "border-primary ring-2 ring-primary/30" : "border-border"
      )}
      onMouseEnter={() => { setIsCardHovered(true); onHover?.(); }}
      onMouseLeave={() => { setIsCardHovered(false); onHoverEnd?.(); }}
    >
      {/* Image section */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <PropertyThumbnail
          src={images[imageIndex]}
          alt={project.name}
          className="w-full h-full"
        />

        {/* Favorite */}
        <div className="absolute top-2 right-2 z-10">
          <ProjectFavoriteButton projectId={project.id} />
        </div>

        {/* Badge */}
        <div className="absolute top-2 left-2 z-10">
          <Badge className="text-xs gap-1 bg-emerald-500/90 text-white border-emerald-500/90 backdrop-blur-sm">
            <Building2 className="h-3 w-3" />
            New Development
          </Badge>
        </div>

        {/* Carousel arrows */}
        {totalImages > 1 && isCardHovered && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 z-10 h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4 text-foreground" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10 h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4 text-foreground" />
            </button>
          </>
        )}

        {/* Dots */}
        {totalImages > 1 && (
          <div className="absolute bottom-2 left-0 right-0 z-10">
            <CarouselDots
              total={Math.min(totalImages, 5)}
              current={imageIndex % Math.min(totalImages, 5)}
            />
          </div>
        )}
      </div>

      {/* Info section */}
      <div className="p-3 space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-foreground">{priceDisplay}</span>
        </div>

        <p className="text-sm font-medium text-foreground truncate">{project.name}</p>

        {stats && (
          <p className="text-sm text-muted-foreground">{stats}</p>
        )}

        <p className="text-sm text-foreground truncate">{location}</p>
      </div>
    </Link>
  );
});
