import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import { 
  ChevronLeft, ChevronRight, Share2, Heart, Building, 
  MapPin, Home, Calendar, Eye, ArrowLeft, CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFormatPrice } from '@/contexts/PreferencesContext';
import { Project } from '@/types/projects';

interface ProjectHeroProps {
  project: Project & { construction_progress_percent?: number };
  onShare?: () => void;
  onSave?: () => void;
  isSaved?: boolean;
}

export function ProjectHero({ project, onShare, onSave, isSaved = false }: ProjectHeroProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps' });
  const formatPrice = useFormatPrice();

  const images = project.images?.length 
    ? project.images 
    : ['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920'];

  const scrollPrev = useCallback(() => {
    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const scrollNext = useCallback(() => {
    setSelectedImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  useEffect(() => {
    if (emblaApi) {
      emblaApi.scrollTo(selectedImageIndex);
    }
  }, [emblaApi, selectedImageIndex]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning': return 'Planning Phase';
      case 'pre_sale': return 'Pre-Sale';
      case 'under_construction': return 'Under Construction';
      case 'completed': return 'Ready to Move In';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-muted text-muted-foreground';
      case 'pre_sale': return 'bg-accent text-accent-foreground';
      case 'under_construction': return 'bg-primary text-primary-foreground';
      case 'completed': return 'bg-green-600 text-white';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare();
    } else if (navigator.share) {
      navigator.share({
        title: project.name,
        text: `Check out ${project.name} - New development in ${project.city}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Back Button */}
      <Button variant="ghost" size="sm" className="gap-2 -ml-2" asChild>
        <Link to="/projects">
          <ArrowLeft className="h-4 w-4" />
          All Projects
        </Link>
      </Button>

      {/* Main Image */}
      <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-muted">
        <img
          src={images[selectedImageIndex]}
          alt={`${project.name} - Image ${selectedImageIndex + 1}`}
          className="w-full h-full object-cover"
        />
        
        {/* Overlay Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
            onClick={handleShare}
          >
            <Share2 className="h-5 w-5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className={`h-10 w-10 rounded-full backdrop-blur-sm ${
              isSaved ? 'bg-primary text-primary-foreground' : 'bg-background/80 hover:bg-background'
            }`}
            onClick={onSave}
          >
            <Heart className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
          </Button>
        </div>

        {/* Status & Featured Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          <Badge className={getStatusColor(project.status || 'planning')}>
            {getStatusLabel(project.status || 'planning')}
          </Badge>
          {project.is_featured && (
            <Badge className="bg-accent text-accent-foreground">Featured</Badge>
          )}
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm"
              onClick={scrollPrev}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm"
              onClick={scrollNext}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}

        {/* Image Counter */}
        <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium">
          {selectedImageIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImageIndex(index)}
                className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                  index === selectedImageIndex
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img src={image} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Project Info */}
      <div className="space-y-4">
        {/* Price */}
        <div className="space-y-1">
          <span className="text-sm text-muted-foreground">Starting from</span>
          <p className="text-3xl font-bold text-primary">
            {formatPrice(project.price_from || 0, project.currency || 'ILS')}
            {project.price_to && (
              <span className="text-lg font-normal text-muted-foreground ml-2">
                – {formatPrice(project.price_to, project.currency || 'ILS')}
              </span>
            )}
          </p>
        </div>

        {/* Title & Developer */}
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{project.name}</h1>
          {project.developer && (
            <Link 
              to={`/developers/${project.developer.slug}`}
              className="inline-flex items-center gap-1.5 text-primary hover:underline"
            >
              <span>by {project.developer.name}</span>
              {project.developer.is_verified && (
                <CheckCircle className="h-4 w-4" />
              )}
            </Link>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>
            {project.address && `${project.address}, `}
            {project.neighborhood && `${project.neighborhood}, `}
            {project.city}
          </span>
        </div>

        {/* Activity Indicators */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{project.views_count || 0} views</span>
          </div>
        </div>

        {/* Key Stats Bar */}
        <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-xl border border-border/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Units</p>
              <p className="font-semibold">{project.total_units || 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Completion</p>
              <p className="font-semibold">
                {project.completion_date 
                  ? new Date(project.completion_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                  : 'TBD'}
              </p>
            </div>
          </div>
          {project.construction_progress_percent !== undefined && (
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Progress</p>
                <p className="font-semibold">{project.construction_progress_percent}%</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}