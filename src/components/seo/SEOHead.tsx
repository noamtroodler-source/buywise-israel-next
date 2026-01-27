// Declarative SEO component that manages meta tags
import { useSEO } from '@/lib/seo';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  canonicalUrl?: string;
  type?: 'website' | 'article' | 'product';
  jsonLd?: object | object[];
  noindex?: boolean;
}

/**
 * SEOHead component for managing dynamic meta tags
 * 
 * Usage:
 * ```tsx
 * <SEOHead 
 *   title="3 Bed Apartment in Tel Aviv | ₪2,500,000"
 *   description="Beautiful apartment for sale..."
 *   image="https://..."
 *   canonicalUrl="https://buywiseisrael.com/property/abc123"
 *   jsonLd={generatePropertyJsonLd(property)}
 * />
 * ```
 */
export function SEOHead({
  title,
  description,
  image,
  canonicalUrl,
  type = 'website',
  jsonLd,
  noindex = false,
}: SEOHeadProps) {
  useSEO({
    title,
    description,
    image,
    url: canonicalUrl,
    type,
    jsonLd,
    noindex,
    canonicalUrl,
  });

  // This component doesn't render anything visible
  return null;
}
