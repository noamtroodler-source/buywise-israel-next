import { cn } from '@/lib/utils';

interface CarouselDotsProps {
  total: number;
  current: number;
  onDotClick?: (index: number) => void;
  className?: string;
}

export function CarouselDots({ total, current, onDotClick, className }: CarouselDotsProps) {
  if (total <= 1) return null;

  return (
    <div className={cn("flex justify-center gap-1.5", className)}>
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          onClick={() => onDotClick?.(index)}
          aria-label={`Go to slide ${index + 1}`}
          aria-current={index === current ? 'true' : undefined}
          className={cn(
            "w-2 h-2 rounded-full transition-colors duration-200",
            index === current 
              ? "bg-primary" 
              : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
          )}
        />
      ))}
    </div>
  );
}
