import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { usePropertyWizard } from '../PropertyWizardContext';
import { FileText, Plus, X, Lightbulb, Sparkles } from 'lucide-react';
import { useState } from 'react';

export function StepDescription() {
  const { data, updateData } = usePropertyWizard();
  const [newHighlight, setNewHighlight] = useState('');

  const addHighlight = () => {
    if (newHighlight.trim() && data.highlights.length < 5) {
      updateData({ highlights: [...data.highlights, newHighlight.trim()] });
      setNewHighlight('');
    }
  };

  const removeHighlight = (index: number) => {
    updateData({ highlights: data.highlights.filter((_, i) => i !== index) });
  };

  const descriptionLength = data.description.length;
  const minLength = 100;
  const optimalMin = 300;
  const optimalMax = 500;
  const warningLength = 1500;
  const maxLength = 2000;

  const getCharacterFeedback = () => {
    if (descriptionLength < minLength) {
      return { text: `${descriptionLength} characters (minimum ${minLength})`, color: 'text-primary' };
    }
    if (descriptionLength < optimalMin) {
      return { text: `${descriptionLength} characters · ${optimalMin - descriptionLength} more for optimal`, color: 'text-muted-foreground' };
    }
    if (descriptionLength <= optimalMax) {
      return { text: `${descriptionLength} characters · Great length!`, color: 'text-primary' };
    }
    if (descriptionLength < warningLength) {
      return { text: `${descriptionLength} characters`, color: 'text-muted-foreground' };
    }
    if (descriptionLength < maxLength) {
      return { text: `${descriptionLength} characters · ${maxLength - descriptionLength} remaining`, color: 'text-primary' };
    }
    return { text: `Maximum reached (${maxLength})`, color: 'text-destructive' };
  };

  const feedback = getCharacterFeedback();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-1">Description</h2>
        <p className="text-muted-foreground">
          Tell the story of this property to attract buyers
        </p>
      </div>

      <div className="space-y-6">
        {/* Main Description */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-semibold">Property Description *</h3>
          </div>
          <Textarea
            id="description"
            value={data.description}
            onChange={(e) => updateData({ description: e.target.value })}
            maxLength={maxLength}
            placeholder="Describe the property, its best features, the neighborhood, and why someone would love living here..."
            rows={8}
            className="rounded-xl resize-none"
          />
          <div className="flex justify-between text-xs">
            <span className={feedback.color}>
              {feedback.text}
            </span>
            <span className="text-muted-foreground">
              Recommended: {optimalMin}-{optimalMax}
            </span>
          </div>
        </div>

        {/* Writing Tips */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-muted/30 border border-primary/10">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Lightbulb className="h-4 w-4 text-primary" />
            </div>
            Writing Tips
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1.5 ml-10">
            <li>• Start with the most compelling feature</li>
            <li>• Mention natural light, views, and outdoor space</li>
            <li>• Describe the neighborhood and nearby amenities</li>
            <li>• Be specific: "5-minute walk to the beach" beats "close to beach"</li>
            <li>• Avoid ALL CAPS and excessive punctuation!!!</li>
          </ul>
        </div>

        {/* Highlights */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Key Highlights</h3>
              <p className="text-xs text-muted-foreground">Optional, up to 5</p>
            </div>
          </div>
          
          {data.highlights.length > 0 && (
            <div className="space-y-2">
              {data.highlights.map((highlight, index) => (
                <div key={index} className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <span className="text-sm flex-1">{highlight}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeHighlight(index)}
                    className="rounded-lg hover:bg-primary/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {data.highlights.length < 5 && (
            <div className="flex gap-2">
              <Input
                value={newHighlight}
                onChange={(e) => setNewHighlight(e.target.value)}
                placeholder="e.g., Renovated in 2023"
                className="h-11 rounded-xl"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addHighlight();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addHighlight} className="rounded-xl h-11 px-4">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            These bullet points appear prominently on the listing
          </p>
        </div>
      </div>
    </div>
  );
}
