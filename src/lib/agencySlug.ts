import { supabase } from '@/integrations/supabase/client';

/** Convert an agency name into a URL-safe slug (no DB check). */
export function slugifyAgencyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Generate a unique agency slug from a name. If the base slug is taken,
 * append `-2`, `-3`, … until a free one is found.
 */
export async function generateUniqueAgencySlug(name: string): Promise<string> {
  const base = slugifyAgencyName(name) || 'agency';

  const { data: existing } = await supabase
    .from('agencies')
    .select('slug')
    .like('slug', `${base}%`);

  const taken = new Set((existing || []).map((a: { slug: string }) => a.slug));
  if (!taken.has(base)) return base;

  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix++;
  return `${base}-${suffix}`;
}
