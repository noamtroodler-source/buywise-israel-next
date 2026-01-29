import { Lightbulb, ArrowRight, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface Insight {
  id: string;
  message: string;
  category: 'opportunity' | 'warning' | 'action';
  metric?: string;
  relatedSection?: string;
}

interface ChapterInsightCardProps {
  insights: Insight[];
  onViewData?: (section: string) => void;
  onMarkAddressed?: (id: string) => void;
}

export function ChapterInsightCard({ 
  insights, 
  onViewData, 
  onMarkAddressed 
}: ChapterInsightCardProps) {
  if (insights.length === 0) return null;

  const categoryConfig = {
    opportunity: {
      bgClass: 'bg-emerald-500/5 border-emerald-500/20',
      iconClass: 'text-emerald-600',
    },
    warning: {
      bgClass: 'bg-amber-500/5 border-amber-500/20',
      iconClass: 'text-amber-600',
    },
    action: {
      bgClass: 'bg-destructive/5 border-destructive/20',
      iconClass: 'text-destructive',
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
      {insights.map((insight) => {
        const config = categoryConfig[insight.category];
        return (
          <Card 
            key={insight.id} 
            className={cn("border rounded-xl", config.bgClass)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={cn("mt-0.5", config.iconClass)}>
                  <Lightbulb className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-3">
                  <p className="text-sm text-foreground leading-relaxed">
                    {insight.message}
                  </p>
                  
                  {insight.metric && (
                    <p className="text-xs text-muted-foreground font-medium">
                      📊 {insight.metric}
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    {insight.relatedSection && onViewData && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-xs text-primary hover:text-primary"
                        onClick={() => onViewData(insight.relatedSection!)}
                      >
                        View Data <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    )}
                    {onMarkAddressed && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => onMarkAddressed(insight.id)}
                      >
                        <Check className="mr-1 h-3 w-3" /> Addressed
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
