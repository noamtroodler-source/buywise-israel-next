import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GuideCTACardProps {
  guideSlug: string;
  title: string;
  description: string;
  className?: string;
}

/**
 * A specialized CTA card for linking to guides.
 * Uses consistent BookOpen icon and styling across all tools.
 */
export function GuideCTACard({
  guideSlug,
  title,
  description,
  className,
}: GuideCTACardProps) {
  return (
    <Link
      to={`/guides/${guideSlug}`}
      className={cn(
        "group p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all",
        className
      )}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <BookOpen className="h-5 w-5" />
        </div>
        <p className="font-semibold group-hover:text-primary transition-colors">{title}</p>
      </div>
      <p className="text-sm text-muted-foreground">
        {description}
      </p>
    </Link>
  );
}
