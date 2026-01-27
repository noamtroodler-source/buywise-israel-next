// React hook for managing dynamic meta tags
import { useEffect } from 'react';
import { SITE_CONFIG } from './constants';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  jsonLd?: object | object[];
  noindex?: boolean;
  canonicalUrl?: string;
}

// Helper to set or create a meta tag
function setMetaTag(property: string, content: string, attributeName: 'property' | 'name' = 'property') {
  if (!content) return;
  
  let element = document.querySelector(`meta[${attributeName}="${property}"]`) as HTMLMetaElement | null;
  
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attributeName, property);
    document.head.appendChild(element);
  }
  
  element.setAttribute('content', content);
}

// Helper to set or create a link tag
function setLinkTag(rel: string, href: string) {
  if (!href) return;
  
  let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  
  element.setAttribute('href', href);
}

// Helper to inject JSON-LD script
function injectJsonLd(data: object | object[], id: string) {
  // Remove existing script with same id
  const existing = document.getElementById(id);
  if (existing) {
    existing.remove();
  }
  
  const script = document.createElement('script');
  script.id = id;
  script.type = 'application/ld+json';
  
  // Handle array of schemas
  const schemas = Array.isArray(data) ? data : [data];
  script.textContent = JSON.stringify(schemas.length === 1 ? schemas[0] : schemas);
  
  document.head.appendChild(script);
  
  return script;
}

export function useSEO(props: SEOProps) {
  const {
    title,
    description,
    image,
    url,
    type = 'website',
    jsonLd,
    noindex = false,
    canonicalUrl,
  } = props;

  useEffect(() => {
    const cleanupTasks: (() => void)[] = [];
    
    // Set document title
    const previousTitle = document.title;
    if (title) {
      document.title = title;
      cleanupTasks.push(() => {
        document.title = previousTitle;
      });
    }
    
    // Basic meta tags
    if (description) {
      setMetaTag('description', description, 'name');
    }
    
    // Open Graph tags
    setMetaTag('og:type', type);
    if (title) setMetaTag('og:title', title);
    if (description) setMetaTag('og:description', description);
    if (image) setMetaTag('og:image', image.startsWith('http') ? image : `${SITE_CONFIG.siteUrl}${image}`);
    if (url) setMetaTag('og:url', url);
    setMetaTag('og:site_name', SITE_CONFIG.siteName);
    setMetaTag('og:locale', SITE_CONFIG.locale);
    
    // Twitter Card tags
    setMetaTag('twitter:card', 'summary_large_image', 'name');
    if (title) setMetaTag('twitter:title', title, 'name');
    if (description) setMetaTag('twitter:description', description, 'name');
    if (image) setMetaTag('twitter:image', image.startsWith('http') ? image : `${SITE_CONFIG.siteUrl}${image}`, 'name');
    setMetaTag('twitter:site', SITE_CONFIG.twitterHandle, 'name');
    
    // Canonical URL
    if (canonicalUrl) {
      setLinkTag('canonical', canonicalUrl);
    }
    
    // Robots meta tag for noindex
    if (noindex) {
      setMetaTag('robots', 'noindex, nofollow', 'name');
      cleanupTasks.push(() => {
        const robotsMeta = document.querySelector('meta[name="robots"]');
        if (robotsMeta) robotsMeta.remove();
      });
    }
    
    // JSON-LD structured data
    let jsonLdScript: HTMLScriptElement | null = null;
    if (jsonLd) {
      jsonLdScript = injectJsonLd(jsonLd, 'seo-json-ld');
      cleanupTasks.push(() => {
        if (jsonLdScript) jsonLdScript.remove();
      });
    }
    
    // Cleanup on unmount or when props change
    return () => {
      cleanupTasks.forEach(task => task());
    };
  }, [title, description, image, url, type, jsonLd, noindex, canonicalUrl]);
}
