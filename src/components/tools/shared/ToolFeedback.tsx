import { useState } from 'react';
import { MessageSquare, CheckCircle, Star, ArrowRight, X } from 'lucide-react';
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
        "relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 p-6",
        className
      )}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Thanks for your feedback!</p>
            <p className="text-sm text-muted-foreground">You're helping us build something better.</p>
          </div>
        </div>
      </div>
    );
  }

  // Star rating component
  const StarRating = () => (
    <div className="flex items-center gap-0.5">
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
                : "text-muted-foreground/30"
            )}
          />
        </button>
      ))}
    </div>
  );

  // Inline variant - polished card design
  if (variant === 'inline') {
    if (!isExpanded) {
      return (
        <div className={cn(
          "relative overflow-hidden rounded-xl border-l-4 border-l-primary border border-border/50 bg-gradient-to-br from-primary/5 via-background to-accent/5",
          className
        )}>
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-foreground">Got thoughts on this tool?</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Your feedback shapes what we build next. Share ideas, report bugs, or just say hi.
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => setIsExpanded(true)}
                size="sm"
                className="shrink-0 gap-1.5"
              >
                Share Feedback
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={cn(
        "relative overflow-hidden rounded-xl border-l-4 border-l-primary border border-border/50 bg-gradient-to-br from-primary/5 via-background to-accent/5 animate-in fade-in-50 duration-300",
        className
      )}>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground">Share your feedback</h4>
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <Textarea
            placeholder="What would make this tool more useful? Any features you'd like to see?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[100px] resize-none bg-background/80 border-border/60 focus:border-primary/50"
          />
          
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Rate this tool</span>
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
