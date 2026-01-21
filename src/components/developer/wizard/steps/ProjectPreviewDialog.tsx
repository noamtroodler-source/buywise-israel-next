import { useState, useEffect, useCallback } from 'react';
import { X, MapPin, Building, Calendar, TrendingUp, ChevronLeft, ChevronRight, MessageCircle, Mail, Users, Sparkles } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useProjectWizard } from '../ProjectWizardContext';
import useEmblaCarousel from 'embla-carousel-react';

const statusLabels: Record<string, string> = {
  planning: 'Planning Phase',
  pre_sale: 'Pre-Sale',
  foundation: 'Foundation',
  structure: 'Structure',
  finishing: 'Finishing',
  delivery: 'Delivery',
};

const amenityLabels: Record<string, string> = {
  lobby: 'Grand Lobby',
  concierge: '24/7 Concierge',
  security: 'Security',
  parking_underground: 'Underground Parking',
  ev_charging: 'EV Charging',
  storage: 'Storage Units',
  pool: 'Swimming Pool',
  gym: 'Fitness Center',
  spa: 'Spa',
  rooftop: 'Rooftop Terrace',
  garden: 'Gardens',
  playground: 'Playground',
  coworking: 'Co-Working Space',
  event_room: 'Event Room',
  guest_suite: 'Guest Suites',
  dog_spa: 'Pet Spa',
  smart_home: 'Smart Home',
  fiber_optic: 'Fiber Internet',
  generator: 'Backup Generator',
  solar: 'Solar Panels',
  green_building: 'Green Certified',
  rainwater: 'Rainwater Harvesting',
  mamad: 'Safe Rooms (ממ״ד)',
  shabbat_elevator: 'Shabbat Elevator',
  accessible: 'Full Accessibility',
  shul: 'Synagogue (בית כנסת)',
  mikvah: 'Mikvah (מקווה)',
  sukkot_area: 'Designated Sukkot Area',
  senior_friendly: 'Senior Friendly',
  doorman: 'Doorman',
  tennis: 'Tennis Court',
  bike_storage: 'Bike Storage',
  package_room: 'Package Room',
  wine_storage: 'Wine Storage',
};

interface ProjectPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectPreviewDialog({ open, onOpenChange }: ProjectPreviewDialogProps) {
  const { data } = useProjectWizard();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  useEffect(() => {
    if (open) {
      setSelectedImageIndex(0);
      setIsDescriptionExpanded(false);
    }
  }, [open]);

