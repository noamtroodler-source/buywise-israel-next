import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, Heart, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';

interface FullscreenGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: string[];
  initialIndex?: number;
  title: string;
  subtitle?: string;
  onSave?: () => void;
  onShare?: () => void;
  isSaved?: boolean;
}

export function FullscreenGallery({
  open,
  onOpenChange,
  images,
  initialIndex = 0,
  title,
  subtitle,
  onSave,
  onShare,
  isSaved = false,
}: FullscreenGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    startIndex: initialIndex,
    loop: true 
  });

  // Sync embla with currentIndex
  useEffect(() => {
    if (emblaApi) {
      emblaApi.scrollTo(currentIndex);
    }
  }, [emblaApi, currentIndex]);

  // Listen to embla scroll events
  useEffect(() => {
    if (!emblaApi) return;
    
    const onSelect = () => {
      setCurrentIndex(emblaApi.selectedScrollSnap());
    };
    
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  // Reset to initial index when opening
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
    }
  }, [open, initialIndex]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        scrollPrev();
      } else if (e.key === 'ArrowRight') {
        scrollNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, scrollPrev, scrollNext]);

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!images.length) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-none w-screen h-screen p-0 bg-black/95 border-0 rounded-none [&>button]:hidden"
      >
        <div className="relative flex flex-col h-full">
          {/* Header */}
          <header className="flex-shrink-0 flex items-center justify-between px-4 md:px-8 h-16 border-b border-white/10">
            {/* Left: Back to listing */}
            <button
              onClick={handleClose}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Back to listing</span>
            </button>

            {/* Center: Photos tab */}
            <div className="flex flex-col items-center">
              <span className="text-white font-medium text-sm md:text-base">Photos</span>
              <div className="h-0.5 w-10 bg-primary mt-1 rounded-full" />
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 md:gap-4">
              {onSave && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSave}
                  className={`text-white/80 hover:text-white hover:bg-white/10 ${
                    isSaved ? 'text-primary' : ''
                  }`}
                >
                  <Heart className={`h-5 w-5 mr-0 md:mr-2 ${isSaved ? 'fill-current' : ''}`} />
                  <span className="hidden md:inline">{isSaved ? 'Saved' : 'Save'}</span>
                </Button>
              )}
              {onShare && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onShare}
                  className="text-white/80 hover:text-white hover:bg-white/10"
                >
                  <Share2 className="h-5 w-5 mr-0 md:mr-2" />
                  <span className="hidden md:inline">Share</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="text-white/80 hover:text-white hover:bg-white/10 md:hidden"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </header>

          {/* Main Image Area */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            {/* Embla Carousel */}
            <div className="w-full h-full overflow-hidden" ref={emblaRef}>
              <div className="flex h-full">
                {images.map((image, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 w-full h-full flex items-center justify-center px-4 md:px-20 py-4"
                  >
                    <img
                      src={image}
                      alt={`${title} - Image ${index + 1}`}
                      className="max-h-full max-w-full object-contain rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={scrollPrev}
                  className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/40 hover:bg-black/60 text-white border border-white/20"
                >
                  <ChevronLeft className="h-7 w-7" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={scrollNext}
                  className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/40 hover:bg-black/60 text-white border border-white/20"
                >
                  <ChevronRight className="h-7 w-7" />
                </Button>
              </>
            )}

            {/* Image Counter */}
            <div className="absolute top-4 right-4 md:right-8 bg-black/60 text-white px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm">
              {currentIndex + 1} of {images.length}
            </div>
          </div>

          {/* Bottom Summary Bar */}
          <footer className="flex-shrink-0 h-14 md:h-16 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm border-t border-white/10">
            <p className="text-white/90 text-sm md:text-base text-center truncate max-w-4xl">
              {subtitle || title}
            </p>
          </footer>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex-shrink-0 px-4 md:px-8 py-3 bg-black/60 border-t border-white/10 overflow-x-auto">
              <div className="flex gap-2 justify-center">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`flex-shrink-0 w-16 h-12 md:w-20 md:h-14 rounded-lg overflow-hidden transition-all ${
                      index === currentIndex
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-black'
                        : 'opacity-50 hover:opacity-80'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
