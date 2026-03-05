import { useState, useCallback, useEffect } from 'react';
import {
  Languages, Link2, Loader2, AlertTriangle, BookOpen, HelpCircle,
  BarChart3, Search, Save, Copy, RotateCcw, ShieldAlert, ChevronDown,
  ChevronUp, Bed, Maximize, Building2, Home, MapPin, Calendar,
  Layers, Car, Wrench, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useListingDecoder, type MissingField, type RedFlag, type LoadingStep } from '@/hooks/useListingDecoder';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { FullscreenGallery } from '@/components/shared/FullscreenGallery';

const riskColors = {
  high: 'bg-semantic-red/15 text-semantic-red border-semantic-red/30',
  medium: 'bg-semantic-amber/15 text-semantic-amber border-semantic-amber/30',
  low: 'bg-muted text-muted-foreground border-border',
};

const riskDotColors = {
  high: 'bg-semantic-red',
  medium: 'bg-semantic-amber',
  low: 'bg-muted-foreground/40',
};

const riskLabels = { high: 'High Risk', medium: 'Medium', low: 'Low' };

function RiskBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  return (
    <Badge variant="outline" className={cn('text-xs font-medium', riskColors[level])}>
      {riskLabels[level]}
    </Badge>
  );
}

const loadingStepLabels: Record<string, string> = {
  scraping: 'Scraping listing page…',
  analyzing: 'Translating & analyzing…',
  matching: 'Matching market data…',
};

function LoadingState({ step, progress }: { step: LoadingStep; progress: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-lg mx-auto py-20 px-4 text-center space-y-6"
    >
      <div className="relative mx-auto w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-muted" />
        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <Languages className="absolute inset-0 m-auto h-6 w-6 text-primary" />
      </div>

      <div className="space-y-2">
        <AnimatePresence mode="wait">
          <motion.p
            key={step || 'init'}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-sm font-medium text-foreground"
          >
            {step ? loadingStepLabels[step] : 'Starting analysis…'}
          </motion.p>
        </AnimatePresence>
        <p className="text-xs text-muted-foreground">This usually takes 5–10 seconds</p>
      </div>

      <Progress value={progress} className="h-1.5 max-w-xs mx-auto" indicatorClassName="transition-all duration-700 ease-out" />
    </motion.div>
  );
}

