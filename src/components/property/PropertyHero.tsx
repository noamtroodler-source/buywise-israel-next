import { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';

interface PropertyHeroProps {
  property: {
    id: string;
    title: string;
    listing_status: string;
    images?: string[] | null;
    is_featured?: boolean;
  };
  onSave?: () => void;
  onShare?: () => void;
  isSaved?: boolean;
}

export function PropertyHero({ property }: PropertyHeroProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true
  });
  
  const images = property.images?.length 
    ? property.images 
    : ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200'];

  const scrollPrev = useCallback(() => {
    if (selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  }, [selectedImageIndex]);

  const scrollNext = useCallback(() => {
    if (selectedImageIndex < images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  }, [selectedImageIndex, images.length]);

  // Scroll thumbnail carousel to keep selected image visible
  useEffect(() => {
    if (emblaApi) {
      emblaApi.scrollTo(selectedImageIndex);
    }
  }, [emblaApi, selectedImageIndex]);

  const statusLabels: Record<string, string> = {
    for_sale: 'For Sale',
    for_rent: 'For Rent',
    sold: 'Sold',
    rented: 'Rented',
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      {/* Main Image */}
      <div className="relative w-full">
        <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-muted">
            <img 
              src={images[selectedImageIndex]} 
              alt={property.title}
              className="w-full h-full object-cover"
            />
            
            {/* Status Badge */}
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge className="text-sm px-3 py-1.5 bg-background/90 text-foreground backdrop-blur-sm border-0">
                {statusLabels[property.listing_status] || property.listing_status}
              </Badge>
              {property.is_featured && (
                <Badge variant="default" className="text-sm px-3 py-1.5 bg-accent text-accent-foreground">
                  Featured
                </Badge>
              )}
            </div>

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background disabled:opacity-50"
                  onClick={scrollPrev}
                  disabled={selectedImageIndex === 0}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background disabled:opacity-50"
                  onClick={scrollNext}
                  disabled={selectedImageIndex === images.length - 1}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}

            {/* Image Counter */}
            <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5">
              <Camera className="h-4 w-4" />
              {selectedImageIndex + 1} / {images.length}
            </div>

            {/* Progress Bar Indicator - Bottom of image */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-4 right-20 flex gap-1 z-10">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-1 h-1 rounded-full transition-colors duration-200 ${
                      index === selectedImageIndex 
                        ? "bg-white" 
                        : "bg-white/40 hover:bg-white/60"
                    }`}
                    aria-label={`View image ${index + 1}`}
                  />
                ))}
              </div>
            )}
        </div>
      </div>

      {/* Horizontal Thumbnail Carousel */}
      {images.length > 1 && (
        <div className="mt-3">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImageIndex(i)}
                  className={`flex-shrink-0 relative w-20 h-14 md:w-24 md:h-16 rounded-lg overflow-hidden transition-all ${
                    selectedImageIndex === i 
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' 
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
