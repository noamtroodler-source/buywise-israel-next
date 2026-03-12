import { useState, useEffect, useCallback } from 'react';
import { X, MapPin, Building, Calendar, TrendingUp, ChevronLeft, ChevronRight, MessageCircle, Mail, Users, Sparkles, FileImage, ExternalLink, BedDouble, Bath, Maximize, Layers, Trees } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

const outdoorLabels: Record<string, string> = {
  balcony: 'Balcony',
  garden: 'Garden',
  roof_terrace: 'Roof Terrace',
  none: 'None',
};

export function ProjectPreviewDialog({ open, onOpenChange }: ProjectPreviewDialogProps) {
  const { data } = useProjectWizard();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedFloorPlan, setSelectedFloorPlan] = useState<{ url: string; type: string } | null>(null);

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

  const formatRange = (min: number | undefined, max: number | undefined, suffix = '') => {
    if (!min && !max) return 'N/A';
    if (min === max || !max) return `${min}${suffix}`;
    if (!min) return `${max}${suffix}`;
    return `${min}-${max}${suffix}`;
  };

  const calculatePricePerSqm = (priceMin: number | undefined, sizeMin: number | undefined, sizeMax: number | undefined) => {
    if (!priceMin || (!sizeMin && !sizeMax)) return null;
    const avgSize = sizeMin && sizeMax ? (sizeMin + sizeMax) / 2 : (sizeMin || sizeMax || 0);
    if (avgSize === 0) return null;
    return Math.round(priceMin / avgSize);
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

                {/* Floor Plans & Units Table */}
                {data.unit_types.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <FileImage className="h-5 w-5 text-primary" />
                        Floor Plans & Units
                      </h2>
                      
                      {/* Desktop Table */}
                      <div className="hidden md:block rounded-xl border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead>Unit Type</TableHead>
                              <TableHead>Floor Plan</TableHead>
                              <TableHead className="text-center">Rooms</TableHead>
                              <TableHead className="text-center">Baths</TableHead>
                              <TableHead>Size</TableHead>
                              <TableHead>Floors</TableHead>
                              <TableHead>Outdoor</TableHead>
                              <TableHead className="text-right">Price From</TableHead>
                              <TableHead className="text-right">Price/m²</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.unit_types.map((unit, index) => {
                              const pricePerSqm = calculatePricePerSqm(unit.priceMin, unit.sizeMin, unit.sizeMax);
                              return (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">{unit.name}</TableCell>
                                  <TableCell>
                                    {unit.floorPlanUrl ? (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedFloorPlan({ url: unit.floorPlanUrl!, type: unit.name })}
                                        className="h-8 text-primary hover:text-primary"
                                      >
                                        <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                        View
                                      </Button>
                                    ) : (
                                      <span className="text-muted-foreground text-sm">Coming Soon</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <BedDouble className="h-3.5 w-3.5 text-muted-foreground" />
                                      {unit.bedrooms}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <Bath className="h-3.5 w-3.5 text-muted-foreground" />
                                      {unit.bathrooms}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      <Maximize className="h-3.5 w-3.5 text-muted-foreground" />
                                      {formatRange(unit.sizeMin, unit.sizeMax, ' m²')}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                                      {formatRange(unit.floorMin, unit.floorMax)}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      <Trees className="h-3.5 w-3.5 text-muted-foreground" />
                                      {outdoorLabels[unit.outdoorSpace] || 'None'}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {unit.priceMin ? formatPrice(unit.priceMin) : 'TBD'}
                                  </TableCell>
                                  <TableCell className="text-right text-muted-foreground">
                                    {pricePerSqm ? `₪${pricePerSqm.toLocaleString()}` : '—'}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Mobile Cards */}
                      <div className="md:hidden space-y-3">
                        {data.unit_types.map((unit, index) => {
                          const pricePerSqm = calculatePricePerSqm(unit.priceMin, unit.sizeMin, unit.sizeMax);
                          return (
                            <div key={index} className="border rounded-xl p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold">{unit.name}</h3>
                                {unit.floorPlanUrl && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedFloorPlan({ url: unit.floorPlanUrl!, type: unit.name })}
                                    className="h-8 text-primary"
                                  >
                                    <FileImage className="h-4 w-4 mr-1" />
                                    Floor Plan
                                  </Button>
                                )}
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-sm">
                                <div className="flex items-center gap-1">
                                  <BedDouble className="h-4 w-4 text-muted-foreground" />
                                  <span>{unit.bedrooms} bed</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Bath className="h-4 w-4 text-muted-foreground" />
                                  <span>{unit.bathrooms} bath</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Maximize className="h-4 w-4 text-muted-foreground" />
                                  <span>{formatRange(unit.sizeMin, unit.sizeMax, ' m²')}</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t">
                                <span className="text-muted-foreground text-sm">From</span>
                                <div className="text-right">
                                  <div className="font-semibold text-primary">
                                    {unit.priceMin ? formatPrice(unit.priceMin) : 'TBD'}
                                  </div>
                                  {pricePerSqm && (
                                    <div className="text-xs text-muted-foreground">
                                      ₪{pricePerSqm.toLocaleString()}/m²
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
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

      {/* Floor Plan Modal */}
      <Dialog open={!!selectedFloorPlan} onOpenChange={(open) => !open && setSelectedFloorPlan(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5 text-primary" />
              {selectedFloorPlan?.type} - Floor Plan
            </DialogTitle>
          </DialogHeader>
          <div className="relative aspect-[4/3] w-full bg-muted rounded-lg overflow-hidden">
            {selectedFloorPlan && (
              <img
                src={selectedFloorPlan.url}
                alt={`${selectedFloorPlan.type} floor plan`}
                className="w-full h-full object-contain"
              />
            )}
          </div>
          <div className="flex justify-center">
            <Button variant="outline" disabled className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Open Full Size
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
