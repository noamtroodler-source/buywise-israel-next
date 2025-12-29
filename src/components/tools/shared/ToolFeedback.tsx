import { useState } from 'react';
import { MessageSquare, CheckCircle, Star, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(variant === 'default');

  const submitFeedback = async () => {
    if (!comment.trim() && rating === 0) {
      toast.error('Please add a comment or rating');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('tool_feedback').insert({
        tool_name: toolName,
        rating: rating || null,
        comment: comment.trim() || null,
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

  // Success state
  if (isSubmitted) {
    return (
      <div className={cn(
        "flex items-center gap-2 text-primary",
        variant === 'inline' ? "py-3" : "p-5 rounded-lg bg-muted/30",
        className
      )}>
        <CheckCircle className="h-5 w-5" />
        <span className="text-sm font-medium">Thanks for helping us improve!</span>
      </div>
    );
  }

  // Star rating component
  const StarRating = () => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="p-0.5 transition-transform hover:scale-110"
          onMouseEnter={() => setHoveredRating(star)}
          onMouseLeave={() => setHoveredRating(0)}
          onClick={() => setRating(star)}
        >
          <Star
            className={cn(
              "h-5 w-5 transition-colors",
              (hoveredRating || rating) >= star
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/40"
            )}
          />
        </button>
      ))}
    </div>
  );

  // Inline variant - minimal, elegant design
  if (variant === 'inline') {
    if (!isExpanded) {
      return (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className={cn(
            "group flex items-center gap-2.5 text-sm text-muted-foreground/70 hover:text-primary transition-all duration-200",
            className
          )}
        >
          <div className="p-1.5 rounded-md bg-muted/50 group-hover:bg-primary/10 transition-colors">
            <MessageSquare className="h-3.5 w-3.5" />
          </div>
          <span className="font-medium">Help us improve this tool</span>
        </button>
      );
    }

    return (
      <div className={cn(
        "p-4 rounded-xl border border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 space-y-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-300",
        className
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <span className="font-medium text-foreground">Share your feedback</span>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="text-muted-foreground/60 hover:text-foreground transition-colors"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
        </div>
        
        <Textarea
          placeholder="What would make this tool more useful? Any features you'd like to see?"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[80px] resize-none text-sm bg-background/50 border-border/50 focus:border-primary/50"
        />
        
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-muted-foreground">Rate this tool</span>
            <StarRating />
          </div>
          
          <Button
            size="sm"
            onClick={submitFeedback}
            disabled={isSubmitting || (!comment.trim() && rating === 0)}
            className="h-8 px-4"
          >
            {isSubmitting ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>
    );
  }

  // Default variant - always expanded, card style
  return (
    <div className={cn("p-5 rounded-lg bg-muted/30 space-y-4", className)}>
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
        <span className="font-medium text-foreground">Help us improve this tool</span>
      </div>

      <Textarea
        placeholder="What would make this calculator more useful? Any features you'd like to see?"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="min-h-[100px] resize-none"
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Rating (optional)</span>
          <StarRating />
        </div>
        
        <Button
          onClick={submitFeedback}
          disabled={isSubmitting || (!comment.trim() && rating === 0)}
        >
          {isSubmitting ? 'Sending...' : 'Send Feedback'}
        </Button>
      </div>
    </div>
  );
}
