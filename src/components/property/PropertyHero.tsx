import { useState, useCallback, useEffect } from 'react';
import { MapPin, Bed, Bath, Maximize, Building2, Layers, Eye, Clock, Share2, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { useFormatPrice, useFormatArea, useFormatPricePerArea } from '@/contexts/PreferencesContext';

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
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true
  });
  
  const formatPrice = useFormatPrice();
  const formatArea = useFormatArea();
  const formatPricePerArea = useFormatPricePerArea();
  
  const images = property.images?.length 
    ? property.images 
    : ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200'];

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

  const scrollPrev = useCallback(() => {
    if (selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  }, [selectedImageIndex]);

  const scrollNext = useCallback(() => {
    if (selectedImageIndex < images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  }, [selectedImageIndex, images.length]);

  // Scroll thumbnail carousel to keep selected image visible
  useEffect(() => {
    if (emblaApi) {
      emblaApi.scrollTo(selectedImageIndex);
    }
  }, [emblaApi, selectedImageIndex]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Main Image */}
      <div className="relative rounded-xl overflow-hidden">
        <div className="relative aspect-[16/10] md:aspect-[16/9]">
          <img 
            src={images[selectedImageIndex]} 
            alt={property.title}
            className="w-full h-full object-cover"
          />
          
          {/* Badge */}
          <div className="absolute top-4 left-4">
            <Badge className="text-sm px-3 py-1">
              {property.listing_status === 'for_sale' ? 'For Sale' : 'For Rent'}
            </Badge>
          </div>

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

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background disabled:opacity-50"
                onClick={scrollPrev}
                disabled={selectedImageIndex === 0}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background disabled:opacity-50"
                onClick={scrollNext}
                disabled={selectedImageIndex === images.length - 1}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}

          {/* Image Counter */}
          <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
            {selectedImageIndex + 1} / {images.length}
          </div>
        </div>
      </div>

      {/* Horizontal Thumbnail Carousel */}
      {images.length > 1 && (
        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImageIndex(i)}
                  className={`flex-shrink-0 relative w-20 h-16 md:w-24 md:h-18 rounded-lg overflow-hidden transition-all ${
                    selectedImageIndex === i 
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' 
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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
              {formatPricePerArea(pricePerSqm, property.currency)}
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
              <p className="text-lg font-semibold">{formatArea(property.size_sqm)}</p>
              <p className="text-xs text-muted-foreground">Size</p>
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
