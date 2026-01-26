import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { usePropertyWizard } from '../PropertyWizardContext';
import { FileText, Plus, X, Lightbulb, Sparkles, Wand2, CheckCircle2, Loader2, Info } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AIFeedback {
  hasIssues: boolean;
  suggestions: string[];
  improvedVersion?: string;
}

export function StepDescription() {
  const { data, updateData } = usePropertyWizard();
  const [newHighlight, setNewHighlight] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState<AIFeedback | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

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

  const charFeedback = getCharacterFeedback();

  const checkWithAI = async () => {
    if (descriptionLength < 50) {
      toast.error('Please write at least 50 characters before checking');
      return;
    }

    setIsChecking(true);
    setFeedback(null);
    setShowFeedback(true);

    try {
      const { data: result, error } = await supabase.functions.invoke('check-description', {
        body: { description: data.description }
      });

      if (error) throw error;

      if (result.error) {
        toast.error(result.error);
        setShowFeedback(false);
        return;
      }

      setFeedback(result as AIFeedback);
    } catch (error) {
      console.error('Failed to check description:', error);
      toast.error('Failed to check description. Please try again.');
      setShowFeedback(false);
    } finally {
      setIsChecking(false);
    }
  };

  const applyImprovedVersion = () => {
    if (feedback?.improvedVersion) {
      updateData({ description: feedback.improvedVersion });
      setFeedback(null);
      setShowFeedback(false);
      toast.success('Improved version applied!');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-1">Description</h2>
        <p className="text-muted-foreground">
          Tell the story of this property to attract buyers
        </p>
      </div>

      <div className="space-y-6">
        {/* Quality Reminder */}
        <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50 border border-border/50">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80">Quality check:</span> Descriptions with spelling/grammar errors or low-quality content may be returned for revision. Use the AI check below to catch issues before submitting.
          </p>
        </div>

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
            onChange={(e) => {
              updateData({ description: e.target.value });
              // Clear feedback when description changes
              if (feedback) {
                setFeedback(null);
                setShowFeedback(false);
              }
            }}
            maxLength={maxLength}
            placeholder="Describe the property, its best features, the neighborhood, and why someone would love living here..."
            rows={8}
            className="rounded-xl resize-none"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className={`text-xs ${charFeedback.color}`}>
                {charFeedback.text}
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Recommended: {optimalMin}-{optimalMax}
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={checkWithAI}
              disabled={isChecking || descriptionLength < 50}
              className="rounded-lg gap-2"
            >
              {isChecking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              Check Grammar & Quality
            </Button>
          </div>

          {/* AI Feedback Section */}
          {showFeedback && (
            <div className="rounded-xl border overflow-hidden">
              {isChecking ? (
                <div className="p-4 flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Analyzing your description...</span>
                </div>
              ) : feedback && (
              <div className="p-4 bg-primary/5">
                  <div className="flex items-start gap-3">
                    {feedback.hasIssues ? (
                      <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm mb-2">
                        {feedback.hasIssues ? 'Suggestions for Improvement' : 'Looking Good!'}
                      </h4>
                      
                      {feedback.suggestions.length > 0 && (
                        <ul className="space-y-1.5 text-sm text-muted-foreground">
                          {feedback.suggestions.map((suggestion, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-primary">•</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {feedback.improvedVersion && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-xs font-medium text-muted-foreground">Suggested Version</span>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={applyImprovedVersion}
                              className="rounded-lg gap-1.5 h-7 text-xs"
                            >
                              <Sparkles className="h-3 w-3" />
                              Apply
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground bg-background/50 p-3 rounded-lg border border-border/50 max-h-32 overflow-y-auto">
                            {feedback.improvedVersion}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
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
