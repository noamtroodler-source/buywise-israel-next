import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Share2, Heart, Bed, Bath, Maximize, Building2, Eye, Clock } from 'lucide-react';
import { useFormatPrice, useFormatArea, useFormatPricePerArea } from '@/contexts/PreferencesContext';
import { motion } from 'framer-motion';

interface PropertyQuickSummaryProps {
  property: {
    price: number;
    currency?: string;
    title: string;
    address: string;
    city: string;
    neighborhood?: string;
    bedrooms?: number;
    bathrooms?: number;
    size_sqm?: number;
    property_type: string;
    views_count?: number;
    created_at: string;
  };
  onShare?: () => void;
  onSave?: () => void;
  isSaved?: boolean;
}

export function PropertyQuickSummary({ property, onShare, onSave, isSaved }: PropertyQuickSummaryProps) {
  const formatPrice = useFormatPrice();
  const formatArea = useFormatArea();
  const formatPricePerArea = useFormatPricePerArea();

  const pricePerSqm = property.size_sqm ? property.price / property.size_sqm : null;
  
  // Calculate days on market
  const createdDate = new Date(property.created_at);
  const now = new Date();
  const daysOnMarket = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

  const locationText = property.neighborhood 
    ? `${property.neighborhood}, ${property.city}`
    : property.city;

  const propertyTypeLabel = property.property_type.charAt(0).toUpperCase() + property.property_type.slice(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Price & Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-foreground">
              {formatPrice(property.price, property.currency || 'ILS')}
            </h1>
            {pricePerSqm && (
              <span className="text-muted-foreground text-sm">
                {formatPricePerArea(pricePerSqm, property.currency || 'ILS')}
              </span>
            )}
          </div>
          <h2 className="text-xl font-semibold text-foreground">{property.title}</h2>
          <p className="text-muted-foreground flex items-center gap-1.5">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{property.address}, {locationText}</span>
          </p>
        </div>
        
        {/* Action Buttons - Desktop */}
        <div className="hidden sm:flex gap-2 shrink-0">
          <Button variant="outline" size="sm" className="gap-2" onClick={onShare}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2" 
            onClick={onSave}
          >
            <Heart className={`h-4 w-4 ${isSaved ? 'fill-primary text-primary' : ''}`} />
            {isSaved ? 'Saved' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex flex-wrap gap-6 py-4 border-y border-border">
        {property.bedrooms !== undefined && property.bedrooms !== null && (
          <div className="flex items-center gap-2">
            <Bed className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-lg font-semibold">{property.bedrooms}</p>
              <p className="text-xs text-muted-foreground">Beds</p>
            </div>
          </div>
        )}
        {property.bathrooms !== undefined && property.bathrooms !== null && (
          <div className="flex items-center gap-2">
            <Bath className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-lg font-semibold">{property.bathrooms}</p>
              <p className="text-xs text-muted-foreground">Baths</p>
            </div>
          </div>
        )}
        {property.size_sqm && (
          <div className="flex items-center gap-2">
            <Maximize className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-lg font-semibold">{formatArea(property.size_sqm)}</p>
              <p className="text-xs text-muted-foreground">Size</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-lg font-semibold">{propertyTypeLabel}</p>
            <p className="text-xs text-muted-foreground">Type</p>
          </div>
        </div>
      </div>

      {/* Activity Badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="gap-1.5">
          <Clock className="h-3 w-3" />
          {daysOnMarket === 0 ? 'Listed today' : `${daysOnMarket} days on market`}
        </Badge>
        {property.views_count !== undefined && property.views_count > 0 && (
          <Badge variant="secondary" className="gap-1.5">
            <Eye className="h-3 w-3" />
            {property.views_count} views
          </Badge>
        )}
      </div>

      {/* Mobile Action Buttons */}
      <div className="flex gap-2 sm:hidden">
        <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={onShare}>
          <Share2 className="h-4 w-4" />
          Share
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 gap-2" 
          onClick={onSave}
        >
          <Heart className={`h-4 w-4 ${isSaved ? 'fill-primary text-primary' : ''}`} />
          {isSaved ? 'Saved' : 'Save'}
        </Button>
      </div>
    </motion.div>
  );
}
