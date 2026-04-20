import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useNeighborhoodIllustration } from '@/hooks/useNeighborhoodIllustration';
import { cityHeroImages } from '@/lib/cityHeroImages';
import propertyFallbackImg from '@/assets/cities/hero/tel-aviv.jpg';
import projectFallbackImg from '@/assets/cities/hero/jerusalem.jpg';

// Local asset fallbacks — no external 404 risk
const FALLBACK_IMAGE = propertyFallbackImg;
const PROJECT_FALLBACK_IMAGE = projectFallbackImg;

function cityToSlug(city: string): string {
  return city
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/** Detect generic Unsplash stock photos used as placeholders for sourced listings */
function isGenericStockPhoto(url: string | null | undefined): boolean {
  if (!url) return true;
  return url.includes('images.unsplash.com/photo-');
}

interface PropertyThumbnailProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  type?: 'property' | 'project';
  city?: string | null;
  neighborhood?: string | null;
}

export function PropertyThumbnail({ 
  src, 
  alt, 
  className,
  fallbackSrc,
  type = 'property',
  city,
  neighborhood,
}: PropertyThumbnailProps) {
  const [error, setError] = useState(false);
  const illustrationUrl = useNeighborhoodIllustration(city, neighborhood);
  
  const defaultFallback = type === 'project' ? PROJECT_FALLBACK_IMAGE : FALLBACK_IMAGE;
  const cityImage = city ? cityHeroImages[cityToSlug(city)] : undefined;
  
  // Treat generic Unsplash stock photos as "no image" so illustrations take priority
  const isStock = isGenericStockPhoto(src);
  const hasRealImage = src && !error && !isStock;

  // Priority: real src -> neighborhood illustration -> city hero image -> custom fallbackSrc -> defaultFallback.
  // CRITICAL: never fall back to the original `src` if it's stock OR errored — that's how broken
  // images silently leaked through before. The local defaultFallback is the guaranteed final stop.
  const imageSrc = hasRealImage
    ? src
    : (illustrationUrl || cityImage || fallbackSrc || defaultFallback);
  
  return (
    <img
      src={imageSrc}
      alt={alt}
      className={cn("object-cover", className)}
      onError={() => setError(true)}
    />
  );
}
