import { useState, useRef } from 'react';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useBlogWizard } from './BlogWizardContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function StepCoverImage() {
  const { data, updateData } = useBlogWizard();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `blog-${Date.now()}.${fileExt}`;
      const filePath = `blog-covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('property-images')
        .getPublicUrl(filePath);

      updateData({ coverImage: urlData.publicUrl });
      toast.success('Cover image uploaded');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    updateData({ coverImage: '' });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Cover Image</Label>
        <p className="text-sm text-muted-foreground">
          Add a cover image to make your article stand out. A good cover image 
          increases engagement and shares.
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {data.coverImage ? (
        <div className="relative rounded-xl overflow-hidden border">
          <img
            src={data.coverImage}
            alt="Cover preview"
            className="w-full aspect-[16/9] object-cover"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-3 right-3 rounded-full"
            onClick={handleRemoveImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full aspect-[16/9] rounded-xl border-2 border-dashed border-primary/20 hover:border-primary/40 bg-muted/30 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <span className="text-sm text-muted-foreground">Uploading...</span>
            </>
          ) : (
            <>
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-medium">Click to upload cover image</p>
                <p className="text-sm text-muted-foreground">
                  Recommended: 1200 x 630px (16:9 ratio)
                </p>
              </div>
              <Button variant="outline" size="sm" className="mt-2">
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
            </>
          )}
        </button>
      )}

      <div className="rounded-xl bg-muted/50 p-4">
        <h4 className="font-medium mb-2">Image Guidelines</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Use high-quality images (minimum 1200px wide)</li>
          <li>• Avoid images with too much text</li>
          <li>• Choose images relevant to your article topic</li>
          <li>• Ensure you have rights to use the image</li>
        </ul>
      </div>
    </div>
  );
}
