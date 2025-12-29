import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Minus, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface ToolFeedbackProps {
  toolName: string;
  className?: string;
}

export function ToolFeedback({ toolName, className }: ToolFeedbackProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === null) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('tool_feedback').insert({
        tool_name: toolName,
        rating,
        comment: comment.trim() || null,
        user_id: user?.id || null,
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast.success('Thank you for your feedback!');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className={cn("p-5 bg-muted/30", className)}>
        <div className="flex items-center gap-3 text-primary">
          <CheckCircle className="h-5 w-5" />
          <p className="text-sm font-medium">Thanks for your feedback!</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("p-5 shadow-sm", className)}>
      <p className="text-sm font-medium text-foreground mb-3">Help Us Improve</p>
      
      {/* Rating Buttons */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-muted-foreground mr-2">How useful was this tool?</span>
        <Button
          variant={rating === 5 ? "default" : "outline"}
          size="sm"
          className={cn(
            "h-9 w-9 p-0",
            rating === 5 && "bg-green-600 hover:bg-green-700"
          )}
          onClick={() => setRating(5)}
        >
          <ThumbsUp className="h-4 w-4" />
        </Button>
        <Button
          variant={rating === 3 ? "default" : "outline"}
          size="sm"
          className={cn(
            "h-9 w-9 p-0",
            rating === 3 && "bg-yellow-600 hover:bg-yellow-700"
          )}
          onClick={() => setRating(3)}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          variant={rating === 1 ? "default" : "outline"}
          size="sm"
          className={cn(
            "h-9 w-9 p-0",
            rating === 1 && "bg-red-600 hover:bg-red-700"
          )}
          onClick={() => setRating(1)}
        >
          <ThumbsDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Comment Field (appears after rating) */}
      {rating !== null && (
        <div className="space-y-3 animate-in fade-in-50 duration-200">
          <Textarea
            placeholder="Any suggestions or feedback? (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[80px] resize-none"
          />
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            {isSubmitting ? 'Sending...' : 'Submit Feedback'}
          </Button>
        </div>
      )}
    </Card>
  );
}