  useEffect(() => {
    if (emblaApi) {
      emblaApi.scrollTo(selectedImageIndex);
    }
  }, [emblaApi, selectedImageIndex]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollPrev();
      setSelectedImageIndex(emblaApi.selectedScrollSnap());
    }
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollNext();
      setSelectedImageIndex(emblaApi.selectedScrollSnap());
    }
  }, [emblaApi]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const images = data.images.length > 0 ? data.images : ['/placeholder.svg'];
  const descriptionCharLimit = 300;
  const shouldTruncate = data.description.length > descriptionCharLimit;
  const displayDescription = isDescriptionExpanded 
    ? data.description 
    : data.description.slice(0, descriptionCharLimit) + (shouldTruncate ? '...' : '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 gap-0 overflow-hidden">
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-50 rounded-full bg-background/80 backdrop-blur-sm p-2 hover:bg-background transition-colors"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <ScrollArea className="h-full">
          <div className="p-6">
            {/* Preview Banner */}
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6">
              <p className="text-sm text-center text-primary font-medium">
                Preview Mode — This is how buyers will see your project listing
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Hero Image Carousel */}
                <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-muted">
                  <div className="overflow-hidden h-full" ref={emblaRef}>
                    <div className="flex h-full">
                      {images.map((image, index) => (
                        <div key={index} className="flex-[0_0_100%] min-w-0 h-full">
                          <img
                            src={image}
                            alt={`${data.name} - Image ${index + 1}`}
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
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm rounded-full p-2 hover:bg-background transition-colors"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={scrollNext}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm rounded-full p-2 hover:bg-background transition-colors"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}

                  {/* Image Counter */}
                  <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1 text-sm">
                    {selectedImageIndex + 1} / {images.length}
                  </div>

                  {/* Status Badge */}
                  <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
                    {statusLabels[data.status] || data.status}
                  </Badge>
                </div>

                {/* Thumbnail Strip */}
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-colors ${
                          index === selectedImageIndex
                            ? 'border-primary'
                            : 'border-transparent hover:border-muted-foreground/30'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Price & Title Section */}
                <div>
                  {(data.price_from || data.price_to) && (
                    <div className="mb-2">
                      <span className="text-sm text-muted-foreground">Starting from</span>
                      <div className="text-2xl font-bold text-primary">
                        {data.price_from && formatPrice(data.price_from)}
                        {data.price_from && data.price_to && ' – '}
                        {data.price_to && formatPrice(data.price_to)}
                      </div>
                    </div>
                  )}
                  <h1 className="text-2xl font-bold">{data.name || 'Untitled Project'}</h1>
                  <div className="flex items-center gap-1 text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4" />
                    <span>{data.city}{data.neighborhood ? `, ${data.neighborhood}` : ''}</span>
                    {data.address && <span className="text-muted-foreground/60">• {data.address}</span>}
                  </div>
                </div>

                {/* Key Stats Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-xl">
                  {data.total_units && (
                    <div className="text-center">
                      <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <div className="text-lg font-semibold">{data.total_units}</div>
                      <div className="text-xs text-muted-foreground">Total Units</div>
                    </div>
                  )}
                  {data.completion_date && (
                    <div className="text-center">
                      <Calendar className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <div className="text-lg font-semibold">
                        {new Date(data.completion_date).getFullYear()}
                      </div>
                      <div className="text-xs text-muted-foreground">Completion</div>
                    </div>
                  )}
                  {data.construction_progress_percent > 0 && (
                    <div className="text-center">
                      <TrendingUp className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <div className="text-lg font-semibold">{data.construction_progress_percent}%</div>
                      <div className="text-xs text-muted-foreground">Progress</div>
                    </div>
                  )}
                  <div className="text-center">
                    <Building className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <div className="text-lg font-semibold">{statusLabels[data.status] || 'N/A'}</div>
                    <div className="text-xs text-muted-foreground">Status</div>
                  </div>
                </div>

                <Separator />

                {/* Description Section */}
                {data.description && (
                  <div>
                    <h2 className="text-lg font-semibold mb-3">About This Project</h2>
                    <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                      {displayDescription}
                    </p>
                    {shouldTruncate && (
                      <button
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        className="text-primary text-sm font-medium mt-2 hover:underline"
                      >
                        {isDescriptionExpanded ? 'Show less' : 'Read more'}
                      </button>
                    )}
                  </div>
                )}

                <Separator />

                {/* Amenities Section */}
                {data.amenities.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Amenities & Features
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {data.amenities.map((amenity) => (
                        <Badge key={amenity} variant="secondary" className="rounded-full">
                          {amenityLabels[amenity] || amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timeline Section */}
                {(data.construction_start || data.completion_date) && (
                  <>
                    <Separator />
                    <div>
                      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Project Timeline
                      </h2>
                      <div className="grid grid-cols-2 gap-4">
                        {data.construction_start && (
                          <div className="bg-muted/50 rounded-xl p-4">
                            <div className="text-sm text-muted-foreground">Construction Start</div>
                            <div className="font-semibold">
                              {new Date(data.construction_start).toLocaleDateString('en-US', {
                                month: 'long',
                                year: 'numeric',
                              })}
                            </div>
                          </div>
                        )}
                        {data.completion_date && (
                          <div className="bg-muted/50 rounded-xl p-4">
                            <div className="text-sm text-muted-foreground">Expected Completion</div>
                            <div className="font-semibold">
                              {new Date(data.completion_date).toLocaleDateString('en-US', {
                                month: 'long',
                                year: 'numeric',
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Floor Plans Preview */}
                {data.floor_plans.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h2 className="text-lg font-semibold mb-3">Floor Plans</h2>
                      <div className="grid grid-cols-3 gap-2">
                        {data.floor_plans.slice(0, 3).map((plan, index) => (
                          <div key={index} className="aspect-square rounded-lg overflow-hidden bg-muted">
                            <img src={plan} alt={`Floor plan ${index + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                      {data.floor_plans.length > 3 && (
                        <p className="text-sm text-muted-foreground mt-2">
                          +{data.floor_plans.length - 3} more floor plans
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Right Column - Sticky Card */}
              <div className="lg:col-span-1">
                <div className="sticky top-6 space-y-4">
                  <div className="border rounded-xl p-5 space-y-4">
                    {/* Price Display */}
                    {(data.price_from || data.price_to) && (
                      <div>
                        <div className="text-sm text-muted-foreground">Price Range</div>
                        <div className="text-xl font-bold text-primary">
                          {data.price_from && formatPrice(data.price_from)}
                          {data.price_from && data.price_to && ' – '}
                          {data.price_to && formatPrice(data.price_to)}
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Unit Info */}
                    <div className="space-y-2">
                      {data.total_units && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Units</span>
                          <span className="font-medium">{data.total_units}</span>
                        </div>
                      )}
                      {data.available_units !== undefined && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Available</span>
                          <span className="font-medium">{data.available_units}</span>
                        </div>
                      )}
                      {data.completion_date && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Completion</span>
                          <span className="font-medium">
                            {new Date(data.completion_date).toLocaleDateString('en-US', {
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Disabled Contact Buttons */}
                    <div className="space-y-2">
                      <Button disabled className="w-full gap-2" size="lg">
                        <MessageCircle className="h-4 w-4" />
                        WhatsApp
                      </Button>
                      <Button disabled variant="outline" className="w-full gap-2" size="lg">
                        <Mail className="h-4 w-4" />
                        Email Developer
                      </Button>
                    </div>

                    <p className="text-xs text-center text-muted-foreground">
                      Contact buttons disabled in preview
                    </p>
                  </div>

                  {/* Status Badge Card */}
                  <div className="border rounded-xl p-4 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-sm font-medium">
                        {statusLabels[data.status] || 'Status Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
