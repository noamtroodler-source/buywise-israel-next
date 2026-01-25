import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, Heart, Bed, Bath, Maximize, MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Property } from '@/types/database';
import { PropertyThumbnail } from '@/components/shared/PropertyThumbnail';

interface ComparePropertyCardProps {
  property: Property;
  formatPrice: (price: number, currency?: string) => string;
  formatArea: (sqm: number) => string;
  isFavorite: boolean;
  onRemove: () => void;
  onToggleFavorite: () => void;
  winnerBadge?: string | null;
}

export function ComparePropertyCard({
  property,
  formatPrice,
  formatArea,
  isFavorite,
  onRemove,
  onToggleFavorite,
  winnerBadge,
}: ComparePropertyCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="group relative bg-card rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Image Section */}
      <div className="relative aspect-[16/10]">
        <PropertyThumbnail
          src={property.images?.[0]}
          alt={property.title}
          className="w-full h-full"
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
          <div className="text-2xl font-bold text-white drop-shadow-lg">
            {formatPrice(property.price, property.currency || 'ILS')}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
          {property.title}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-1">
            {property.city}{property.neighborhood ? `, ${property.neighborhood}` : ''}
          </span>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4 text-sm">
          {property.bedrooms && (
            <div className="flex items-center gap-1.5">
              <Bed className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{property.bedrooms}</span>
            </div>
          )}
          {property.bathrooms && (
            <div className="flex items-center gap-1.5">
              <Bath className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{property.bathrooms}</span>
            </div>
          )}
          {property.size_sqm && (
            <div className="flex items-center gap-1.5">
              <Maximize className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{formatArea(property.size_sqm)}</span>
            </div>
          )}
        </div>

        {/* View Button */}
        <Button asChild variant="outline" size="sm" className="w-full mt-2">
          <Link to={`/property/${property.id}`}>
            View Property
            <ExternalLink className="h-3.5 w-3.5 ml-2" />
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}
