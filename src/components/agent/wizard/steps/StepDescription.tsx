import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { usePropertyWizard } from '../PropertyWizardContext';
import { FileText, Plus, X, Lightbulb } from 'lucide-react';
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
  const optimalLength = 300;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Description</h2>
        <p className="text-sm text-muted-foreground">
          Tell the story of this property to attract buyers
        </p>
      </div>

      <div className="space-y-6">
        {/* Main Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Property Description *
          </Label>
          <Textarea
            id="description"
            value={data.description}
            onChange={(e) => updateData({ description: e.target.value })}
            placeholder="Describe the property, its best features, the neighborhood, and why someone would love living here..."
            rows={8}
            className="resize-none"
          />
          <div className="flex justify-between text-xs">
            <span className={descriptionLength < minLength ? 'text-destructive' : 'text-muted-foreground'}>
              {descriptionLength} characters
              {descriptionLength < minLength && ` (minimum ${minLength})`}
            </span>
            {descriptionLength >= minLength && descriptionLength < optimalLength && (
              <span className="text-muted-foreground">
                Tip: {optimalLength - descriptionLength} more for optimal length
              </span>
            )}
          </div>
        </div>

        {/* Writing Tips */}
        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
          <h3 className="font-medium flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Writing Tips
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Start with the most compelling feature</li>
            <li>• Mention natural light, views, and outdoor space</li>
            <li>• Describe the neighborhood and nearby amenities</li>
            <li>• Be specific: "5-minute walk to the beach" beats "close to beach"</li>
            <li>• Avoid ALL CAPS and excessive punctuation!!!</li>
          </ul>
        </div>

        {/* Highlights */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            Key Highlights
            <span className="text-muted-foreground font-normal">(optional, up to 5)</span>
          </Label>
          
          {data.highlights.length > 0 && (
            <div className="space-y-2">
              {data.highlights.map((highlight, index) => (
                <div key={index} className="flex items-center gap-2 bg-muted/50 p-2 rounded">
                  <span className="text-sm flex-1">{highlight}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeHighlight(index)}
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addHighlight();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addHighlight}>
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
