import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  X, ChevronLeft, ChevronRight, MapPin, Building2, Calendar,
  Home, TrendingUp, Phone, Mail, MessageCircle, Info, Clock
} from 'lucide-react';
import { AdminProject } from '@/hooks/useAdminProjects';
import useEmblaCarousel from 'embla-carousel-react';

interface ProjectPreviewModalProps {
  project: AdminProject;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
  gym: 'Fitness Center',
  pool: 'Swimming Pool',
  spa: 'Spa & Wellness',
  rooftop: 'Rooftop Terrace',
  garden: 'Gardens',
  parking: 'Underground Parking',
  storage: 'Storage Rooms',
  mamad: 'Safe Rooms (ממ״ד)',
  shabbat_elevator: 'Shabbat Elevator',
  accessible: 'Full Accessibility',
  shul: 'Synagogue (בית כנסת)',
  mikvah: 'Mikvah (מקווה)',
  sukkot_area: 'Designated Sukkot Area',
  playground: 'Playground',
  doorman: 'Doorman',
  coworking: 'Co-Working Space',
  ev_charging: 'EV Charging',
  smart_home: 'Smart Home',
  generator: 'Backup Generator',
  solar: 'Solar Panels',
  dog_park: 'Dog Park',
  tennis: 'Tennis Court',
  basketball: 'Basketball Court',
  bbq_area: 'BBQ Area',
  wine_cellar: 'Wine Cellar',
  cinema: 'Private Cinema',
  guest_suite: 'Guest Suite',
  bike_storage: 'Bike Storage',
  package_lockers: 'Package Lockers',
  club_room: 'Club Room',
  kids_room: 'Kids Room',
};

