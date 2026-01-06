import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, MapPin, Calendar, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

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
    case 'under_construction':
      return 'Under Construction';
    case 'completed':
      return 'Completed';
    default:
      return status;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pre_sale':
      return 'bg-project text-project-foreground';
    case 'under_construction':
      return 'bg-project text-project-foreground';
    case 'planning':
      return 'bg-project/70 text-project-foreground';
    case 'completed':
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

function ProjectCard({ project, hideStatusBadge = false }: { project: Project; hideStatusBadge?: boolean }) {
  const placeholderImage = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=60';
  
  const completionDate = project.completion_date 
    ? new Date(project.completion_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/projects/${project.slug}`}>
        <Card className="overflow-hidden hover:shadow-card-hover transition-all duration-300 group cursor-pointer">
          <div className="relative aspect-[4/3] overflow-hidden">
            <img
              src={project.images?.[0] || placeholderImage}
              alt={project.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {!hideStatusBadge && project.status && (
              <div className="absolute top-3 left-3 flex gap-2">
                <Badge className={cn("text-xs font-medium", getStatusColor(project.status))}>
                  {getStatusLabel(project.status)}
                </Badge>
              </div>
            )}
          </div>

          <CardContent className="p-4 space-y-3">
            {/* Price Range */}
            {project.price_from && (
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-foreground">
                  From {formatPrice(project.price_from, project.currency || 'ILS')}
                </span>
              </div>
            )}

            {/* Project Name */}
            <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {project.name}
            </h3>

            {/* Location */}
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm line-clamp-1">
                {project.neighborhood ? `${project.neighborhood}, ` : ''}{project.city}
              </span>
            </div>

            {/* Details */}
            <div className="flex items-center gap-4 pt-2 border-t border-border">
              {project.developer && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span className="text-sm line-clamp-1">{project.developer.name}</span>
                </div>
              )}
              {completionDate && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">{completionDate}</span>
                </div>
              )}
            </div>
          </CardContent>
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
    <section className="py-10">
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
            <Button variant="default" asChild className="ml-2 px-5">
              <Link to={viewAllLink} className="gap-2">
                {viewAllText}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex -ml-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="min-w-0 shrink-0 grow-0 basis-full md:basis-1/2 lg:basis-1/3 pl-4"
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