/* ==================== HERO IMAGE GALLERY ==================== */
function DecoderHero({ images, screenshot, title }: { images: string[]; screenshot: string | null; title: string }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps', dragFree: true });

  const allImages = images.length > 0 ? images : screenshot ? [screenshot] : [];

  useEffect(() => {
    if (emblaApi) emblaApi.scrollTo(selectedIndex);
  }, [emblaApi, selectedIndex]);

  const scrollPrev = useCallback(() => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
  }, [allImages.length]);

  const scrollNext = useCallback(() => {
    setSelectedIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
  }, [allImages.length]);

  if (allImages.length === 0) return null;

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="w-full">
        <div
          className="relative aspect-[16/10] md:rounded-xl overflow-hidden bg-muted cursor-pointer group"
          onClick={() => setIsGalleryOpen(true)}
        >
          <img
            src={allImages[selectedIndex]}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none" />

          {/* Source badge */}
          <div className="absolute top-4 left-4">
            <Badge className="text-sm px-3 py-1.5 bg-background/90 text-foreground backdrop-blur-sm border-0">
              <Languages className="h-3.5 w-3.5 mr-1.5" />
              Decoded Listing
            </Badge>
          </div>

          {allImages.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background hidden md:flex"
                onClick={(e) => { e.stopPropagation(); scrollPrev(); }}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background hidden md:flex"
                onClick={(e) => { e.stopPropagation(); scrollNext(); }}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>

              <div className="absolute bottom-4 left-4 right-20 hidden md:flex gap-1 z-10" onClick={(e) => e.stopPropagation()}>
                {allImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => { e.stopPropagation(); setSelectedIndex(index); }}
                    className={`flex-1 h-1 rounded-full transition-colors duration-200 ${
                      index === selectedIndex ? "bg-white" : "bg-white/40 hover:bg-white/60"
                    }`}
                  />
                ))}
              </div>

              <div className="absolute bottom-4 right-4 z-10 md:hidden" onClick={(e) => e.stopPropagation()}>
                <span className="bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">
                  {selectedIndex + 1} / {allImages.length}
                </span>
              </div>
            </>
          )}
        </div>

        {allImages.length > 1 && (
          <div className="mt-3 hidden md:block">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex gap-2">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedIndex(i)}
                    className={`flex-shrink-0 relative w-24 h-16 rounded-lg overflow-hidden transition-all ${
                      selectedIndex === i
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      <FullscreenGallery
        open={isGalleryOpen}
        onOpenChange={setIsGalleryOpen}
        images={allImages}
        initialIndex={selectedIndex}
        title={title}
        subtitle="Decoded listing images"
      />
    </>
  );
}

/* ==================== STATS BAR ==================== */
function StatsBar({ summary }: { summary: Record<string, string | undefined> }) {
  const stats = [
    { icon: Bed, value: summary.bedrooms || summary.rooms, label: summary.bedrooms ? 'Bedrooms' : 'Rooms' },
    { icon: Maximize, value: summary.sqm, label: 'Size (sqm)' },
    { icon: Layers, value: summary.floor ? (summary.total_floors ? `${summary.floor}/${summary.total_floors}` : summary.floor) : undefined, label: 'Floor' },
    { icon: Home, value: summary.property_type, label: 'Type' },
  ].filter(s => s.value);

  if (stats.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-border">
      {stats.map(({ icon: Icon, value, label }) => (
        <div key={label} className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ==================== QUICK FACTS ==================== */
function QuickFacts({ summary }: { summary: Record<string, string | undefined> }) {
  const facts = [
    { icon: Car, label: 'Parking', value: summary.parking },
    { icon: Wrench, label: 'Condition', value: summary.condition },
    { icon: Calendar, label: 'Year Built', value: summary.year_built },
    { icon: Calendar, label: 'Entry Date', value: summary.entry_date },
  ].filter(f => f.value);

  if (facts.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
      {facts.map(({ icon: Icon, label, value }) => (
        <div key={label} className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-medium text-foreground">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ==================== COLLAPSIBLE SECTION ==================== */
function CollapsibleSection({ title, icon, children, defaultOpen = true, count }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  count?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border pb-5">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-2 text-left group"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-semibold text-foreground">{title}</span>
          {count !== undefined && (
            <Badge variant="secondary" className="text-xs">{count}</Badge>
          )}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ==================== MAIN COMPONENT ==================== */
export function ListingDecoderTool() {
  const {
    url, setUrl, isLoading, data, error, loadingStep, loadingProgress,
    analyze, saveAnalysis, reset,
  } = useListingDecoder();

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
    if (e.key === 'Enter' && !isLoading) analyze();
  };

  const summary = (data?.result.property_summary || {}) as Record<string, string | undefined>;
  const locationText = [summary.neighborhood, summary.city].filter(Boolean).join(', ');
  const title = summary.property_type
    ? `${summary.property_type}${locationText ? ` in ${locationText}` : ''}`
    : locationText || 'Decoded Listing';

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Compact URL Input Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-primary shrink-0">
            <Languages className="h-5 w-5" />
            <span className="font-semibold text-foreground hidden sm:inline">Listing Decoder</span>
          </div>
          <div className="flex-1 flex gap-2">
            <Input
              type="url"
              placeholder="Paste a Yad2, Madlan, or listing URL…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="flex-1"
            />
            {!data ? (
              <Button onClick={analyze} disabled={isLoading || !url.trim()} className="shrink-0 gap-2">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="hidden sm:inline">{isLoading ? 'Analyzing…' : 'Decode'}</span>
              </Button>
            ) : (
              <Button variant="outline" onClick={reset} className="shrink-0 gap-2">
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">New</span>
              </Button>
            )}
          </div>
        </div>

        {data?.usage && (
          <p className="text-xs text-muted-foreground text-right mt-1.5">
            {data.usage.used} of {data.usage.limit} free analyses used today
          </p>
        )}

        {error && !isLoading && (
          <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm flex items-start gap-2 mt-3">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </motion.div>

      {/* Loading State */}
      {isLoading && <LoadingState step={loadingStep} progress={loadingProgress} />}

      {/* Empty State */}
      {!isLoading && !data && !error && (
        <div className="text-center py-20 text-muted-foreground">
          <Languages className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium text-lg">Paste a listing URL to get started</p>
          <p className="text-sm mt-1 max-w-md mx-auto">
            We'll scrape the page, translate the listing into English, flag what's missing, and give you questions to ask the agent.
          </p>
        </div>
      )}

      {/* Results — Property Detail Page Style */}
      {data && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          {/* Hero Gallery */}
          <div className="-mx-4 md:mx-0 mb-6">
            <DecoderHero
              images={data.images || []}
              screenshot={data.screenshot || null}
              title={title}
            />
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column — Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Price + Title */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                {summary.price && (
                  <h1 className="text-3xl font-bold text-foreground">{summary.price}</h1>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{locationText || 'Location not specified'}</span>
                </div>
              </motion.div>

              {/* Stats Bar */}
              <StatsBar summary={summary} />

              {/* Quick Facts */}
              <QuickFacts summary={summary} />

              {/* Full Translation */}
              <CollapsibleSection
                title="Full Translation"
                icon={<BookOpen className="h-4 w-4 text-primary" />}
                defaultOpen={true}
              >
                <div className="text-sm whitespace-pre-wrap leading-relaxed text-foreground bg-muted/30 rounded-lg p-4">
                  {data.result.translation}
                </div>
              </CollapsibleSection>

              {/* Israeli Terms */}
              {data.result.hebrew_terms.length > 0 && (
                <CollapsibleSection
                  title="Israeli Terms Explained"
                  icon={<span className="text-base">🔑</span>}
                  defaultOpen={false}
                  count={data.result.hebrew_terms.length}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    {data.result.hebrew_terms.map((term, i) => (
                      <div key={i} className="bg-muted/50 rounded-lg p-3 text-sm">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-bold text-base">{term.term}</span>
                          <span className="text-muted-foreground italic text-xs">({term.transliteration})</span>
                        </div>
                        <p className="font-medium">{term.meaning}</p>
                        <p className="text-muted-foreground text-xs mt-1">{term.buyer_context}</p>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}

              {/* Red Flags */}
              {data.result.red_flags.length > 0 && (
                <CollapsibleSection
                  title="Red Flags"
                  icon={<AlertTriangle className="h-4 w-4 text-semantic-red" />}
                  defaultOpen={true}
                  count={data.result.red_flags.length}
                >
                  <div className="space-y-3">
                    {data.result.red_flags.map((flag, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm">
                        <RiskBadge level={flag.severity} />
                        <div>
                          <p className="font-medium text-foreground">{flag.flag}</p>
                          <p className="text-muted-foreground text-xs mt-0.5">{flag.explanation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}

              {/* Questions to Ask */}
              {data.result.questions_to_ask.length > 0 && (
                <CollapsibleSection
                  title="Questions to Ask the Agent"
                  icon={<HelpCircle className="h-4 w-4 text-primary" />}
                  defaultOpen={false}
                  count={data.result.questions_to_ask.length}
                >
                  <div className="space-y-3">
                    {data.result.questions_to_ask.map((q, i) => (
                      <div key={i} className="text-sm bg-muted/30 rounded-lg p-3">
                        <p className="font-medium text-foreground">"{q.question}"</p>
                        <p className="text-muted-foreground text-xs mt-1">{q.why_ask}</p>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}

              {/* Market Context */}
              {data.market_context && (
                <CollapsibleSection
                  title={`Market Context — ${data.market_context.city_name}`}
                  icon={<BarChart3 className="h-4 w-4 text-primary" />}
                  defaultOpen={true}
                >
                  <div className="grid grid-cols-2 gap-3">
                    {data.market_context.median_apartment_price && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">Median Price</p>
                        <p className="text-sm font-semibold text-foreground">₪{data.market_context.median_apartment_price.toLocaleString()}</p>
                      </div>
                    )}
                    {data.market_context.average_price_sqm && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">Avg ₪/sqm</p>
                        <p className="text-sm font-semibold text-foreground">₪{data.market_context.average_price_sqm.toLocaleString()}</p>
                      </div>
                    )}
                    {data.market_context.yoy_price_change != null && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">YoY Change</p>
                        <p className={cn('text-sm font-semibold', data.market_context.yoy_price_change >= 0 ? 'text-semantic-green' : 'text-semantic-red')}>
                          {data.market_context.yoy_price_change > 0 ? '+' : ''}{data.market_context.yoy_price_change}%
                        </p>
                      </div>
                    )}
                    {data.market_context.gross_yield_percent && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">Gross Yield</p>
                        <p className="text-sm font-semibold text-foreground">{data.market_context.gross_yield_percent}%</p>
                      </div>
                    )}
                  </div>
                </CollapsibleSection>
              )}
            </div>

            {/* Right Column — Sticky Sidebar */}
            <div className="hidden lg:block">
              <div className="sticky top-20 space-y-4">
                {/* What's Missing Card */}
                {data.result.missing_fields.length > 0 && (
                  <Card className="border-semantic-red/20 shadow-sm">
                    <CardContent className="pt-5 space-y-4">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-semantic-red" />
                        <h3 className="font-semibold text-foreground">What's Missing</h3>
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {data.result.missing_fields.length}
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        {data.result.missing_fields
                          .sort((a, b) => {
                            const order = { high: 0, medium: 1, low: 2 };
                            return order[a.risk_level] - order[b.risk_level];
                          })
                          .map((field, i) => (
                            <div key={i} className="flex items-start gap-2.5">
                              <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', riskDotColors[field.risk_level])} />
                              <div>
                                <p className="text-sm font-medium text-foreground">{field.field_name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{field.why_it_matters}</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Actions Card */}
                <Card>
                  <CardContent className="pt-5 space-y-3">
                    <Button onClick={saveAnalysis} className="w-full gap-2" variant="default">
                      <Save className="h-4 w-4" />
                      Save Analysis
                    </Button>
                    <Button onClick={handleCopyResults} className="w-full gap-2" variant="outline">
                      <Copy className="h-4 w-4" />
                      Copy Results
                    </Button>
                    <Separator />
                    <p className="text-xs text-muted-foreground text-center">
                      AI-powered analysis. Always verify details independently.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Mobile What's Missing + Actions (shown below content on mobile) */}
          <div className="lg:hidden mt-6 space-y-4">
            {data.result.missing_fields.length > 0 && (
              <Card className="border-semantic-red/20">
                <CardContent className="pt-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-semantic-red" />
                    <h3 className="font-semibold text-foreground">What's Missing</h3>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {data.result.missing_fields.length}
                    </Badge>
                  </div>
                  {data.result.missing_fields
                    .sort((a, b) => {
                      const order = { high: 0, medium: 1, low: 2 };
                      return order[a.risk_level] - order[b.risk_level];
                    })
                    .map((field, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', riskDotColors[field.risk_level])} />
                        <div>
                          <p className="text-sm font-medium text-foreground">{field.field_name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{field.why_it_matters}</p>
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2">
              <Button onClick={saveAnalysis} className="flex-1 gap-2">
                <Save className="h-4 w-4" />
                Save
              </Button>
              <Button onClick={handleCopyResults} className="flex-1 gap-2" variant="outline">
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
