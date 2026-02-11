import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChapterSignal {
  status: 'green' | 'yellow' | 'red';
  label: string;
  message: string;
}

interface ChapterHeaderProps {
  icon: LucideIcon;
  title: string;
  question: string;
  description: string;
  signals?: ChapterSignal[];
}

export function ChapterHeader({ 
  icon: Icon, 
  title, 
  question, 
  description, 
  signals = [] 
}: ChapterHeaderProps) {
  const statusConfig = {
    green: { 
      label: 'Strong', 
      bgClass: 'bg-semantic-green', 
      textClass: 'text-semantic-green-foreground',
      dotClass: 'bg-white/80'
    },
    yellow: { 
      label: 'Watch', 
      bgClass: 'bg-semantic-amber', 
      textClass: 'text-semantic-amber-foreground',
      dotClass: 'bg-white/80'
    },
    red: { 
      label: 'Action', 
      bgClass: 'bg-semantic-red', 
      textClass: 'text-semantic-red-foreground',
      dotClass: 'bg-white/80'
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6 mb-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.08),transparent_50%)]" />
      
      <div className="relative space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground uppercase tracking-wide">
              {title}
            </h2>
            <p className="text-sm text-primary font-medium">{question}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">
          {description}
        </p>

        {/* Signals */}
        {signals.length > 0 && (
          <div className="flex flex-wrap gap-3 pt-2">
            {signals.map((signal, idx) => {
              const config = statusConfig[signal.status];
              return (
                <div 
                  key={idx}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
                    config.bgClass, config.textClass
                  )}
                >
                  <span className={cn("w-2 h-2 rounded-full", config.dotClass)} />
                  <span className="font-semibold">{signal.label}:</span>
                  <span>{signal.message}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
