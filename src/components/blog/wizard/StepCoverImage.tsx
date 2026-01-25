import { useState, useRef } from 'react';
import { Upload, X, ImageIcon, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useBlogWizard } from './BlogWizardContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function StepCoverImage() {
  const { data, updateData } = useBlogWizard();
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
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

  const generateAIImage = async () => {
    if (!data.title) {
      toast.error('Please add an article title first');
      return;
    }

    setIsGeneratingAI(true);

    try {
      // Build prompt from article title and content excerpt
      const contentPreview = data.content?.slice(0, 500) || '';
      const prompt = `Create a professional, high-quality blog cover image for an article titled "${data.title}". ${contentPreview ? `The article is about: ${contentPreview.slice(0, 200)}...` : ''} Style: Modern, clean, professional real estate or lifestyle photography. Aspect ratio 16:9, ultra high resolution. No text overlays on the image.`;

      const { data: result, error } = await supabase.functions.invoke('generate-hero-image', {
        body: { prompt }
      });

      if (error) throw error;
      if (result.error) throw new Error(result.error);

      // The result contains a base64 image URL - upload it to storage
      const base64Data = result.imageUrl;
      
      // Convert base64 to blob for upload
      const response = await fetch(base64Data);
      const blob = await response.blob();
      
      const fileName = `blog-ai-${Date.now()}.png`;
      const filePath = `blog-covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(filePath, blob, { contentType: 'image/png' });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('property-images')
        .getPublicUrl(filePath);

      updateData({ coverImage: urlData.publicUrl });
      toast.success('AI cover image generated!');
    } catch (error) {
      console.error('AI generation error:', error);
      if (error instanceof Error && error.message.includes('Rate limit')) {
        toast.error('Rate limit exceeded. Please try again in a moment.');
      } else if (error instanceof Error && error.message.includes('Payment')) {
        toast.error('AI credits exhausted. Please upload an image manually.');
      } else {
        toast.error('Failed to generate image. Please try again or upload manually.');
      }
    } finally {
      setIsGeneratingAI(false);
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
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden border">
            <img
              src={data.coverImage}
              alt="Cover preview"
              className="w-full aspect-[16/9] object-cover"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={generateAIImage}
              disabled={isGeneratingAI || isUploading}
            >
              {isGeneratingAI ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Regenerate with AI
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isGeneratingAI}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Different
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemoveImage}
              disabled={isUploading || isGeneratingAI}
            >
              <X className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* AI Generation Loading State */}
          {isGeneratingAI ? (
            <div className="w-full aspect-[16/9] rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <div className="text-center">
                <p className="font-medium">Generating your cover image...</p>
                <p className="text-sm text-muted-foreground">
                  This may take 5-10 seconds
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full aspect-[16/9] rounded-xl border-2 border-dashed border-primary/20 bg-muted/30 flex flex-col items-center justify-center gap-4 p-6">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-medium">Add a cover image</p>
                <p className="text-sm text-muted-foreground">
                  Recommended: 1200 x 630px (16:9 ratio)
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={generateAIImage}
                  disabled={isGeneratingAI || !data.title}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate AI Cover
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload Your Own
                </Button>
              </div>
              {!data.title && (
                <p className="text-xs text-muted-foreground">
                  Add an article title first to generate an AI cover
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Pro Tip */}
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
        <div className="flex gap-2">
          <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-primary">Pro Tip</h4>
            <p className="text-sm text-muted-foreground mt-1">
              AI-generated images are created based on your article title and content. 
              No attribution or licensing needed - they're yours to use!
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-muted/50 p-4">
        <h4 className="font-medium mb-2">Image Guidelines</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Use high-quality images (minimum 1200px wide)</li>
          <li>• Avoid images with too much text</li>
          <li>• Choose images relevant to your article topic</li>
          <li>• Ensure you have rights to use the image</li>
          <li className="flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-primary" />
            <span>Or use AI-generated images - no licensing worries!</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
