import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { differenceInDays } from 'date-fns';
import { ProjectFavoriteButton } from '@/components/project/ProjectFavoriteButton';
import { ProjectShareButton } from '@/components/project/ProjectShareButton';

interface Project {
  id: string;
  name: string;
  slug: string;
  city: string;
  neighborhood?: string | null;
  images?: string[] | null;
  price_from?: number | null;
  price_to?: number | null;
  currency?: string | null;
  completion_date?: string | null;
  status?: string | null;
  developer?: {
    name: string;
    slug: string;
  } | null;
  is_featured?: boolean | null;
  created_at?: string | null;
}

interface ProjectCarouselProps {
  title: string;
  description: string;
  projects: Project[] | undefined;
  isLoading: boolean;
  viewAllLink: string;
  viewAllText?: string;
  hideStatusBadge?: boolean;
}

const formatPrice = (price: number, currency: string = 'ILS') => {
  if (currency === 'ILS') {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(price);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(price);
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'planning':
      return 'Planning';
    case 'pre_sale':
      return 'Pre-Sale';
    case 'foundation':
      return 'Foundation';
    case 'structure':
      return 'Structure';
    case 'finishing':
      return 'Finishing';
    case 'delivery':
      return 'Delivery';
    default:
      return status;
  }
};

const getStatusColor = (status: string) => {
  // All project statuses use the same teal color for unified branding
  switch (status) {
    case 'planning':
    case 'pre_sale':
    case 'foundation':
    case 'structure':
    case 'finishing':
    case 'delivery':
      return 'bg-project text-project-foreground';
    default:
      return 'bg-project text-project-foreground';
  }
};


function ProjectCard({ project, hideStatusBadge = false }: { project: Project; hideStatusBadge?: boolean }) {
  const placeholderImage = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=60';
  const [imageLoaded, setImageLoaded] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const images = project.images?.length ? project.images : [];
  const hasMultipleImages = images.length > 1;
  const currentImage = imageError ? placeholderImage : (images[currentImageIndex] || placeholderImage);

  const completionDate = project.completion_date 
    ? new Date(project.completion_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

  // Check if project is new (listed within last 7 days)
  const isNewListing = project.created_at 
    ? differenceInDays(new Date(), new Date(project.created_at)) <= 7 
    : false;

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/projects/${project.slug}`}>
        <Card className={cn(
          "overflow-hidden transition-all duration-300 group cursor-pointer rounded-xl",
          "border border-border/50 bg-white ring-1 ring-black/5 shadow-sm",
          "hover:shadow-md hover:-translate-y-1 hover:border-primary/30"
        )}>
          {/* Image Section */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl">
            {/* Loading skeleton */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-muted animate-pulse" />
            )}
             <img
               src={currentImage}
               alt={project.name}
               draggable={false}
               onDragStart={(e) => e.preventDefault()}
               className={cn(
                 "absolute inset-0 w-full h-full object-cover select-none group-hover:scale-105 transition-all duration-300",
                 imageLoaded ? "opacity-100" : "opacity-0"
               )}
               onLoad={() => setImageLoaded(true)}
               onError={() => { setImageError(true); setImageLoaded(true); }}
             />

            {/* Progress Bar - hover-only */}
            {hasMultipleImages && (
              <div className="absolute top-2 left-2 right-2 flex gap-0.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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

            {/* Action Buttons - Top Right */}
            <div className="absolute top-2 right-2 flex gap-1.5 z-10">
              {/* Share - visible on hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <ProjectShareButton
                  projectSlug={project.slug}
                  projectName={project.name}
                  className="h-7 w-7 rounded-full"
                />
              </div>
              {/* Favorite - always visible */}
              <ProjectFavoriteButton
                projectId={project.id}
                className="h-7 w-7 rounded-full bg-background/80 hover:bg-background"
              />
            </div>

            {/* Status Badge - Top Left (moved below progress bar) */}
            <div className="absolute top-6 left-2 flex gap-1.5 z-10">
              {!hideStatusBadge && project.status && (
                <Badge className={cn("text-xs font-medium", getStatusColor(project.status))}>
                  {getStatusLabel(project.status)}
                </Badge>
              )}
              {isNewListing && (
                <Badge className="bg-project text-project-foreground text-xs font-medium">
                  <Sparkles className="h-3 w-3 mr-1" />
                  New
                </Badge>
              )}
            </div>
          </div>

          {/* Content Section BELOW Image - Clean White Area */}
          <div className="p-3 bg-white border-t border-black/5">
            {project.price_from && (
              <p className="text-lg font-bold text-foreground">
                From {formatPrice(project.price_from, project.currency || 'ILS')}
              </p>
            )}
            <p className="text-xs text-muted-foreground line-clamp-1">
              {project.name}
            </p>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {project.neighborhood ? `${project.neighborhood}, ` : ''}{project.city}
              {completionDate && ` · ${completionDate}`}
            </p>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

export function ProjectCarousel({
  title,
  description,
  projects,
  isLoading,
  viewAllLink,
  viewAllText = 'View All',
  hideStatusBadge = false,
}: ProjectCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    skipSnaps: false,
    dragFree: true,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section className="py-16 md:py-20 bg-background">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6"
        >
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              {title}
            </h2>
            <p className="text-muted-foreground max-w-2xl text-sm md:text-base">
              {description}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto">
            <Button
              variant="outline"
              size="icon"
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              className="h-10 w-10 rounded-full border-border bg-background shadow-sm hover:bg-muted disabled:opacity-50"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={scrollNext}
              disabled={!canScrollNext}
              className="h-10 w-10 rounded-full border-border bg-background shadow-sm hover:bg-muted disabled:opacity-50"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            <Button asChild className="ml-4 px-5">
              <Link to={viewAllLink} className="gap-2 font-medium">
                {viewAllText}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-xl" />
            ))}
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex -ml-8">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="min-w-0 shrink-0 grow-0 basis-1/2 md:basis-1/3 lg:basis-1/4 pl-8"
                >
                  <ProjectCard project={project} hideStatusBadge={hideStatusBadge} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-xl">
            <p className="text-muted-foreground">
              No projects available at the moment.
            </p>
            <Button asChild className="mt-4">
              <Link to={viewAllLink}>Browse All Projects</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
