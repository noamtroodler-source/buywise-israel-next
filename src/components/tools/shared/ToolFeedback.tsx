import { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface ToolFeedbackProps {
  toolName: string;
  className?: string;
  variant?: 'default' | 'inline';
}

export function ToolFeedback({ toolName, className, variant = 'default' }: ToolFeedbackProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState<number | null>(null);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleRating = async (value: number) => {
    setRating(value);
    
    // Auto-submit simple rating
    if (!showComment) {
      await submitFeedback(value, '');
    }
  };

  const submitFeedback = async (ratingValue: number, commentText: string) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('tool_feedback').insert({
        tool_name: toolName,
        rating: ratingValue,
        comment: commentText.trim() || null,
        user_id: user?.id || null,
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast.success('Thanks for your feedback!');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitWithComment = async () => {
    if (rating === null) return;
    await submitFeedback(rating, comment);
  };

  if (isSubmitted) {
    return (
      <div className={cn(
        "flex items-center gap-2 text-primary",
        variant === 'inline' ? "py-2" : "p-4 rounded-lg bg-muted/30",
        className
      )}>
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Thanks for your feedback!</span>
      </div>
    );
  }

  // Inline variant - compact single row
  if (variant === 'inline') {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Was this helpful?</span>
          <div className="flex items-center gap-1.5">
            <Button
              variant={rating === 5 ? "default" : "ghost"}
              size="sm"
              className={cn(
                "h-8 w-8 p-0",
                rating === 5 && "bg-green-600 hover:bg-green-700"
              )}
              onClick={() => handleRating(5)}
              disabled={isSubmitting}
            >
              <ThumbsUp className="h-4 w-4" />
            </Button>
            <Button
              variant={rating === 1 ? "default" : "ghost"}
              size="sm"
              className={cn(
                "h-8 w-8 p-0",
                rating === 1 && "bg-red-600 hover:bg-red-700"
              )}
              onClick={() => handleRating(1)}
              disabled={isSubmitting}
            >
              <ThumbsDown className="h-4 w-4" />
            </Button>
          </div>
          {!showComment && rating === null && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5"
              onClick={() => setShowComment(true)}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Leave a comment
            </Button>
          )}
        </div>

        {showComment && !isSubmitted && (
          <div className="space-y-2 animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Optional feedback</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setShowComment(false)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Textarea
              placeholder="How can we improve this tool?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[60px] resize-none text-sm"
            />
            <Button
              size="sm"
              onClick={handleSubmitWithComment}
              disabled={isSubmitting || rating === null}
              className="h-8 text-xs"
            >
              {isSubmitting ? 'Sending...' : 'Submit'}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Default variant - card style
  return (
    <div className={cn("p-4 rounded-lg bg-muted/30 space-y-3", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Was this helpful?</span>
        <div className="flex items-center gap-1.5">
          <Button
            variant={rating === 5 ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-8 w-8 p-0",
              rating === 5 && "bg-green-600 hover:bg-green-700 border-green-600"
            )}
            onClick={() => handleRating(5)}
            disabled={isSubmitting}
          >
            <ThumbsUp className="h-4 w-4" />
          </Button>
          <Button
            variant={rating === 1 ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-8 w-8 p-0",
              rating === 1 && "bg-red-600 hover:bg-red-700 border-red-600"
            )}
            onClick={() => handleRating(1)}
            disabled={isSubmitting}
          >
            <ThumbsDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!showComment && !isSubmitted && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5 p-0"
          onClick={() => setShowComment(true)}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Add a comment
        </Button>
      )}

      {showComment && !isSubmitted && (
        <div className="space-y-2 animate-in fade-in-50 duration-200">
          <Textarea
            placeholder="How can we improve this tool?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[60px] resize-none text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComment(false)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmitWithComment}
              disabled={isSubmitting || rating === null}
              className="h-8 text-xs"
            >
              {isSubmitting ? 'Sending...' : 'Submit'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
