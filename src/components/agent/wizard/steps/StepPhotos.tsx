import { ImageUpload } from '@/components/agent/ImageUpload';
import { usePropertyWizard } from '../PropertyWizardContext';
import { Camera, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function StepPhotos() {
  const { data, updateData } = usePropertyWizard();
  
  const minPhotos = 1;
  const recommendedPhotos = 5;
  const hasEnoughPhotos = data.images.length >= minPhotos;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Photos</h2>
        <p className="text-sm text-muted-foreground">
          Great photos are the #1 factor in getting buyer interest
        </p>
      </div>

      {/* Photo tips */}
      <div className="bg-muted/50 p-4 rounded-lg space-y-2">
        <h3 className="font-medium flex items-center gap-2">
          <Camera className="h-4 w-4" />
          Photo Tips
        </h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Use landscape orientation (horizontal)</li>
          <li>• Take photos during daylight with lights on</li>
          <li>• Include living room, kitchen, bedrooms, bathrooms, balcony</li>
          <li>• Show the view if it's a selling point</li>
          <li>• First photo will be the cover image</li>
        </ul>
      </div>

      {/* Status */}
      {data.images.length > 0 && (
        <Alert variant={hasEnoughPhotos ? "default" : "destructive"}>
          {hasEnoughPhotos ? (
            <CheckCircle className="h-4 w-4" />
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
                {' '}— Minimum {minPhotos} photo required to continue
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Image Upload */}
      <ImageUpload
        images={data.images}
        onImagesChange={(images) => updateData({ images })}
        maxImages={20}
      />

      {data.images.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Upload at least {minPhotos} photo to continue
        </p>
      )}
    </div>
  );
}
