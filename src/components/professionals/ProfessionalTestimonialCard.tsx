import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import type { TrustedProfessional } from '@/hooks/useTrustedProfessionals';
import type { ProfessionalTestimonial } from '@/hooks/useProfessionalTestimonials';

interface Props {
  professional: TrustedProfessional;
  accentColor: string;
  testimonials?: ProfessionalTestimonial[];
}

interface TestimonialItem {
  quote: string;
  author: string;
  context?: string | null;
  service?: string | null;
}

const PAGE_SIZE = 3;

export function ProfessionalTestimonialCard({ professional, accentColor, testimonials = [] }: Props) {
  const [page, setPage] = useState(0);

  const items: TestimonialItem[] = testimonials.map(t => ({
    quote: t.quote,
    author: t.author_name,
    context: t.author_context,
    service: t.service_used,
  }));

  // Fallback to legacy fields
  if (items.length === 0 && professional.testimonial_quote) {
    items.push({
      quote: professional.testimonial_quote,
      author: professional.testimonial_author || '',
    });
  }

  if (items.length === 0) return null;

  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const visibleItems = items.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
    >
      <Card className="overflow-hidden">
        <div className="h-0.5 w-full" style={{ backgroundColor: `${accentColor}30` }} />
        <CardContent className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-foreground">Client Testimonials</h2>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-1 rounded-md hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous testimonials"
                >
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                </button>
                <span className="text-xs text-muted-foreground tabular-nums px-1">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className="p-1 rounded-md hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next testimonials"
                >
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {visibleItems.map((item, i) => (
                <div key={i} className={`flex gap-3 ${i > 0 ? 'pt-5 border-t border-border/50' : ''}`}>
                  <Quote className="h-5 w-5 shrink-0 mt-0.5" style={{ color: accentColor }} />
                  <div className="space-y-2">
                    <p className="text-sm text-foreground/90 leading-relaxed italic">
                      "{item.quote}"
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {item.author && (
                        <span className="text-xs font-medium text-muted-foreground">— {item.author}</span>
                      )}
                      {item.context && (
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border"
                          style={{
                            backgroundColor: `${accentColor}08`,
                            borderColor: `${accentColor}20`,
                            color: `${accentColor}CC`,
                          }}
                        >
                          {item.context}
                        </span>
                      )}
                      {item.service && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
                          {item.service}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
