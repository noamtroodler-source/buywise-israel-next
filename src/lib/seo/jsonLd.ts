// JSON-LD structured data generators following Schema.org standards
import { SITE_CONFIG } from './constants';

// Helper to create base context
const createContext = () => 'https://schema.org';

// Property/RealEstateListing schema
interface PropertyJsonLdInput {
  id: string;
  title?: string | null;
  description?: string | null;
  price: number;
  currency?: string;
  city: string;
  neighborhood?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  size_sqm?: number | null;
  property_type?: string | null;
  listing_status?: string | null;
  images?: string[] | null;
  created_at?: string;
  agent?: { 
    id: string;
    name: string; 
    phone?: string | null;
    email?: string;
  } | null;
}

export function generatePropertyJsonLd(property: PropertyJsonLdInput): object[] {
  const url = `${SITE_CONFIG.siteUrl}/property/${property.id}`;
  const isRental = property.listing_status === 'for_rent';
  
  // Main RealEstateListing schema
  const listing: Record<string, unknown> = {
    '@context': createContext(),
    '@type': 'RealEstateListing',
    '@id': url,
    name: property.title || `${property.bedrooms || ''} Bedroom ${property.property_type || 'Property'} in ${property.city}`,
    description: property.description,
    url,
    datePosted: property.created_at,
  };
  
  // Add images
  if (property.images?.length) {
    listing.image = property.images;
  }
  
  // Add offers/pricing
  listing.offers = {
    '@type': 'Offer',
    price: property.price.toString(),
    priceCurrency: property.currency || 'ILS',
    availability: 'https://schema.org/InStock',
    ...(isRental && { priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }),
  };
  
  // Add address
  listing.address = {
    '@type': 'PostalAddress',
    streetAddress: property.address || undefined,
    addressLocality: property.city,
    addressRegion: property.neighborhood || undefined,
    addressCountry: 'IL',
  };
  
  // Add geo coordinates
  if (property.latitude && property.longitude) {
    listing.geo = {
      '@type': 'GeoCoordinates',
      latitude: property.latitude,
      longitude: property.longitude,
    };
  }
  
  // Add property details
  if (property.bedrooms) listing.numberOfRooms = property.bedrooms;
  if (property.bathrooms) listing.numberOfBathroomsTotal = property.bathrooms;
  
  if (property.size_sqm) {
    listing.floorSize = {
      '@type': 'QuantitativeValue',
      value: property.size_sqm,
      unitCode: 'MTK', // Square meters
    };
  }
  
  const schemas: object[] = [listing];
  
  // Add agent schema if available
  if (property.agent) {
    const agentSchema = {
      '@context': createContext(),
      '@type': 'RealEstateAgent',
      '@id': `${SITE_CONFIG.siteUrl}/agents/${property.agent.id}`,
      name: property.agent.name,
      telephone: property.agent.phone || undefined,
      email: property.agent.email || undefined,
    };
    schemas.push(agentSchema);
  }
  
  // Add breadcrumb
  schemas.push(generateBreadcrumbJsonLd([
    { name: 'Home', url: SITE_CONFIG.siteUrl },
    { name: 'Properties', url: `${SITE_CONFIG.siteUrl}/listings` },
    { name: property.city, url: `${SITE_CONFIG.siteUrl}/areas/${property.city.toLowerCase().replace(/\s+/g, '-')}` },
    { name: property.title || 'Property', url },
  ]));
  
  return schemas;
}

// Project schema (Place + Product)
interface ProjectJsonLdInput {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  city: string;
  neighborhood?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status: string;
  total_units: number;
  price_from?: number | null;
  price_to?: number | null;
  currency?: string;
  completion_date?: string | null;
  images?: string[] | null;
  developer?: { 
    id: string;
    name: string; 
    slug: string;
    logo_url?: string | null;
    website?: string | null;
  } | null;
}

