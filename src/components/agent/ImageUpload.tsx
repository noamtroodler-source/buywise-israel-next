import { useState, useCallback } from 'react';
import { Upload, X, Loader2, AlertTriangle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export function ImageUpload({ images, onImagesChange, maxImages = 10 }: ImageUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [enhancingCount, setEnhancingCount] = useState(0);
  const [brokenImages, setBrokenImages] = useState<Set<number>>(new Set());

  const handleImageError = (index: number) => {
    setBrokenImages(prev => new Set(prev).add(index));
  };

  const uploadImage = useCallback(async (file: File) => {
    if (!user) {
      toast.error('Must be logged in to upload images');
      return null;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('property-images')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('property-images')
      .getPublicUrl(fileName);

    return publicUrl;
  }, [user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    setUploading(true);
    try {
      const uploadPromises = filesToUpload.map(uploadImage);
      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter(Boolean) as string[];
      
      const allImages = [...images, ...validUrls];
      onImagesChange(allImages);
      toast.success(`${validUrls.length} image(s) uploaded`);
      setUploading(false);

      // Background AI enhancement
      if (validUrls.length > 0) {
        setEnhancingCount(validUrls.length);
        toast.info(`Enhancing ${validUrls.length} image(s) with AI...`);

        const enhancedResults = await Promise.allSettled(
          validUrls.map(async (url) => {
            try {
              const enhancePath = `property-images/enhanced-${crypto.randomUUID()}.png`;
              const { data, error } = await supabase.functions.invoke('enhance-image', {
                body: { image_url: url, bucket: 'property-images', path: enhancePath },
              });
              if (error || !data?.success || !data?.enhanced) return url;
              return data.image_url || url;
            } catch { return url; }
          })
        );

        const enhancedUrls = enhancedResults.map((r, i) =>
          r.status === 'fulfilled' ? r.value : validUrls[i]
        );

        const updatedImages = allImages.map(url => {
          const origIdx = validUrls.indexOf(url);
          return origIdx >= 0 ? enhancedUrls[origIdx] : url;
        });
        onImagesChange(updatedImages);

        const count = enhancedResults.filter(
          (r, i) => r.status === 'fulfilled' && r.value !== validUrls[i]
        ).length;
        if (count > 0) toast.success(`${count} image(s) enhanced with AI`);
        setEnhancingCount(0);
      }
    } catch (error) {
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
      setEnhancingCount(0);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    // Also remove from broken images set
    setBrokenImages(prev => {
      const updated = new Set(prev);
      updated.delete(index);
      // Shift down indices for images after the removed one
      const shifted = new Set<number>();
      updated.forEach(i => {
        if (i > index) shifted.add(i - 1);
        else shifted.add(i);
      });
      return shifted;
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((url, index) => {
          const isBroken = brokenImages.has(index);
          return (
            <div 
              key={index} 
              className={cn(
                "relative aspect-square rounded-lg overflow-hidden group",
                isBroken ? "border-2 border-destructive bg-destructive/5" : ""
              )}
            >
              {isBroken ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-3 bg-destructive/10">
                  <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
                  <span className="text-sm text-destructive font-medium">Failed to load</span>
                  <span className="text-xs text-muted-foreground mt-1">Remove and re-upload</span>
                </div>
              ) : (
                <img
                  src={url}
                  alt={`Property image ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={() => handleImageError(index)}
                />
              )}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className={cn(
                  "absolute top-2 right-2 h-6 w-6 transition-opacity",
                  isBroken ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
                onClick={() => removeImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          );
        })}
        
        {images.length < maxImages && (
          <label
            className={cn(
              "aspect-square rounded-lg border-2 border-dashed border-border",
              "flex flex-col items-center justify-center gap-2 cursor-pointer",
              "hover:border-primary hover:bg-primary/5 transition-colors",
              uploading && "pointer-events-none opacity-50"
            )}
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Upload</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>
        )}
      </div>
      {enhancingCount > 0 && (
        <div className="flex items-center justify-center gap-2 text-sm text-primary">
          <Sparkles className="h-4 w-4 animate-pulse" />
          <span>Enhancing {enhancingCount} image(s) with AI...</span>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        {images.length} of {maxImages} images uploaded
      </p>
    </div>
  );
}
