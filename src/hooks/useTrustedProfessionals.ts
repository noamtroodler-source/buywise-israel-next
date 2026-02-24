import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TrustedProfessional {
  id: string;
  slug: string;
  name: string;
  category: string;
  company: string | null;
  logo_url: string | null;
  description: string | null;
  long_description: string | null;
  languages: string[];
  website: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  booking_url: string | null;
  specializations: string[];
  cities_covered: string[];
  works_with_internationals: boolean;
  is_featured: boolean;
  accent_color: string | null;
  display_order: number;
  is_published: boolean;
  linkedin_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  founded_year: number | null;
  office_address: string | null;
  testimonial_quote: string | null;
  testimonial_author: string | null;
  created_at: string;
  updated_at: string;
}

export function useTrustedProfessionals() {
  return useQuery({
    queryKey: ['trusted-professionals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trusted_professionals')
        .select('*')
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return data as TrustedProfessional[];
    },
  });
}

export function useTrustedProfessional(slug: string) {
  return useQuery({
    queryKey: ['trusted-professional', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trusted_professionals')
        .select('*')
        .eq('slug', slug)
        .single();
      if (error) throw error;
      return data as TrustedProfessional;
    },
    enabled: !!slug,
  });
}

const CATEGORY_LABELS: Record<string, string> = {
  lawyer: 'Lawyer',
  mortgage_broker: 'Mortgage Broker',
  accountant: 'Accountant & Tax Advisor',
};

export function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] || category;
}

const CATEGORY_PLURAL_LABELS: Record<string, string> = {
  lawyer: 'Lawyers',
  mortgage_broker: 'Mortgage Brokers',
  accountant: 'Accountants & Tax Advisors',
};

export function getCategoryPluralLabel(category: string): string {
  return CATEGORY_PLURAL_LABELS[category] || category;
}
