import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { X, Loader2, GripVertical, Star, ImagePlus, AlertTriangle, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

interface SortableImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  minImages?: number;
}

interface SortableImageItemProps {
  url: string;
  index: number;
  onRemove: () => void;
  onSetCover: () => void;
  isFirst: boolean;
}

function SortableImageItem({ url, index, onRemove, onSetCover, isFirst }: SortableImageItemProps) {
  const [hasError, setHasError] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group rounded-xl overflow-hidden border-2 transition-all",
        hasError ? "border-destructive bg-destructive/5" :
          isFirst ? "border-primary ring-2 ring-primary/20" : "border-border",
        isDragging && "opacity-50 scale-105 shadow-xl z-50"
      )}
    >
      {/* Cover badge for first image */}
      {isFirst && !hasError && (
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-md shadow-md">
          <Star className="h-3 w-3 fill-current" />
          Cover
        </div>
      )}
      
      {/* Position number for non-cover images */}
      {!isFirst && !hasError && (
        <div className="absolute top-2 left-2 z-10 flex items-center justify-center h-6 w-6 bg-background/90 backdrop-blur-sm text-foreground text-xs font-semibold rounded-full border shadow-sm">
          {index + 1}
        </div>
      )}

      {/* Drag handle */}
      {!hasError && (
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 right-10 z-10 p-1.5 bg-background/90 backdrop-blur-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {/* Remove button - always visible when error */}
      <button
        type="button"
        onClick={onRemove}
        className={cn(
          "absolute top-2 right-2 z-10 p-1.5 bg-destructive text-destructive-foreground rounded-md transition-opacity hover:bg-destructive/90",
          hasError ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
      >
        <X className="h-4 w-4" />
      </button>

      {/* Image or Error State */}
      {hasError ? (
        <div className="w-full h-32 bg-destructive/10 flex flex-col items-center justify-center text-center p-2">
          <AlertTriangle className="h-6 w-6 text-destructive mb-1" />
          <span className="text-xs text-destructive font-medium">Failed to load</span>
          <span className="text-xs text-muted-foreground">Remove and re-upload</span>
        </div>
      ) : (
        <img
          src={url}
          alt={`Property image ${index + 1}`}
          className="w-full h-32 object-cover"
          onError={() => setHasError(true)}
        />
      )}

      {/* Set as cover button (only for non-first images without error) */}
      {!isFirst && !hasError && (
        <button
          type="button"
          onClick={onSetCover}
          className="absolute bottom-0 inset-x-0 py-1.5 bg-background/95 backdrop-blur-sm text-xs font-medium text-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background border-t"
        >
          Set as Cover
        </button>
      )}
    </div>
  );
}

export function SortableImageUpload({
  images,
  onImagesChange,
  maxImages = 20,
  minImages = 3,
}: SortableImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [enhancingCount, setEnhancingCount] = useState(0);
  const [failedUploads, setFailedUploads] = useState<{ file: File; error: string }[]>([]);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const uploadImage = useCallback(async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `property-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('property-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('property-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }, []);

  const enhanceUploadedImage = useCallback(async (publicUrl: string): Promise<string> => {
    try {
      const enhancePath = `property-images/enhanced-${crypto.randomUUID()}.png`;
      const { data, error } = await supabase.functions.invoke('enhance-image', {
        body: {
          image_url: publicUrl,
          bucket: 'property-images',
          path: enhancePath,
        },
      });

      if (error) {
        console.error('Enhancement error:', error);
        return publicUrl;
      }

      if (data?.success && data?.enhanced && data?.image_url) {
        return data.image_url;
      }
      return publicUrl;
    } catch (err) {
      console.error('Enhancement failed:', err);
      return publicUrl;
    }
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      toast({
        title: "Maximum images reached",
        description: `You can only upload up to ${maxImages} images.`,
        variant: "destructive",
      });
      return;
    }

    // Validate file sizes (10MB max)
    const MAX_SIZE = 10 * 1024 * 1024;
    const validFiles: File[] = [];
    const oversizedFiles: string[] = [];
    
    Array.from(files).slice(0, remainingSlots).forEach(file => {
      if (file.size > MAX_SIZE) {
        oversizedFiles.push(file.name);
      } else {
        validFiles.push(file);
      }
    });

    if (oversizedFiles.length > 0) {
      toast({
        title: "Files too large",
        description: `${oversizedFiles.join(', ')} exceed 10MB limit.`,
        variant: "destructive",
      });
    }

    if (validFiles.length === 0) {
      event.target.value = '';
      return;
    }

    setUploading(true);

    try {
      const results = await Promise.allSettled(validFiles.map(uploadImage));
      
      const newUrls: string[] = [];
      const newFailed: { file: File; error: string }[] = [];
      
      results.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          newUrls.push(result.value);
        } else {
          newFailed.push({ file: validFiles[i], error: result.reason?.message || 'Upload failed' });
        }
      });

      if (newFailed.length > 0) {
        setFailedUploads(prev => [...prev, ...newFailed]);
        toast({
          title: `${newFailed.length} upload(s) failed`,
          description: "You can retry failed uploads below.",
          variant: "destructive",
        });
      }

      if (newUrls.length > 0) {
        const allImages = [...images, ...newUrls];
        onImagesChange(allImages);
        setUploading(false);

        // Enhance only the cover photo (index 0) if it's among the newly uploaded batch
        const coverUrl = allImages[0];
        const isCoverNew = newUrls.includes(coverUrl);

        if (isCoverNew) {
          setEnhancingCount(1);
          sonnerToast.info('Enhancing cover photo with AI...', { duration: 3000 });

          const enhancedCover = await enhanceUploadedImage(coverUrl);

          if (enhancedCover !== coverUrl) {
            const updatedImages = allImages.map(url =>
              url === coverUrl ? enhancedCover : url
            );
            onImagesChange(updatedImages);
            sonnerToast.success('Cover photo enhanced with AI');
          }
          setEnhancingCount(0);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setEnhancingCount(0);
      event.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const setAsCover = (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    const [movedImage] = newImages.splice(index, 1);
    newImages.unshift(movedImage);
    onImagesChange(newImages);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = images.indexOf(active.id as string);
      const newIndex = images.indexOf(over.id as string);
      onImagesChange(arrayMove(images, oldIndex, newIndex));
    }
  };

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <p className="text-sm text-muted-foreground">
        Drag to reorder. First image becomes your cover photo.
      </p>

      {/* Image grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={images} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((url, index) => (
              <SortableImageItem
                key={url}
                url={url}
                index={index}
                onRemove={() => removeImage(index)}
                onSetCover={() => setAsCover(index)}
                isFirst={index === 0}
              />
            ))}

            {/* Upload button */}
            {images.length < maxImages && (
              <label className="relative flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer group">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={uploading}
                />
                {uploading ? (
                  <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                ) : (
                  <>
                    <ImagePlus className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-xs text-muted-foreground mt-2">Add Photos</span>
                  </>
                )}
              </label>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Enhancement indicator */}
      {enhancingCount > 0 && (
        <div className="flex items-center justify-center gap-2 text-sm text-primary">
          <Sparkles className="h-4 w-4 animate-pulse" />
          <span>Enhancing {enhancingCount} image(s) with AI...</span>
        </div>
      )}

      {/* Counter */}
      <p className="text-sm text-muted-foreground text-center">
        {images.length} / {maxImages} photos
        {images.length < minImages && (
          <span className="text-destructive ml-1">
            (minimum {minImages} required)
          </span>
        )}
      </p>
    </div>
  );
}
