import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import type { TrustedProfessional } from '@/hooks/useTrustedProfessionals';
import { useExtractedColor } from '@/hooks/useExtractedColor';
import { PROFESSIONAL_LOGOS } from './professionalLogos';
import { getAccentColor } from './professionalColors';

interface ProfessionalCardProps {
  professional: TrustedProfessional;
  index?: number;
}

export function ProfessionalCard({ professional, index = 0 }: ProfessionalCardProps) {
  const logoUrl = professional.logo_url || PROFESSIONAL_LOGOS[professional.slug] || undefined;
  const extractedColor = useExtractedColor(logoUrl);
  const accentColor = extractedColor || getAccentColor(professional);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
    >
      <Link to={`/professionals/${professional.slug}`}>
        <Card
          className="h-full border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-300 group"
          style={{ borderLeft: `3px solid ${accentColor}` }}
        >
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              {/* Logo or fallback */}
              <div
                className="shrink-0 h-14 w-14 rounded-xl flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: `${accentColor}15` }}
              >
                {(professional.logo_url || PROFESSIONAL_LOGOS[professional.slug]) ? (
                  <img
                    src={professional.logo_url || PROFESSIONAL_LOGOS[professional.slug]}
                    alt={`${professional.name} logo`}
                    className="h-full w-full object-cover rounded-xl"
                  />
                ) : (
                  <span className="text-xl font-bold text-primary">
                    {professional.name.charAt(0)}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {professional.name}
                </h3>
                {professional.company && (
                  <p className="text-sm text-muted-foreground truncate">{professional.company}</p>
                )}
              </div>

              <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
            </div>

            {professional.description && (
              <p className="text-sm text-muted-foreground leading-relaxed mt-3 line-clamp-2">
                {professional.description}
              </p>
            )}

            <div className="flex flex-wrap gap-1.5 mt-3">
              {professional.specializations?.slice(0, 2).map((spec) => (
                <Badge key={spec} variant="outline" className="text-xs bg-primary/5 border-primary/20 text-primary">
                  {spec}
                </Badge>
              ))}
              {professional.languages?.slice(0, 3).map((lang) => (
                <Badge key={lang} variant="outline" className="text-xs">
                  {lang}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
