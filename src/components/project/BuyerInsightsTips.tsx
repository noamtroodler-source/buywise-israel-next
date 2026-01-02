import { Lightbulb } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const insights = [
  "4-room units are the most common choice for families in Israel.",
  "Garden apartments appeal to buyers with young children or pets.",
  "Penthouse units usually have stronger long-term resale value.",
  "Larger balconies are highly valued for outdoor living in Israel's climate.",
  "Higher floors command premium prices but offer better views and less noise.",
  "Corner units provide more natural light and cross-ventilation.",
];

export function BuyerInsightsTips() {
  // Show 3-4 random insights
  const displayInsights = insights.slice(0, 4);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-amber-500" />
        Buyer Insights
      </h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {displayInsights.map((insight, index) => (
          <Card key={index} className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/30">
            <CardContent className="p-3">
              <p className="text-sm text-foreground/80">{insight}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