export function generateProjectJsonLd(project: ProjectJsonLdInput): object[] {
  const url = `${SITE_CONFIG.siteUrl}/projects/${project.slug}`;
  
  // Main Place schema for the development
  const place: Record<string, unknown> = {
    '@context': createContext(),
    '@type': 'Place',
    '@id': url,
    name: project.name,
    description: project.description,
    url,
  };
  
  if (project.images?.length) {
    place.image = project.images;
  }
  
  place.address = {
    '@type': 'PostalAddress',
    streetAddress: project.address || undefined,
    addressLocality: project.city,
    addressRegion: project.neighborhood || undefined,
    addressCountry: 'IL',
  };
  
  if (project.latitude && project.longitude) {
    place.geo = {
      '@type': 'GeoCoordinates',
      latitude: project.latitude,
      longitude: project.longitude,
    };
  }
  
  const schemas: object[] = [place];
  
  // Add Product with AggregateOffer for price range
  if (project.price_from || project.price_to) {
    const product: Record<string, unknown> = {
      '@context': createContext(),
      '@type': 'Product',
      name: `Apartments at ${project.name}`,
      description: `New construction apartments in ${project.city}`,
      offers: {
        '@type': 'AggregateOffer',
        lowPrice: project.price_from?.toString(),
        highPrice: project.price_to?.toString() || project.price_from?.toString(),
        priceCurrency: project.currency || 'ILS',
        offerCount: project.total_units,
        availability: 'https://schema.org/InStock',
      },
    };
    schemas.push(product);
  }
  
  // Add developer Organization schema
  if (project.developer) {
    const developerSchema = {
      '@context': createContext(),
      '@type': 'Organization',
      '@id': `${SITE_CONFIG.siteUrl}/developers/${project.developer.slug}`,
      name: project.developer.name,
      logo: project.developer.logo_url || undefined,
      url: project.developer.website || `${SITE_CONFIG.siteUrl}/developers/${project.developer.slug}`,
    };
    schemas.push(developerSchema);
  }
  
  // Add breadcrumb
  schemas.push(generateBreadcrumbJsonLd([
    { name: 'Home', url: SITE_CONFIG.siteUrl },
    { name: 'Projects', url: `${SITE_CONFIG.siteUrl}/projects` },
    { name: project.city, url: `${SITE_CONFIG.siteUrl}/areas/${project.city.toLowerCase().replace(/\s+/g, '-')}` },
    { name: project.name, url },
  ]));
  
  return schemas;
}

// City/Place schema
interface CityJsonLdInput {
  name: string;
  slug: string;
  description?: string | null;
  region?: string | null;
  population?: number | null;
  hero_image?: string | null;
}

export function generateCityJsonLd(city: CityJsonLdInput): object[] {
  const url = `${SITE_CONFIG.siteUrl}/areas/${city.slug}`;
  
  const place: Record<string, unknown> = {
    '@context': createContext(),
    '@type': 'Place',
    '@id': url,
    name: city.name,
    description: city.description || `Real estate and property information for ${city.name}, Israel`,
    url,
    address: {
      '@type': 'PostalAddress',
      addressLocality: city.name,
      addressRegion: city.region || undefined,
      addressCountry: 'IL',
    },
  };
  
  if (city.hero_image) {
    place.image = city.hero_image;
  }
  
  const schemas: object[] = [place];
  
  // Add breadcrumb
  schemas.push(generateBreadcrumbJsonLd([
    { name: 'Home', url: SITE_CONFIG.siteUrl },
    { name: 'Areas', url: `${SITE_CONFIG.siteUrl}/areas` },
    { name: city.name, url },
  ]));
  
  return schemas;
}

// Article schema for blog posts
interface ArticleJsonLdInput {
  id: string;
  title: string;
  slug: string;
  content?: string;
  excerpt?: string | null;
  cover_image?: string | null;
  published_at?: string | null;
  updated_at?: string;
  reading_time_minutes?: number | null;
  author_name?: string | null;
  author_avatar?: string | null;
  category?: { name: string; slug: string } | null;
}

export function generateArticleJsonLd(article: ArticleJsonLdInput): object[] {
  const url = `${SITE_CONFIG.siteUrl}/blog/${article.slug}`;
  
  const articleSchema: Record<string, unknown> = {
    '@context': createContext(),
    '@type': 'Article',
    '@id': url,
    headline: article.title,
    description: article.excerpt || undefined,
    url,
    datePublished: article.published_at || undefined,
    dateModified: article.updated_at || article.published_at || undefined,
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.siteName,
      url: SITE_CONFIG.siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: SITE_CONFIG.defaultImage,
      },
    },
  };
  
  if (article.cover_image) {
    articleSchema.image = article.cover_image;
  }
  
  if (article.author_name) {
    articleSchema.author = {
      '@type': 'Person',
      name: article.author_name,
      image: article.author_avatar || undefined,
    };
  }
  
  if (article.reading_time_minutes) {
    articleSchema.timeRequired = `PT${article.reading_time_minutes}M`;
  }
  
  const schemas: object[] = [articleSchema];
  
  // Add breadcrumb
  const breadcrumbs = [
    { name: 'Home', url: SITE_CONFIG.siteUrl },
    { name: 'Blog', url: `${SITE_CONFIG.siteUrl}/blog` },
  ];
  
  if (article.category) {
    breadcrumbs.push({ 
      name: article.category.name, 
      url: `${SITE_CONFIG.siteUrl}/blog?category=${article.category.slug}` 
    });
  }
  
  breadcrumbs.push({ name: article.title, url });
  schemas.push(generateBreadcrumbJsonLd(breadcrumbs));
  
  return schemas;
}

// Agent schema (RealEstateAgent)
interface AgentJsonLdInput {
  id: string;
  name: string;
  bio?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  email?: string;
  agency_name?: string | null;
  years_experience?: number | null;
  languages?: string[] | null;
  neighborhoods_covered?: string[] | null;
}

