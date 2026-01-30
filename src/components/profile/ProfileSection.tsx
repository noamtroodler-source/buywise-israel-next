import * as React from 'react';
import { ChevronDown, Check, AlertCircle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface ProfileSectionProps {
  title: string;
  icon: React.ReactNode;
  status?: 'complete' | 'incomplete' | 'neutral';
  statusText?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function ProfileSection({
  title,
  icon,
  status = 'neutral',
  statusText,
  defaultOpen = false,
  children,
  className,
}: ProfileSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between w-full p-3 md:p-4 text-left hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2.5 md:gap-3">
              <div className="h-8 w-8 md:h-9 md:w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                {icon}
              </div>
              <div>
                <h3 className="font-medium text-foreground">{title}</h3>
                {statusText && (
                  <p className="text-xs text-muted-foreground">{statusText}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {status === 'complete' && (
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
              {status === 'incomplete' && (
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                  <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              )}
              <ChevronDown
                className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-3 md:px-4 md:pb-4 border-t border-border pt-3 md:pt-4">
            {children}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
