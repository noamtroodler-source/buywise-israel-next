import type { TrustedProfessional } from '@/hooks/useTrustedProfessionals';

/** Hardcoded fallback map so colors render even before DB data loads */
const ACCENT_COLORS: Record<string, string> = {
  'cohen-levy-partners': '#1B4D6E',
  'adv-sarah-goldstein': '#6B4C9A',
  'shapira-legal-group': '#2C5F3F',
  'ben-david-associates': '#8B5A2B',
  'israel-mortgage-advisors': '#0E6B5C',
  'firsthome-finance': '#D4761C',
  'global-lending-il': '#2A5CAA',
  'aliyah-mortgage-solutions': '#1A7A4F',
  'katz-co-accounting': '#4A4A4A',
  'stern-tax-advisory': '#7B3B3A',
  'levi-financial-partners': '#2E5B8A',
  'dvora-mizrachi-cpa': '#8A6B3D',
};

const DEFAULT_ACCENT = '#2A5CAA'; // fallback to a neutral blue

/**
 * Returns the accent color for a professional.
 * Priority: DB value → hardcoded map → default.
 */
export function getAccentColor(professional: Pick<TrustedProfessional, 'slug' | 'accent_color'>): string {
  return professional.accent_color || ACCENT_COLORS[professional.slug] || DEFAULT_ACCENT;
}
