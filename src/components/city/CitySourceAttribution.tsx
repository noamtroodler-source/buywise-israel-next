import { CheckCircle2, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface CitySourceAttributionProps {
  sources?: Record<string, string> | null;
  lastVerified?: string | null;
  className?: string;
}

const SOURCE_LABELS: Record<string, string> = {
  price_data: 'Price Data',
  rental_data: 'Rental Data',
  arnona_data: 'Arnona Rates',
  demographics: 'Demographics',
  market_factors: 'Market Factors',
};

export function CitySourceAttribution({ sources, lastVerified, className }: CitySourceAttributionProps) {
  if (!sources || Object.keys(sources).length === 0) {
    return null;
  }

  const formattedDate = lastVerified 
    ? new Date(lastVerified).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

  return (
    <section className={`py-8 ${className || ''}`}>
      <div className="container">
        <Card className="border-border/30 bg-muted/20">
          <CardContent className="py-5">
            <div className="flex items-center gap-2 text-sm text-foreground mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="font-medium">Data verified from official sources</span>
              {formattedDate && (
                <span className="text-muted-foreground">· Last updated {formattedDate}</span>
              )}
            </div>
            
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(sources).map(([key, value]) => (
                <div key={key} className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/80">
                    {SOURCE_LABELS[key] || key.replace(/_/g, ' ')}:
                  </span>{' '}
                  {value}
                </div>
              ))}
            </div>
            
            <p className="text-xs text-muted-foreground mt-4 pt-3 border-t border-border/30">
              All data is for informational purposes only. Verify current figures before making decisions.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
