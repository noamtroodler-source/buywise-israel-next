import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPin, Building, Calendar, Eye, Share2, Heart, CheckCircle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFormatPrice } from '@/contexts/PreferencesContext';
import { Project, Developer } from '@/types/projects';

interface ProjectQuickSummaryProps {
  project: Project & { construction_progress_percent?: number; featured_highlight?: string | null };
  developer?: Developer | null;
  onShare?: () => void;
  onSave?: () => void;
  isSaved?: boolean;
}

export function ProjectQuickSummary({ 
  project, 
  developer,
  onShare, 
  onSave, 
  isSaved = false 
}: ProjectQuickSummaryProps) {
  const formatPrice = useFormatPrice();

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning': return { label: 'Planning Phase', className: '' };
      case 'pre_sale': return { label: 'Pre-Sale', className: '' };
      case 'under_construction': return { label: 'Under Construction', className: 'bg-semantic-amber/10 text-semantic-amber border-semantic-amber/20' };
      case 'completed': return { label: 'Ready to Move In', className: 'bg-semantic-green/10 text-semantic-green border-semantic-green/20' };
      default: return { label: status, className: '' };
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare();
    } else if (navigator.share) {
      navigator.share({
        title: project.name,
        text: `Check out ${project.name} - New development in ${project.city}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-4"
    >
      {/* Price & Actions Row */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <span className="text-sm text-muted-foreground">Starting from</span>
          <p className="text-3xl font-bold text-primary">
            {formatPrice(project.price_from || 0, project.currency || 'ILS')}
            {project.price_to && (
              <span className="text-lg font-normal text-muted-foreground ml-2">
                – {formatPrice(project.price_to, project.currency || 'ILS')}
              </span>
            )}
          </p>
        </div>
        
        {/* Desktop Actions */}
        <div className="hidden sm:flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10"
            onClick={handleShare}
          >
            <Share2 className="h-5 w-5" />
          </Button>
          <Button
            variant={isSaved ? "default" : "outline"}
            size="icon"
            className="h-10 w-10"
            onClick={onSave}
          >
            <Heart className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Title & Developer */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">{project.name}</h1>
        {developer && (
          <Link 
            to={`/developers/${developer.slug}`}
            className="inline-flex items-center gap-1.5 text-primary hover:underline"
          >
            <span>by {developer.name}</span>
            {developer.is_verified && (
              <CheckCircle className="h-4 w-4" />
            )}
          </Link>
        )}
      </div>

      {/* Location */}
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <MapPin className="h-4 w-4" />
        <span>
          {project.address && `${project.address}, `}
          {project.neighborhood && `${project.neighborhood}, `}
          {project.city}
        </span>
      </div>

      {/* Featured Selling Point */}
      {project.featured_highlight && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 border-l-2 border-primary/40 pl-3"
        >
          <Star className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{project.featured_highlight}</span>
        </motion.div>
      )}

      {/* Key Stats Bar - 2-column grid on mobile, flex on larger */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-4 sm:gap-6 py-3 sm:py-4 border-y border-border">
        <div className="text-center">
          <p className="text-lg sm:text-xl font-semibold">
            {project.available_units 
              ? `${project.available_units}/${project.total_units || 0}` 
              : project.total_units || 0}
          </p>
          <p className="text-xs text-muted-foreground">
            {project.available_units ? 'Units Left' : 'Units'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-lg sm:text-xl font-semibold">
            {project.completion_date 
              ? new Date(project.completion_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
              : 'TBD'}
          </p>
          <p className="text-xs text-muted-foreground">Completion</p>
        </div>
        {project.construction_progress_percent !== undefined && project.construction_progress_percent > 0 && (
          <div className="text-center">
            <p className="text-lg sm:text-xl font-semibold">{project.construction_progress_percent}%</p>
            <p className="text-xs text-muted-foreground">Progress</p>
          </div>
        )}
        <div className="text-center flex items-center justify-center">
          {(() => {
            const statusInfo = getStatusLabel(project.status || 'planning');
            return (
              <Badge variant="outline" className={`font-medium text-xs sm:text-sm ${statusInfo.className}`}>
                {statusInfo.label}
              </Badge>
            );
          })()}
        </div>
      </div>

      {/* Activity Indicators */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Eye className="h-4 w-4" />
          <span>{project.views_count || 0} views</span>
        </div>
      </div>
    </motion.div>
  );
}
