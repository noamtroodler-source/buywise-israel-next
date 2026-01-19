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
  X, MapPin, Bed, Bath, Ruler, Building2, User
} from 'lucide-react';
import { useState } from 'react';

interface PropertyPreviewModalProps {
  property: PropertyForReview;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PropertyPreviewModal({ property, open, onOpenChange }: PropertyPreviewModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  const images = property.images && property.images.length > 0 
    ? property.images 
    : ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Property Preview: {property.title}</DialogTitle>
        </DialogHeader>
        
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-10 bg-background/80 backdrop-blur-sm rounded-full"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
        </Button>

        <ScrollArea className="max-h-[90vh]">
          {/* Hero Image */}
          <div className="relative aspect-[16/9] w-full bg-muted">
            <img
              src={images[selectedImageIndex]}
              alt={property.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 flex gap-2">
              {getStatusBadge()}
              <Badge variant="outline" className="bg-background/80 backdrop-blur-sm capitalize">
                {property.property_type.replace('_', ' ')}
              </Badge>
            </div>
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex gap-2 p-4 overflow-x-auto bg-muted/30">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImageIndex(i)}
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

          <div className="p-6 space-y-6">
            {/* Title & Price */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">{property.title}</h2>
                <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
                  <MapPin className="h-4 w-4" />
                  <span>{property.address}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {property.city}{property.neighborhood && ` • ${property.neighborhood}`}
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">{formatPrice(property.price)}</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {property.property_type.replace('_', ' ')}
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-xl">
              {property.bedrooms && (
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-background rounded-lg">
                    <Bed className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{property.bedrooms}</p>
                    <p className="text-xs text-muted-foreground">Bedrooms</p>
                  </div>
                </div>
              )}
              {property.bathrooms && (
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-background rounded-lg">
                    <Bath className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{property.bathrooms}</p>
                    <p className="text-xs text-muted-foreground">Bathrooms</p>
                  </div>
                </div>
              )}
              {property.size_sqm && (
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-background rounded-lg">
                    <Ruler className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{property.size_sqm}</p>
                    <p className="text-xs text-muted-foreground">sqm</p>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {property.description && (
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground whitespace-pre-line">{property.description}</p>
              </div>
            )}

            {/* Agent Info */}
            {property.agent && (
              <div className="p-4 bg-muted/50 rounded-xl">
                <h3 className="font-semibold mb-3">Listed By</h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{property.agent.name}</p>
                    {property.agent.agency_name && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        {property.agent.agency_name}
                      </p>
                    )}
                  </div>
                  {property.agent.is_verified && (
                    <Badge variant="outline" className="ml-auto">Verified Agent</Badge>
                  )}
                </div>
              </div>
            )}

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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
