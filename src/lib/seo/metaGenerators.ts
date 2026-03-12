// Meta tag content generators for SEO optimization
import { SITE_CONFIG, PROPERTY_TYPE_LABELS, LISTING_STATUS_LABELS, PROJECT_STATUS_LABELS } from './constants';

// Helper to format price in ILS with symbol
const formatPrice = (price: number | null | undefined, currency: string = 'ILS'): string => {
  if (!price) return '';
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price);
};

// Helper to truncate description to optimal SERP length (155-160 chars)
const truncateDescription = (text: string, maxLength: number = 155): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3).trim() + '...';
};

// Property meta generation
interface PropertyMetaInput {
  id: string;
  title?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  size_sqm?: number | null;
  price: number;
  currency?: string;
  city: string;
  neighborhood?: string | null;
  property_type?: string | null;
  listing_status?: string | null;
  description?: string | null;
  condition?: string | null;
  features?: string[] | null;
  agent?: { name: string } | null;
}

export function generatePropertyMeta(property: PropertyMetaInput): { title: string; description: string } {
  const typeLabel = PROPERTY_TYPE_LABELS[property.property_type || 'apartment'] || 'Property';
  const statusLabel = LISTING_STATUS_LABELS[property.listing_status || 'for_sale'] || 'For Sale';
  const location = property.neighborhood 
    ? `${property.neighborhood}, ${property.city}` 
    : property.city;
  
  // Generate title: "3 Bed Apartment in Tel Aviv | ₪2,500,000 | BuyWise Israel"
  const bedsText = property.bedrooms ? `${property.bedrooms} Bed ` : '';
  const priceText = formatPrice(property.price, property.currency);
  const isRental = property.listing_status === 'for_rent';
  const priceWithSuffix = isRental ? `${priceText}/mo` : priceText;
  
  const title = `${bedsText}${typeLabel} in ${location} | ${priceWithSuffix} | ${SITE_CONFIG.siteName}`;
  
  // Generate description: "3 bedroom apartment for sale in Neve Tzedek, Tel Aviv. 95 sqm, renovated, with balcony and parking."
  const bedsDesc = property.bedrooms ? `${property.bedrooms} bedroom ` : '';
  const sizeText = property.size_sqm ? `${property.size_sqm} sqm` : '';
  const conditionText = property.condition ? `, ${property.condition}` : '';
  
  // Extract top features
  const topFeatures = property.features?.slice(0, 2).join(' and ') || '';
  const featuresText = topFeatures ? `, with ${topFeatures}` : '';
  
  let description = `${bedsDesc}${typeLabel.toLowerCase()} ${statusLabel.toLowerCase()} in ${location}.`;
  if (sizeText) description += ` ${sizeText}${conditionText}${featuresText}.`;
  if (property.agent?.name) description += ` Listed by ${property.agent.name}.`;
  
  return {
    title: title.slice(0, 60), // Google truncates at ~60 chars
    description: truncateDescription(description),
  };
}

// Project meta generation
interface ProjectMetaInput {
  id: string;
  name: string;
  slug: string;
  city: string;
  neighborhood?: string | null;
  description?: string | null;
  status: string;
  total_units: number;
  price_from?: number | null;
  price_from?: number | null;
  price_to?: number | null;
  currency?: string;
  completion_date?: string | null;
  developer?: { name: string } | null;
}

export function generateProjectMeta(project: ProjectMetaInput): { title: string; description: string } {
  const statusLabel = PROJECT_STATUS_LABELS[project.status] || project.status;
  const priceText = project.price_from ? formatPrice(project.price_from, project.currency || 'ILS') : '';
  const developerName = project.developer?.name || '';
  
  // Generate title: "Haifa Heights | New Development in Haifa | From ₪1,800,000"
  let title = `${project.name} | New Development in ${project.city}`;
  if (priceText) title += ` | From ${priceText}`;
  
  // Generate description
  const unitsText = `${project.total_units} total units`;
  
  const completionText = project.completion_date 
    ? ` Completion: ${new Date(project.completion_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}.`
    : '';
  
  let description = `${project.name}: ${unitsText} in ${project.city}`;
  if (developerName) description += ` by ${developerName}`;
  description += `.`;
  if (priceText) description += ` From ${priceText}.`;
  description += ` ${statusLabel}.${completionText}`;
  
  return {
    title: title.slice(0, 60),
    description: truncateDescription(description),
  };
}

// City/Area meta generation
interface CityMetaInput {
  name: string;
  slug: string;
  description?: string | null;
  average_price_sqm?: number | null;
  median_apartment_price?: number | null;
  population?: number | null;
  region?: string | null;
}

export function generateCityMeta(city: CityMetaInput, listingsCount?: number): { title: string; description: string } {
  // Title: "Real Estate in Tel Aviv | Market Data & Properties | BuyWise Israel"
  const title = `Real Estate in ${city.name} | Market Data & Properties | ${SITE_CONFIG.siteName}`;
  
  // Description with market data
  let description = `Explore ${city.name} real estate: current market prices, trends, and available properties.`;
  
  if (city.average_price_sqm) {
    description += ` Average price: ₪${city.average_price_sqm.toLocaleString()}/sqm.`;
  }
  
  if (listingsCount !== undefined && listingsCount > 0) {
    description += ` ${listingsCount} listings available.`;
  }
  
  return {
    title: title.slice(0, 60),
    description: truncateDescription(description),
  };
}

