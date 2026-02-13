import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Building2, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CarouselDots } from '@/components/shared/CarouselDots';
import { useFeaturedProjects } from '@/hooks/useProjects';
import { ProjectFavoriteButton } from '@/components/project/ProjectFavoriteButton';
import { ProjectShareButton } from '@/components/project/ProjectShareButton';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useTouchSwipe } from '@/hooks/useTouchSwipe';
import { cn } from '@/lib/utils';

function formatPrice(price: number | null, currency: string = 'ILS') {
  if (!price) return 'Price on request';
  return new Intl.NumberFormat('en-IL', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

const PLACEHOLDER = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=60';

/** Reusable image carousel for project highlight cards */
function ProjectImageCarousel({
  images,
  alt,
  aspectClass = 'aspect-[16/10]',
}: {
  images: string[];
  alt: string;
  aspectClass?: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(true);
  const [imageError, setImageError] = useState(false);

  const hasMultiple = images.length > 1;
  const currentImage = imageError ? PLACEHOLDER : (images[currentIndex] || PLACEHOLDER);

  const goToPrev = useCallback(() => {
    setImageLoaded(false);
    setImageError(false);
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setImageLoaded(false);
    setImageError(false);
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const touchHandlers = useTouchSwipe({
    onSwipeLeft: hasMultiple ? goToNext : undefined,
    onSwipeRight: hasMultiple ? goToPrev : undefined,
    threshold: 30,
  });

  return (
    <div className={cn(aspectClass, "overflow-hidden relative")} {...touchHandlers}>
      {!imageLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse z-[1]" />
      )}
      <img
        src={currentImage}
        alt={alt}
        loading="lazy"
        decoding="async"
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        className={cn(
          "w-full h-full object-cover select-none group-hover:scale-105 transition-all duration-500",
          imageLoaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => setImageLoaded(true)}
        onError={() => { setImageError(true); setImageLoaded(true); }}
      />

      {/* Progress Bar */}
      {hasMultiple && (
        <div className="absolute bottom-2 left-2 right-2 flex gap-0.5 z-10 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentIndex(index);
              }}
              className={cn(
                "flex-1 h-1 rounded-full transition-colors duration-200",
                index === currentIndex ? "bg-white" : "bg-white/30"
              )}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Navigation Arrows */}
      {hasMultiple && (
        <>
          <button
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); goToPrev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/80 hover:bg-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md z-10"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-4 w-4 text-foreground" />
          </button>
          <button
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); goToNext(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/80 hover:bg-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md z-10"
            aria-label="Next image"
          >
            <ChevronRight className="h-4 w-4 text-foreground" />
          </button>
        </>
      )}
    </div>
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
  const mainProject = displayProjects[0];
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

  const scrollTo = useCallback((index: number) => {
    emblaApi?.scrollTo(index);
  }, [emblaApi]);

  if (isLoading) {
    return (
      <section className="py-10 md:py-14">
        <div className="container">
          <div className="lg:hidden">
            <Skeleton className="aspect-[16/9] rounded-lg" />
          </div>
          <div className="hidden lg:grid lg:grid-cols-5 gap-4">
            <Skeleton className="lg:col-span-3 aspect-[16/9] rounded-lg" />
            <div className="lg:col-span-2 space-y-3">
              <Skeleton className="aspect-[16/7] rounded-lg" />
              <Skeleton className="aspect-[16/7] rounded-lg" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (displayProjects.length === 0) return null;

  return (
    <section className="py-10 md:py-14">
      <div className="container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-2 text-primary mb-1">
              <Building2 className="h-5 w-5" />
              <span className="text-sm font-medium">New Construction</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-bold text-foreground">
              New Developments
            </h2>
            <p className="text-base text-muted-foreground mt-1 max-w-lg">
              Pre-construction projects with transparent pricing
            </p>
          </motion.div>

          <Button variant="outline" asChild>
            <Link to="/projects" className="gap-2">
              View All
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {/* Mobile/Tablet: Horizontal Carousel */}
        {!isDesktop && (
          <div className="lg:hidden animate-fade-in -mx-4">
            <div className="overflow-hidden px-4" ref={emblaRef}>
              <div className="flex">
                {displayProjects.map((project) => (
                  <div 
                    key={project.id} 
                    className="flex-[0_0_calc(100%-2rem)] sm:flex-[0_0_calc(50%-1rem)] min-w-0 pl-4 first:pl-4"
                  >
                    <Link
                      to={`/projects/${project.slug}`}
                      className="group block relative overflow-hidden rounded-xl bg-card border border-border shadow-card hover:shadow-card-hover transition-all duration-300"
                    >
                      <ProjectImageCarousel
                        images={project.images || []}
                        alt={project.name}
                        aspectClass="aspect-[16/10]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent pointer-events-none" />
                      
                      <div className="absolute top-3 right-3 flex gap-1.5 z-10">
                        <ProjectShareButton projectSlug={project.slug} projectName={project.name} />
                        <ProjectFavoriteButton projectId={project.id} />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 pointer-events-none">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-primary text-primary-foreground text-xs">New Project</Badge>
                          {project.developer && (
                            <span className="text-xs text-white/80 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              {typeof project.developer === 'object' ? project.developer.name : 'Verified'}
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">{project.name}</h3>
                        <p className="text-sm text-white/80 mb-2">
                          {project.neighborhood ? `${project.neighborhood}, ` : ''}{project.city}
                        </p>
                        <p className="text-base font-semibold text-white">
                          From {formatPrice(project.price_from, project.currency || 'ILS')}
                        </p>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-4">
              <CarouselDots total={displayProjects.length} current={selectedIndex} onDotClick={scrollTo} className="mt-4" />
            </div>
          </div>
        )}

        {/* Desktop: Bento Grid */}
        {isDesktop && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="hidden lg:grid lg:grid-cols-5 gap-4"
          >
            {mainProject && (
              <Link
                to={`/projects/${mainProject.slug}`}
                className="lg:col-span-3 group relative overflow-hidden rounded-xl bg-card border border-border shadow-card hover:shadow-card-hover transition-all duration-300"
              >
                <ProjectImageCarousel
                  images={mainProject.images || []}
                  alt={mainProject.name}
                  aspectClass="aspect-[16/9]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent pointer-events-none" />
                
                <div className="absolute top-3 right-3 flex gap-1.5 z-10">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <ProjectShareButton projectSlug={mainProject.slug} projectName={mainProject.name} />
                  </div>
                  <ProjectFavoriteButton projectId={mainProject.id} />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5 pb-6 md:pb-7 pointer-events-none">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-primary text-primary-foreground text-xs">New Project</Badge>
                    {mainProject.developer && (
                      <span className="text-xs text-white/80 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {typeof mainProject.developer === 'object' ? mainProject.developer.name : 'Verified'}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-1">{mainProject.name}</h3>
                  <p className="text-sm text-white/80 mb-2">
                    {mainProject.neighborhood ? `${mainProject.neighborhood}, ` : ''}{mainProject.city}
                  </p>
                  <p className="text-base font-semibold text-white">
                    From {formatPrice(mainProject.price_from, mainProject.currency || 'ILS')}
                  </p>
                </div>
              </Link>
            )}

            <div className="lg:col-span-2 space-y-3">
              {sideProjects.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.slug}`}
                  className="group block relative overflow-hidden rounded-lg bg-card border border-border shadow-card hover:shadow-card-hover transition-all duration-300"
                >
                  <ProjectImageCarousel
                    images={project.images || []}
                    alt={project.name}
                    aspectClass="aspect-[16/7]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent pointer-events-none" />
                  
                  <div className="absolute top-2 right-2 flex gap-1.5 z-10">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <ProjectShareButton projectSlug={project.slug} projectName={project.name} />
                    </div>
                    <ProjectFavoriteButton projectId={project.id} />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 pb-5 pointer-events-none">
                    <Badge className="bg-primary/90 text-primary-foreground mb-1.5 text-xs">New Project</Badge>
                    <h3 className="text-base font-bold text-white">{project.name}</h3>
                    <p className="text-xs text-white/80">
                      {project.city} • From {formatPrice(project.price_from, project.currency || 'ILS')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
