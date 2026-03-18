import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, MapPin, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  variant?: 'hero' | 'default' 
}) {
  const isHero = variant === 'hero';
  
  return (
    <Link
      to={`/projects/${project.slug}`}
      className="group relative block overflow-hidden rounded-2xl h-full"
    >
      {/* Image */}
      <div className="absolute inset-0">
        <PropertyThumbnail
          src={project.images?.[0]}
          alt={project.name}
          type="project"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
      </div>
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
      
      {/* Favorite */}
      <div className="absolute top-3 right-3 z-10">
        <ProjectFavoriteButton projectId={project.id} />
      </div>
      
      {/* Content */}
      <div className={`absolute bottom-0 left-0 right-0 ${isHero ? 'p-6 md:p-8' : 'p-4 md:p-5'}`}>
        {/* Developer tag */}
        {project.developer && typeof project.developer === 'object' && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white/70 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {project.developer.name}
          </span>
        )}
        
        <h3 className={`font-bold text-white mb-1.5 leading-tight ${isHero ? 'text-2xl md:text-3xl' : 'text-lg'}`}>
          {project.name}
        </h3>
        
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <span className="inline-flex items-center gap-1 text-sm text-white/80">
            <MapPin className="h-3.5 w-3.5" />
            {project.neighborhood ? `${project.neighborhood}, ` : ''}{project.city}
          </span>
          {isHero && project.completion_date && (
            <span className="inline-flex items-center gap-1 text-sm text-white/80">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(project.completion_date).getFullYear()}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className={`font-semibold text-white ${isHero ? 'text-lg' : 'text-base'}`}>
            From {formatPrice(project.price_from, project.currency || 'ILS')}
          </p>
          
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
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

  const displayProjects = projects?.slice(0, 6) || [];
  const heroProject = displayProjects[0];
  const gridProjects = displayProjects.slice(1, 5);

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
      <section className="py-12 md:py-16">
        <div className="container">
          <div className="flex gap-4">
            <Skeleton className="flex-1 aspect-[4/3] rounded-2xl" />
            <div className="hidden lg:grid grid-cols-2 gap-4 flex-1">
              <Skeleton className="aspect-[4/3] rounded-2xl" />
              <Skeleton className="aspect-[4/3] rounded-2xl" />
              <Skeleton className="aspect-[4/3] rounded-2xl" />
              <Skeleton className="aspect-[4/3] rounded-2xl" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (displayProjects.length === 0) return null;

  return (
    <section className="py-12 md:py-16">
      <div className="container">
        {/* Header */}
        <div className="flex items-end justify-between gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              New Developments
            </h2>
            <p className="text-muted-foreground mt-1.5">
              Pre-construction projects with transparent pricing
            </p>
          </motion.div>

          <div className="flex items-center gap-2">
            {/* Mobile carousel controls */}
            {!isDesktop && displayProjects.length > 1 && (
              <div className="flex gap-1.5 mr-2">
                <button
                  onClick={scrollPrev}
                  className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={scrollNext}
                  className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
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

        {/* Mobile: Carousel */}
        {!isDesktop && (
          <div className="lg:hidden -mx-4">
            <div className="overflow-hidden px-4" ref={emblaRef}>
              <div className="flex">
                {displayProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex-[0_0_calc(100%-2rem)] sm:flex-[0_0_calc(50%-1rem)] min-w-0 pl-4 first:pl-4"
                  >
                    <div className="aspect-[3/4] sm:aspect-[4/5]">
                      <ProjectCard project={project} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Progress bar */}
            <div className="px-4 mt-4">
              <div className="h-0.5 bg-border rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={false}
                  animate={{
                    width: `${((selectedIndex + 1) / displayProjects.length) * 100}%`,
                  }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Desktop: Hero + Grid Layout */}
        {isDesktop && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="hidden lg:grid lg:grid-cols-2 gap-4"
          >
            {/* Hero project - left side, full height */}
            {heroProject && (
              <div className="row-span-2 min-h-[360px]">
                <ProjectCard project={heroProject} variant="hero" />
              </div>
            )}

            {/* 4 smaller projects - 2x2 grid on right */}
            {gridProjects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="aspect-[16/10]"
              >
                <ProjectCard project={project} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
