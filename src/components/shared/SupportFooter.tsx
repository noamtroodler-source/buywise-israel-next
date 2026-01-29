import { ArrowRight, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SupportFooterProps {
  message: string;
  linkText?: string;
  variant?: 'subtle' | 'card' | 'inline';
  className?: string;
}

export function SupportFooter({ 
  message, 
  linkText = "Contact us",
  variant = 'subtle',
  className,
}: SupportFooterProps) {
  // Parse message to extract link portion
  const renderMessage = () => {
    return message.split('[').map((part, i) => {
      if (i === 0) return <span key={i}>{part}</span>;
      const [, rest] = part.split(']');
      return (
        <span key={i}>
          <span className="text-primary font-medium">{linkText}</span>
          {rest}
        </span>
      );
    });
  };

  if (variant === 'card') {
    return (
      <Link
        to="/contact"
        className={cn(
          "group block p-5 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10",
          "border border-primary/15 hover:border-primary/30",
          "hover:from-primary/8 hover:to-primary/15",
          "transition-all duration-300 text-center",
          className
        )}
      >
        <MessageCircle className="h-6 w-6 text-primary mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-2">
          {renderMessage()}
        </p>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
          {linkText}
          <ArrowRight className="h-4 w-4" />
        </span>
      </Link>
    );
  }

  if (variant === 'inline') {
    return (
      <Link
        to="/contact"
        className={cn(
          "group flex items-center justify-between gap-4 py-4 px-5 rounded-xl",
          "bg-muted/40 hover:bg-muted/60",
          "border border-border/50 hover:border-primary/30",
          "transition-all duration-300",
          className
        )}
      >
        <p className="text-sm text-muted-foreground">
          {renderMessage()}
        </p>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
      </Link>
    );
  }

  // Default: subtle variant - enhanced version
  return (
    <Link
      to="/contact"
      className={cn(
        "group flex items-center justify-between gap-4 py-4 px-5 rounded-xl",
        "bg-muted/30 hover:bg-muted/50",
        "border border-border/40 hover:border-primary/25",
        "transition-all duration-300",
        className
      )}
    >
      <p className="text-sm text-muted-foreground">
        {renderMessage()}
      </p>
      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
    </Link>
  );
}
