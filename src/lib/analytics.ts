/**
 * Google Analytics 4 helper functions
 * 
 * To enable tracking, replace GA_MEASUREMENT_ID with your actual ID
 * Get your ID from: https://analytics.google.com → Admin → Data Streams → your stream → Measurement ID
 */

// Replace with your actual GA4 Measurement ID (format: G-XXXXXXXXXX)
export const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX';

// Check if GA is loaded and measurement ID is configured
const isGAEnabled = (): boolean => {
  return typeof window !== 'undefined' && 
         'gtag' in window && 
         GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX';
};

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

/**
 * Track a page view
 */
export const trackPageView = (url: string, title?: string): void => {
  if (!isGAEnabled()) return;
  
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
    page_title: title,
  });
};

/**
 * Track a custom event
 */
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
): void => {
  if (!isGAEnabled()) return;
  
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

/**
 * Track property view
 */
export const trackPropertyView = (propertyId: string, city?: string, price?: number): void => {
  trackEvent('view_item', 'property', propertyId, price);
  
  if (!isGAEnabled()) return;
  
  window.gtag('event', 'view_item', {
    currency: 'ILS',
    value: price,
    items: [{
      item_id: propertyId,
      item_category: 'property',
      item_category2: city,
      price: price,
    }],
  });
};

/**
 * Track project view
 */
export const trackProjectView = (projectSlug: string, developerName?: string): void => {
  trackEvent('view_item', 'project', projectSlug);
  
  if (!isGAEnabled()) return;
  
  window.gtag('event', 'view_item', {
    items: [{
      item_id: projectSlug,
      item_category: 'project',
      item_brand: developerName,
    }],
  });
};

/**
 * Track inquiry/lead submission
 */
export const trackInquiry = (
  entityType: 'property' | 'project' | 'agent',
  entityId: string
): void => {
  trackEvent('generate_lead', entityType, entityId);
  
  if (!isGAEnabled()) return;
  
  window.gtag('event', 'generate_lead', {
    currency: 'ILS',
    items: [{
      item_id: entityId,
      item_category: entityType,
    }],
  });
};

/**
 * Track sign up
 */
export const trackSignUp = (method: 'email' | 'google' | 'apple' = 'email'): void => {
  if (!isGAEnabled()) return;
  
  window.gtag('event', 'sign_up', {
    method: method,
  });
};

/**
 * Track search
 */
export const trackSearch = (searchTerm: string, filters?: Record<string, unknown>): void => {
  if (!isGAEnabled()) return;
  
  window.gtag('event', 'search', {
    search_term: searchTerm,
    ...filters,
  });
};

/**
 * Track property saved to favorites
 */
export const trackAddToFavorites = (propertyId: string, price?: number): void => {
  if (!isGAEnabled()) return;
  
  window.gtag('event', 'add_to_wishlist', {
    currency: 'ILS',
    value: price,
    items: [{
      item_id: propertyId,
      item_category: 'property',
      price: price,
    }],
  });
};

/**
 * Track share event
 */
export const trackShare = (
  method: 'whatsapp' | 'telegram' | 'copy_link' | 'email',
  contentType: 'property' | 'project' | 'article',
  contentId: string
): void => {
  if (!isGAEnabled()) return;
  
  window.gtag('event', 'share', {
    method: method,
    content_type: contentType,
    item_id: contentId,
  });
};

/**
 * Track calculator usage
 */
export const trackCalculatorUse = (calculatorType: string): void => {
  trackEvent('use_calculator', 'tools', calculatorType);
};

/**
 * Track guide/article read
 */
export const trackContentRead = (contentType: 'guide' | 'blog', slug: string): void => {
  trackEvent('view_content', contentType, slug);
};
