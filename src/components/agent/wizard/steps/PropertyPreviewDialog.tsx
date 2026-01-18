import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePropertyWizard } from '../PropertyWizardContext';
import { 
  MapPin, Bed, Bath, Ruler, Building, Car, Calendar,
  Thermometer, CheckCircle, Phone, MessageCircle, X
} from 'lucide-react';

interface PropertyPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PropertyPreviewDialog({ open, onOpenChange }: PropertyPreviewDialogProps) {
  const { data } = usePropertyWizard();

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0 flex flex-row items-center justify-between">
          <DialogTitle>Listing Preview</DialogTitle>
          <p className="text-sm text-muted-foreground">
            This is how buyers will see your listing
          </p>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-80px)]">
          <div className="space-y-6 p-4">
            {/* Hero Image Gallery */}
            {data.images.length > 0 ? (
              <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-muted">
                <img
                  src={data.images[0]}
                  alt="Property"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge className="bg-primary text-primary-foreground">
                    {data.listing_status === 'for_sale' ? 'For Sale' : 'For Rent'}
                  </Badge>
                  <Badge variant="secondary">
                    {propertyTypeLabels[data.property_type] || data.property_type}
                  </Badge>
                </div>
                {data.images.length > 1 && (
                  <div className="absolute bottom-4 right-4">
                    <Badge variant="secondary" className="bg-black/60 text-white">
                      +{data.images.length - 1} photos
                    </Badge>
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-[16/9] rounded-lg bg-muted flex items-center justify-center">
                <p className="text-muted-foreground">No photos uploaded</p>
              </div>
            )}

            {/* Thumbnail strip */}
            {data.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {data.images.slice(0, 6).map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`Photo ${i + 1}`}
                    className="h-16 w-24 object-cover rounded-md flex-shrink-0"
                  />
                ))}
                {data.images.length > 6 && (
                  <div className="h-16 w-24 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                    <span className="text-sm text-muted-foreground">+{data.images.length - 6}</span>
                  </div>
                )}
              </div>
            )}

            {/* Main Content */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column - Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Title & Location */}
                <div>
                  <h1 className="text-2xl font-bold">{data.title || 'Untitled Listing'}</h1>
                  <p className="text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-4 w-4" />
                    {data.address}, {data.neighborhood && `${data.neighborhood}, `}{data.city}
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="flex flex-wrap gap-6 py-4 border-y">
                  <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">{data.bedrooms}</p>
                      <p className="text-xs text-muted-foreground">Bedrooms</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">{data.bathrooms}</p>
                      <p className="text-xs text-muted-foreground">Bathrooms</p>
                    </div>
                  </div>
                  {data.size_sqm && (
                    <div className="flex items-center gap-2">
                      <Ruler className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-semibold">{data.size_sqm} m²</p>
                        <p className="text-xs text-muted-foreground">Living Area</p>
                      </div>
                    </div>
                  )}
                  {data.floor !== undefined && (
                    <div className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-semibold">{data.floor}{data.total_floors && `/${data.total_floors}`}</p>
                        <p className="text-xs text-muted-foreground">Floor</p>
                      </div>
                    </div>
                  )}
                  {data.parking > 0 && (
                    <div className="flex items-center gap-2">
                      <Car className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-semibold">{data.parking}</p>
                        <p className="text-xs text-muted-foreground">Parking</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Highlights */}
                {data.highlights.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Highlights</h3>
                    <ul className="grid sm:grid-cols-2 gap-2">
                      {data.highlights.map((h, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Description */}
                <div>
                  <h3 className="font-semibold mb-3">About this property</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {data.description || 'No description provided'}
                  </p>
                </div>

                {/* Features */}
                <div>
                  <h3 className="font-semibold mb-3">Features & Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{conditionLabels[data.condition] || data.condition}</Badge>
                    {data.ac_type !== 'none' && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Thermometer className="h-3 w-3" />
                        {data.ac_type === 'central' ? 'Central A/C' : 
                         data.ac_type === 'mini_central' ? 'Mini Central A/C' : 'Split A/C'}
                      </Badge>
                    )}
                    {data.is_immediate_entry && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Immediate Entry
                      </Badge>
                    )}
                    {data.features.map((f) => (
                      <Badge key={f} variant="secondary">
                        {featureLabels[f] || f}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Sticky Contact Card */}
              <div className="lg:col-span-1">
                <div className="sticky top-4 rounded-lg border bg-card p-6 space-y-4">
                  {/* Price */}
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">
                      {formatPrice(data.price)}
                    </p>
                    {data.listing_status === 'for_rent' && (
                      <p className="text-sm text-muted-foreground">/month</p>
                    )}
                    {data.size_sqm && data.size_sqm > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatPrice(Math.round(data.price / data.size_sqm))}/m²
                      </p>
                    )}
                  </div>

                  {/* Monthly Costs Preview */}
                  {data.vaad_bayit_monthly && (
                    <div className="text-sm text-center text-muted-foreground border-t pt-4">
                      Building fee: ₪{data.vaad_bayit_monthly}/mo
                    </div>
                  )}

                  {/* Mock Contact Buttons */}
                  <div className="space-y-2">
                    <Button className="w-full gap-2" disabled>
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </Button>
                    <Button variant="outline" className="w-full gap-2" disabled>
                      <Phone className="h-4 w-4" />
                      Call Agent
                    </Button>
                  </div>
                  
                  <p className="text-xs text-center text-muted-foreground">
                    Contact buttons disabled in preview
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}