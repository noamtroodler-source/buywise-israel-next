import { useState } from 'react';
import { MessageSquare, CheckCircle, Star, ChevronUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

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
                ? "fill-primary text-primary"
                : "text-muted-foreground/40"
            )}
          />
        </button>
      ))}
    </div>
  );

  // Inline variant - subtle card matching navigation cards
  if (variant === 'inline') {
    return (
      <Link
        to="/contact"
        className={cn(
          "group flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors",
          className
        )}
      >
        <MessageSquare className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Help us improve this tool</p>
          <p className="text-xs text-muted-foreground">Share your thoughts or suggest features</p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
      </Link>
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
