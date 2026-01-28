import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BlogAuthorContact {
  id: string;
  type: 'agent' | 'agency' | 'developer';
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  organization_name: string | null;
  slug?: string;
}

async function fetchAuthorDetails(
  authorType: string | null,
  authorProfileId: string | null
): Promise<BlogAuthorContact | null> {
  if (!authorType || !authorProfileId) return null;

  switch (authorType) {
    case 'agent': {
      const { data, error } = await supabase
        .from('agents')
        .select('id, name, email, phone, avatar_url, agency_name')
        .eq('id', authorProfileId)
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: data.id,
        type: 'agent',
        name: data.name,
        email: data.email,
        phone: data.phone,
        avatar_url: data.avatar_url,
        organization_name: data.agency_name,
      };
    }

    case 'agency': {
      const { data, error } = await supabase
        .from('agencies')
        .select('id, name, email, phone, logo_url, slug')
        .eq('id', authorProfileId)
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: data.id,
        type: 'agency',
        name: data.name,
        email: data.email,
        phone: data.phone,
        avatar_url: data.logo_url,
        organization_name: null,
        slug: data.slug,
      };
    }

    case 'developer': {
      const { data, error } = await supabase
        .from('developers')
        .select('id, name, email, phone, logo_url, slug')
        .eq('id', authorProfileId)
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: data.id,
        type: 'developer',
        name: data.name,
        email: data.email,
        phone: data.phone,
        avatar_url: data.logo_url,
        organization_name: null,
        slug: data.slug,
      };
    }

    default:
      return null;
  }
}

export function useBlogPostAuthor(
  authorType: string | null | undefined,
  authorProfileId: string | null | undefined
) {
  return useQuery({
    queryKey: ['blog-post-author', authorType, authorProfileId],
    queryFn: () => fetchAuthorDetails(authorType ?? null, authorProfileId ?? null),
    enabled: !!authorType && !!authorProfileId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
