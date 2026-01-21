import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useProjectWizard } from '../ProjectWizardContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Wand2, Loader2, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

interface AIFeedback {
  hasIssues: boolean;
  suggestions: string[];
  improvedVersion?: string;
}

export function StepDescription() {
  const { data, updateData } = useProjectWizard();
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState<AIFeedback | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const descriptionLength = data.description.length;
  const minLength = 150;
  const optimalMin = 400;
  const optimalMax = 600;
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
    return { text: `Maximum reached (${maxLength})`, color: 'text-primary' };
  };

  const checkWithAI = async () => {
    if (data.description.length < 50) {
      toast.error('Please write at least 50 characters before checking');
      return;
    }

    setIsChecking(true);
    setShowFeedback(true);
    setFeedback(null);

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

      setFeedback(result);
    } catch (error) {
      console.error('AI check error:', error);
      toast.error('Failed to analyze description. Please try again.');
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

  const charFeedback = getCharacterFeedback();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Project Description</h2>
        <p className="text-muted-foreground mb-6">
          Write a compelling description that highlights what makes your development special.
        </p>
      </div>

      <div className="space-y-4">
        {/* Quality Reminder */}
        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border border-border">
          <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            Descriptions with grammar issues or unclear content may be returned for revision. 
            Use the AI checker below to ensure quality before submitting.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={data.description}
            onChange={(e) => {
              updateData({ description: e.target.value });
              if (showFeedback) {
                setShowFeedback(false);
                setFeedback(null);
              }
            }}
            maxLength={maxLength}
            placeholder="Describe your project's unique features, location benefits, target buyers, construction quality, and lifestyle it offers..."
            rows={10}
            className="resize-none"
          />
          <div className="flex justify-between items-center text-xs">
            <span className={charFeedback.color}>
              {charFeedback.text}
            </span>
            <span className="text-muted-foreground">
              Recommended: {optimalMin}-{optimalMax}
            </span>
          </div>
        </div>

        {/* AI Check Button */}
        <Button
          type="button"
          variant="outline"
          onClick={checkWithAI}
          disabled={isChecking || data.description.length < 50}
          className="gap-2"
        >
          {isChecking ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              Check Grammar & Quality
            </>
          )}
        </Button>

        {/* AI Feedback Section */}
        {showFeedback && (
          <div className="rounded-lg border border-border p-4 space-y-3">
            {isChecking ? (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Analyzing your description...</span>
              </div>
            ) : feedback ? (
              feedback.hasIssues ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-medium">Suggestions for improvement</span>
                  </div>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {feedback.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-muted-foreground">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                  {feedback.improvedVersion && (
                    <div className="pt-3 border-t border-border space-y-3">
                      <p className="text-sm font-medium">Suggested improved version:</p>
                      <div className="bg-muted/50 p-3 rounded text-sm max-h-40 overflow-y-auto">
                        {feedback.improvedVersion}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={applyImprovedVersion}
                        className="gap-2"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Apply Improved Version
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-primary">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Looking good! Your description is well-written.</span>
                </div>
              )
            ) : null}
          </div>
        )}

        <div className="bg-muted/50 p-4 rounded-lg space-y-3">
          <h4 className="font-medium text-sm">Tips for a great description:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Highlight unique architectural features and design elements</li>
            <li>• Mention proximity to transportation, schools, and amenities</li>
            <li>• Describe the lifestyle and community the project creates</li>
            <li>• Include information about construction quality and materials</li>
            <li>• Mention any green building certifications or sustainability features</li>
            <li>• Describe the developer's track record if relevant</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
