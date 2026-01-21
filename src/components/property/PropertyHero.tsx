import { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { FullscreenGallery } from '@/components/shared/FullscreenGallery';

interface PropertyHeroProps {
  property: {
    id: string;
    title: string;
    listing_status: string;
    images?: string[] | null;
    is_featured?: boolean;
    price?: number;
    currency?: string;
    bedrooms?: number | null;
    bathrooms?: number | null;
    size_sqm?: number | null;
  };
  onSave?: () => void;
  onShare?: () => void;
  isSaved?: boolean;
}

export function PropertyHero({ property, onSave, onShare, isSaved }: PropertyHeroProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
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

  // Format subtitle for gallery
  const formatGallerySubtitle = () => {
    const parts: string[] = [];
    
    const statusLabel = statusLabels[property.listing_status] || property.listing_status;
    parts.push(statusLabel);
    
    if (property.price) {
      const currency = property.currency === 'USD' ? '$' : '₪';
      parts.push(`${currency}${property.price.toLocaleString()}`);
    }
    
    const details: string[] = [];
    if (property.bedrooms) details.push(`${property.bedrooms} beds`);
    if (property.bathrooms) details.push(`${property.bathrooms} baths`);
    if (property.size_sqm) details.push(`${property.size_sqm} sqm`);
    
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
        transition={{ duration: 0.4 }}
        className="w-full"
      >
        {/* Main Image */}
        <div className="relative w-full">
          <div 
            className="relative aspect-[16/10] rounded-xl overflow-hidden bg-muted cursor-pointer group"
            onClick={handleImageClick}
          >
              <img 
                src={images[selectedImageIndex]} 
                alt={property.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
              
              {/* Click hint overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none" />
              
              {/* Status Badge */}
              <div className="absolute top-4 left-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
                <Badge className="text-sm px-3 py-1.5 bg-background/90 text-foreground backdrop-blur-sm border-0">
                  {statusLabels[property.listing_status] || property.listing_status}
                </Badge>
              </div>

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background disabled:opacity-50"
                    onClick={(e) => handleNavClick(e, scrollPrev)}
                    disabled={selectedImageIndex === 0}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background disabled:opacity-50"
                    onClick={(e) => handleNavClick(e, scrollNext)}
                    disabled={selectedImageIndex === images.length - 1}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              )}


              {/* Progress Bar Indicator - Bottom of image */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-4 right-20 flex gap-1 z-10" onClick={(e) => e.stopPropagation()}>
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(index); }}
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

      {/* Fullscreen Gallery */}
      <FullscreenGallery
        open={isGalleryOpen}
        onOpenChange={setIsGalleryOpen}
        images={images}
        initialIndex={selectedImageIndex}
        title={property.title}
        subtitle={formatGallerySubtitle()}
        onSave={onSave}
        onShare={onShare}
        isSaved={isSaved}
      />
    </>
  );
}