export function generateAgentJsonLd(agent: AgentJsonLdInput): object[] {
  const url = `${SITE_CONFIG.siteUrl}/agents/${agent.id}`;
  
  const agentSchema: Record<string, unknown> = {
    '@context': createContext(),
    '@type': 'RealEstateAgent',
    '@id': url,
    name: agent.name,
    description: agent.bio || undefined,
    url,
    telephone: agent.phone || undefined,
    email: agent.email || undefined,
    image: agent.avatar_url || undefined,
  };
  
  if (agent.agency_name) {
    agentSchema.worksFor = {
      '@type': 'Organization',
      name: agent.agency_name,
    };
  }
  
  if (agent.neighborhoods_covered?.length) {
    agentSchema.areaServed = agent.neighborhoods_covered.map(area => ({
      '@type': 'Place',
      name: area,
    }));
  }
  
  if (agent.languages?.length) {
    agentSchema.knowsLanguage = agent.languages;
  }
  
  const schemas: object[] = [agentSchema];
  
  // Add breadcrumb
  schemas.push(generateBreadcrumbJsonLd([
    { name: 'Home', url: SITE_CONFIG.siteUrl },
    { name: 'Agents', url: `${SITE_CONFIG.siteUrl}/agents` },
    { name: agent.name, url },
  ]));
  
  return schemas;
}

// Developer/Organization schema
interface DeveloperJsonLdInput {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo_url?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  founded_year?: number | null;
  office_city?: string | null;
  office_address?: string | null;
}

export function generateDeveloperJsonLd(developer: DeveloperJsonLdInput): object[] {
  const url = `${SITE_CONFIG.siteUrl}/developers/${developer.slug}`;
  
  const orgSchema: Record<string, unknown> = {
    '@context': createContext(),
    '@type': 'Organization',
    '@id': url,
    name: developer.name,
    description: developer.description || undefined,
    url: developer.website || url,
    logo: developer.logo_url || undefined,
    telephone: developer.phone || undefined,
    email: developer.email || undefined,
    foundingDate: developer.founded_year?.toString() || undefined,
  };
  
  if (developer.office_city || developer.office_address) {
    orgSchema.address = {
      '@type': 'PostalAddress',
      streetAddress: developer.office_address || undefined,
      addressLocality: developer.office_city || undefined,
      addressCountry: 'IL',
    };
  }
  
  const schemas: object[] = [orgSchema];
  
  // Add breadcrumb
  schemas.push(generateBreadcrumbJsonLd([
    { name: 'Home', url: SITE_CONFIG.siteUrl },
    { name: 'Developers', url: `${SITE_CONFIG.siteUrl}/developers` },
    { name: developer.name, url },
  ]));
  
  return schemas;
}

// Agency/Organization schema
interface AgencyJsonLdInput {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo_url?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  founded_year?: number | null;
  office_address?: string | null;
  cities_covered?: string[] | null;
}

export function generateAgencyJsonLd(agency: AgencyJsonLdInput): object[] {
  const url = `${SITE_CONFIG.siteUrl}/agencies/${agency.slug}`;
  
  const orgSchema: Record<string, unknown> = {
    '@context': createContext(),
    '@type': 'RealEstateAgent', // Using RealEstateAgent as primary type for agencies
    '@id': url,
    name: agency.name,
    description: agency.description || undefined,
    url: agency.website || url,
    logo: agency.logo_url || undefined,
    telephone: agency.phone || undefined,
    email: agency.email || undefined,
    foundingDate: agency.founded_year?.toString() || undefined,
  };
  
  if (agency.office_address) {
    orgSchema.address = {
      '@type': 'PostalAddress',
      streetAddress: agency.office_address,
      addressCountry: 'IL',
    };
  }
  
  if (agency.cities_covered?.length) {
    orgSchema.areaServed = agency.cities_covered.map(city => ({
      '@type': 'Place',
      name: city,
    }));
  }
  
  const schemas: object[] = [orgSchema];
  
  // Add breadcrumb
  schemas.push(generateBreadcrumbJsonLd([
    { name: 'Home', url: SITE_CONFIG.siteUrl },
    { name: 'Agencies', url: `${SITE_CONFIG.siteUrl}/agencies` },
    { name: agency.name, url },
  ]));
  
  return schemas;
}

// Breadcrumb schema generator
interface BreadcrumbItem {
  name: string;
  url: string;
}

export function generateBreadcrumbJsonLd(items: BreadcrumbItem[]): object {
  return {
    '@context': createContext(),
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// Website schema for homepage
export function generateWebsiteJsonLd(): object {
  return {
    '@context': createContext(),
    '@type': 'WebSite',
    '@id': SITE_CONFIG.siteUrl,
    name: SITE_CONFIG.siteName,
    description: SITE_CONFIG.defaultDescription,
    url: SITE_CONFIG.siteUrl,
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.siteName,
      url: SITE_CONFIG.siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: SITE_CONFIG.defaultImage,
      },
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_CONFIG.siteUrl}/listings?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}
