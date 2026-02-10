// SEO utilities - re-export all modules
export { SITE_CONFIG, PROPERTY_TYPE_LABELS, LISTING_STATUS_LABELS, PROJECT_STATUS_LABELS, REGION_LABELS } from './constants';

export {
  generatePropertyMeta,
  generateProjectMeta,
  generateCityMeta,
  generateArticleMeta,
  generateAgentMeta,
  generateDeveloperMeta,
  generateAgencyMeta,
  generateProfessionalMeta,
} from './metaGenerators';

export {
  generatePropertyJsonLd,
  generateProjectJsonLd,
  generateCityJsonLd,
  generateArticleJsonLd,
  generateAgentJsonLd,
  generateDeveloperJsonLd,
  generateAgencyJsonLd,
  generateBreadcrumbJsonLd,
  generateWebsiteJsonLd,
} from './jsonLd';

export { useSEO } from './useSEO';