// Blog/Article meta generation
interface ArticleMetaInput {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string;
  author_name?: string | null;
  published_at?: string | null;
  category?: { name: string } | null;
}

export function generateArticleMeta(article: ArticleMetaInput): { title: string; description: string } {
  const title = `${article.title} | ${SITE_CONFIG.siteName}`;
  
  // Use excerpt if available, otherwise extract from content
  let description = article.excerpt || '';
  if (!description && article.content) {
    // Strip HTML and get first 160 chars
    const plainText = article.content.replace(/<[^>]*>/g, '').trim();
    description = truncateDescription(plainText);
  }
  
  if (!description) {
    description = `Read ${article.title} on BuyWise Israel. Expert insights on Israeli real estate.`;
  }
  
  return {
    title: title.slice(0, 60),
    description: truncateDescription(description),
  };
}

// Agent meta generation
interface AgentMetaInput {
  id: string;
  name: string;
  bio?: string | null;
  agency_name?: string | null;
  years_experience?: number | null;
  languages?: string[] | null;
  neighborhoods_covered?: string[] | null;
}

export function generateAgentMeta(agent: AgentMetaInput): { title: string; description: string } {
  const agencyText = agent.agency_name ? ` at ${agent.agency_name}` : '';
  const title = `${agent.name} | Real Estate Agent${agencyText} | ${SITE_CONFIG.siteName}`;
  
  let description = `${agent.name} is a real estate agent`;
  if (agent.agency_name) description += ` at ${agent.agency_name}`;
  if (agent.years_experience) description += ` with ${agent.years_experience}+ years experience`;
  description += '.';
  
  if (agent.neighborhoods_covered?.length) {
    const areas = agent.neighborhoods_covered.slice(0, 3).join(', ');
    description += ` Specializing in ${areas}.`;
  }
  
  if (agent.languages?.length && agent.languages.length > 1) {
    description += ` Speaks ${agent.languages.join(', ')}.`;
  }
  
  return {
    title: title.slice(0, 60),
    description: truncateDescription(description),
  };
}

// Developer meta generation
interface DeveloperMetaInput {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  founded_year?: number | null;
  total_projects?: number | null;
  office_city?: string | null;
}

export function generateDeveloperMeta(developer: DeveloperMetaInput): { title: string; description: string } {
  const title = `${developer.name} | Property Developer | ${SITE_CONFIG.siteName}`;
  
  let description = `${developer.name} is a property developer`;
  if (developer.office_city) description += ` based in ${developer.office_city}`;
  if (developer.founded_year) description += `, established ${developer.founded_year}`;
  description += '.';
  
  if (developer.total_projects && developer.total_projects > 0) {
    description += ` ${developer.total_projects} projects.`;
  }
  
  if (developer.description) {
    description = truncateDescription(developer.description);
  }
  
  return {
    title: title.slice(0, 60),
    description: truncateDescription(description),
  };
}

// Agency meta generation
interface AgencyMetaInput {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  founded_year?: number | null;
  cities_covered?: string[] | null;
  specializations?: string[] | null;
}

export function generateAgencyMeta(agency: AgencyMetaInput): { title: string; description: string } {
  const title = `${agency.name} | Real Estate Agency | ${SITE_CONFIG.siteName}`;
  
  let description = `${agency.name} is a real estate agency`;
  if (agency.founded_year) description += ` established ${agency.founded_year}`;
  description += '.';
  
  if (agency.cities_covered?.length) {
    const cities = agency.cities_covered.slice(0, 3).join(', ');
    description += ` Operating in ${cities}.`;
  }
  
  if (agency.specializations?.length) {
    const specs = agency.specializations.slice(0, 2).join(', ');
    description += ` Specializing in ${specs}.`;
  }
  
  if (agency.description) {
    description = truncateDescription(agency.description);
  }
  
  return {
    title: title.slice(0, 60),
    description: truncateDescription(description),
  };
}

// Professional meta generation
interface ProfessionalMetaInput {
  name: string;
  slug: string;
  category: string;
  company?: string | null;
  description?: string | null;
  cities_covered?: string[] | null;
  languages?: string[] | null;
}

export function generateProfessionalMeta(professional: ProfessionalMetaInput): { title: string; description: string } {
  const CATEGORY_LABELS: Record<string, string> = {
    lawyer: 'Lawyer',
    mortgage_broker: 'Mortgage Broker',
    accountant: 'Accountant & Tax Advisor',
  };
  const categoryLabel = CATEGORY_LABELS[professional.category] || professional.category;
  const companyText = professional.company ? ` — ${professional.company}` : '';
  const title = `${professional.name}${companyText} | ${categoryLabel} | ${SITE_CONFIG.siteName}`;

  let description = professional.description || `${professional.name} is a ${categoryLabel.toLowerCase()} working with international buyers in Israel.`;

  if (professional.cities_covered?.length) {
    const cities = professional.cities_covered.slice(0, 3).join(', ');
    description += ` Serving ${cities}.`;
  }

  return {
    title: title.slice(0, 60),
    description: truncateDescription(description),
  };
}
