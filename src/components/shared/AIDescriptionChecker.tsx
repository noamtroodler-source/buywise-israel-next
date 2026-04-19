import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Wand2, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

interface AIFeedback {
  hasIssues: boolean;
  suggestions: string[];
  improvedVersion?: string;
}

interface AIDescriptionCheckerProps {
  text: string;
  contentType: 'property' | 'agency' | 'agent_bio';
  minLength?: number;
  onApplyImproved: (improved: string) => void;
  buttonLabel?: string;
}

export function AIDescriptionChecker({
  text,
  contentType,
  minLength = 50,
  onApplyImproved,
  buttonLabel = 'Check Grammar & Quality',
}: AIDescriptionCheckerProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState<AIFeedback | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const runCheck = async () => {
    if (text.length < minLength) {
      toast.error(`Please write at least ${minLength} characters before checking`);
      return;
    }

    setIsChecking(true);
    setShowFeedback(true);
    setFeedback(null);

    try {
      const { data: result, error } = await supabase.functions.invoke('check-description', {
        body: { description: text, contentType },
      });

      if (error) throw error;
      if (result?.error) {
        toast.error(result.error);
        setShowFeedback(false);
        return;
      }
      setFeedback(result);
    } catch (err) {
      console.error('AI check error:', err);
      toast.error('Failed to analyze. Please try again.');
      setShowFeedback(false);
    } finally {
      setIsChecking(false);
    }
  };

  const applyImproved = () => {
    if (feedback?.improvedVersion) {
      onApplyImproved(feedback.improvedVersion);
      setFeedback(null);
      setShowFeedback(false);
      toast.success('Improved version applied!');
    }
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={runCheck}
        disabled={isChecking || text.length < minLength}
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
            {buttonLabel}
          </>
        )}
      </Button>

      {showFeedback && (
        <div className="rounded-lg border border-border p-4 space-y-3">
          {isChecking ? (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Analyzing your text...</span>
            </div>
          ) : feedback ? (
            feedback.hasIssues ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">Suggestions for improvement</span>
                </div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {feedback.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span>•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
                {feedback.improvedVersion && (
                  <div className="pt-3 border-t border-border space-y-3">
                    <p className="text-sm font-medium">Suggested improved version:</p>
                    <div className="bg-muted/50 p-3 rounded text-sm max-h-40 overflow-y-auto">
                      {feedback.improvedVersion}
                    </div>
                    <Button type="button" size="sm" onClick={applyImproved} className="gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Apply Improved Version
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Looking good! Your text is well-written.</span>
              </div>
            )
          ) : null}
        </div>
      )}
    </div>
  );
}
