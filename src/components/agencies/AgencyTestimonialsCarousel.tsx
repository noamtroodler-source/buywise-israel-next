import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import type { AgencyTestimonial } from '@/hooks/useAgencyTestimonials';

interface Props {
  testimonials: AgencyTestimonial[];
  accentColor: string;
}

export function AgencyTestimonialsCarousel({ testimonials, accentColor }: Props) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  const total = testimonials.length;

  const go = useCallback((dir: 1 | -1) => {
    setDirection(dir);
    setCurrent(prev => (prev + dir + total) % total);
  }, [total]);

  // Auto-advance every 6s
  useEffect(() => {
    if (total <= 1) return;
    const timer = setInterval(() => go(1), 6000);
    return () => clearInterval(timer);
  }, [total, go]);

  if (total === 0) return null;

  const t = testimonials[current];

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">What Clients Say</h2>
        {total > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => go(-1)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <div className="flex gap-1">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: i === current ? 16 : 6,
                    backgroundColor: i === current ? accentColor : `${accentColor}30`,
                  }}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={() => go(1)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>

      <div className="relative overflow-hidden rounded-xl border bg-card px-6 py-5">
        <Quote
          className="absolute top-4 right-4 h-8 w-8 opacity-[0.07]"
          style={{ color: accentColor }}
        />
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="space-y-3"
          >
            <p className="text-sm text-foreground/90 leading-relaxed italic pr-8">
              "{t.quote}"
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">— {t.author_name}</span>
              {t.author_context && (
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border"
                  style={{
                    backgroundColor: `${accentColor}08`,
                    borderColor: `${accentColor}20`,
                    color: `${accentColor}CC`,
                  }}
                >
                  {t.author_context}
                </span>
              )}
              {t.service_used && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
                  {t.service_used}
                </span>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
