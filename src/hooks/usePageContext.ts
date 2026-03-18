import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';

export interface PageContext {
  description: string;
  suggestions: string[];
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

export function usePageContext(): PageContext {
  const location = useLocation();
  const path = location.pathname;
  const search = new URLSearchParams(location.search);

  return useMemo(() => {
    // Property detail page
    if (path.match(/^\/property\//)) {
      return {
        description: 'Viewing a property listing',
        suggestions: [
          'Is this fairly priced for the area?',
          'What hidden costs should I expect?',
          'What should I ask the agent?',
        ],
      };
    }

    // Project detail page
    if (path.match(/^\/project\//)) {
      return {
        description: 'Viewing a new construction project',
        suggestions: [
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
  }, [path, search.toString()]);
}
