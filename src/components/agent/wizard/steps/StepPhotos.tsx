import { SortableImageUpload } from '@/components/agent/SortableImageUpload';
import { usePropertyWizard } from '../PropertyWizardContext';
import { Camera, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function StepPhotos() {
  const { data, updateData } = usePropertyWizard();
  
  const minPhotos = data.bedrooms + (data.additional_rooms || 0) + data.bathrooms;
  const safeMinPhotos = Math.max(minPhotos, 3); // At least 3 no matter what
  const recommendedPhotos = safeMinPhotos + 2;
  const hasEnoughPhotos = data.images.length >= safeMinPhotos;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-1">Photos</h2>
        <p className="text-muted-foreground">
          Great photos are the #1 factor in getting buyer interest
        </p>
      </div>

      <div className="space-y-6">
        {/* Photo tips */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-muted/30 border border-primary/10">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Camera className="h-4 w-4 text-primary" />
            </div>
            Photo Tips
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1.5 ml-10">
            <li>• Use landscape orientation (horizontal)</li>
            <li>• Take photos during daylight with lights on</li>
            <li>• Include living room, kitchen, bedrooms, bathrooms, balcony</li>
            <li>• Show the view if it's a selling point</li>
            <li>• First photo will be the cover image</li>
          </ul>
        </div>

        {/* Status */}
        {data.images.length > 0 && (
          <Alert variant={hasEnoughPhotos ? "default" : "destructive"} className={hasEnoughPhotos ? "border-primary/20 bg-primary/5" : ""}>
            {hasEnoughPhotos ? (
              <CheckCircle className="h-4 w-4 text-primary" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {data.images.length} photo{data.images.length !== 1 ? 's' : ''} uploaded
              {data.images.length < recommendedPhotos && hasEnoughPhotos && (
                <span className="text-muted-foreground">
                  {' '}— We recommend at least {recommendedPhotos} photos
                </span>
              )}
              {!hasEnoughPhotos && (
                <span>
                  {' '}— Minimum {safeMinPhotos} photos required ({data.bedrooms} bed{data.bedrooms !== 1 ? 's' : ''} + {data.additional_rooms || 0} room{(data.additional_rooms || 0) !== 1 ? 's' : ''} + {data.bathrooms} bath{data.bathrooms !== 1 ? 's' : ''})
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Sortable Image Upload */}
        <SortableImageUpload
          images={data.images}
          onImagesChange={(images) => updateData({ images })}
          maxImages={20}
          minImages={safeMinPhotos}
        />

        {data.images.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">
            Upload at least {minPhotos} photos to continue
          </p>
        )}
      </div>
    </div>
  );
}
