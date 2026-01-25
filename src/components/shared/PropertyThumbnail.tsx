import { useState } from 'react';
import { cn } from '@/lib/utils';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&auto=format&fit=crop&q=60';
const PROJECT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&auto=format&fit=crop&q=60';

interface PropertyThumbnailProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  type?: 'property' | 'project';
}

export function PropertyThumbnail({ 
  src, 
  alt, 
  className,
  fallbackSrc,
  type = 'property'
}: PropertyThumbnailProps) {
  const [error, setError] = useState(false);
  
  const defaultFallback = type === 'project' ? PROJECT_FALLBACK_IMAGE : FALLBACK_IMAGE;
  const imageSrc = (!src || error) ? (fallbackSrc || defaultFallback) : src;
  
  return (
    <img
      src={imageSrc}
      alt={alt}
      className={cn("object-cover", className)}
      onError={() => setError(true)}
    />
  );
}
