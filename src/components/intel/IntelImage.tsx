import { ImageOff } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  src?: string | null;
  alt: string;
  className?: string;
  aspect?: 'video' | 'square' | 'wide';
  rounded?: boolean;
}

/** Image with graceful fallback. Hot-linked from source (zero-storage policy). */
export function IntelImage({ src, alt, className, aspect = 'video', rounded = false }: Props) {
  const [errored, setErrored] = useState(false);
  const aspectClass =
    aspect === 'square' ? 'aspect-square'
    : aspect === 'wide' ? 'aspect-[21/9]'
    : 'aspect-[16/9]';

  if (!src || errored) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted text-muted-foreground/40',
          aspectClass,
          rounded && 'rounded-md',
          className,
        )}
      >
        <ImageOff className="h-6 w-6" aria-hidden />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'overflow-hidden bg-muted',
        aspectClass,
        rounded && 'rounded-md',
        className,
      )}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setErrored(true)}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
      />
    </div>
  );
}
