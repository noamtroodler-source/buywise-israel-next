import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, Heart, MapPin, ExternalLink, Calendar, HardHat, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface CompareProject {
  id: string;
  name: string;
  slug: string;
  city: string;
  neighborhood: string | null;
  status: string;
  price_from: number | null;
  price_to: number | null;
  currency: string;
  completion_date: string | null;
  construction_progress_percent: number | null;
  total_units: number;
  images: string[] | null;
  amenities: string[] | null;
  developer?: {
    id: string;
    name: string;
  };
}

interface CompareProjectCardProps {
  project: CompareProject;
  formatPrice: (price: number, currency?: string) => string;
  isFavorite: boolean;
  onRemove: () => void;
  onToggleFavorite: () => void;
  winnerBadge?: string | null;
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'planning': return 'Planning';
    case 'pre_sale': return 'Pre-Sale';
    case 'foundation': return 'Foundation';
    case 'structure': return 'Structure';
    case 'finishing': return 'Finishing';
    case 'delivery': return 'Ready';
    default: return status;
  }
};

export function CompareProjectCard({
  project,
  formatPrice,
  isFavorite,
  onRemove,
  onToggleFavorite,
  winnerBadge,
}: CompareProjectCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="group relative bg-card rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Image Section */}
      <div className="relative aspect-[16/10]">
        <img
          src={project.images?.[0] || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800'}
          alt={project.name}
          className="w-full h-full object-cover"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Top Actions */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          {/* Winner Badge */}
          {winnerBadge && (
            <Badge className="bg-primary text-primary-foreground font-medium">
              {winnerBadge}
            </Badge>
          )}
          {!winnerBadge && <div />}

          {/* Action Buttons */}
          <div className="flex gap-1.5">
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full bg-background/90 hover:bg-background shadow-sm"
              onClick={onToggleFavorite}
            >
              <Heart 
                className={`h-4 w-4 transition-colors ${
                  isFavorite ? 'fill-primary text-primary' : ''
                }`} 
              />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full bg-background/90 hover:bg-destructive hover:text-destructive-foreground shadow-sm transition-colors"
              onClick={onRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Price Overlay */}
        <div className="absolute bottom-3 left-3 right-3">
          <div className="text-lg text-white/80">Starting from</div>
          <div className="text-2xl font-bold text-white drop-shadow-lg">
            {project.price_from ? formatPrice(project.price_from, project.currency || 'ILS') : 'Price TBD'}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div>
          <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
            {project.name}
          </h3>
          {project.developer && (
            <p className="text-sm text-muted-foreground">by {project.developer.name}</p>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-1">
            {project.neighborhood ? `${project.neighborhood}, ` : ''}{project.city}
          </span>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <Badge variant="secondary">{getStatusLabel(project.status)}</Badge>
            {project.construction_progress_percent !== null && (
              <span className="text-muted-foreground flex items-center gap-1">
                <HardHat className="h-3.5 w-3.5" />
                {project.construction_progress_percent}%
              </span>
            )}
          </div>
          {project.construction_progress_percent !== null && (
            <Progress value={project.construction_progress_percent} className="h-1.5" />
          )}
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4 text-sm">
          {project.completion_date && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{new Date(project.completion_date).getFullYear()}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Home className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{project.available_units ?? '—'} / {project.total_units ?? '—'}</span>
          </div>
        </div>

        {/* View Button */}
        <Button asChild variant="outline" size="sm" className="w-full mt-2">
          <Link to={`/projects/${project.slug}`}>
            View Project
            <ExternalLink className="h-3.5 w-3.5 ml-2" />
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}
