import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Home, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ProjectFavoriteButton } from '@/components/project/ProjectFavoriteButton';
import { ProjectShareButton } from '@/components/project/ProjectShareButton';
import { useTouchSwipe } from '@/hooks/useTouchSwipe';

interface ProjectCardProps {
  project: {
    id: string;
    slug: string;
    name: string;
    city: string;
    neighborhood?: string | null;
    images?: string[] | null;
    status: string;
    price_from: number | null;
    completion_date?: string | null;
    developer?: { name: string } | null;
    original_price_from?: number | null;
  };
  onClick?: () => void;
}

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=60';

// Calculate progress based on stage position (6 stages total)
function getStageProgress(status: string): number {
  const stages = ['planning', 'pre_sale', 'foundation', 'structure', 'finishing', 'delivery'];
  const stageIndex = stages.findIndex(s => s === status);
  if (stageIndex === -1) return 0;
  return Math.round(((stageIndex + 1) / stages.length) * 100);
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'planning': return 'Planning Phase';
    case 'pre_sale': return 'Pre-Sale';
    case 'foundation': return 'Foundation';
    case 'structure': return 'Structure';
    case 'finishing': return 'Finishing';
    case 'delivery': return 'Ready for Move-In';
    default: return status;
  }
}

function formatPrice(price: number | null): string {
  if (!price) return 'N/A';
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(price);
}

function getUnitTypeLabel(priceFrom: number | null): string {
  const p = priceFrom || 0;
  if (p < 2000000) return '2-3 Room';
  if (p < 3500000) return '3-4 Room';
  return '4-5 Room';
}

function isPriceReduced(project: ProjectCardProps['project']): boolean {
  const originalPrice = (project as any).original_price_from;
  return !!(originalPrice && project.price_from && project.price_from < originalPrice);
}

function getPriceDropPercent(project: ProjectCardProps['project']): number {
  const originalPrice = (project as any).original_price_from;
  if (!originalPrice || !project.price_from) return 0;
  return Math.round(((originalPrice - project.price_from) / originalPrice) * 100);
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(true);
  const [imageError, setImageError] = useState(false);

  const images = project.images?.length ? project.images : [];
  const hasMultipleImages = images.length > 1;
  const currentImage = imageError ? PLACEHOLDER_IMAGE : (images[currentImageIndex] || PLACEHOLDER_IMAGE);

  const goToPrevImage = useCallback(() => {
    setImageLoaded(false);
    setImageError(false);
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goToNextImage = useCallback(() => {
    setImageLoaded(false);
    setImageError(false);
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    goToPrevImage();
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    goToNextImage();
  };

  const touchHandlers = useTouchSwipe({
    onSwipeLeft: hasMultipleImages ? goToNextImage : undefined,
    onSwipeRight: hasMultipleImages ? goToPrevImage : undefined,
    threshold: 30,
  });

  const priceReduced = isPriceReduced(project);
  const dropPercent = getPriceDropPercent(project);

  return (
    <div className="animate-fade-in">
      <Link to={`/projects/${project.slug}`} onClick={onClick}>
        <Card className="h-full overflow-hidden border border-border/60 shadow-sm hover:shadow-card-hover hover:border-primary/30 transition-all duration-300 group">
          <div className="aspect-[16/10] overflow-hidden relative" {...touchHandlers}>
            {/* Loading skeleton */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-muted animate-pulse" />
            )}
            <img
              src={currentImage}
              alt={project.name}
              loading="lazy"
              decoding="async"
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              className={cn(
                "w-full h-full object-cover select-none group-hover:scale-105 transition-all duration-300",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(true);
              }}
            />

            {/* Progress Bar - Bottom of image, always visible on mobile */}
            {hasMultipleImages && (
              <div className="absolute bottom-2 left-2 right-2 flex gap-0.5 z-10 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    className={cn(
                      "flex-1 h-1 rounded-full transition-colors duration-200",
                      index === currentImageIndex
                        ? "bg-white"
                        : "bg-white/30"
                    )}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Image Navigation Arrows */}
            {hasMultipleImages && (
              <>
                <button
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/80 hover:bg-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-4 w-4 text-foreground" />
                </button>
                <button
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/80 hover:bg-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md z-10"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-4 w-4 text-foreground" />
                </button>
              </>
            )}

            {/* Badges - Top Left */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
              {priceReduced && dropPercent >= 2 && (
                <Badge className="bg-green-600 text-white text-xs font-medium gap-1">
                  <TrendingDown className="h-3 w-3" />
                  -{dropPercent}%
                </Badge>
              )}
            </div>

            {/* Action Buttons - Top Right */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <ProjectShareButton projectSlug={project.slug} projectName={project.name} />
              </div>
              <ProjectFavoriteButton projectId={project.id} />
            </div>
          </div>

          <CardContent className="p-5 space-y-3">
            <div className="space-y-1">
              <h2 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {project.name}
              </h2>
              {project.developer && (
                <p className="text-sm text-primary font-medium">
                  by {project.developer.name}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="line-clamp-1">
                {project.neighborhood ? `${project.neighborhood}, ` : ''}{project.city}
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Home className="h-4 w-4" />
                <span>{getUnitTypeLabel(project.price_from)} Units</span>
              </div>
              {project.completion_date && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(project.completion_date).getFullYear()}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {getStatusLabel(project.status)}
                </span>
                <span className="font-medium text-primary">
                  {getStageProgress(project.status)}%
                </span>
              </div>
              <Progress
                value={getStageProgress(project.status)}
                className="h-1.5"
              />
            </div>

            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">Starting from</p>
              <p className="text-xl font-bold text-primary">
                {formatPrice(project.price_from)}
              </p>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
