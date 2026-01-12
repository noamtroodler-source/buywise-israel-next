import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, BookOpen, ArrowRight, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Guide } from '@/pages/Guides';

interface GuideCardProps {
  guide: Guide;
  isHighlighted?: boolean;
}

const audienceLabels: Record<string, string> = {
  olim: 'Olim',
  investors: 'Investors',
  'first-time': 'First-Time',
  families: 'Families',
};

export function GuideCard({ guide, isHighlighted = true }: GuideCardProps) {
  const Icon = guide.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isHighlighted ? 1 : 0.4, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/guides/${guide.slug}`}>
        <div
          className={cn(
            "group relative bg-card border rounded-xl p-6 h-full flex flex-col transition-all duration-300",
            "hover:shadow-lg hover:border-primary/40",
            guide.featured && "border-primary/30 ring-1 ring-primary/10",
            !isHighlighted && "pointer-events-none"
          )}
        >
          {/* Featured Badge */}
          {guide.featured && (
            <Badge className="absolute -top-2 left-4 bg-primary text-primary-foreground border-0 shadow-sm">
              <Star className="h-3 w-3 mr-1 fill-current" />
              Essential
            </Badge>
          )}

          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <Icon className="h-6 w-6 text-primary" />
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
            {guide.title}
          </h3>

          {/* Description */}
          <p className="text-muted-foreground text-sm leading-relaxed flex-1 mb-4">
            {guide.description}
          </p>

          {/* Value Statement */}
          {guide.valueStatement && (
            <p className="text-xs text-primary font-medium mb-4 bg-primary/5 px-3 py-2 rounded-lg">
              💡 {guide.valueStatement}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {guide.readingTime} min
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {guide.chaptersCount} sections
            </span>
          </div>

          {/* Audience Tags */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {guide.audience.map((aud) => (
              <span
                key={aud}
                className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
              >
                {audienceLabels[aud] || aud}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div className="pt-4 border-t border-border">
            <span className="text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
              Start Reading
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
