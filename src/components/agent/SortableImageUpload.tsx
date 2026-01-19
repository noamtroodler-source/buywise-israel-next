import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { X, Loader2, GripVertical, Star, ImagePlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
        isFirst ? "border-primary ring-2 ring-primary/20" : "border-border",
        isDragging && "opacity-50 scale-105 shadow-xl z-50"
      )}
    >
      {/* Cover badge for first image */}
      {isFirst && (
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-md shadow-md">
          <Star className="h-3 w-3 fill-current" />
          Cover
        </div>
      )}
      
      {/* Position number for non-cover images */}
      {!isFirst && (
        <div className="absolute top-2 left-2 z-10 flex items-center justify-center h-6 w-6 bg-background/90 backdrop-blur-sm text-foreground text-xs font-semibold rounded-full border shadow-sm">
          {index + 1}
        </div>
      )}

      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-10 z-10 p-1.5 bg-background/90 backdrop-blur-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-2 right-2 z-10 p-1.5 bg-destructive text-destructive-foreground rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Image */}
      <img
        src={url}
        alt={`Property image ${index + 1}`}
        className="w-full h-32 object-cover"
      />

      {/* Set as cover button (only for non-first images) */}
      {!isFirst && (
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

    if (uploadError) {
      throw uploadError;
    }

      const { data } = supabase.storage
        .from('property-images')
        .getPublicUrl(filePath);

    return data.publicUrl;
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

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setUploading(true);

    try {
      const uploadPromises = filesToUpload.map(uploadImage);
      const newUrls = await Promise.all(uploadPromises);
      onImagesChange([...images, ...newUrls]);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
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
