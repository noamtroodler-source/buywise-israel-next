import { useSimilarProjects } from '@/hooks/useSimilarProjects';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, MapPin, Building2, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

interface Project {
  id: string;
  name: string;
  slug: string;
  city: string;
  neighborhood?: string | null;
  price_from?: number | null;
  images?: string[] | null;
  status?: string | null;
  completion_date?: string | null;
  available_units?: number | null;
}

interface SimilarProjectsProps {
  currentProject: Project | null | undefined;
}

const formatPrice = (price: number) => {
  if (price >= 1000000) {
    return `₪${(price / 1000000).toFixed(1)}M`;
  }
  return `₪${(price / 1000).toFixed(0)}K`;
};

const getStatusLabel = (status: string | null | undefined) => {
  switch (status) {
    case 'pre_sale': return 'Pre-Sale';
    case 'under_construction': return 'Under Construction';
    case 'completed': return 'Ready to Move';
    case 'planning': return 'Coming Soon';
    default: return 'New Project';
  }
};

export function SimilarProjects({ currentProject }: SimilarProjectsProps) {
  const { data: projects, isLoading } = useSimilarProjects(currentProject);
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    align: 'start',
    containScroll: 'trimSnaps',
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    
    const onSelect = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };

    emblaApi.on('select', onSelect);
    onSelect();

    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  if (!isLoading && (!projects || projects.length === 0)) {
    return null;
  }

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="mt-12"
    >
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">Similar New Projects</h2>
          <p className="text-muted-foreground text-sm mt-0.5 md:mt-1">
            Other developments in {currentProject?.city}
          </p>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className="h-8 w-8 md:h-9 md:w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={scrollNext}
            disabled={!canScrollNext}
            className="h-8 w-8 md:h-9 md:w-9"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Edge-to-edge carousel on mobile */}
      <div className="-mx-4 md:mx-0 px-4 md:px-0 overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="min-w-0 shrink-0 grow-0 basis-full md:basis-1/2 lg:basis-1/3 pl-4">
                <Skeleton className="h-[280px] w-full rounded-xl" />
              </div>
            ))
          ) : (
            projects?.map((project) => (
              <div key={project.id} className="min-w-0 shrink-0 grow-0 basis-full md:basis-1/2 lg:basis-1/3 pl-4">
                <Link to={`/projects/${project.slug}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                    <div className="relative h-40">
                      <img
                        src={project.images?.[0] || '/placeholder.svg'}
                        alt={project.name}
                        className="w-full h-full object-cover"
                      />
                      <Badge className="absolute top-2 left-2 bg-primary/90">
                        {getStatusLabel(project.status)}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground line-clamp-1">{project.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{project.neighborhood || project.city}</span>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="font-bold text-primary">
                          {project.price_from ? `From ${formatPrice(project.price_from)}` : 'Price TBA'}
                        </span>
                        {project.completion_date && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(project.completion_date).getFullYear()}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 text-center">
        <Button variant="outline" asChild>
          <Link to={`/projects?city=${currentProject?.city}`}>
            <Building2 className="h-4 w-4 mr-2" />
            View All Projects in {currentProject?.city}
          </Link>
        </Button>
      </div>
    </motion.section>
  );
}
