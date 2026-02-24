import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Globe, MapPin, ExternalLink } from 'lucide-react';
import { ProfessionalHighlights } from './ProfessionalHighlights';
import { ProfessionalSocialLinks } from './ProfessionalSocialLinks';
import { PROFESSIONAL_LOGOS } from './professionalLogos';
import { getCategoryLabel } from '@/hooks/useTrustedProfessionals';
import type { TrustedProfessional } from '@/hooks/useTrustedProfessionals';

interface Props {
  professional: TrustedProfessional;
  accentColor: string;
  logoUrl?: string;
}

export function ProfessionalHeroCard({ professional, accentColor, logoUrl }: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="overflow-hidden" style={{ background: `linear-gradient(160deg, ${accentColor}12, ${accentColor}05 40%, transparent 70%)` }}>
        <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}80)` }} />
        <CardContent className="p-6 md:p-8">
          <div className="flex items-start gap-5">
            {/* Logo */}
            <div
              className="shrink-0 h-20 w-20 rounded-xl flex items-center justify-center overflow-hidden ring-2"
              style={{ backgroundColor: `${accentColor}12`, boxShadow: `0 0 0 2px ${accentColor}40` }}
            >
              {(professional.logo_url || PROFESSIONAL_LOGOS[professional.slug]) ? (
                <img
                  src={professional.logo_url || PROFESSIONAL_LOGOS[professional.slug]}
                  alt={`${professional.name} logo`}
                  className="h-full w-full object-cover rounded-xl"
                />
              ) : (
                <span className="text-3xl font-bold" style={{ color: accentColor }}>
                  {professional.name.charAt(0)}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {professional.name}
              </h1>
              {professional.company && (
                <p className="text-muted-foreground">
                  {professional.company}
                  {professional.founded_year && (
                    <span className="text-xs ml-2 opacity-70">· Est. {professional.founded_year}</span>
                  )}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  style={{ backgroundColor: `${accentColor}20`, color: accentColor, borderColor: `${accentColor}35` }}
                  className="border hover:opacity-80 font-semibold"
                >
                  {getCategoryLabel(professional.category)}
                </Badge>

                {professional.works_with_internationals && (
                  <Badge
                    style={{ backgroundColor: `${accentColor}15`, color: accentColor, borderColor: `${accentColor}30` }}
                    className="border font-medium gap-1"
                  >
                    <Globe className="h-3 w-3" />
                    Works with Internationals
                  </Badge>
                )}

                {professional.website && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                    asChild
                  >
                    <a href={professional.website} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" />
                      Website
                    </a>
                  </Button>
                )}
              </div>

              <ProfessionalSocialLinks professional={professional} />
            </div>
          </div>

          <ProfessionalHighlights professional={professional} accentColor={accentColor} />

          {/* Language & city badges */}
          <div className="mt-5 pt-5 space-y-4" style={{ borderTop: `1.5px solid ${accentColor}25` }}>
            {professional.languages?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Languages</p>
                <div className="flex flex-wrap gap-1.5">
                  {professional.languages.map((lang) => (
                    <Badge key={lang} variant="outline" className="text-xs">
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {professional.cities_covered?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Areas Covered</p>
                <div className="flex flex-wrap gap-1.5">
                  {professional.cities_covered.map((city) => (
                    <Badge key={city} variant="outline" className="text-xs bg-muted/50">
                      <MapPin className="h-3 w-3 mr-1" />
                      {city}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
