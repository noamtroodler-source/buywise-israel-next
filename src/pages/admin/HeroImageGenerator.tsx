import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Download, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImageConcept {
  id: string;
  title: string;
  tagline: string;
  prompts: string[];
}

const imageConcepts: ImageConcept[] = [
  {
    id: 'balcony',
    title: 'Balcony View',
    tagline: '"You made it. You\'re home. Breathe."',
    prompts: [
      "Wide cinematic shot, silhouette of a person standing on a modern apartment balcony, overlooking Mediterranean white buildings cascading down a hillside toward a distant calm sea. Morning soft light, peaceful atmosphere. High contrast, strong shapes. 16:9 hero image aspect ratio, ultra high resolution.",
      "Over-the-shoulder view of a person leaning peacefully on a balcony railing, looking out at modern Israeli apartment buildings with lush green trees and balconies with plants. Sense of peace and accomplishment. Strong silhouette, architectural details. 16:9 hero image, ultra high resolution.",
      "Romantic silhouette of a couple standing together on a spacious balcony at golden hour, holding hands while overlooking a coastal Mediterranean city. Feeling of achievement, peace, and new beginnings. 16:9 hero image aspect ratio, ultra high resolution."
    ]
  },
  {
    id: 'doorway',
    title: 'Welcoming Doorway',
    tagline: '"Come in, you\'re safe here."',
    prompts: [
      "Open wooden door of a Mediterranean home with warm golden light streaming through from inside, glimpse of cozy interior, potted plants on both sides of entrance, white stone walls. Welcoming, safe, inviting. 16:9 hero image aspect ratio, ultra high resolution.",
      "Modern Israeli apartment entrance with elegant glass door open, warm interior light spilling out onto the entrance, clean contemporary design. Feeling of welcome and safety. 16:9 hero image, ultra high resolution.",
      "Beautiful Jerusalem stone archway entrance with a wooden door slightly ajar, golden warm light emanating from within, olive tree nearby. Heritage, warmth, and welcome. 16:9 hero image aspect ratio, ultra high resolution."
    ]
  },
  {
    id: 'keys',
    title: 'Keys in Hand',
    tagline: '"Achievement. You did it. It\'s yours."',
    prompts: [
      "Close-up of two hands exchanging house keys, one hand giving, one receiving. Blurred modern white apartment building in soft background. Moment of achievement and new beginnings. Emotional, celebratory. 16:9 hero image aspect ratio, ultra high resolution.",
      "First-person perspective of a hand holding shiny new house keys, with a beautiful new apartment door blurred in the background. The moment of becoming a homeowner. Pride and achievement. 16:9 hero image, ultra high resolution.",
      "Keys with a small decorative ribbon resting on an open palm, soft focus white Mediterranean home with blue shutters in background. Celebratory moment of achievement. 16:9 hero image aspect ratio, ultra high resolution."
    ]
  }
];

interface GeneratedImage {
  conceptId: string;
  promptIndex: number;
  imageUrl: string;
  prompt: string;
}

export default function HeroImageGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentlyGenerating, setCurrentlyGenerating] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

  const generateImage = async (concept: ImageConcept, promptIndex: number) => {
    const prompt = concept.prompts[promptIndex];
    const key = `${concept.id}-${promptIndex}`;
    
    setCurrentlyGenerating(key);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-hero-image', {
        body: { prompt }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setGeneratedImages(prev => [
        ...prev.filter(img => !(img.conceptId === concept.id && img.promptIndex === promptIndex)),
        {
          conceptId: concept.id,
          promptIndex,
          imageUrl: data.imageUrl,
          prompt
        }
      ]);
      
      toast.success(`Generated ${concept.title} #${promptIndex + 1}`);
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error(`Failed to generate ${concept.title} #${promptIndex + 1}: ${error.message}`);
    } finally {
      setCurrentlyGenerating(null);
    }
  };

  const generateAllImages = async () => {
    setIsGenerating(true);
    
    for (const concept of imageConcepts) {
      for (let i = 0; i < concept.prompts.length; i++) {
        await generateImage(concept, i);
        // Small delay between generations to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    setIsGenerating(false);
    toast.success('All images generated!');
  };

  const getImageForConcept = (conceptId: string, promptIndex: number) => {
    return generatedImages.find(
      img => img.conceptId === conceptId && img.promptIndex === promptIndex
    );
  };

  const downloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Hero Image Generator</h1>
          <p className="text-muted-foreground mb-4">
            Generate 9 AI hero images for BuyWise Israel homepage. These will work under the blue overlay.
          </p>
          <Button 
            onClick={generateAllImages} 
            disabled={isGenerating}
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating All Images...
              </>
            ) : (
              'Generate All 9 Images'
            )}
          </Button>
        </div>

        <div className="space-y-12">
          {imageConcepts.map((concept) => (
            <Card key={concept.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl">{concept.title}</span>
                    <p className="text-muted-foreground font-normal text-base mt-1">
                      {concept.tagline}
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {concept.prompts.map((prompt, promptIndex) => {
                    const image = getImageForConcept(concept.id, promptIndex);
                    const isThisGenerating = currentlyGenerating === `${concept.id}-${promptIndex}`;
                    
                    return (
                      <div key={promptIndex} className="space-y-3">
                        <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
                          {image ? (
                            <>
                              {/* Original image */}
                              <img 
                                src={image.imageUrl} 
                                alt={`${concept.title} variation ${promptIndex + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {isThisGenerating ? (
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                              ) : (
                                <span className="text-muted-foreground text-sm">
                                  Variation {promptIndex + 1}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Preview with blue overlay */}
                        {image && (
                          <div className="aspect-video rounded-lg overflow-hidden relative">
                            <img 
                              src={image.imageUrl} 
                              alt={`${concept.title} with overlay`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-primary/75 to-primary/90" />
                            <span className="absolute bottom-2 left-2 text-xs text-white/80">
                              With blue overlay
                            </span>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generateImage(concept, promptIndex)}
                            disabled={isGenerating || isThisGenerating}
                            className="flex-1"
                          >
                            {isThisGenerating ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <RefreshCw className="h-4 w-4 mr-1" />
                                {image ? 'Regenerate' : 'Generate'}
                              </>
                            )}
                          </Button>
                          {image && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadImage(
                                image.imageUrl, 
                                `hero-${concept.id}-${promptIndex + 1}.png`
                              )}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {prompt.slice(0, 100)}...
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
