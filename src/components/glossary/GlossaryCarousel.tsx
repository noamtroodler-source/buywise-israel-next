import { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { CarouselDots } from '@/components/shared/CarouselDots';
import { GlossaryTermCard } from './GlossaryTermCard';
import type { GlossaryTerm } from '@/hooks/useGlossary';

interface GlossaryCarouselProps {
  terms: GlossaryTerm[];
  savedTerms: Set<string>;
  expandedTerms: Set<string>;
  onToggleSave: (termId: string) => void;
  onToggleExpand: (termId: string) => void;
}

export function GlossaryCarousel({ 
  terms, 
  savedTerms, 
  expandedTerms, 
  onToggleSave, 
  onToggleExpand 
}: GlossaryCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: true,
    skipSnaps: false,
    containScroll: 'trimSnaps',
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback((index: number) => {
    emblaApi?.scrollTo(index);
  }, [emblaApi]);

  return (
    <div>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {terms.map((term, index) => (
            <div 
              key={term.id} 
              className="flex-[0_0_calc(100%-1.5rem)] min-w-0 pl-4 first:pl-0"
            >
              <GlossaryTermCard 
                term={term}
                isSaved={savedTerms.has(term.id)}
                isExpanded={expandedTerms.has(term.id)}
                onToggleSave={() => onToggleSave(term.id)}
                onToggleExpand={() => onToggleExpand(term.id)}
                index={index}
              />
            </div>
          ))}
        </div>
      </div>
      <CarouselDots 
        total={terms.length} 
        current={selectedIndex} 
        onDotClick={scrollTo}
        className="mt-4"
      />
    </div>
  );
}
