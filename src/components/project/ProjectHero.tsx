import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, Share2, Heart, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Project } from '@/types/projects';
import { FullscreenGallery } from '@/components/shared/FullscreenGallery';
import { useFormatPrice } from '@/contexts/PreferencesContext';

interface ProjectHeroProps {
  project: Project;
  onShare?: () => void;
  onSave?: () => void;
  isSaved?: boolean;
}

export function ProjectHero({ project, onShare, onSave, isSaved = false }: ProjectHeroProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
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

  // Format subtitle for gallery
  const formatGallerySubtitle = () => {
    const parts: string[] = [];
    
    parts.push('New Development');
    
    if (project.price_from) {
      const priceText = project.price_to 
        ? `From ${formatPrice(project.price_from, project.currency || 'ILS')}`
        : formatPrice(project.price_from, project.currency || 'ILS');
      parts.push(priceText);
    }
    
    const details: string[] = [];
    if (project.city) details.push(project.city);
    if (project.total_units) details.push(`${project.total_units} units`);
    
    if (details.length) {
      parts.push(`(${details.join(', ')})`);
    }
    
    return parts.join(': ');
  };

  const handleImageClick = () => {
    setIsGalleryOpen(true);
  };

  const handleNavClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <>
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
        <div 
          className="relative aspect-[16/10] rounded-xl overflow-hidden bg-muted cursor-pointer group"
          onClick={handleImageClick}
        >
          <img
            src={images[selectedImageIndex]}
            alt={`${project.name} - Image ${selectedImageIndex + 1}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          
          {/* Click hint overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none" />
          
          {/* Overlay Actions */}
          <div className="absolute top-4 right-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="secondary"
              size="icon"
              className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={(e) => { e.stopPropagation(); handleShare(); }}
            >
              <Share2 className="h-5 w-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className={`h-10 w-10 rounded-full backdrop-blur-sm ${
                isSaved ? 'bg-primary text-primary-foreground' : 'bg-background/80 hover:bg-background'
              }`}
              onClick={(e) => { e.stopPropagation(); onSave?.(); }}
            >
              <Heart className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
            </Button>
          </div>

          {/* Status & Featured Badges */}
          <div className="absolute top-4 left-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
            <Badge className={getStatusColor(project.status || 'planning')}>
              {getStatusLabel(project.status || 'planning')}
            </Badge>
          </div>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm"
                onClick={(e) => handleNavClick(e, scrollPrev)}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm"
                onClick={(e) => handleNavClick(e, scrollNext)}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}

          {/* Image Counter */}
          <div 
            className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium"
            onClick={(e) => e.stopPropagation()}
          >
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

        {/* Progress Dots */}
        {images.length > 1 && (
          <div className="flex justify-center gap-1.5 pt-2">
            {images.length <= 8 ? (
              images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === selectedImageIndex
                      ? 'w-6 bg-primary'
                      : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                />
              ))
            ) : (
              <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${((selectedImageIndex + 1) / images.length) * 100}%` }}
                />
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Fullscreen Gallery */}
      <FullscreenGallery
        open={isGalleryOpen}
        onOpenChange={setIsGalleryOpen}
        images={images}
        initialIndex={selectedImageIndex}
        title={project.name}
        subtitle={formatGallerySubtitle()}
        onSave={onSave}
        onShare={handleShare}
        isSaved={isSaved}
      />
    </>
  );
}
