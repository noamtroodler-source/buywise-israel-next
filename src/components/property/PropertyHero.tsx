import { useState } from 'react';
import { MapPin, Bed, Bath, Maximize, Building2, Layers, Eye, Clock, Share2, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface Agent {
  name: string;
  agency_name: string | null;
}

interface PropertyHeroProps {
  property: {
    id: string;
    title: string;
    address: string;
    city: string;
    neighborhood?: string | null;
    price: number;
    currency: string;
    listing_status: string;
    property_type: string;
    bedrooms?: number | null;
    bathrooms?: number | null;
    size_sqm?: number | null;
    floor?: number | null;
    total_floors?: number | null;
    images?: string[] | null;
    views_count?: number | null;
    created_at?: string;
    agent?: Agent | null;
  };
  onSave?: () => void;
  onShare?: () => void;
  isSaved?: boolean;
}

export function PropertyHero({ property, onSave, onShare, isSaved = false }: PropertyHeroProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  const images = property.images?.length 
    ? property.images 
    : ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200'];

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat(currency === 'ILS' ? 'he-IL' : 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const pricePerSqm = property.size_sqm 
    ? Math.round(property.price / property.size_sqm)
    : null;

  const daysOnMarket = property.created_at 
    ? Math.floor((Date.now() - new Date(property.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const propertyTypeLabels: Record<string, string> = {
    apartment: 'Apartment',
    house: 'House',
    penthouse: 'Penthouse',
    cottage: 'Cottage',
    land: 'Land',
    commercial: 'Commercial',
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Image Gallery */}
      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 rounded-xl overflow-hidden">
          {/* Main Image */}
          <div className="md:col-span-3 relative aspect-[16/10] md:aspect-[16/9]">
            <img 
              src={images[selectedImageIndex]} 
              alt={property.title}
              className="w-full h-full object-cover"
            />
            {/* Overlay Actions */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                className="bg-background/90 backdrop-blur-sm hover:bg-background"
                onClick={onShare}
              >
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                className={`bg-background/90 backdrop-blur-sm hover:bg-background ${isSaved ? 'text-red-500' : ''}`}
                onClick={onSave}
              >
                <Heart className={`h-4 w-4 mr-1 ${isSaved ? 'fill-current' : ''}`} />
                Save
              </Button>
            </div>
            {/* Badge */}
            <div className="absolute top-4 left-4">
              <Badge className="text-sm px-3 py-1">
                {property.listing_status === 'for_sale' ? 'For Sale' : 'For Rent'}
              </Badge>
            </div>
          </div>

          {/* Thumbnail Grid */}
          <div className="hidden md:grid grid-rows-3 gap-2">
            {images.slice(1, 4).map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImageIndex(i + 1)}
                className={`relative aspect-[4/3] overflow-hidden rounded-lg transition-all ${
                  selectedImageIndex === i + 1 ? 'ring-2 ring-primary' : 'hover:opacity-80'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
                {i === 2 && images.length > 4 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-semibold">+{images.length - 4} more</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Image Dots */}
        <div className="flex justify-center gap-1.5 mt-3 md:hidden">
          {images.slice(0, 5).map((_, i) => (
            <button
              key={i}
              onClick={() => setSelectedImageIndex(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                selectedImageIndex === i ? 'bg-primary w-4' : 'bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Price & Title Section */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {formatPrice(property.price, property.currency)}
            {property.listing_status === 'for_rent' && (
              <span className="text-lg text-muted-foreground font-normal">/month</span>
            )}
          </h1>
          {pricePerSqm && (
            <span className="text-muted-foreground">
              {formatPrice(pricePerSqm, property.currency)}/m²
            </span>
          )}
        </div>

        <h2 className="text-xl md:text-2xl font-semibold text-foreground">{property.title}</h2>

        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <span>
            {property.address}
            {property.neighborhood && `, ${property.neighborhood}`}
            , {property.city}
          </span>
        </div>

        {/* Activity Indicators */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {property.views_count !== null && property.views_count !== undefined && (
            <div className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              <span>{property.views_count.toLocaleString()} views</span>
            </div>
          )}
          {daysOnMarket !== null && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{daysOnMarket === 0 ? 'Listed today' : `${daysOnMarket} days on market`}</span>
            </div>
          )}
        </div>
      </div>

      {/* Key Stats Bar */}
      <div className="flex flex-wrap gap-4 py-4 px-4 bg-muted/50 rounded-xl border border-border">
        {property.bedrooms !== null && property.bedrooms !== undefined && (
          <div className="flex items-center gap-2.5 px-3">
            <Bed className="h-5 w-5 text-primary" />
            <div>
              <p className="text-lg font-semibold">{property.bedrooms}</p>
              <p className="text-xs text-muted-foreground">Beds</p>
            </div>
          </div>
        )}
        {property.bathrooms !== null && property.bathrooms !== undefined && (
          <div className="flex items-center gap-2.5 px-3 border-l border-border">
            <Bath className="h-5 w-5 text-primary" />
            <div>
              <p className="text-lg font-semibold">{property.bathrooms}</p>
              <p className="text-xs text-muted-foreground">Baths</p>
            </div>
          </div>
        )}
        {property.size_sqm && (
          <div className="flex items-center gap-2.5 px-3 border-l border-border">
            <Maximize className="h-5 w-5 text-primary" />
            <div>
              <p className="text-lg font-semibold">{property.size_sqm}</p>
              <p className="text-xs text-muted-foreground">m²</p>
            </div>
          </div>
        )}
        {property.floor !== null && property.floor !== undefined && (
          <div className="flex items-center gap-2.5 px-3 border-l border-border">
            <Layers className="h-5 w-5 text-primary" />
            <div>
              <p className="text-lg font-semibold">
                {property.floor}
                {property.total_floors && `/${property.total_floors}`}
              </p>
              <p className="text-xs text-muted-foreground">Floor</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2.5 px-3 border-l border-border">
          <Building2 className="h-5 w-5 text-primary" />
          <div>
            <p className="text-lg font-semibold">{propertyTypeLabels[property.property_type] || property.property_type}</p>
            <p className="text-xs text-muted-foreground">Type</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
