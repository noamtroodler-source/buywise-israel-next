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

const homepageHeroConcepts: ImageConcept[] = [
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

const guideHeroConcepts: ImageConcept[] = [
  {
    id: 'buying-guide-aerial',
    title: 'Buying Guide: Aerial Vista',
    tagline: 'Buying a Property in Israel Guide',
    prompts: [
      "Wide cinematic aerial view of white Jerusalem stone apartment buildings with terracotta rooftops cascading down a sunlit hillside, Mediterranean cypress trees, clear blue sky. Warm golden hour light creates long shadows. Feeling of arrival and home. 16:9 hero image aspect ratio, ultra high resolution, architectural photography style.",
      "Panoramic aerial photograph of modern Israeli coastal city with white Mediterranean apartment buildings, palm trees, sparkling blue sea in the distance. Clear sunny day, vibrant colors. Sense of opportunity and new beginnings. 16:9 hero image, ultra high resolution.",
      "Drone view of beautiful Tel Aviv neighborhood with Bauhaus white buildings, tree-lined streets, glimpses of the sea. Golden hour warm light, architectural beauty. Professional real estate photography. 16:9 hero image aspect ratio, ultra high resolution."
    ]
  },
  {
    id: 'buying-guide-signing',
    title: 'Buying Guide: Document Signing',
    tagline: 'The Moment of Commitment',
    prompts: [
      "Close-up of hands signing an official document with an elegant fountain pen, modern Israeli apartment visible through a large window in soft focus background. Professional, serious but hopeful moment. Clean bright natural lighting. 16:9 hero image, ultra high resolution.",
      "Overhead shot of a real estate contract on a wooden desk, hands holding a pen about to sign, coffee cup nearby, keys visible. Warm professional atmosphere. Moment of decision and accomplishment. 16:9 hero image aspect ratio, ultra high resolution.",
      "Professional close-up of a person signing important papers, wedding ring visible on hand, blurred Jerusalem stone building exterior through window. Serious but celebratory mood. Natural light. 16:9 hero image, ultra high resolution."
    ]
  },
  {
    id: 'buying-guide-keys',
    title: 'Buying Guide: Key Handover',
    tagline: 'Achievement Unlocked',
    prompts: [
      "Two hands exchanging house keys in foreground, blurred modern white Mediterranean apartment building with balconies and greenery in background. Moment of achievement and new beginnings. Warm natural light. 16:9 hero image aspect ratio, ultra high resolution.",
      "Close-up of a hand receiving shiny new house keys from another hand, beautiful Israeli apartment building entrance blurred in background. Emotional moment of accomplishment. Golden hour lighting. 16:9 hero image, ultra high resolution.",
      "Artistic shot of keys being handed over, focus on the connection between two hands, modern Israeli apartment door and mezuzah softly blurred behind. Cultural authenticity, celebratory moment. 16:9 hero image aspect ratio, ultra high resolution."
    ]
  }
];

interface GeneratedImage {
  conceptId: string;
  promptIndex: number;
  imageUrl: string;
  prompt: string;
}

interface ConceptCardProps {
  concept: ImageConcept;
  getImageForConcept: (id: string, index: number) => GeneratedImage | undefined;
  currentlyGenerating: string | null;
  isGenerating: boolean;
  generateImage: (concept: ImageConcept, index: number) => void;
  downloadImage: (url: string, filename: string) => void;
}

function ConceptCard({ 
  concept, 
  getImageForConcept, 
  currentlyGenerating, 
  isGenerating, 
  generateImage, 
  downloadImage 
}: ConceptCardProps) {
  return (
    <Card>
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
                    <img 
                      src={image.imageUrl} 
                      alt={`${concept.title} variation ${promptIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
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
  );
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
      toast.error(`Failed to generate ${concept.title} #${promptIndex + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCurrentlyGenerating(null);
    }
  };

  const generateAllForCategory = async (concepts: ImageConcept[]) => {
    setIsGenerating(true);
    
    for (const concept of concepts) {
      for (let i = 0; i < concept.prompts.length; i++) {
        await generateImage(concept, i);
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
          <p className="text-muted-foreground">
            Generate AI hero images for the homepage and guides.
          </p>
        </div>

        {/* Homepage Hero Section */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Homepage Hero Images</h2>
              <p className="text-muted-foreground">9 AI images for the homepage. Work under blue overlay.</p>
            </div>
            <Button 
              onClick={() => generateAllForCategory(homepageHeroConcepts)} 
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate All 9'
              )}
            </Button>
          </div>

          <div className="space-y-8">
            {homepageHeroConcepts.map((concept) => (
              <ConceptCard 
                key={concept.id}
                concept={concept}
                getImageForConcept={getImageForConcept}
                currentlyGenerating={currentlyGenerating}
                isGenerating={isGenerating}
                generateImage={generateImage}
                downloadImage={downloadImage}
              />
            ))}
          </div>
        </div>

        {/* Guide Hero Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Guide Hero Images</h2>
              <p className="text-muted-foreground">Hero images for the buying guides.</p>
            </div>
            <Button 
              onClick={() => generateAllForCategory(guideHeroConcepts)} 
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate All 9'
              )}
            </Button>
          </div>

          <div className="space-y-8">
            {guideHeroConcepts.map((concept) => (
              <ConceptCard 
                key={concept.id}
                concept={concept}
                getImageForConcept={getImageForConcept}
                currentlyGenerating={currentlyGenerating}
                isGenerating={isGenerating}
                generateImage={generateImage}
                downloadImage={downloadImage}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
