import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useFeaturedProjects } from '@/hooks/useProjects';
import { ProjectFavoriteButton } from '@/components/project/ProjectFavoriteButton';
import { PropertyThumbnail } from '@/components/shared/PropertyThumbnail';
import { useMediaQuery } from '@/hooks/useMediaQuery';

function formatPrice(price: number | null, currency: string = 'ILS') {
  if (!price) return 'Price on request';
  return new Intl.NumberFormat('en-IL', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

function ProjectCard({ project, variant = 'default' }: {
  project: any;
  variant?: 'hero' | 'default';
}) {
  const isHero = variant === 'hero';

  return (
    <Link
      to={`/projects/${project.slug}`}
      className="group relative block h-full overflow-hidden rounded-xl md:rounded-2xl"
    >
      <div className="absolute inset-0">
        <PropertyThumbnail
          src={project.images?.[0]}
          alt={project.name}
          type="project"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/30 to-foreground/10" />

      <div className="absolute right-3 top-3 z-10">
        <ProjectFavoriteButton projectId={project.id} />
      </div>

      <div className={`absolute inset-x-0 bottom-0 ${isHero ? 'p-4 md:p-5' : 'p-3.5 md:p-4'}`}>
        {project.developer && typeof project.developer === 'object' && isHero && (
          <span className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-white/75">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {project.developer.name}
          </span>
        )}

        <h3 className={`mb-1 leading-tight text-white ${isHero ? 'text-xl md:text-2xl font-bold' : 'text-base md:text-lg font-semibold'}`}>
          {project.name}
        </h3>

        <div className="mb-2 flex items-center gap-1.5 text-white/80">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <p className="truncate text-sm">
            {project.neighborhood ? `${project.neighborhood}, ` : ''}{project.city}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className={`text-white ${isHero ? 'text-base md:text-lg font-semibold' : 'text-sm md:text-base font-medium'}`}>
            From {formatPrice(project.price_from, project.currency || 'ILS')}
          </p>

          <span className="inline-flex h-8 w-8 translate-x-2 items-center justify-center rounded-full bg-background/15 text-white opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ProjectsHighlight() {
  const { data: projects, isLoading } = useFeaturedProjects();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: true,
    skipSnaps: false,
    containScroll: 'trimSnaps',
  });

  const displayProjects = (projects ?? []).slice(0, isDesktop ? 3 : 4);
  const heroProject = displayProjects[0];
  const sideProjects = displayProjects.slice(1, 3);

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
      <section className="py-8 md:py-10">
        <div className="container">
          <div className="grid gap-4 lg:grid-cols-12">
            <Skeleton className="aspect-[16/10] rounded-xl md:rounded-2xl lg:col-span-7" />
            <div className="hidden gap-4 lg:grid lg:col-span-5">
              <Skeleton className="aspect-[16/9] rounded-xl md:rounded-2xl" />
              <Skeleton className="aspect-[16/9] rounded-xl md:rounded-2xl" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (displayProjects.length === 0) return null;

  return (
    <section className="py-8 md:py-10">
      <div className="container">
        <div className="mb-5 flex items-end justify-between gap-4 md:mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              New Developments
            </h2>
            <p className="mt-1 text-sm text-muted-foreground md:text-base">
              Pre-construction projects with transparent pricing
            </p>
          </motion.div>

          <div className="flex items-center gap-2">
            {!isDesktop && displayProjects.length > 1 && (
              <div className="mr-1 flex gap-1.5">
                <button
                  onClick={scrollPrev}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background hover:bg-muted transition-colors"
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={scrollNext}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background hover:bg-muted transition-colors"
                  aria-label="Next"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            <Button variant="outline" asChild className="rounded-full">
              <Link to="/projects" className="gap-2">
                View All
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>

        {!isDesktop && (
          <div className="-mx-4 lg:hidden">
            <div className="overflow-hidden px-4" ref={emblaRef}>
              <div className="flex">
                {displayProjects.map((project) => (
                  <div
                    key={project.id}
                    className="min-w-0 flex-[0_0_calc(100%-2rem)] pl-4 first:pl-4 sm:flex-[0_0_calc(50%-1rem)]"
                  >
                    <div className="aspect-[16/10]">
                      <ProjectCard project={project} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 px-4">
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
        )}

        {isDesktop && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="hidden items-stretch gap-4 lg:grid lg:grid-cols-12"
          >
            {heroProject && (
              <div className="aspect-[2/1] lg:col-span-7">
                <ProjectCard project={heroProject} variant="hero" />
              </div>
            )}

            {sideProjects.length > 0 && (
              <div className="grid gap-4 lg:col-span-5">
                {sideProjects.map((project) => (
                  <div key={project.id} className="aspect-[16/9]">
                    <ProjectCard project={project} />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}
