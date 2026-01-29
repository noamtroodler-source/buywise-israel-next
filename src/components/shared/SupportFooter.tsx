import { Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SupportFooterProps {
  message: string;
  linkText?: string;
  variant?: 'subtle' | 'card' | 'inline';
  className?: string;
}

const SUPPORT_EMAIL = 'hello@buywiseisrael.com';

export function SupportFooter({ 
  message, 
  linkText = "Email us",
  variant = 'subtle',
  className,
}: SupportFooterProps) {
  const mailtoLink = `mailto:${SUPPORT_EMAIL}`;

  if (variant === 'card') {
    return (
      <div className={cn(
        "p-5 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10 text-center",
        className
      )}>
        <Mail className="h-6 w-6 text-primary mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-3">
          {message.split('[').map((part, i) => {
            if (i === 0) return part;
            const [link, rest] = part.split(']');
            return (
              <span key={i}>
                <a 
                  href={mailtoLink}
                  className="text-primary font-medium hover:underline"
                >
                  {linkText}
                </a>
                {rest}
              </span>
            );
          })}
        </p>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        {message.split('[').map((part, i) => {
          if (i === 0) return part;
          const [, rest] = part.split(']');
          return (
            <span key={i}>
              <a 
                href={mailtoLink}
                className="text-primary font-medium hover:underline"
              >
                {linkText}
              </a>
              {rest}
            </span>
          );
        })}
      </p>
    );
  }

  // Default: subtle variant
  return (
    <div className={cn(
      "pt-6 border-t border-border text-center",
      className
    )}>
      <p className="text-sm text-muted-foreground">
        {message.split('[').map((part, i) => {
          if (i === 0) return part;
          const [, rest] = part.split(']');
          return (
            <span key={i}>
              <a 
                href={mailtoLink}
                className="text-primary font-medium hover:underline"
              >
                {linkText}
              </a>
              {rest}
            </span>
          );
        })}
      </p>
    </div>
  );
}
