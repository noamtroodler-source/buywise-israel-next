import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EnhancedEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: LucideIcon;
  };
  suggestions?: {
    icon?: LucideIcon;
    text: string;
  }[];
  children?: ReactNode;
  className?: string;
  variant?: 'default' | 'compact';
}

/**
 * Enhanced empty state component with engaging visuals and clear actions
 * Used across the app for consistent empty/no-results messaging
 */
export function EnhancedEmptyState({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  suggestions,
  children,
  className,
  variant = 'default',
}: EnhancedEmptyStateProps) {
  const isCompact = variant === 'compact';
  
  return (
    <div className={cn(
      "text-center mx-auto px-4",
      isCompact ? "py-8 max-w-sm" : "py-12 md:py-16 max-w-lg",
      className
    )}>
      {/* Animated Icon Container */}
      <div className={cn(
        "relative mx-auto mb-4",
        isCompact ? "w-14 h-14" : "w-20 h-20 md:w-24 md:h-24 mb-6"
      )}>
        {/* Pulsing background rings */}
        <div className="absolute inset-0 bg-primary/5 rounded-full animate-pulse" />
        <div className={cn(
          "absolute bg-primary/10 rounded-full",
          isCompact ? "inset-1" : "inset-2"
        )} />
        <div className={cn(
          "absolute bg-muted rounded-full",
          isCompact ? "inset-2" : "inset-4"
        )} />
        
        {/* Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className={cn(
            "text-muted-foreground/60",
            isCompact ? "h-6 w-6" : "h-8 w-8 md:h-10 md:w-10"
          )} />
        </div>
      </div>
      
      {/* Title */}
      <h2 className={cn(
        "font-semibold text-foreground mb-2",
        isCompact ? "text-lg" : "text-xl md:text-2xl"
      )}>
        {title}
      </h2>
      
      {/* Description */}
      <p className={cn(
        "text-muted-foreground mb-6",
        isCompact ? "text-sm" : "text-base"
      )}>
        {description}
      </p>
      
      {/* Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div className={cn(
          "bg-muted/50 rounded-xl text-left mb-6",
          isCompact ? "p-4 space-y-2" : "p-5 space-y-3"
        )}>
          <ul className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                {suggestion.icon && (
                  <suggestion.icon className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                )}
                <span>{suggestion.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Actions */}
      {(primaryAction || secondaryAction) && (
        <div className={cn(
          "flex gap-3 justify-center",
          isCompact ? "flex-col" : "flex-col sm:flex-row"
        )}>
          {primaryAction && (
            primaryAction.href ? (
              <Button asChild size={isCompact ? "default" : "lg"}>
                <Link to={primaryAction.href}>
                  {primaryAction.icon && <primaryAction.icon className="h-4 w-4 mr-2" />}
                  {primaryAction.label}
                </Link>
              </Button>
            ) : (
              <Button onClick={primaryAction.onClick} size={isCompact ? "default" : "lg"}>
                {primaryAction.icon && <primaryAction.icon className="h-4 w-4 mr-2" />}
                {primaryAction.label}
              </Button>
            )
          )}
          
          {secondaryAction && (
            secondaryAction.href ? (
              <Button asChild variant="outline" size={isCompact ? "default" : "lg"}>
                <Link to={secondaryAction.href}>
                  {secondaryAction.icon && <secondaryAction.icon className="h-4 w-4 mr-2" />}
                  {secondaryAction.label}
                </Link>
              </Button>
            ) : (
              <Button variant="outline" onClick={secondaryAction.onClick} size={isCompact ? "default" : "lg"}>
                {secondaryAction.icon && <secondaryAction.icon className="h-4 w-4 mr-2" />}
                {secondaryAction.label}
              </Button>
            )
          )}
        </div>
      )}
      
      {/* Additional content */}
      {children}
    </div>
  );
}
