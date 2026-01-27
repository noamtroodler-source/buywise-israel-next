// Site-wide SEO configuration constants

export const SITE_CONFIG = {
  siteName: 'BuyWise Israel',
  siteUrl: 'https://buywiseisrael.com',
  defaultTitle: 'BuyWise Israel | Property Discovery for International Buyers',
  defaultDescription: 'Navigate Israeli real estate with clarity and confidence. Explore properties, calculate costs, and understand the market — built for international buyers.',
  defaultImage: 'https://buywiseisrael.com/og-image.png',
  twitterHandle: '@BuyWiseIsrael',
  locale: 'en_US',
  currency: 'ILS',
};

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: 'Apartment',
  garden_apartment: 'Garden Apartment',
  penthouse: 'Penthouse',
  mini_penthouse: 'Mini Penthouse',
  duplex: 'Duplex',
  house: 'House',
  cottage: 'Cottage',
  land: 'Land',
  commercial: 'Commercial Property',
  studio: 'Studio',
  townhouse: 'Townhouse',
  villa: 'Villa',
};

export const LISTING_STATUS_LABELS: Record<string, string> = {
  for_sale: 'For Sale',
  for_rent: 'For Rent',
  sold: 'Sold',
  rented: 'Rented',
};

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  planning: 'Planning Stage',
  pre_sale: 'Pre-Sale',
  foundation: 'Foundation Stage',
  structure: 'Under Construction',
  finishing: 'Finishing Stage',
  delivery: 'Ready for Delivery',
};

export const REGION_LABELS: Record<string, string> = {
  tel_aviv: 'Tel Aviv District',
  central: 'Central District',
  haifa: 'Haifa District',
  north: 'Northern District',
  south: 'Southern District',
  jerusalem: 'Jerusalem District',
  judea_samaria: 'Judea and Samaria',
};
