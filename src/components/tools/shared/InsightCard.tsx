import { MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface InsightCardProps {
  insights: string[];
  className?: string;
}

export function InsightCard({ insights, className }: InsightCardProps) {
  if (!insights.length) return null;

  return (
    <Card className={cn(
      "border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent",
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-primary/10 shrink-0 mt-0.5">
            <MessageCircle className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-foreground">
              What This Means For You
            </h4>
            <div className="space-y-2">
              {insights.map((insight, index) => (
                <p key={index} className="text-sm text-muted-foreground leading-relaxed">
                  {insight}
                </p>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
