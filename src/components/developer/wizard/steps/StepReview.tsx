import { useState } from 'react';
import { Edit2, MapPin, Building, DollarSign, Calendar, Sparkles, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProjectWizard } from '../ProjectWizardContext';
import { ProjectPreviewDialog } from './ProjectPreviewDialog';

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
};

interface StepReviewProps {
  onEditStep: (step: number) => void;
}

export function StepReview({ onEditStep }: StepReviewProps) {
  const { data } = useProjectWizard();
  const [showPreview, setShowPreview] = useState(false);

  const formatPrice = (price: number) => {
    return `₪${price.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold mb-1">Review Your Project</h2>
          <p className="text-muted-foreground">
            Please review all the information before submitting.
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowPreview(true)} className="gap-2 rounded-xl">
          <Eye className="h-4 w-4" />
          Preview as Buyer
        </Button>
      </div>

      <ProjectPreviewDialog open={showPreview} onOpenChange={setShowPreview} />

      {/* Main Image Preview */}
      {data.images.length > 0 && (
        <div className="relative aspect-video rounded-lg overflow-hidden">
          <img
            src={data.images[0]}
            alt={data.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 text-white">
            <h3 className="text-2xl font-bold">{data.name || 'Untitled Project'}</h3>
            <div className="flex items-center gap-1 text-white/90">
              <MapPin className="h-4 w-4" />
              <span>{data.city}{data.neighborhood ? `, ${data.neighborhood}` : ''}</span>
            </div>
          </div>
        </div>
      )}

      {/* Basics Section */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold flex items-center gap-2">
            <Building className="h-4 w-4" />
            Project Basics
          </h4>
          <Button variant="ghost" size="sm" onClick={() => onEditStep(0)}>
            <Edit2 className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
        <div className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name:</span>
            <span className="font-medium">{data.name || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Location:</span>
            <span className="font-medium">
              {data.city}{data.neighborhood ? `, ${data.neighborhood}` : ''}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Address:</span>
            <span className="font-medium">{data.address || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status:</span>
            <Badge variant="outline">{statusLabels[data.status]}</Badge>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Project Details
          </h4>
          <Button variant="ghost" size="sm" onClick={() => onEditStep(1)}>
            <Edit2 className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
        <div className="grid gap-2 text-sm">
          {data.total_units && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Units:</span>
              <span className="font-medium">{data.total_units}</span>
            </div>
          )}
          {data.available_units !== undefined && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Available Units:</span>
              <span className="font-medium">{data.available_units}</span>
            </div>
          )}
          {(data.price_from || data.price_to) && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price Range:</span>
              <span className="font-medium">
                {data.price_from && formatPrice(data.price_from)}
                {data.price_from && data.price_to && ' - '}
                {data.price_to && formatPrice(data.price_to)}
              </span>
            </div>
          )}
          {data.construction_progress_percent > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Progress:</span>
              <span className="font-medium">{data.construction_progress_percent}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Timeline Section */}
      {(data.construction_start || data.completion_date) && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </h4>
            <Button variant="ghost" size="sm" onClick={() => onEditStep(1)}>
              <Edit2 className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
          <div className="grid gap-2 text-sm">
            {data.construction_start && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Construction Start:</span>
                <span className="font-medium">{new Date(data.construction_start).toLocaleDateString()}</span>
              </div>
            )}
            {data.completion_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expected Completion:</span>
                <span className="font-medium">{new Date(data.completion_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Amenities Section */}
      {data.amenities.length > 0 && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Amenities
            </h4>
            <Button variant="ghost" size="sm" onClick={() => onEditStep(2)}>
              <Edit2 className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.amenities.map((amenity) => (
              <Badge key={amenity} variant="secondary">
                {amenityLabels[amenity] || amenity}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Description Preview */}
      {data.description && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold">Description</h4>
            <Button variant="ghost" size="sm" onClick={() => onEditStep(4)}>
              <Edit2 className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
          <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-4">
            {data.description}
          </p>
        </div>
      )}

      {/* Photos count */}
      <div className="bg-muted/50 p-4 rounded-lg flex items-center justify-between">
        <span className="text-sm">
          <span className="font-medium">{data.images.length}</span> images
          {data.floor_plans.length > 0 && (
            <>, <span className="font-medium">{data.floor_plans.length}</span> floor plans</>
          )}
        </span>
        <Button variant="ghost" size="sm" onClick={() => onEditStep(3)}>
          <Edit2 className="h-4 w-4 mr-1" />
          Edit Photos
        </Button>
      </div>
    </div>
  );
}
