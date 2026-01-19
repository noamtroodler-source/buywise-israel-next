import { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePropertyWizard } from '../PropertyWizardContext';
import { 
  MapPin, Bed, Bath, Maximize, Building2, Car, Calendar,
  Thermometer, CheckCircle, MessageCircle, Mail, Eye, Clock,
  CalendarCheck, Layers, DollarSign, Wrench, ChevronLeft, ChevronRight, Camera,
  ChevronDown, ChevronUp, Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { estimateMonthlyPaymentRange } from '@/lib/calculations/mortgage';
import { formatMonthlyRange } from '@/lib/utils/formatRange';

interface PropertyPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PropertyPreviewDialog({ open, onOpenChange }: PropertyPreviewDialogProps) {
  const { data } = usePropertyWizard();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true
  });

  // Reset states when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedImageIndex(0);
      setIsDescriptionExpanded(false);
    }
  }, [open]);

  // Scroll thumbnail carousel to keep selected image visible
  useEffect(() => {
    if (emblaApi) {
      emblaApi.scrollTo(selectedImageIndex);
    }
  }, [emblaApi, selectedImageIndex]);

  const scrollPrev = useCallback(() => {
    if (selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  }, [selectedImageIndex]);

  const scrollNext = useCallback(() => {
    if (selectedImageIndex < data.images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  }, [selectedImageIndex, data.images.length]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const featureLabels: Record<string, string> = {
    elevator: 'Elevator',
    balcony: 'Balcony',
    mamad: 'Safe Room',
    storage: 'Storage',
    sukkah_balcony: 'Sukkah Balcony',
    shabbat_elevator: 'Shabbat Elevator',
    accessible: 'Accessible',
    furnished: 'Furnished',
    pets_allowed: 'Pets Allowed',
    renovated_kitchen: 'Renovated Kitchen',
    master_suite: 'Master Suite',
    garden: 'Garden',
    pool: 'Pool',
    gym: 'Gym',
    doorman: 'Doorman',
  };

  const conditionLabels: Record<string, string> = {
    new: 'New',
    like_new: 'Like New',
    renovated: 'Renovated',
    good: 'Good Condition',
    needs_renovation: 'Needs Renovation',
  };

  const propertyTypeLabels: Record<string, string> = {
    apartment: 'Apartment',
    house: 'House',
    penthouse: 'Penthouse',
    garden_apartment: 'Garden Apartment',
    duplex: 'Duplex',
    townhouse: 'Townhouse',
    cottage: 'Cottage',
    villa: 'Villa',
    studio: 'Studio',
    land: 'Land',
  };

  const statusLabels: Record<string, string> = {
    for_sale: 'For Sale',
    for_rent: 'For Rent',
  };

  const pricePerSqm = data.size_sqm ? data.price / data.size_sqm : null;

  // Mortgage estimate range for sale properties
  const mortgageRange = data.listing_status !== 'for_rent' 
    ? estimateMonthlyPaymentRange(data.price) 
    : null;

  // Format floor display
  const getFloorDisplay = () => {
    if (data.floor === null || data.floor === undefined) return 'Not specified';
    if (data.floor === 0) return 'Ground';
    if (data.total_floors) return `${data.floor} of ${data.total_floors}`;
    return `Floor ${data.floor}`;
  };

  // Format condition display
  const getConditionDisplay = () => {
    if (!data.condition) return 'Not specified';
    return conditionLabels[data.condition] || data.condition;
  };

  // Format parking display
  const getParkingDisplay = () => {
    if (!data.parking || data.parking === 0) return 'None';
    return `${data.parking} spot${data.parking > 1 ? 's' : ''}`;
  };

  // Format entry date display
  const getEntryDateDisplay = () => {
    if (data.is_immediate_entry || !data.entry_date) return 'Immediate';
    const date = new Date(data.entry_date);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Format A/C type display
  const getAcTypeDisplay = () => {
    if (!data.ac_type || data.ac_type === 'none') return null;
    const labels: Record<string, string> = {
      'split': 'Split A/C',
      'central': 'Central A/C',
      'mini_central': 'Mini Central',
    };
    return labels[data.ac_type] || data.ac_type;
  };

  // Truncate description for preview
  const descriptionCharLimit = 300;
  const shouldTruncateDescription = (data.description?.length || 0) > descriptionCharLimit;
  const displayDescription = isDescriptionExpanded 
    ? data.description 
    : data.description?.slice(0, descriptionCharLimit);

  const images = data.images.length > 0 ? data.images : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] p-0 overflow-hidden">
        {/* Preview Mode Banner */}
        <div className="bg-primary/5 border-b border-primary/20 px-4 py-3 flex items-center gap-2">
          <Eye className="h-4 w-4 text-primary" />
          <p className="text-sm text-foreground">
            <span className="font-medium">Preview Mode</span>
            <span className="text-muted-foreground"> — This is how buyers will see your listing. Activity metrics will appear once published.</span>
          </p>
        </div>
        
        <ScrollArea className="max-h-[calc(95vh-52px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            {/* Main Content Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Hero Image with 16:10 aspect ratio */}
              {images.length > 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Main Image */}
                  <div 
                    className="relative aspect-[16/10] rounded-xl overflow-hidden bg-muted cursor-pointer group"
                  >
                    <img 
                      src={images[selectedImageIndex]} 
                      alt="Property preview"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    
                    {/* Click hint overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none" />
                    
                    {/* Status Badges */}
                    <div className="absolute top-4 left-4 flex gap-2">
                      <Badge className="text-sm px-3 py-1.5 bg-background/90 text-foreground backdrop-blur-sm border-0">
                        {statusLabels[data.listing_status] || data.listing_status}
                      </Badge>
                      <Badge variant="secondary" className="text-sm px-3 py-1.5 bg-background/80 backdrop-blur-sm">
                        {propertyTypeLabels[data.property_type] || data.property_type}
                      </Badge>
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
                    <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5">
                      <Camera className="h-4 w-4" />
                      {selectedImageIndex + 1} / {images.length}
                    </div>

                    {/* Progress Bar Indicator */}
                    {images.length > 1 && (
                      <div className="absolute bottom-4 left-4 right-20 flex gap-1 z-10">
                        {images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImageIndex(index)}
                            className={`flex-1 h-1 rounded-full transition-colors duration-200 ${
                              index === selectedImageIndex 
                                ? "bg-white" 
                                : "bg-white/40 hover:bg-white/60"
                            }`}
                            aria-label={`View image ${index + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Strip */}
                  {images.length > 1 && (
                    <div className="mt-3">
                      <div className="overflow-hidden" ref={emblaRef}>
                        <div className="flex gap-2">
                          {images.map((img, i) => (
                            <button
                              key={i}
                              onClick={() => setSelectedImageIndex(i)}
                              className={`flex-shrink-0 relative w-20 h-14 md:w-24 md:h-16 rounded-lg overflow-hidden transition-all ${
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
                </motion.div>
              ) : (
                <div className="aspect-[16/10] rounded-xl bg-muted flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No photos uploaded</p>
                    <p className="text-sm">Add photos to see them here</p>
                  </div>
                </div>
              )}

              {/* Price & Title Section */}
              <div className="space-y-3">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <h1 className="text-3xl font-bold text-foreground">
                    {formatPrice(data.price)}
                  </h1>
                  {data.listing_status === 'for_rent' && (
                    <span className="text-muted-foreground">/month</span>
                  )}
                  {pricePerSqm && (
                    <span className="text-muted-foreground text-sm">
                      ({formatPrice(Math.round(pricePerSqm))}/m²)
                    </span>
                  )}
                </div>

                {/* Mortgage Estimate Range */}
                {mortgageRange && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="border-b border-dotted border-muted-foreground/50">
                      {formatMonthlyRange(mortgageRange.low, mortgageRange.high, 'ILS')}
                    </span>
                    <span className="text-muted-foreground/60">•</span>
                    <span className="text-primary">estimated mortgage</span>
                  </div>
                )}

                <h2 className="text-xl font-semibold text-foreground">
                  {data.title || 'Untitled Listing'}
                </h2>
                <p className="text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{data.address}{data.neighborhood && `, ${data.neighborhood}`}, {data.city}</span>
                </p>
              </div>

              {/* Hero Stats Bar */}
              <div className="flex flex-wrap gap-6 py-4 border-y border-border">
                {data.bedrooms !== undefined && data.bedrooms !== null && (
                  <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-lg font-semibold">{data.bedrooms}</p>
                      <p className="text-xs text-muted-foreground">Beds</p>
                    </div>
                  </div>
                )}
                {data.bathrooms !== undefined && data.bathrooms !== null && (
                  <div className="flex items-center gap-2">
                    <Bath className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-lg font-semibold">{data.bathrooms}</p>
                      <p className="text-xs text-muted-foreground">Baths</p>
                    </div>
                  </div>
                )}
                {data.size_sqm && (
                  <div className="flex items-center gap-2">
                    <Maximize className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-lg font-semibold">{data.size_sqm} m²</p>
                      <p className="text-xs text-muted-foreground">Size</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-lg font-semibold">
                      {propertyTypeLabels[data.property_type] || data.property_type}
                    </p>
                    <p className="text-xs text-muted-foreground">Type</p>
                  </div>
                </div>
              </div>

              {/* Quick Facts Grid */}
              <TooltipProvider>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* Year Built */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {data.year_built || 'Not specified'}
                      </p>
                      <p className="text-xs text-muted-foreground">Built</p>
                    </div>
                  </div>

                  {/* Floor */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Layers className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{getFloorDisplay()}</p>
                      <p className="text-xs text-muted-foreground">Floor</p>
                    </div>
                  </div>

                  {/* Price per sqm */}
                  {pricePerSqm && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <DollarSign className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {formatPrice(Math.round(pricePerSqm))}
                        </p>
                        <p className="text-xs text-muted-foreground">per m²</p>
                      </div>
                    </div>
                  )}

                  {/* Parking */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Car className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{getParkingDisplay()}</p>
                      <p className="text-xs text-muted-foreground">Parking</p>
                    </div>
                  </div>

                  {/* Condition */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Wrench className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{getConditionDisplay()}</p>
                      <p className="text-xs text-muted-foreground">Condition</p>
                    </div>
                  </div>

                  {/* Entry Date */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <CalendarCheck className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{getEntryDateDisplay()}</p>
                      <p className="text-xs text-muted-foreground">Available</p>
                    </div>
                  </div>

                  {/* A/C Type */}
                  {getAcTypeDisplay() && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Thermometer className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{getAcTypeDisplay()}</p>
                        <p className="text-xs text-muted-foreground">A/C</p>
                      </div>
                    </div>
                  )}
                </div>
              </TooltipProvider>

              {/* At a Glance Highlights */}
              {data.highlights.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 text-foreground">At a Glance</h3>
                  <ul className="grid sm:grid-cols-2 gap-2">
                    {data.highlights.slice(0, 6).map((h, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Description with Expand/Collapse */}
              <div>
                <h3 className="font-semibold mb-3 text-foreground">About This Property</h3>
                {data.description ? (
                  <div>
                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {displayDescription}
                      {shouldTruncateDescription && !isDescriptionExpanded && '...'}
                    </p>
                    {shouldTruncateDescription && (
                      <button
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        className="text-primary text-sm font-medium mt-2 flex items-center gap-1 hover:underline"
                      >
                        {isDescriptionExpanded ? (
                          <>Show less <ChevronUp className="h-4 w-4" /></>
                        ) : (
                          <>Read more <ChevronDown className="h-4 w-4" /></>
                        )}
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No description provided</p>
                )}
              </div>

              {/* Features & Amenities */}
              {data.features.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 text-foreground">Features & Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {data.features.map((f) => (
                      <Badge key={f} variant="secondary">
                        {featureLabels[f] || f}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity Bar Preview (Placeholder) */}
              <div className="flex items-center gap-4 py-4 border-t border-border text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span><span className="font-semibold text-foreground">0</span> days on market</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4" />
                  <span><span className="font-semibold text-foreground">0</span> views</span>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground/70 cursor-help">
                      <Info className="h-3 w-3" />
                      <span>Stats appear after publishing</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Views, saves, and time on market will be tracked once your listing is live.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Right Column - Sticky Contact Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-0 rounded-lg border bg-card p-6 space-y-4">
                {/* Price */}
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">
                    {formatPrice(data.price)}
                  </p>
                  {data.listing_status === 'for_rent' && (
                    <p className="text-sm text-muted-foreground">/month</p>
                  )}
                  {pricePerSqm && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatPrice(Math.round(pricePerSqm))}/m²
                    </p>
                  )}
                </div>

                {/* Monthly Costs Preview */}
                {data.vaad_bayit_monthly && (
                  <div className="text-sm text-center text-muted-foreground border-t pt-4">
                    Building fee: ₪{data.vaad_bayit_monthly}/mo
                  </div>
                )}

                {/* Contact Buttons - WhatsApp and Email only */}
                <div className="space-y-2">
                  <Button className="w-full gap-2" disabled>
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </Button>
                  <Button variant="outline" className="w-full gap-2" disabled>
                    <Mail className="h-4 w-4" />
                    Email
                  </Button>
                </div>
                
                <p className="text-xs text-center text-muted-foreground">
                  Contact buttons disabled in preview
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
