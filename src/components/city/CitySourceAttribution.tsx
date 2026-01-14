import { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';

// Support both flat string and nested {date, source} formats
type SourceValue = string | { date?: string; source?: string };

interface CitySourceAttributionProps {
  sources?: Record<string, SourceValue> | null;
  lastVerified?: string | null;
  className?: string;
}

// Format source value for display (includes date if available)
const formatSourceValue = (value: SourceValue): string => {
  if (typeof value === 'string') return value;
  const parts: string[] = [];
  if (value?.source) parts.push(value.source);
  if (value?.date) parts.push(`(${value.date})`);
  return parts.join(' ') || '';
};

const SOURCE_LABELS: Record<string, string> = {
  price_data: 'Price Data',
  rental_data: 'Rental Data',
  arnona_data: 'Arnona Rates',
  demographics: 'Demographics',
  market_factors: 'Market Factors',
};

export function CitySourceAttribution({ sources, lastVerified, className }: CitySourceAttributionProps) {
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  
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
            {/* Header with verification badge */}
            <div className="flex items-center gap-2 text-sm text-foreground mb-4">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 dark:bg-primary/20">
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
              <span className="font-medium">Data verified from official sources</span>
              {formattedDate && (
                <span className="text-muted-foreground">· Last updated {formattedDate}</span>
              )}
            </div>
            
            {/* Source list */}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 mb-4">
              {Object.entries(sources).map(([key, value]) => (
                <div key={key} className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/80">
                    {SOURCE_LABELS[key] || key.replace(/_/g, ' ')}:
                  </span>{' '}
                  {formatSourceValue(value)}
                </div>
              ))}
            </div>
            
            {/* Methodology Collapsible */}
            <Collapsible open={isMethodologyOpen} onOpenChange={setIsMethodologyOpen}>
              <div className="border-t border-border/30 pt-3 mt-3">
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground hover:bg-transparent"
                  >
                    <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                    How we verify this data
                    {isMethodologyOpen ? (
                      <ChevronUp className="h-3.5 w-3.5 ml-1" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 ml-1" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="pt-3">
                  <div className="space-y-3 text-xs text-muted-foreground">
                    <div>
                      <span className="font-medium text-foreground/80">Price Data:</span>{' '}
                      We aggregate transaction data from the Central Bureau of Statistics (CBS), cross-referenced 
                      with listing platforms including Madlan and Kantahome to ensure accuracy.
                    </div>
                    <div>
                      <span className="font-medium text-foreground/80">Rental Data:</span>{' '}
                      Rental ranges are derived from active listings analysis and CBS rental surveys, 
                      validated against market observations.
                    </div>
                    <div>
                      <span className="font-medium text-foreground/80">Arnona Rates:</span>{' '}
                      Municipal tax rates are sourced directly from municipality rate tables and 
                      verified against government publications.
                    </div>
                    <div>
                      <span className="font-medium text-foreground/80">Yield Calculations:</span>{' '}
                      Gross yields are calculated using verified price and rental data, following 
                      standard industry methodology.
                    </div>
                    <div className="pt-2 border-t border-border/30">
                      <span className="font-medium text-foreground/80">Update Frequency:</span>{' '}
                      Data is reviewed and updated monthly, with market factors verified quarterly 
                      or when significant changes occur.
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
            
            <p className="text-xs text-muted-foreground mt-4 pt-3 border-t border-border/30">
              All data is for informational purposes only. Verify current figures before making decisions.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