export function ProjectPreviewModal({ project, open, onOpenChange }: ProjectPreviewModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  const images = project.images || [];

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

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) {
      emblaApi.scrollTo(index);
      setSelectedImageIndex(index);
    }
  }, [emblaApi]);

  const formatPrice = (price: number | null) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const description = project.description || '';
  const shouldTruncate = description.length > 300;
  const displayDescription = shouldTruncate && !isDescriptionExpanded
    ? description.slice(0, 300) + '...'
    : description;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0 overflow-hidden">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-50 bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
        </Button>

        <ScrollArea className="h-full">
          <div className="p-6">
            {/* Admin Preview Banner */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-6 flex items-center gap-2">
              <Info className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm text-primary">
                <strong>Admin Preview</strong> — This shows how buyers will see this project after approval
              </span>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column - Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Hero Image Carousel */}
                <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-muted">
                  {images.length > 0 ? (
                    <>
                      <div className="overflow-hidden h-full" ref={emblaRef}>
                        <div className="flex h-full">
                          {images.map((img, index) => (
                            <div key={index} className="flex-[0_0_100%] min-w-0 h-full">
                              <img
                                src={img}
                                alt={`${project.name} - Image ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Navigation Arrows */}
                      {images.length > 1 && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background"
                            onClick={scrollPrev}
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background"
                            onClick={scrollNext}
                          >
                            <ChevronRight className="h-5 w-5" />
                          </Button>
                        </>
                      )}

                      {/* Image Counter */}
                      <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md text-sm">
                        {selectedImageIndex + 1} / {images.length}
                      </div>

                      {/* Progress Dots */}
                      {images.length > 1 && (
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {images.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => scrollTo(index)}
                              className={`h-1.5 rounded-full transition-all ${
                                index === selectedImageIndex
                                  ? 'w-6 bg-white'
                                  : 'w-1.5 bg-white/50 hover:bg-white/75'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Thumbnail Strip */}
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => scrollTo(index)}
                        className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                          index === selectedImageIndex
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-transparent hover:border-muted-foreground/30'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Title & Location */}
                <div>
                  <h1 className="text-2xl font-bold mb-2">{project.name}</h1>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{project.city}{project.neighborhood && `, ${project.neighborhood}`}</span>
                  </div>
                </div>

                {/* Key Stats Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-xl">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                      <Home className="h-4 w-4" />
                      <span className="text-xs">Total Units</span>
                    </div>
                    <p className="font-semibold">{project.total_units || 'TBD'}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                      <Calendar className="h-4 w-4" />
                      <span className="text-xs">Completion</span>
                    </div>
                    <p className="font-semibold">
                      {project.completion_date
                        ? new Date(project.completion_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                        : 'TBD'}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-xs">Progress</span>
                    </div>
                    <p className="font-semibold">{project.construction_progress_percent ?? 0}%</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs">Available</span>
                    </div>
                    <p className="font-semibold">{project.available_units ?? project.total_units ?? 'TBD'} units</p>
                  </div>
                </div>

                <Separator />

                {/* Description */}
                <div>
                  <h2 className="text-lg font-semibold mb-3">About This Project</h2>
                  {description ? (
                    <div>
                      <p className="text-muted-foreground whitespace-pre-line">{displayDescription}</p>
                      {shouldTruncate && (
                        <Button
                          variant="link"
                          className="px-0 h-auto text-primary"
                          onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        >
                          {isDescriptionExpanded ? 'Show less' : 'Read more'}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">No description provided</p>
                  )}
                </div>

                {/* Amenities */}
                {project.amenities && project.amenities.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h2 className="text-lg font-semibold mb-3">Amenities & Features</h2>
                      <div className="flex flex-wrap gap-2">
                        {project.amenities.map((amenity) => (
                          <Badge key={amenity} variant="secondary" className="text-sm py-1 px-3">
                            {amenityLabels[amenity] || amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Previous Feedback */}
                {project.admin_feedback && (
                  <>
                    <Separator />
                    <div className="bg-muted/50 border rounded-lg p-4">
                      <h3 className="font-medium mb-2 flex items-center gap-2">
                        <Info className="h-4 w-4 text-muted-foreground" />
                        Previous Admin Feedback
                      </h3>
                      <p className="text-sm text-muted-foreground">{project.admin_feedback}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Right Column - Sticky Card */}
              <div className="lg:col-span-1">
                <div className="sticky top-6 space-y-4">
                  {/* Price Card */}
                  <div className="border rounded-xl p-5 space-y-4 bg-card">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Starting from</p>
                      <p className="text-2xl font-bold text-primary">
                        {formatPrice(project.price_from)}
                      </p>
                      {project.price_to && project.price_from !== project.price_to && (
                        <p className="text-sm text-muted-foreground">
                          up to {formatPrice(project.price_to)}
                        </p>
                      )}
                    </div>

                    <Separator />

                    {/* Unit Availability */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Available Units</span>
                      <span className="font-medium">
                        {project.available_units ?? project.total_units ?? 'TBD'} of {project.total_units ?? 'TBD'}
                      </span>
                    </div>

                    <Separator />

                    {/* Disabled Contact Buttons */}
                    <div className="space-y-2">
                      <Button className="w-full gap-2" disabled>
                        <MessageCircle className="h-4 w-4" />
                        WhatsApp
                      </Button>
                      <Button variant="outline" className="w-full gap-2" disabled>
                        <Mail className="h-4 w-4" />
                        Email
                      </Button>
                      <Button variant="outline" className="w-full gap-2" disabled>
                        <Phone className="h-4 w-4" />
                        Call
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                      Contact buttons are disabled in preview mode
                    </p>
                  </div>

                  {/* Developer Info */}
                  {project.developer && (
                    <div className="border rounded-xl p-4 bg-card">
                      <p className="text-sm text-muted-foreground mb-2">Developer</p>
                      <div className="flex items-center gap-3">
                        {project.developer.logo_url ? (
                          <img
                            src={project.developer.logo_url}
                            alt={project.developer.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{project.developer.name}</p>
                          {project.developer.is_verified && (
                            <Badge variant="secondary" className="text-xs">Verified</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
