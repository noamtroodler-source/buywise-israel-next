import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CTACardProps {
  title: string;
  description?: string;
  buttonText: string;
  buttonLink?: string;
  onButtonClick?: () => void;
  icon?: ReactNode;
  trustMessage?: string;
  variant?: 'primary' | 'accent' | 'muted';
  className?: string;
}

const variantStyles = {
  primary: 'bg-primary/10 border-primary/20',
  accent: 'bg-accent/10 border-accent/20',
  muted: 'bg-muted border-border',
};

export function CTACard({
  title,
  description,
  buttonText,
  buttonLink,
  onButtonClick,
  icon,
  trustMessage,
  variant = 'primary',
  className,
}: CTACardProps) {
  const ButtonContent = (
    <>
      {buttonText}
      <ArrowRight className="h-4 w-4 ml-2" />
    </>
  );

  return (
    <div className={cn(
      "rounded-xl border p-4",
      variantStyles[variant],
      className
    )}>
      <div className="flex items-start gap-3">
        {icon && (
          <span className="text-primary mt-0.5">{icon}</span>
        )}
        <div className="flex-1">
          <h4 className="font-semibold text-foreground">{title}</h4>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
      
      <div className="mt-4">
        {buttonLink ? (
          <Button asChild className="w-full">
            <Link to={buttonLink}>
              {ButtonContent}
            </Link>
          </Button>
        ) : (
          <Button onClick={onButtonClick} className="w-full">
            {ButtonContent}
          </Button>
        )}
      </div>

      {trustMessage && (
        <p className="text-xs text-muted-foreground text-center mt-3">
          {trustMessage}
        </p>
      )}
    </div>
  );
}
