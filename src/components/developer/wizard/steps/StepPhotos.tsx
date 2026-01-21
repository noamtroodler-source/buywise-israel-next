import { useState } from 'react';
import { X, Loader2, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useProjectWizard } from '../ProjectWizardContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function StepPhotos() {
  const { data, updateData } = useProjectWizard();
  const [isUploading, setIsUploading] = useState(false);
  const [brokenImages, setBrokenImages] = useState<Set<number>>(new Set());

  const handleImageError = (index: number) => {
    setBrokenImages(prev => new Set(prev).add(index));
  };


  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 5MB)`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `projects/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(fileName, file);

        if (uploadError) {
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(fileName);

        newUrls.push(publicUrl);
      }

      if (newUrls.length > 0) {
        updateData({ images: [...data.images, ...newUrls] });
        toast.success(`Uploaded ${newUrls.length} image${newUrls.length > 1 ? 's' : ''}`);
      }
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    const updated = data.images.filter((_, i) => i !== index);
    updateData({ images: updated });
    // Update broken images set
    setBrokenImages(prev => {
      const updated = new Set(prev);
      updated.delete(index);
      const shifted = new Set<number>();
      updated.forEach(i => {
        if (i > index) shifted.add(i - 1);
        else shifted.add(i);
      });
      return shifted;
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">Project Photos</h2>
        <p className="text-muted-foreground mb-6">
          Upload high-quality images for your project.
        </p>
      </div>

      {/* Project Images */}
      <div className="space-y-4">
        <Label>Project Images *</Label>
        <p className="text-sm text-muted-foreground">
          Upload renders, construction photos, or finished images. At least 1 required.
        </p>

        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {data.images.map((url, index) => {
            const isBroken = brokenImages.has(index);
            return (
              <div 
                key={index} 
                className={cn(
                  "relative aspect-video rounded-lg overflow-hidden border group",
                  isBroken && "border-2 border-destructive bg-destructive/5"
                )}
              >
                {isBroken ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-3 bg-destructive/10">
                    <AlertTriangle className="h-6 w-6 text-destructive mb-1" />
                    <span className="text-xs text-destructive font-medium">Failed to load</span>
                    <span className="text-xs text-muted-foreground">Remove and re-upload</span>
                  </div>
                ) : (
                  <img
                    src={url}
                    alt={`Project ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(index)}
                  />
                )}
                <button
                  onClick={() => removeImage(index)}
                  className={cn(
                    "absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-opacity",
                    isBroken ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}
                >
                  <X className="h-4 w-4" />
                </button>
                {index === 0 && !isBroken && (
                  <span className="absolute bottom-2 left-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                    Main
                  </span>
                )}
              </div>
            );
          })}

          <label className="flex flex-col items-center justify-center aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 cursor-pointer transition-colors">
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <>
                <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Add Photos</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

    </div>
  );
}
