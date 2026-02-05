import { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, BookOpen, Building2, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  type SourceValue,
  getDisplayableSources,
  hasGovernmentVerification,
} from '@/lib/utils/sourceFormatting';

interface CitySourceAttributionProps {
  sources?: Record<string, SourceValue> | null;
  lastVerified?: string | null;
  className?: string;
  cityName?: string;
  districtName?: string | null;
}

export function CitySourceAttribution({ sources, lastVerified, className, cityName, districtName }: CitySourceAttributionProps) {
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [isDataExplainerOpen, setIsDataExplainerOpen] = useState(false);
  
  // Determine city-specific variants
  const isJerusalem = cityName?.toLowerCase() === 'jerusalem';
  const isTelAviv = cityName?.toLowerCase() === 'tel aviv';
  const districtLabel = districtName?.replace(' District', '');
  
  // Get displayable sources (filters out empty values and hidden categories)
  const displayableSources = getDisplayableSources(sources);
  const hasGovVerification = hasGovernmentVerification(sources);
  
  // Don't render if no meaningful sources
  if (displayableSources.length === 0 && !hasGovVerification) {
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
            
            {/* Source list - only show non-empty sources */}
            {displayableSources.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 mb-4">
                {displayableSources.map(({ key, label, value }) => (
                  <div key={key} className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/80">
                      {label}:
                    </span>{' '}
                    {value}
                  </div>
                ))}
              </div>
            )}
            
            {/* Government verification badge */}
            {hasGovVerification && (
              <div className="mb-4">
                <Badge variant="secondary" className="text-xs gap-1.5">
                  <Building2 className="h-3 w-3" />
                  Government verified source
                </Badge>
              </div>
            )}
            
            {/* Understanding Our Data - NEW Collapsible */}
            <Collapsible open={isDataExplainerOpen} onOpenChange={setIsDataExplainerOpen}>
              <div className="border-t border-border/30 pt-3 mt-3">
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground hover:bg-transparent"
                  >
                    <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                    Understanding our data
                    {isDataExplainerOpen ? (
                      <ChevronUp className="h-3.5 w-3.5 ml-1" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 ml-1" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="pt-3">
                  <div className="space-y-3 text-xs text-muted-foreground">
                    {isJerusalem ? (
                      <>
                        <p>
                          Jerusalem encompasses remarkably diverse neighborhoods — from ultra-Orthodox 
                          communities to secular areas — each with distinct market dynamics and pricing.
                        </p>
                        <p>
                          Our data combines CBS regional statistics with listing platform data and local 
                          market analysis. Given Jerusalem's diversity, we especially recommend:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>Consulting with local agents familiar with your target neighborhoods</li>
                          <li>Reviewing recent transactions in specific areas you're considering</li>
                          <li>Using our regional trends as context, not as neighborhood-specific predictions</li>
                        </ul>
                      </>
                    ) : isTelAviv ? (
                      <>
                        <p>
                          Tel Aviv benefits from extensive market coverage, with city-specific data 
                          available from multiple sources including CBS city-level statistics, Madlan 
                          transaction records, and active listing analysis.
                        </p>
                        <p>
                          This page combines government statistics with real-time market data to give 
                          you one of the most complete pictures available for any Israeli city.
                        </p>
                      </>
                    ) : (
                      <>
                        <p>We combine multiple verified sources to give you a complete picture:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li><span className="font-medium text-foreground/80">Government sources</span> (CBS, municipalities) form our foundation for verified statistics</li>
                          <li><span className="font-medium text-foreground/80">Listing platforms</span> (Madlan, Yad2) provide real-time market pricing</li>
                          <li><span className="font-medium text-foreground/80">Industry research</span> validates trends and provides market context</li>
                        </ul>
                        {districtLabel && cityName && (
                          <p className="pt-2">
                            For price trends, Israel's CBS publishes indices at the regional level. {cityName} is 
                            part of the {districtLabel} region — this gives you verified government context, while 
                            city-specific metrics come from aggregated transaction and listing data.
                          </p>
                        )}
                        <p className="pt-2">
                          Different sources have different strengths. We cross-reference them to help 
                          you make informed decisions.
                        </p>
                      </>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
            
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
