import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, BookOpen, ArrowRight, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Guide } from '@/pages/Guides';

interface GuideCardProps {
  guide: Guide;
  index?: number;
}

export function GuideCard({ guide, index = 0 }: GuideCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link to={`/guides/${guide.slug}`}>
        <div
          className={cn(
            "group relative bg-card border rounded-2xl overflow-hidden h-full flex flex-col transition-all duration-300",
            "hover:shadow-lg hover:border-primary/30"
          )}
        >
          {/* Image */}
          <div className="relative aspect-[16/10] overflow-hidden">
            <img
              src={guide.image}
              alt={guide.title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Featured Badge */}
            {guide.featured && (
              <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground border-0 shadow-sm">
                <Star className="h-3 w-3 mr-1 fill-current" />
                Essential
              </Badge>
            )}
          </div>

          {/* Content */}
          <div className="p-5 flex flex-col flex-1">
            {/* Title */}
            <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
              {guide.title}
            </h3>

            {/* Description */}
            <p className="text-muted-foreground text-sm leading-relaxed flex-1 line-clamp-2 mb-4">
              {guide.description}
            </p>

            {/* Meta Info */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {guide.readingTime} min
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  {guide.chaptersCount} sections
                </span>
              </div>
              
              {/* CTA */}
              <span className="text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                Read
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
