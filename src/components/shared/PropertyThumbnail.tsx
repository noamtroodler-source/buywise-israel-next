import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useNeighborhoodIllustration } from '@/hooks/useNeighborhoodIllustration';
import { cityHeroImages } from '@/lib/cityHeroImages';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&auto=format&fit=crop&q=60';
const PROJECT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&auto=format&fit=crop&q=60';

function cityToSlug(city: string): string {
  return city
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
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
  
  // Priority: src -> neighborhood illustration -> city hero image -> fallbackSrc -> defaultFallback
  const imageSrc = (!src || error) 
    ? (illustrationUrl || cityImage || fallbackSrc || defaultFallback) 
    : src;
  
  return (
    <img
      src={imageSrc}
      alt={alt}
      className={cn("object-cover", className)}
      onError={() => setError(true)}
    />
  );
}
