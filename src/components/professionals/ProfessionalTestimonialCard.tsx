import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Quote } from 'lucide-react';
import type { TrustedProfessional } from '@/hooks/useTrustedProfessionals';

interface Props {
  professional: TrustedProfessional;
  accentColor: string;
}

export function ProfessionalTestimonialCard({ professional, accentColor }: Props) {
  if (!professional.testimonial_quote) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
    >
      <Card className="overflow-hidden">
        <div className="h-0.5 w-full" style={{ backgroundColor: `${accentColor}30` }} />
        <CardContent className="p-6 md:p-8">
          <div className="flex gap-3">
            <Quote className="h-5 w-5 shrink-0 mt-0.5" style={{ color: accentColor }} />
            <div className="space-y-3">
              <p className="text-sm text-foreground/90 leading-relaxed italic">
                "{professional.testimonial_quote}"
              </p>
              {professional.testimonial_author && (
                <p className="text-xs font-medium text-muted-foreground">
                  — {professional.testimonial_author}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
