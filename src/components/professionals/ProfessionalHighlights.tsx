import { Badge } from '@/components/ui/badge';
import { Globe, Languages, MapPin, Briefcase, Scale, Landmark, Calculator, CheckCircle2 } from 'lucide-react';
import type { TrustedProfessional } from '@/hooks/useTrustedProfessionals';
import { getCategoryLabel } from '@/hooks/useTrustedProfessionals';

interface Highlight {
  label: string;
  icon: React.ReactNode;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  lawyer: <Scale className="h-3.5 w-3.5" />,
  mortgage_broker: <Landmark className="h-3.5 w-3.5" />,
  accountant: <Calculator className="h-3.5 w-3.5" />,
};

function generateHighlights(professional: TrustedProfessional): Highlight[] {
  const highlights: Highlight[] = [];

  if (professional.works_with_internationals) {
    highlights.push({ label: 'Works with international buyers', icon: <Globe className="h-3.5 w-3.5" /> });
  }

  const langCount = professional.languages?.length || 0;
  if (langCount >= 3) {
    highlights.push({ label: `Speaks ${langCount} languages`, icon: <Languages className="h-3.5 w-3.5" /> });
  } else if (langCount === 2) {
    highlights.push({ label: `Bilingual (${professional.languages.join(' & ')})`, icon: <Languages className="h-3.5 w-3.5" /> });
  }

  const specCount = professional.specializations?.length || 0;
  if (specCount >= 5) {
    highlights.push({ label: `${specCount} areas of expertise`, icon: CATEGORY_ICONS[professional.category] || <Briefcase className="h-3.5 w-3.5" /> });
  } else if (specCount >= 3) {
    highlights.push({ label: 'Multi-specialist practice', icon: CATEGORY_ICONS[professional.category] || <Briefcase className="h-3.5 w-3.5" /> });
  }

  const cities = professional.cities_covered || [];
  const isNationwide = cities.some(c => c.toLowerCase() === 'nationwide');
  if (isNationwide) {
    highlights.push({ label: 'Nationwide coverage', icon: <MapPin className="h-3.5 w-3.5" /> });
  } else if (cities.length >= 3) {
    highlights.push({ label: `Covers ${cities.length} cities`, icon: <MapPin className="h-3.5 w-3.5" /> });
  }

  const specs = (professional.specializations || []).map(s => s.toLowerCase());
  if (specs.some(s => s.includes('olim') || s.includes('new immigrant') || s.includes('aliyah'))) {
    highlights.push({ label: 'Olim / new immigrant specialist', icon: <Globe className="h-3.5 w-3.5" /> });
  }
  if (specs.some(s => s.includes('cross-border') || s.includes('international') || s.includes('us-israel') || s.includes('dual'))) {
    highlights.push({ label: 'Cross-border expertise', icon: <Globe className="h-3.5 w-3.5" /> });
  }
  if (specs.some(s => s.includes('tama 38') || s.includes('tama38'))) {
    highlights.push({ label: 'TAMA 38 specialist', icon: CATEGORY_ICONS[professional.category] || <Briefcase className="h-3.5 w-3.5" /> });
  }
  if (specs.some(s => s.includes('off-plan') || s.includes('developer agreement'))) {
    highlights.push({ label: 'Off-plan purchase expert', icon: CATEGORY_ICONS[professional.category] || <Briefcase className="h-3.5 w-3.5" /> });
  }

  const seen = new Set<string>();
  return highlights.filter(h => {
    if (seen.has(h.label)) return false;
    seen.add(h.label);
    return true;
  }).slice(0, 3);
}

interface ProfessionalHighlightsProps {
  professional: TrustedProfessional;
  accentColor?: string;
}

export function ProfessionalHighlights({ professional, accentColor }: ProfessionalHighlightsProps) {
  const hasCurated = professional.key_differentiators && professional.key_differentiators.length > 0;
  const autoHighlights = generateHighlights(professional);

  if (!hasCurated && autoHighlights.length === 0) return null;

  return (
    <div className="mt-5 pt-4" style={accentColor ? { borderTop: `1.5px solid ${accentColor}20` } : { borderTop: '1px solid hsl(var(--border) / 0.6)' }}>
      <p
        className="text-[11px] font-medium uppercase tracking-wider mb-2"
        style={accentColor ? { color: `${accentColor}B0` } : { color: 'hsl(var(--primary) / 0.7)' }}
      >
        {hasCurated ? 'What sets them apart' : 'Why this firm'}
      </p>

      {hasCurated ? (
        <ul className="space-y-2">
          {professional.key_differentiators!.slice(0, 4).map((d) => (
            <li key={d} className="flex items-start gap-2 text-xs text-foreground/80">
              <CheckCircle2
                className="h-3.5 w-3.5 shrink-0 mt-0.5"
                style={{ color: accentColor || 'hsl(var(--primary))' }}
              />
              {d}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-wrap gap-2">
          {autoHighlights.map((h) => (
            <div
              key={h.label}
              className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium"
              style={accentColor ? {
                backgroundColor: `${accentColor}0A`,
                borderColor: `${accentColor}20`,
                color: `${accentColor}CC`,
              } : {
                backgroundColor: 'hsl(var(--primary) / 0.05)',
                borderColor: 'hsl(var(--primary) / 0.1)',
                color: 'hsl(var(--primary) / 0.8)',
              }}
            >
              {h.icon}
              {h.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
