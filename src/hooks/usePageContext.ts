import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';

export interface PageContextData {
  price?: number;
  city?: string;
  neighborhood?: string;
  bedrooms?: number;
  propertyType?: string;
  name?: string;
  listingStatus?: string;
  priceFrom?: number;
  priceTo?: number;
  currency?: string;
}

export interface PageContext {
  description: string;
  suggestions: string[];
}

// Singleton store for page context data set by detail pages
let _pageData: PageContextData | null = null;

export function setPageContextData(data: PageContextData | null) {
  _pageData = data;
}

export function getPageContextData(): PageContextData | null {
  return _pageData;
}

const toolNames: Record<string, string> = {
  'purchase-tax': 'Purchase Tax Calculator',
  'true-cost': 'True Cost Calculator',
  'mortgage': 'Mortgage Calculator',
  'rent-vs-buy': 'Rent vs Buy Calculator',
  'affordability': 'Affordability Calculator',
};

const guideNames: Record<string, string> = {
  'buying-in-israel': 'Complete Buying in Israel Guide',
  'purchase-tax': 'Purchase Tax Guide',
  'mortgages': 'Mortgage Guide',
  'true-cost': 'True Cost Guide',
  'oleh-buyer': 'Oleh Buyer Guide',
  'new-vs-resale': 'New vs Resale Guide',
  'investment': 'Investment Property Guide',
  'new-construction': 'New Construction Guide',
  'rent-vs-buy': 'Rent vs Buy Guide',
  'talking-to-professionals': 'Talking to Professionals Guide',
  'listings-guide': 'Understanding Listings Guide',
};

function formatPrice(price: number): string {
  if (price >= 1_000_000) return `₪${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000) return `₪${(price / 1_000).toFixed(0)}K`;
  return `₪${price}`;
}

function buildPropertySuggestions(data: PageContextData): string[] {
  const suggestions: string[] = [];
  if (data.price && data.city) {
    suggestions.push(`Is ${formatPrice(data.price)} fair for ${data.city}?`);
  }
  if (data.price) {
    suggestions.push(`What are the hidden costs on a ${formatPrice(data.price)} purchase?`);
  }
  suggestions.push('What should I ask the agent?');
  return suggestions.slice(0, 3);
}

function buildProjectSuggestions(data: PageContextData): string[] {
  const suggestions: string[] = [];
  if (data.priceFrom && data.city) {
    suggestions.push(`Is ${formatPrice(data.priceFrom)} fair for new construction in ${data.city}?`);
  }
  suggestions.push('What guarantees should I get from the developer?');
  suggestions.push('How does the payment schedule work?');
  return suggestions.slice(0, 3);
}

function buildPropertyDescription(data: PageContextData): string {
  const parts: string[] = [];
  if (data.name) parts.push(data.name);
  if (data.bedrooms) parts.push(`${data.bedrooms}BR`);
  if (data.propertyType) parts.push(data.propertyType);
  if (data.city) parts.push(`in ${data.city}`);
  if (data.neighborhood) parts.push(`(${data.neighborhood})`);
  if (data.price) parts.push(`listed at ${formatPrice(data.price)}`);
  if (data.listingStatus === 'for_rent') parts.push('(rental)');
  return parts.length > 0
    ? `Viewing a property listing: ${parts.join(' ')}`
    : 'Viewing a property listing';
}

function buildProjectDescription(data: PageContextData): string {
  const parts: string[] = [];
  if (data.name) parts.push(data.name);
  if (data.city) parts.push(`in ${data.city}`);
  if (data.priceFrom) parts.push(`from ${formatPrice(data.priceFrom)}`);
  return parts.length > 0
    ? `Viewing a new construction project: ${parts.join(' ')}`
    : 'Viewing a new construction project';
}

export function usePageContext(): PageContext {
  const location = useLocation();
  const path = location.pathname;
  const search = new URLSearchParams(location.search);
  const data = _pageData;

  return useMemo(() => {
    // Property detail page
    if (path.match(/^\/property\//)) {
      return {
        description: data ? buildPropertyDescription(data) : 'Viewing a property listing',
        suggestions: data ? buildPropertySuggestions(data) : [
          'Is this fairly priced for the area?',
          'What hidden costs should I expect?',
          'What should I ask the agent?',
        ],
      };
    }

    // Project detail page
    if (path.match(/^\/project\//)) {
      return {
        description: data ? buildProjectDescription(data) : 'Viewing a new construction project',
        suggestions: data ? buildProjectSuggestions(data) : [
          'What are the risks of buying new construction?',
          'What guarantees should I get from the developer?',
          'How does the payment schedule work?',
        ],
      };
    }

    // Tools page
    if (path === '/tools') {
      const tool = search.get('tool');
      const toolName = tool ? toolNames[tool] : null;
      return {
        description: toolName ? `Using the ${toolName}` : 'Browsing financial calculators',
        suggestions: toolName
          ? ['What do these numbers mean?', 'Am I missing any costs?', 'Is this affordable for me?']
          : ['Which calculator should I use?', 'What costs do buyers face in Israel?', 'How much can I afford?'],
      };
    }

    // Guides
    if (path.startsWith('/guides/')) {
      const slug = path.replace('/guides/', '');
      const guideName = guideNames[slug] || 'a buying guide';
      return {
        description: `Reading the ${guideName}`,
        suggestions: [
          'Summarize the key takeaways',
          'What should I do next?',
          'What questions should I ask my lawyer?',
        ],
      };
    }

    if (path === '/guides') {
      return {
        description: 'Browsing buying guides',
        suggestions: ['Where should I start?', "I'm a first-time buyer in Israel", 'What guides are most important?'],
      };
    }

    // Areas
    if (path.match(/^\/areas\/.+/)) {
      const citySlug = path.replace('/areas/', '');
      return {
        description: `Viewing area details for ${citySlug.replace(/-/g, ' ')}`,
        suggestions: [
          'Is this a good area for investment?',
          "What's the rental yield here?",
          'How are prices trending?',
        ],
      };
    }

    if (path === '/areas') {
      return {
        description: 'Comparing market areas',
        suggestions: ['Which city is best for investment?', 'Where do Anglo buyers usually buy?', 'Compare Tel Aviv vs Jerusalem'],
      };
    }

    // Glossary
    if (path === '/glossary') {
      return {
        description: 'Browsing the Hebrew real estate glossary',
        suggestions: ['What is a Nesach Tabu?', 'Explain Mas Rechisha', 'What does Arnona mean?'],
      };
    }

    // Listings
    if (path === '/listings') {
      return {
        description: 'Browsing property listings',
        suggestions: ['How do I read Israeli listings?', 'What should I look for?', 'What does the room count mean?'],
      };
    }

    // Blog
    if (path.startsWith('/blog')) {
      return {
        description: 'Reading the BuyWise blog',
        suggestions: ["What's happening in the Israeli market?", 'Any tips for buyers right now?', 'How are prices trending?'],
      };
    }

    // Homepage / default
    return {
      description: 'Browsing the BuyWise homepage',
      suggestions: [
        "I'm thinking of buying in Israel — where do I start?",
        'What taxes will I pay as a buyer?',
        'How do mortgages work for foreigners?',
      ],
    };
  }, [path, search.toString(), data?.price, data?.city, data?.name, data?.priceFrom]);
}
