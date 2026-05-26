import { IntelCategory } from '@/hooks/useIntel';
import { TrendingUp, Landmark, Scale, MapPin, Building2, LineChart, Plane, FileText, Newspaper, LucideIcon } from 'lucide-react';
import { ROUTES, TOOL_IDS, toolUrl } from '@/lib/routes';

export interface CategoryMeta {
  id: IntelCategory;
  label: string;
  icon: LucideIcon;
  /** Contextual link to a tool or guide for cross-promotion. */
  ctaLabel?: string;
  ctaHref?: string;
}

export const INTEL_CATEGORIES: CategoryMeta[] = [
  { id: 'property-market', label: 'Property Market', icon: TrendingUp, ctaLabel: 'See area prices', ctaHref: ROUTES.AREAS },
  { id: 'mortgage-rates', label: 'Mortgage & Rates', icon: Landmark, ctaLabel: 'Run a mortgage', ctaHref: toolUrl(TOOL_IDS.MORTGAGE) },
  { id: 'tax-legal', label: 'Tax & Legal', icon: Scale, ctaLabel: 'True cost calculator', ctaHref: toolUrl(TOOL_IDS.TOTAL_COST) },
  { id: 'city-spotlight', label: 'City Spotlight', icon: MapPin, ctaLabel: 'Explore cities', ctaHref: ROUTES.AREAS },
  { id: 'new-developments', label: 'New Developments', icon: Building2, ctaLabel: 'Browse projects', ctaHref: ROUTES.PROJECTS },
  { id: 'macro-economy', label: 'Macro & Economy', icon: LineChart, ctaLabel: 'Affordability check', ctaHref: toolUrl(TOOL_IDS.AFFORDABILITY) },
  { id: 'aliyah-immigration', label: 'Aliyah & Immigration', icon: Plane, ctaLabel: 'Buying guide', ctaHref: '/guides/buying-in-israel' },
  { id: 'policy-regulation', label: 'Policy & Regulation', icon: FileText, ctaLabel: 'Buying guide', ctaHref: '/guides/buying-in-israel' },
  { id: 'general', label: 'General', icon: Newspaper },
];

export const CATEGORY_BY_ID: Record<IntelCategory, CategoryMeta> = INTEL_CATEGORIES.reduce(
  (acc, c) => ({ ...acc, [c.id]: c }),
  {} as Record<IntelCategory, CategoryMeta>,
);
