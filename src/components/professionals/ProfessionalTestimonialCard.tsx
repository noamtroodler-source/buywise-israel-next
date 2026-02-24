import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Quote } from 'lucide-react';
import type { TrustedProfessional } from '@/hooks/useTrustedProfessionals';
import type { ProfessionalTestimonial } from '@/hooks/useProfessionalTestimonials';

interface Props {
  professional: TrustedProfessional;
  accentColor: string;
  testimonials?: ProfessionalTestimonial[];
}

export function ProfessionalTestimonialCard({ professional, accentColor, testimonials = [] }: Props) {
  // Build unified list: dedicated table testimonials first, then legacy field as fallback
  const items: { quote: string; author: string; context?: string | null; service?: string | null }[] =
    testimonials.map(t => ({
      quote: t.quote,
      author: t.author_name,
      context: t.author_context,
      service: t.service_used,
    }));

  // Fallback to legacy fields if no dedicated testimonials exist
  if (items.length === 0 && professional.testimonial_quote) {
    items.push({
      quote: professional.testimonial_quote,
      author: professional.testimonial_author || '',
    });
  }

  if (items.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
    >
      <Card className="overflow-hidden">
        <div className="h-0.5 w-full" style={{ backgroundColor: `${accentColor}30` }} />
        <CardContent className="p-6 md:p-8">
          <h2 className="text-lg font-semibold text-foreground mb-5">Client Testimonials</h2>
          <div className="space-y-6">
            {items.map((item, i) => (
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
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
