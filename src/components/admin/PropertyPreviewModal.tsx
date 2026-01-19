import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PropertyForReview } from '@/hooks/useListingReview';
import { 
  X, MapPin, Bed, Bath, Ruler, Building2, User, ChevronLeft, ChevronRight,
  Calendar, Layers, Car, Wrench, Wind, Eye, MessageSquare, Mail, Phone,
  Home, Info
} from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PropertyPreviewModalProps {
  property: PropertyForReview;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PropertyPreviewModal({ property, open, onOpenChange }: PropertyPreviewModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, startIndex: 0 });
  
  const images = property.images && property.images.length > 0 
    ? property.images 
    : ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'];

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setSelectedImageIndex(0);
      setIsDescriptionExpanded(false);
      emblaApi?.scrollTo(0);
    }
  }, [open, emblaApi]);

  // Sync embla with selected index
  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', () => {
      setSelectedImageIndex(emblaApi.selectedScrollSnap());
    });
  }, [emblaApi]);

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback((index: number) => {
    emblaApi?.scrollTo(index);
    setSelectedImageIndex(index);
  }, [emblaApi]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: property.currency || 'ILS',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadge = () => {
    const statusStyles: Record<string, string> = {
      draft: 'bg-muted text-muted-foreground',
      pending_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      changes_requested: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };

    const statusLabels: Record<string, string> = {
      draft: 'Draft',
      pending_review: 'Pending Review',
      changes_requested: 'Changes Requested',
      approved: 'Approved',
      rejected: 'Rejected',
    };

    return (
      <Badge className={statusStyles[property.verification_status] || 'bg-muted'}>
        {statusLabels[property.verification_status] || property.verification_status}
      </Badge>
    );
  };

  // Helper functions for display
  const propertyTypeLabels: Record<string, string> = {
    apartment: 'Apartment',
    house: 'House',
    penthouse: 'Penthouse',
    garden_apartment: 'Garden Apt',
    duplex: 'Duplex',
    studio: 'Studio',
    townhouse: 'Townhouse',
    villa: 'Villa',
    land: 'Land',
    commercial: 'Commercial',
  };

  const conditionLabels: Record<string, string> = {
    new: 'Brand New',
    renovated: 'Renovated',
    good: 'Good Condition',
    needs_renovation: 'Needs Renovation',
    shell: 'Shell / Unfinished',
  };

  const acTypeLabels: Record<string, string> = {
    none: 'No A/C',
    split: 'Split A/C',
    central: 'Central A/C',
    mini_central: 'Mini-Central A/C',
  };

  const featureLabels: Record<string, string> = {
    elevator: 'Elevator',
    parking: 'Parking',
    storage: 'Storage Room',
    balcony: 'Balcony',
    garden: 'Private Garden',
    security: '24/7 Security',
    pool: 'Pool',
    gym: 'Gym',
    doorman: 'Doorman',
    renovated: 'Recently Renovated',
    furnished: 'Furnished',
    view: 'Great View',
    quiet: 'Quiet Street',
    accessible: 'Wheelchair Accessible',
    safe_room: 'Safe Room (Mamad)',
    solar_water: 'Solar Water Heater',
    central_ac: 'Central A/C',
    sukka_balcony: 'Sukka Balcony',
    shabbat_elevator: 'Shabbat Elevator',
    private_entrance: 'Private Entrance',
  };

  const getFloorDisplay = () => {
    if (property.floor === null && property.total_floors === null) return null;
    if (property.floor === 0) return 'Ground Floor';
    if (property.floor !== null && property.total_floors !== null) {
      return `Floor ${property.floor} of ${property.total_floors}`;
    }
    if (property.floor !== null) return `Floor ${property.floor}`;
    return null;
  };

  const getConditionDisplay = () => {
    if (!property.condition) return null;
    return conditionLabels[property.condition] || property.condition;
  };

  const getParkingDisplay = () => {
    if (property.parking === null || property.parking === 0) return 'No Parking';
    return `${property.parking} ${property.parking === 1 ? 'Spot' : 'Spots'}`;
  };

  const getAcTypeDisplay = () => {
    if (!property.ac_type) return null;
    return acTypeLabels[property.ac_type] || property.ac_type;
  };

  const getEntryDateDisplay = () => {
    if (!property.entry_date) return null;
    const date = new Date(property.entry_date);
    const now = new Date();
    if (date <= now) return 'Immediate';
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const pricePerSqm = property.size_sqm ? Math.round(property.price / property.size_sqm) : null;

  // Mortgage estimate for sale properties
  const isSale = property.listing_status === 'for_sale';
  const mortgageRange = isSale && property.price
    ? {
        low: Math.round((property.price * 0.7 * 0.005)),
        high: Math.round((property.price * 0.7 * 0.006)),
      }
    : null;

  const description = property.description || '';
  const shouldTruncate = description.length > 300;
  const displayDescription = shouldTruncate && !isDescriptionExpanded 
    ? description.slice(0, 300) + '...' 
    : description;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Property Preview: {property.title}</DialogTitle>
        </DialogHeader>
        
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-20 bg-background/80 backdrop-blur-sm rounded-full"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
        </Button>

        <ScrollArea className="max-h-[95vh]">
          {/* Admin Preview Banner */}
          <div className="bg-primary/10 border-b border-primary/20 px-6 py-3 flex items-center gap-3">
            <div className="p-1.5 bg-primary/20 rounded-full">
              <Eye className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary">Admin Preview</p>
              <p className="text-xs text-muted-foreground">This shows how buyers will see this listing after approval</p>
            </div>
          </div>

          {/* Hero Image Carousel */}
          <div className="relative aspect-[16/10] w-full bg-muted overflow-hidden group">
            <div className="overflow-hidden h-full" ref={emblaRef}>
              <div className="flex h-full">
                {images.map((img, index) => (
                  <div key={index} className="flex-[0_0_100%] min-w-0 h-full">
                    <img
                      src={img}
                      alt={`${property.title} - Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={scrollPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-background/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={scrollNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-background/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Status Badges */}
            <div className="absolute top-4 left-4 flex gap-2">
              {getStatusBadge()}
              <Badge variant="outline" className="bg-background/80 backdrop-blur-sm capitalize">
                {isSale ? 'For Sale' : 'For Rent'}
              </Badge>
            </div>

            {/* Image Counter */}
            {images.length > 1 && (
              <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-background/80 backdrop-blur-sm rounded-full text-sm font-medium">
                {selectedImageIndex + 1} / {images.length}
              </div>
            )}

            {/* Progress Bar */}
            {images.length > 1 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-background/30 backdrop-blur-sm">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${((selectedImageIndex + 1) / images.length) * 100}%` }}
                />
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex gap-2 p-4 overflow-x-auto bg-muted/30">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => scrollTo(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                    i === selectedImageIndex 
                      ? 'border-primary' 
                      : 'border-transparent hover:border-muted-foreground/50'
                  }`}
                >
                  <img src={img} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-col lg:flex-row">
            {/* Main Content */}
            <div className="flex-1 p-6 space-y-6">
              {/* Title & Price */}
              <div>
                <h2 className="text-2xl font-bold">{property.title}</h2>
                <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
                  <MapPin className="h-4 w-4" />
                  <span>{property.address}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {property.city}{property.neighborhood && ` • ${property.neighborhood}`}
                </div>
                <p className="text-3xl font-bold text-primary mt-3">
                  {formatPrice(property.price)}
                  {!isSale && <span className="text-lg font-normal text-muted-foreground">/mo</span>}
                </p>
              </div>

              {/* Hero Stats Bar */}
              <div className="flex flex-wrap gap-6 py-4 border-y">
                {property.bedrooms !== null && (
                  <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-muted-foreground" />
                    <span className="font-semibold">{property.bedrooms}</span>
                    <span className="text-sm text-muted-foreground">Beds</span>
                  </div>
                )}
                {property.bathrooms !== null && (
                  <div className="flex items-center gap-2">
                    <Bath className="h-5 w-5 text-muted-foreground" />
                    <span className="font-semibold">{property.bathrooms}</span>
                    <span className="text-sm text-muted-foreground">Baths</span>
                  </div>
                )}
                {property.size_sqm !== null && (
                  <div className="flex items-center gap-2">
                    <Ruler className="h-5 w-5 text-muted-foreground" />
                    <span className="font-semibold">{property.size_sqm}</span>
                    <span className="text-sm text-muted-foreground">m²</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">
                    {propertyTypeLabels[property.property_type] || property.property_type}
                  </span>
                </div>
              </div>

              {/* Quick Facts Grid */}
              <div>
                <h3 className="font-semibold mb-3">Quick Facts</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {property.year_built && (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Year Built</p>
                        <p className="font-medium">{property.year_built}</p>
                      </div>
                    </div>
                  )}
                  {getFloorDisplay() && (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Floor</p>
                        <p className="font-medium">{getFloorDisplay()}</p>
                      </div>
                    </div>
                  )}
                  {pricePerSqm && (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Ruler className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Price / m²</p>
                        <p className="font-medium">₪{pricePerSqm.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Parking</p>
                      <p className="font-medium">{getParkingDisplay()}</p>
                    </div>
                  </div>
                  {getConditionDisplay() && (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Wrench className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Condition</p>
                        <p className="font-medium">{getConditionDisplay()}</p>
                      </div>
                    </div>
                  )}
                  {getAcTypeDisplay() && (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Wind className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">A/C Type</p>
                        <p className="font-medium">{getAcTypeDisplay()}</p>
                      </div>
                    </div>
                  )}
                  {getEntryDateDisplay() && (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Available</p>
                        <p className="font-medium">{getEntryDateDisplay()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Mortgage Estimate (for sale only) */}
              {mortgageRange && (
                <div className="p-4 bg-primary/5 border border-primary/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">Estimated Monthly Mortgage (70% LTV)</p>
                  <p className="text-lg font-semibold text-primary">
                    ~₪{mortgageRange.low.toLocaleString()} - ₪{mortgageRange.high.toLocaleString()}/mo
                  </p>
                </div>
              )}

              {/* Description */}
              {description && (
                <div>
                  <h3 className="font-semibold mb-3">About This Property</h3>
                  <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                    {displayDescription}
                  </p>
                  {shouldTruncate && (
                    <button
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      className="text-primary text-sm font-medium mt-2 hover:underline"
                    >
                      {isDescriptionExpanded ? 'Read less' : 'Read more'}
                    </button>
                  )}
                </div>
              )}

              {/* Features & Amenities */}
              {property.features && property.features.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Features & Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {property.features.map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-sm py-1.5">
                        {featureLabels[feature] || feature.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity Placeholder */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-4 bg-muted/30 rounded-lg border border-dashed cursor-help opacity-60">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        <span className="text-sm">Activity metrics will appear here after publishing</span>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Views, saves, and inquiry counts are displayed after the listing is live</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Previous Feedback */}
              {property.rejection_reason && (
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                  <h3 className="font-semibold text-orange-800 dark:text-orange-400 mb-2">
                    Previous Feedback
                  </h3>
                  <p className="text-orange-700 dark:text-orange-300">{property.rejection_reason}</p>
                </div>
              )}
            </div>

            {/* Sidebar - Contact Card Preview */}
            <div className="lg:w-80 p-6 lg:border-l bg-muted/20">
              <div className="lg:sticky lg:top-6 space-y-4">
                {/* Agent Info */}
                {property.agent && (
                  <div className="p-4 bg-background rounded-xl border">
                    <h3 className="font-semibold mb-3">Listed By</h3>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{property.agent.name}</p>
                        {property.agent.agency_name && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                            <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                            {property.agent.agency_name}
                          </p>
                        )}
                      </div>
                    </div>
                    {property.agent.is_verified && (
                      <Badge variant="outline" className="mt-3 w-full justify-center">
                        Verified Agent
                      </Badge>
                    )}
                  </div>
                )}

                {/* Contact Buttons Preview */}
                <div className="space-y-2">
                  <Button className="w-full gap-2" disabled>
                    <MessageSquare className="h-4 w-4" />
                    WhatsApp
                  </Button>
                  <Button variant="outline" className="w-full gap-2" disabled>
                    <Mail className="h-4 w-4" />
                    Email Agent
                  </Button>
                  <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground pt-2">
                    <Info className="h-3 w-3" />
                    Contact disabled in preview
                  </div>
                </div>

                {/* Property Type Badge */}
                <div className="text-center pt-4 border-t">
                  <Badge variant="outline" className="capitalize">
                    {propertyTypeLabels[property.property_type] || property.property_type.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
