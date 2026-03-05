import { useState, useCallback, useEffect } from 'react';
import {
  Languages, Link2, Loader2, AlertTriangle, BookOpen, HelpCircle,
  BarChart3, Search, Save, Copy, RotateCcw, ShieldAlert, ChevronDown,
  ChevronUp, Bed, Bath, Maximize, Building2, Home, MapPin, Calendar,
  Layers, Car, Wrench, ChevronLeft, ChevronRight, CalendarCheck, Eye,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useListingDecoder, type MissingField, type RedFlag, type LoadingStep } from '@/hooks/useListingDecoder';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { FullscreenGallery } from '@/components/shared/FullscreenGallery';

/* ==================== RISK HELPERS ==================== */
const riskDotColors = {
  high: 'bg-semantic-red',
  medium: 'bg-semantic-amber',
  low: 'bg-muted-foreground/40',
};

/* ==================== LOADING STATE ==================== */
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

/* ==================== HERO — matches PropertyHero exactly ==================== */
function DecoderHero({ images, screenshot, title }: { images: string[]; screenshot: string | null; title: string }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps', dragFree: true });

  const allImages = images.length > 0 ? images : screenshot ? [screenshot] : ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200'];

  const scrollPrev = useCallback(() => {
    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
  }, [allImages.length]);

  const scrollNext = useCallback(() => {
    setSelectedImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
  }, [allImages.length]);

  useEffect(() => {
    if (emblaApi) emblaApi.scrollTo(selectedImageIndex);
  }, [emblaApi, selectedImageIndex]);

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="w-full">
        <div className="relative w-full">
          <div
            className="relative aspect-[16/10] md:rounded-xl overflow-hidden bg-muted cursor-pointer group touch-pan-y"
            onClick={() => setIsGalleryOpen(true)}
            onTouchStart={(e) => { (e.currentTarget as any)._touchStartX = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              const startX = (e.currentTarget as any)._touchStartX;
              if (startX === undefined) return;
              const diff = startX - e.changedTouches[0].clientX;
              if (Math.abs(diff) > 50) { diff > 0 ? scrollNext() : scrollPrev(); e.preventDefault(); }
            }}
          >
            <img src={allImages[selectedImageIndex]} alt={title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none" />

            {/* Decoded badge — same position as status badge */}
            <div className="absolute top-4 left-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
              <Badge className="text-sm px-3 py-1.5 bg-background/90 text-foreground backdrop-blur-sm border-0">
                <Languages className="h-3.5 w-3.5 mr-1.5" />
                Decoded Listing
              </Badge>
            </div>

            {/* Navigation Arrows — desktop only, same as PropertyHero */}
            {allImages.length > 1 && (
              <>
                <Button variant="secondary" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background hidden md:flex" onClick={(e) => { e.stopPropagation(); scrollPrev(); }}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button variant="secondary" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background hidden md:flex" onClick={(e) => { e.stopPropagation(); scrollNext(); }}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}

            {/* Mobile counter */}
            {allImages.length > 1 && (
              <div className="absolute bottom-4 right-4 z-10 md:hidden" onClick={(e) => e.stopPropagation()}>
                <span className="bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">
                  {selectedImageIndex + 1} / {allImages.length}
                </span>
              </div>
            )}

            {/* Progress bar — desktop */}
            {allImages.length > 1 && (
              <div className="absolute bottom-4 left-4 right-20 hidden md:flex gap-1 z-10" onClick={(e) => e.stopPropagation()}>
                {allImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(index); }}
                    className={`flex-1 h-1 rounded-full transition-colors duration-200 ${index === selectedImageIndex ? "bg-white" : "bg-white/40 hover:bg-white/60"}`}
                    aria-label={`View image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Thumbnail carousel — desktop, same as PropertyHero */}
        {allImages.length > 1 && (
          <div className="mt-3 hidden md:block">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex gap-2">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImageIndex(i)}
                    className={`flex-shrink-0 relative w-24 h-16 rounded-lg overflow-hidden transition-all ${selectedImageIndex === i ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'opacity-70 hover:opacity-100'}`}
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
        initialIndex={selectedImageIndex}
        title={title}
        subtitle="Decoded listing images"
      />
    </>
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
      '', '--- Translation ---', r.translation,
      '', '--- Missing Info ---',
      ...r.missing_fields.map((f) => `• [${f.risk_level.toUpperCase()}] ${f.field_name}: ${f.why_it_matters}`),
      '', '--- Questions to Ask ---',
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

  /* ==================== EMPTY / LOADING STATES ==================== */
  if (!data && !isLoading && !error) {
    return (
      <div className="container py-8 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-6">
          <div className="space-y-2">
            <Languages className="h-12 w-12 mx-auto text-primary/30" />
            <h1 className="text-2xl font-bold text-foreground">Listing Decoder</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Paste a Hebrew listing URL from Yad2, Madlan, or any Israeli listing site. We'll translate it, flag what's missing, and give you questions to ask the agent.
            </p>
          </div>
          <div className="flex gap-2 max-w-xl mx-auto">
            <Input
              type="url"
              placeholder="Paste a Yad2, Madlan, or listing URL…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button onClick={analyze} disabled={!url.trim()} className="shrink-0 gap-2">
              <Search className="h-4 w-4" />
              Decode
            </Button>
          </div>
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm flex items-start gap-2 max-w-xl mx-auto">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container py-8">
        {/* Compact URL bar at top during loading */}
        <div className="flex gap-2 max-w-xl mx-auto mb-4">
          <Input type="url" value={url} disabled className="flex-1 text-sm" />
          <Button disabled className="shrink-0 gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="hidden sm:inline">Analyzing…</span>
          </Button>
        </div>
        <LoadingState step={loadingStep} progress={loadingProgress} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container py-8 max-w-3xl mx-auto text-center space-y-4">
        <div className="flex gap-2 max-w-xl mx-auto">
          <Input type="url" placeholder="Paste a listing URL…" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={handleKeyDown} className="flex-1" />
          <Button onClick={analyze} disabled={!url.trim()} className="shrink-0 gap-2"><Search className="h-4 w-4" /> Decode</Button>
        </div>
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm flex items-start gap-2 max-w-xl mx-auto">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  /* ==================== RESULTS — PropertyDetail Layout ==================== */
  const result = data.result;
  const mc = data.market_context;

  return (
    <TooltipProvider>
      <div className="container py-6 md:py-8 pb-24 md:pb-8">
        {/* Top bar — New analysis + source link */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={reset} className="gap-2 text-muted-foreground">
            <RotateCcw className="h-4 w-4" />
            New Analysis
          </Button>
          <div className="flex items-center gap-3">
            {data.usage && (
              <span className="text-xs text-muted-foreground">
                {data.usage.used}/{data.usage.limit} today
              </span>
            )}
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              View Original
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ==================== MAIN CONTENT (2/3) ==================== */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero — edge-to-edge on mobile, same as PropertyDetail */}
            <div className="-mx-4 md:mx-0">
              <DecoderHero images={data.images || []} screenshot={data.screenshot || null} title={title} />
            </div>

            {/* Quick Summary — mirrors PropertyQuickSummary exactly */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-5">
              {/* Price & Title */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-2">
                  {summary.price && (
                    <h1 className="text-3xl font-bold text-foreground">{summary.price}</h1>
                  )}
                  <p className="text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>{locationText || 'Location not specified'}</span>
                  </p>
                </div>
                {/* Desktop actions */}
                <div className="hidden sm:flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" className="gap-2" onClick={handleCopyResults}>
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={saveAnalysis}>
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                </div>
              </div>

              {/* Hero Stats Bar — same grid as PropertyQuickSummary */}
              {(summary.bedrooms || summary.rooms || summary.sqm || summary.property_type) && (
                <div className="grid grid-cols-4 gap-2 md:flex md:flex-wrap md:gap-6 py-4 border-y border-border">
                  {(summary.bedrooms || summary.rooms) && (
                    <div className="flex items-center gap-2">
                      <Bed className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-lg font-semibold">{summary.bedrooms || summary.rooms}</p>
                        <p className="text-xs text-muted-foreground">{summary.bedrooms ? 'Bedrooms' : 'Rooms'}</p>
                      </div>
                    </div>
                  )}
                  {summary.sqm && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 cursor-help">
                          <Maximize className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-lg font-semibold">{summary.sqm} sqm</p>
                            <p className="text-xs text-muted-foreground border-b border-dotted border-muted-foreground/30">Size</p>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>In Israel, listed size typically includes balconies and storage ("built area"). Net living space is usually 10-15% smaller.</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {summary.floor && (
                    <div className="flex items-center gap-2">
                      <Layers className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-lg font-semibold">{summary.total_floors ? `${summary.floor}/${summary.total_floors}` : summary.floor}</p>
                        <p className="text-xs text-muted-foreground">Floor</p>
                      </div>
                    </div>
                  )}
                  {summary.property_type && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-lg font-semibold">{summary.property_type}</p>
                        <p className="text-xs text-muted-foreground">Type</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quick Facts Grid — same style as PropertyQuickSummary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
                {summary.year_built && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg bg-muted/50 cursor-help">
                        <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{summary.year_built}</p>
                          <p className="text-xs text-muted-foreground border-b border-dotted border-muted-foreground/30">Built</p>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Buildings from before 1980 may require seismic retrofitting (TAMA 38 eligibility).</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {summary.parking && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg bg-muted/50 cursor-help">
                        <Car className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{summary.parking}</p>
                          <p className="text-xs text-muted-foreground border-b border-dotted border-muted-foreground/30">Parking</p>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Indoor parking is premium in Israeli cities. Street parking permits are limited in many areas.</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {summary.condition && (
                  <div className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg bg-muted/50">
                    <Wrench className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{summary.condition}</p>
                      <p className="text-xs text-muted-foreground">Condition</p>
                    </div>
                  </div>
                )}
                {summary.entry_date && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg bg-muted/50 cursor-help">
                        <CalendarCheck className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{summary.entry_date}</p>
                          <p className="text-xs text-muted-foreground border-b border-dotted border-muted-foreground/30">Available</p>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>When you can move in. "Immediate" means the property is vacant and ready.</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>

              {/* Mobile action buttons — same as PropertyQuickSummary */}
              <div className="flex gap-2 sm:hidden">
                <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={handleCopyResults}>
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={saveAnalysis}>
                  <Save className="h-4 w-4" />
                  Save
                </Button>
              </div>
            </motion.div>

            {/* Description / Full Translation — matches PropertyDescription */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="space-y-3"
            >
              <h2 className="text-xl font-semibold text-foreground">Full Translation</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {result.translation}
              </p>
            </motion.div>

            {/* Red Flags — prominent section */}
            {result.red_flags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="space-y-3"
              >
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-semantic-red" />
                  Red Flags
                </h2>
                <div className="space-y-3">
                  {result.red_flags.map((flag, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-semantic-red/5 border border-semantic-red/10">
                      <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', riskDotColors[flag.severity])} />
                      <div>
                        <p className="text-sm font-medium text-foreground">{flag.flag}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{flag.explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Israeli Terms — glossary cards like amenity badges */}
            {result.hebrew_terms.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="space-y-3"
              >
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Israeli Terms Explained
                </h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  {result.hebrew_terms.map((term, i) => (
                    <div key={i} className="flex items-start gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg bg-muted/50">
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span className="font-bold text-base text-foreground">{term.term}</span>
                          <span className="text-muted-foreground italic text-xs">({term.transliteration})</span>
                        </div>
                        <p className="text-sm font-medium text-foreground">{term.meaning}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{term.buyer_context}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Questions to Ask — like PropertyQuestionsToAsk */}
            {result.questions_to_ask.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
                className="space-y-3"
              >
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  Questions to Ask the Agent
                </h2>
                <div className="space-y-2">
                  {result.questions_to_ask.map((q, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/50 border border-border">
                      <p className="text-sm font-medium text-foreground">"{q.question}"</p>
                      <p className="text-xs text-muted-foreground mt-1">{q.why_ask}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Market Context — like MarketIntelligence section */}
            {mc && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="space-y-3 py-6 border-t border-border"
              >
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Market Context — {mc.city_name}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
                  {mc.median_apartment_price && (
                    <div className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg bg-muted/50">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">₪{mc.median_apartment_price.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Median Price</p>
                      </div>
                    </div>
                  )}
                  {mc.average_price_sqm && (
                    <div className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg bg-muted/50">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">₪{mc.average_price_sqm.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Avg ₪/sqm</p>
                      </div>
                    </div>
                  )}
                  {mc.yoy_price_change != null && (
                    <div className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg bg-muted/50">
                      <div className="min-w-0">
                        <p className={cn('text-sm font-semibold', mc.yoy_price_change >= 0 ? 'text-semantic-green' : 'text-semantic-red')}>
                          {mc.yoy_price_change > 0 ? '+' : ''}{mc.yoy_price_change}%
                        </p>
                        <p className="text-xs text-muted-foreground">YoY Change</p>
                      </div>
                    </div>
                  )}
                  {mc.gross_yield_percent && (
                    <div className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg bg-muted/50">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{mc.gross_yield_percent}%</p>
                        <p className="text-xs text-muted-foreground">Gross Yield</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground text-center py-4">
              AI-powered analysis. Always verify details independently before making decisions.
            </p>
          </div>

          {/* ==================== STICKY SIDEBAR (1/3) — matches StickyContactCard ==================== */}
          <div className="hidden lg:block">
            <div className="sticky top-20 space-y-4">
              {/* What's Missing Card — primary sidebar card like StickyContactCard */}
              {result.missing_fields.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <Card className="shadow-lg border-border overflow-hidden">
                    <div className="p-5 flex items-center gap-3 bg-semantic-red/5">
                      <div className="h-10 w-10 rounded-full bg-semantic-red/10 flex items-center justify-center">
                        <ShieldAlert className="h-5 w-5 text-semantic-red" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">What's Missing</p>
                        <p className="text-xs text-muted-foreground">{result.missing_fields.length} gaps detected</p>
                      </div>
                    </div>
                    <Separator />
                    <CardContent className="p-5 space-y-3">
                      {result.missing_fields
                        .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.risk_level] - { high: 0, medium: 1, low: 2 }[b.risk_level]))
                        .map((field, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', riskDotColors[field.risk_level])} />
                            <div>
                              <p className="text-sm font-medium text-foreground">{field.field_name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{field.why_it_matters}</p>
                            </div>
                          </div>
                        ))}

                      {/* Permission to slow down — same pattern as StickyContactCard */}
                      <div className="pt-3 border-t border-border/50 mt-3">
                        <p className="text-xs text-muted-foreground text-center mb-2">
                          Ask the agent about these before making any decisions
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Actions Card */}
              <Card>
                <CardContent className="p-5 space-y-3">
                  <Button onClick={saveAnalysis} className="w-full gap-2" size="lg">
                    <Save className="h-5 w-5" />
                    Save Analysis
                  </Button>
                  <Button onClick={handleCopyResults} className="w-full gap-2" variant="outline">
                    <Copy className="h-4 w-4" />
                    Copy Results
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Mobile What's Missing — shown below content, same as MobileContactBar area */}
        <div className="lg:hidden mt-6 space-y-4">
          {result.missing_fields.length > 0 && (
            <Card className="shadow-lg border-border overflow-hidden">
              <div className="p-4 flex items-center gap-3 bg-semantic-red/5">
                <ShieldAlert className="h-5 w-5 text-semantic-red" />
                <div>
                  <p className="font-semibold text-foreground">What's Missing</p>
                  <p className="text-xs text-muted-foreground">{result.missing_fields.length} gaps detected</p>
                </div>
              </div>
              <Separator />
              <CardContent className="p-4 space-y-3">
                {result.missing_fields
                  .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.risk_level] - { high: 0, medium: 1, low: 2 }[b.risk_level]))
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
        </div>

        {/* Mobile Bottom Bar — same pattern as MobileContactBar */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border px-4 py-3 z-50 lg:hidden pb-safe"
        >
          <div className="max-w-lg mx-auto flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleCopyResults} className="flex-shrink-0">
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={reset} className="flex-shrink-0">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button className="flex-1 gap-2" size="lg" onClick={saveAnalysis}>
              <Save className="h-5 w-5" />
              Save Analysis
            </Button>
          </div>
        </motion.div>
      </div>
    </TooltipProvider>
  );
}
