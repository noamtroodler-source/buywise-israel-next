// Centralized route constants for compile-time safety
export const ROUTES = {
  HOME: '/',
  LISTINGS: '/listings',
  PROJECTS: '/projects',
  AREAS: '/areas',
  TOOLS: '/tools',
  GUIDES: '/guides',
  BLOG: '/blog',
  GLOSSARY: '/glossary',
  CONTACT: '/contact',
  ABOUT: '/about',
  PROFILE: '/profile',
  FAVORITES: '/favorites',
  AUTH: '/auth',
  GET_STARTED: '/get-started',
  COMPARE: '/compare',
  COMPARE_PROJECTS: '/compare-projects',
  DEVELOPERS: '/developers',
  AGENCIES: '/agencies',
} as const;

// Tool IDs matching the Tools page query parameter
export const TOOL_IDS = {
  MORTGAGE: 'mortgage',
  TOTAL_COST: 'totalcost',
  AFFORDABILITY: 'affordability',
  RENT_VS_BUY: 'rentvsbuy',
  RENOVATION: 'renovation',
  PURCHASE_TAX: 'purchasetax',
  RENTAL_YIELD: 'rentalyield',
} as const;

// Generate tool URL with optional additional params
export const toolUrl = (toolId: string, params?: Record<string, string | number>) => {
  const searchParams = new URLSearchParams({ tool: toolId });
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.set(key, String(value));
      }
    });
  }
  return `${ROUTES.TOOLS}?${searchParams.toString()}`;
};

// Generate listings URL with status filter
export const listingsUrl = (status: 'for_sale' | 'for_rent', params?: Record<string, string>) => {
  const searchParams = new URLSearchParams({ status });
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.set(key, value);
    });
  }
  return `${ROUTES.LISTINGS}?${searchParams.toString()}`;
};

// Common listing status values
export const LISTING_STATUS = {
  FOR_SALE: 'for_sale',
  FOR_RENT: 'for_rent',
} as const;
