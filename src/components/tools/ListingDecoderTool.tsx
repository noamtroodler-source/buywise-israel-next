import { Languages, Link2, Loader2, AlertTriangle, BookOpen, HelpCircle, BarChart3, Search, Save, Copy, RotateCcw, ShieldAlert, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ToolLayout, ToolDisclaimer, InfoBanner } from '@/components/tools/shared';
import { useListingDecoder, type MissingField, type RedFlag } from '@/hooks/useListingDecoder';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const riskColors = {
  high: 'bg-semantic-red text-semantic-red-foreground border-semantic-red',
  medium: 'bg-semantic-amber text-semantic-amber-foreground border-semantic-amber',
  low: 'bg-muted text-muted-foreground border-border',
};

const riskLabels = { high: 'High Risk', medium: 'Medium', low: 'Low' };

function RiskBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  return (
    <Badge variant="outline" className={cn('text-xs font-medium', riskColors[level])}>
      {riskLabels[level]}
    </Badge>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-32 rounded-lg" />
      <Skeleton className="h-24 rounded-lg" />
      <Skeleton className="h-24 rounded-lg" />
    </div>
  );
}

export function ListingDecoderTool() {
  const { url, setUrl, isLoading, data, error, analyze, saveAnalysis, reset } = useListingDecoder();

  const handleCopyResults = () => {
    if (!data) return;
    const r = data.result;
    const text = [
      `Property: ${r.property_summary.city || ''} — ${r.property_summary.price || ''}`,
      '',
      '--- Translation ---',
      r.translation,
      '',
      '--- Missing Info ---',
      ...r.missing_fields.map((f) => `• [${f.risk_level.toUpperCase()}] ${f.field_name}: ${f.why_it_matters}`),
      '',
      '--- Questions to Ask ---',
      ...r.questions_to_ask.map((q) => `• ${q.question}`),
    ].join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Results copied to clipboard');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      analyze();
    }
  };

  const leftColumn = (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link2 className="h-4 w-4" />
            <span>Paste a listing URL from Yad2, Madlan, or any Israeli real estate site</span>
          </div>
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://www.yad2.co.il/item/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={analyze} disabled={isLoading || !url.trim()} className="shrink-0 gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Decode
                </>
              )}
            </Button>
          </div>

          {data?.usage && (
            <p className="text-xs text-muted-foreground text-right">
              {data.usage.used} of {data.usage.limit} free analyses used today
            </p>
          )}

          {error && !isLoading && (
            <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {data && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={saveAnalysis} className="gap-2">
            <Save className="h-4 w-4" />
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopyResults} className="gap-2">
            <Copy className="h-4 w-4" />
            Copy
          </Button>
          <Button variant="ghost" size="sm" onClick={reset} className="gap-2 ml-auto">
            <RotateCcw className="h-4 w-4" />
            New Analysis
          </Button>
        </div>
      )}
    </div>
  );

  const rightColumn = (
    <div className="space-y-4">
      {isLoading && <LoadingSkeleton />}

      {!isLoading && !data && !error && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center text-muted-foreground py-12">
            <Languages className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Paste a URL to get started</p>
            <p className="text-sm mt-1">We'll translate, analyze, and flag what's missing</p>
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          {/* Property Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                🏠 Property Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {Object.entries(data.result.property_summary)
                  .filter(([, v]) => v)
                  .map(([key, value]) => (
                    <div key={key}>
                      <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                      <p className="font-medium">{value}</p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* What's Missing */}
          {data.result.missing_fields.length > 0 && (
            <Card className="border-destructive/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-destructive">
                  <ShieldAlert className="h-4 w-4" />
                  What's Missing
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {data.result.missing_fields.length} items
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.result.missing_fields
                  .sort((a, b) => {
                    const order = { high: 0, medium: 1, low: 2 };
                    return order[a.risk_level] - order[b.risk_level];
                  })
                  .map((field, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <RiskBadge level={field.risk_level} />
                      <div>
                        <p className="font-medium">{field.field_name}</p>
                        <p className="text-muted-foreground text-xs mt-0.5">{field.why_it_matters}</p>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}

          {/* Accordion for remaining sections */}
          <Accordion type="multiple" defaultValue={['translation', 'red_flags']}>
            {/* Translation */}
            <AccordionItem value="translation">
              <AccordionTrigger className="text-sm font-medium gap-2">
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Full Translation
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="text-sm whitespace-pre-wrap leading-relaxed text-foreground">
                  {data.result.translation}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Hebrew Terms */}
            {data.result.hebrew_terms.length > 0 && (
              <AccordionItem value="terms">
                <AccordionTrigger className="text-sm font-medium gap-2">
                  <span className="flex items-center gap-2">
                    🔑 Israeli Terms Explained ({data.result.hebrew_terms.length})
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    {data.result.hebrew_terms.map((term, i) => (
                      <div key={i} className="bg-muted/50 rounded-lg p-3 text-sm">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-bold text-base">{term.term}</span>
                          <span className="text-muted-foreground italic">({term.transliteration})</span>
                        </div>
                        <p className="font-medium">{term.meaning}</p>
                        <p className="text-muted-foreground text-xs mt-1">{term.buyer_context}</p>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Red Flags */}
            {data.result.red_flags.length > 0 && (
              <AccordionItem value="red_flags">
                <AccordionTrigger className="text-sm font-medium gap-2">
                  <span className="flex items-center gap-2">
                    ⚠️ Red Flags ({data.result.red_flags.length})
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    {data.result.red_flags.map((flag, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm">
                        <RiskBadge level={flag.severity} />
                        <div>
                          <p className="font-medium">{flag.flag}</p>
                          <p className="text-muted-foreground text-xs mt-0.5">{flag.explanation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Questions to Ask */}
            {data.result.questions_to_ask.length > 0 && (
              <AccordionItem value="questions">
                <AccordionTrigger className="text-sm font-medium gap-2">
                  <span className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-primary" />
                    Questions to Ask ({data.result.questions_to_ask.length})
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {data.result.questions_to_ask.map((q, i) => (
                      <div key={i} className="text-sm">
                        <p className="font-medium">"{q.question}"</p>
                        <p className="text-muted-foreground text-xs mt-0.5">{q.why_ask}</p>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Market Context */}
            {data.market_context && (
              <AccordionItem value="market">
                <AccordionTrigger className="text-sm font-medium gap-2">
                  <span className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Market Context — {data.market_context.city_name}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {data.market_context.median_apartment_price && (
                      <div>
                        <span className="text-muted-foreground">Median Price</span>
                        <p className="font-medium">₪{data.market_context.median_apartment_price.toLocaleString()}</p>
                      </div>
                    )}
                    {data.market_context.average_price_sqm && (
                      <div>
                        <span className="text-muted-foreground">Avg ₪/sqm</span>
                        <p className="font-medium">₪{data.market_context.average_price_sqm.toLocaleString()}</p>
                      </div>
                    )}
                    {data.market_context.yoy_price_change != null && (
                      <div>
                        <span className="text-muted-foreground">YoY Change</span>
                        <p className={cn('font-medium', data.market_context.yoy_price_change >= 0 ? 'text-semantic-green-foreground' : 'text-semantic-red-foreground')}>
                          {data.market_context.yoy_price_change > 0 ? '+' : ''}{data.market_context.yoy_price_change}%
                        </p>
                      </div>
                    )}
                    {data.market_context.gross_yield_percent && (
                      <div>
                        <span className="text-muted-foreground">Gross Yield</span>
                        <p className="font-medium">{data.market_context.gross_yield_percent}%</p>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </>
      )}
    </div>
  );

  return (
    <ToolLayout
      title="Listing Decoder"
      subtitle="Paste a Hebrew listing URL — get a full English breakdown, missing data flags, and questions to ask."
      icon={<Languages className="h-6 w-6" />}
      intro={
        <InfoBanner variant="tip">
          Israeli listings often leave out critical details. This tool translates the listing, flags what's missing, and tells you what to ask before you visit.
        </InfoBanner>
      }
      leftColumn={leftColumn}
      rightColumn={rightColumn}
      disclaimer={
      <ToolDisclaimer text="This tool uses AI to analyze listings. Always verify details independently and consult a licensed professional before making decisions." />
      }
    />
  );
}
