import { useState } from 'react';
import { usePropertyWizard } from '../PropertyWizardContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, Bed, Bath, Ruler, Building, Calendar, Car,
  Thermometer, CheckCircle, Edit2, Eye
} from 'lucide-react';
import { PropertyPreviewDialog } from './PropertyPreviewDialog';

interface StepReviewProps {
  onEditStep: (step: number) => void;
}

export function StepReview({ onEditStep }: StepReviewProps) {
  const { data } = usePropertyWizard();
  const [showPreview, setShowPreview] = useState(false);

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

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">Review Your Listing</h2>
          <p className="text-muted-foreground">
            Make sure everything looks good before submitting
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowPreview(true)} className="gap-2 rounded-xl">
          <Eye className="h-4 w-4" />
          Preview as Buyer
        </Button>
      </div>

      <PropertyPreviewDialog open={showPreview} onOpenChange={setShowPreview} />

      {/* Preview Card */}
      <Card className="overflow-hidden rounded-2xl border-primary/20">
        {/* Cover Image */}
        {data.images.length > 0 && (
          <div className="aspect-video relative">
            <img
              src={data.images[0]}
              alt="Cover"
              className="w-full h-full object-cover"
            />
            <Badge className="absolute top-3 left-3 rounded-lg">
              {data.listing_status === 'for_sale' ? 'For Sale' : 'For Rent'}
            </Badge>
          </div>
        )}

        <CardContent className="p-6 space-y-6">
          {/* Title & Price */}
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold">{data.title || 'Untitled'}</h3>
              <p className="text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-4 w-4" />
                {data.address}, {data.neighborhood && `${data.neighborhood}, `}{data.city}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">
                {formatPrice(data.price)}
              </p>
              {data.listing_status === 'for_rent' && (
                <p className="text-sm text-muted-foreground">/month</p>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => onEditStep(0)} className="rounded-lg">
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-4 py-4 border-y border-border">
            <div className="flex items-center gap-1.5">
              <Bed className="h-4 w-4 text-muted-foreground" />
              <span>{data.bedrooms} beds{data.additional_rooms ? ` + ${data.additional_rooms} other` : ''}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bath className="h-4 w-4 text-muted-foreground" />
              <span>{data.bathrooms} baths</span>
            </div>
            {data.size_sqm && (
              <div className="flex items-center gap-1.5">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <span>{data.size_sqm} m²</span>
              </div>
            )}
            {data.floor !== undefined && (
              <div className="flex items-center gap-1.5">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span>Floor {data.floor}{data.total_floors && ` of ${data.total_floors}`}</span>
              </div>
            )}
            {data.parking > 0 && (
              <div className="flex items-center gap-1.5">
                <Car className="h-4 w-4 text-muted-foreground" />
                <span>{data.parking} parking</span>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={() => onEditStep(1)} className="rounded-lg ml-auto">
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Featured Highlight */}
          {data.featured_highlight && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border-l-4 border-primary">
              <CheckCircle className="h-4 w-4 text-primary fill-primary" />
              <span className="text-sm font-medium">{data.featured_highlight}</span>
            </div>
          )}

          {/* Features */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">Features</h4>
              <Button variant="ghost" size="sm" onClick={() => onEditStep(2)} className="rounded-lg">
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="rounded-lg">{conditionLabels[data.condition] || data.condition}</Badge>
              {data.ac_type !== 'none' && (
                <Badge variant="outline" className="flex items-center gap-1 rounded-lg">
                  <Thermometer className="h-3 w-3" />
                  A/C
                </Badge>
              )}
              {data.is_immediate_entry && (
                <Badge variant="outline" className="flex items-center gap-1 rounded-lg">
                  <Calendar className="h-3 w-3" />
                  Immediate Entry
                </Badge>
              )}
              {data.features.map((f) => (
                <Badge key={f} variant="secondary" className="rounded-lg">
                  {featureLabels[f] || f}
                </Badge>
              ))}
            </div>
          </div>

          {/* Photos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">Photos ({data.images.length})</h4>
              <Button variant="ghost" size="sm" onClick={() => onEditStep(3)} className="rounded-lg">
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {data.images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`Photo ${i + 1}`}
                  className="h-16 w-16 object-cover rounded-xl flex-shrink-0"
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">Description</h4>
              <Button variant="ghost" size="sm" onClick={() => onEditStep(4)} className="rounded-lg">
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
            {data.highlights.length > 0 && (
              <ul className="mb-3 space-y-1">
                {data.highlights.map((h, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    {h}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-sm text-muted-foreground line-clamp-4">
              {data.description || 'No description provided'}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-muted/30 border border-primary/10">
        <p className="text-sm text-center text-muted-foreground">
          After submission, your listing will be reviewed by our team before going live.
          This usually takes less than 24 hours.
        </p>
      </div>
    </div>
  );
}
