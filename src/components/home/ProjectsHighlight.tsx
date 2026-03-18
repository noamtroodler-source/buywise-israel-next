import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useFeaturedProjects } from '@/hooks/useProjects';
import { ProjectFavoriteButton } from '@/components/project/ProjectFavoriteButton';
import { PropertyThumbnail } from '@/components/shared/PropertyThumbnail';

function formatPrice(price: number | null, currency: string = 'ILS') {
  if (!price) return 'Price on request';
  return new Intl.NumberFormat('en-IL', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

function ProjectCard({ project }: { project: any }) {
  return (
    <Link
      to={`/projects/${project.slug}`}
      className="group block overflow-hidden rounded-xl border border-border bg-card transition-shadow duration-300 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <PropertyThumbnail
          src={project.images?.[0]}
          alt={project.name}
          type="project"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <div className="absolute right-2.5 top-2.5 z-10">
          <ProjectFavoriteButton projectId={project.id} />
        </div>
      </div>

      <div className="p-3">
        <h3 className="truncate text-sm font-semibold text-foreground">
          {project.name}
        </h3>
        <div className="mt-0.5 flex items-center gap-1 text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <p className="truncate text-xs">
            {project.neighborhood ? `${project.neighborhood}, ` : ''}{project.city}
          </p>
        </div>
        <p className="mt-1.5 text-sm font-bold text-foreground">
          From {formatPrice(project.price_from, project.currency || 'ILS')}
        </p>
      </div>
    </Link>
  );
}

export function ProjectsHighlight() {
  const { data: projects, isLoading } = useFeaturedProjects();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    skipSnaps: false,
    containScroll: 'trimSnaps',
  });

  const displayProjects = (projects ?? []).slice(0, 8);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
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

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  if (isLoading) {
    return (
      <section className="py-6 md:py-8">
        <div className="container">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[4/3] rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (displayProjects.length === 0) return null;

  return (
    <section className="py-6 md:py-8">
      <div className="container">
        <div className="mb-4 flex items-end justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
              New Developments
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">
              Pre-construction projects with transparent pricing
            </p>
          </motion.div>

          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <button
                onClick={scrollPrev}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background transition-colors hover:bg-muted"
                aria-label="Previous"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={scrollNext}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background transition-colors hover:bg-muted"
                aria-label="Next"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <Button variant="outline" size="sm" asChild className="rounded-full">
              <Link to="/projects" className="gap-1.5">
                View All
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="-ml-3 flex md:-ml-4">
            {displayProjects.map((project) => (
              <div
                key={project.id}
                className="min-w-0 flex-[0_0_65%] pl-3 sm:flex-[0_0_45%] md:flex-[0_0_25%] md:pl-4"
              >
                <ProjectCard project={project} />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile progress bar */}
        <div className="mt-3 md:hidden">
          <div className="h-0.5 overflow-hidden rounded-full bg-border">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={false}
              animate={{ width: `${((selectedIndex + 1) / displayProjects.length) * 100}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
