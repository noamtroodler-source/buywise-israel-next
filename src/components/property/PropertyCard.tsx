import { Link } from 'react-router-dom';
import { Bed, Bath, Maximize, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Property } from '@/types/database';
import { cn } from '@/lib/utils';
import { FavoriteButton } from './FavoriteButton';
import { CompareButton } from './CompareButton';
import { useFormatPrice, useFormatArea } from '@/contexts/PreferencesContext';

interface PropertyCardProps {
  property: Property;
  className?: string;
}

export function PropertyCard({ property, className }: PropertyCardProps) {
  const formatPrice = useFormatPrice();
  const formatArea = useFormatArea();

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'for_sale':
        return 'For Sale';
      case 'for_rent':
        return 'For Rent';
      case 'sold':
        return 'Sold';
      case 'rented':
        return 'Rented';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'for_sale':
        return 'bg-primary text-primary-foreground';
      case 'for_rent':
        return 'bg-accent text-accent-foreground';
      case 'sold':
      case 'rented':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const placeholderImage = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=60';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/property/${property.id}`}>
        <Card className={cn(
          "overflow-hidden hover:shadow-card-hover transition-all duration-300 group cursor-pointer",
          className
        )}>
          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden">
            <img
              src={property.images?.[0] || placeholderImage}
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-3 left-3 flex gap-2">
              <Badge className={cn("text-xs font-medium", getStatusColor(property.listing_status))}>
                {getStatusLabel(property.listing_status)}
              </Badge>
              {property.is_featured && (
                <Badge className="bg-accent text-accent-foreground text-xs font-medium">
                  Featured
                </Badge>
              )}
            </div>
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <CompareButton propertyId={property.id} />
              <FavoriteButton propertyId={property.id} />
            </div>
          </div>

          {/* Content */}
          <CardContent className="p-4 space-y-3">
            {/* Price */}
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-foreground">
                {formatPrice(property.price, property.currency || 'ILS')}
              </span>
              {property.listing_status === 'for_rent' && (
                <span className="text-sm text-muted-foreground">/month</span>
              )}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {property.title}
            </h3>

            {/* Location */}
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm line-clamp-1">
                {property.neighborhood ? `${property.neighborhood}, ` : ''}{property.city}
              </span>
            </div>

            {/* Features */}
            <div className="flex items-center gap-4 pt-2 border-t border-border">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Bed className="h-4 w-4" />
                <span className="text-sm">{property.bedrooms}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Bath className="h-4 w-4" />
                <span className="text-sm">{property.bathrooms}</span>
              </div>
              {property.size_sqm && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Maximize className="h-4 w-4" />
                  <span className="text-sm">{formatArea(property.size_sqm)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}