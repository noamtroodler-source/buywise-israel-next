import { Badge } from '@/components/ui/badge';
import { Globe, Languages, MapPin, Briefcase, Scale, Landmark, Calculator } from 'lucide-react';
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

  // International focus
  if (professional.works_with_internationals) {
    highlights.push({
      label: 'Works with international buyers',
      icon: <Globe className="h-3.5 w-3.5" />,
    });
  }

  // Languages
  const langCount = professional.languages?.length || 0;
  if (langCount >= 3) {
    highlights.push({
      label: `Speaks ${langCount} languages`,
      icon: <Languages className="h-3.5 w-3.5" />,
    });
  } else if (langCount === 2) {
    highlights.push({
      label: `Bilingual (${professional.languages.join(' & ')})`,
      icon: <Languages className="h-3.5 w-3.5" />,
    });
  }

  // Specializations depth
  const specCount = professional.specializations?.length || 0;
  if (specCount >= 5) {
    highlights.push({
      label: `${specCount} areas of expertise`,
      icon: CATEGORY_ICONS[professional.category] || <Briefcase className="h-3.5 w-3.5" />,
    });
  } else if (specCount >= 3) {
    highlights.push({
      label: 'Multi-specialist practice',
      icon: CATEGORY_ICONS[professional.category] || <Briefcase className="h-3.5 w-3.5" />,
    });
  }

  // Coverage breadth
  const cities = professional.cities_covered || [];
  const isNationwide = cities.some(c => c.toLowerCase() === 'nationwide');
  if (isNationwide) {
    highlights.push({
      label: 'Nationwide coverage',
      icon: <MapPin className="h-3.5 w-3.5" />,
    });
  } else if (cities.length >= 3) {
    highlights.push({
      label: `Covers ${cities.length} cities`,
      icon: <MapPin className="h-3.5 w-3.5" />,
    });
  }

  // Notable specializations (keyword-based)
  const specs = (professional.specializations || []).map(s => s.toLowerCase());

  if (specs.some(s => s.includes('olim') || s.includes('new immigrant') || s.includes('aliyah'))) {
    highlights.push({
      label: 'Olim / new immigrant specialist',
      icon: <Globe className="h-3.5 w-3.5" />,
    });
  }

  if (specs.some(s => s.includes('cross-border') || s.includes('international') || s.includes('us-israel') || s.includes('dual'))) {
    highlights.push({
      label: 'Cross-border expertise',
      icon: <Globe className="h-3.5 w-3.5" />,
    });
  }

  if (specs.some(s => s.includes('tama 38') || s.includes('tama38'))) {
    highlights.push({
      label: 'TAMA 38 specialist',
      icon: CATEGORY_ICONS[professional.category] || <Briefcase className="h-3.5 w-3.5" />,
    });
  }

  if (specs.some(s => s.includes('off-plan') || s.includes('developer agreement'))) {
    highlights.push({
      label: 'Off-plan purchase expert',
      icon: CATEGORY_ICONS[professional.category] || <Briefcase className="h-3.5 w-3.5" />,
    });
  }

  // Deduplicate by label and cap at 3
  const seen = new Set<string>();
  return highlights.filter(h => {
    if (seen.has(h.label)) return false;
    seen.add(h.label);
    return true;
  }).slice(0, 3);
}

interface ProfessionalHighlightsProps {
  professional: TrustedProfessional;
}

export function ProfessionalHighlights({ professional }: ProfessionalHighlightsProps) {
  const highlights = generateHighlights(professional);

  if (highlights.length === 0) return null;

  return (
    <div className="mt-5 pt-4 border-t border-border/60">
      <p className="text-[11px] font-medium text-primary/70 uppercase tracking-wider mb-2">Why this firm</p>
      <div className="flex flex-wrap gap-2">
        {highlights.map((h) => (
          <div
            key={h.label}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary/5 border border-primary/10 px-2.5 py-1 text-xs font-medium text-primary/80"
          >
            {h.icon}
            {h.label}
          </div>
        ))}
      </div>
    </div>
  );
}
