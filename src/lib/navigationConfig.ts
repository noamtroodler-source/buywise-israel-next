// Journey Phases for user progression
export type JourneyPhase = 
  | 'understand'    // Understand the System
  | 'define'        // Define What Fits You
  | 'explore'       // Explore Real Options
  | 'check'         // Check Before You Commit
  | 'move_forward'  // Move Forward Confidently
  | 'after_deal';   // After the Deal

export interface NavItem {
  label: string;
  href: string;
  description?: string;
  phase?: JourneyPhase;
  icon?: string;
}

export interface NavColumn {
  title: string;
  items: NavItem[];
}

export interface NavSection {
  label: string;
  href?: string; // Direct link if no mega-menu
  columns: NavColumn[];
  cta?: {
    label: string;
    href: string;
  };
}

export const NAV_CONFIG: Record<string, NavSection> = {
  buy: {
    label: 'Buy',
    columns: [
      {
        title: 'Browse',
        items: [
          { label: 'All Properties for Sale', href: '/listings?status=for_sale', phase: 'explore' },
          { label: 'New Construction', href: '/projects', phase: 'explore' },
          { label: 'Understand Markets', href: '/areas', description: 'Price & trend context', phase: 'understand' },
        ]
      },
      {
        title: 'Calculators',
        items: [
          { label: 'Mortgage Calculator', href: '/tools?tool=mortgage', description: 'Monthly payments & rates', phase: 'move_forward' },
          { label: 'Affordability', href: '/tools?tool=affordability', description: 'What can you afford?', phase: 'define' },
          { label: 'True Cost', href: '/tools?tool=totalcost', description: 'Taxes, fees & closing costs', phase: 'check' },
          { label: 'Investment Returns', href: '/tools?tool=investment', description: 'ROI & cash flow analysis', phase: 'check' },
          { label: 'Rent vs Buy', href: '/tools?tool=rentvsbuy', description: 'Compare your options', phase: 'define' },
        ]
      },
      {
        title: 'Guides',
        items: [
          { label: 'Complete Buying Guide', href: '/guides/buying-in-israel', description: '14 chapters', phase: 'understand' },
          { label: 'Understanding Listings', href: '/guides/understanding-listings', description: 'Read listings confidently', phase: 'explore' },
          { label: 'Purchase Tax Guide', href: '/guides/purchase-tax', description: 'Mas Rechisha explained', phase: 'check' },
          { label: 'True Cost of Buying', href: '/guides/true-cost', description: 'Hidden costs revealed', phase: 'check' },
          { label: 'Mortgages in Israel', href: '/guides/mortgages', description: 'Financing for foreigners', phase: 'move_forward' },
          { label: 'New vs Resale', href: '/guides/new-vs-resale', description: 'Which path fits you?', phase: 'explore' },
        ]
      }
    ],
    cta: { label: 'Start Your Search', href: '/listings?status=for_sale' }
  },
  rent: {
    label: 'Rent',
    columns: [
      {
        title: 'Browse',
        items: [
          { label: 'All Rentals', href: '/listings?status=for_rent', phase: 'explore' },
          { label: 'Market Overview', href: '/areas', description: 'Rental prices by city', phase: 'understand' },
        ]
      },
      {
        title: 'Tools for Renters',
        items: [
          { label: 'Affordability Calculator', href: '/tools?tool=affordability', description: 'Budget planning', phase: 'define' },
          { label: 'Rent vs Buy', href: '/tools?tool=rentvsbuy', description: 'Should you rent or buy?', phase: 'define' },
          { label: 'Document Checklist', href: '/tools?tool=documents', description: 'What to prepare', phase: 'move_forward' },
        ]
      },
      {
        title: 'Guides',
        items: [
          { label: 'Rent vs Buy Guide', href: '/guides/rent-vs-buy', description: 'Decision framework', phase: 'understand' },
          { label: 'Understanding Listings', href: '/guides/understanding-listings', description: 'Decode Israeli listings', phase: 'explore' },
        ]
      }
    ],
    cta: { label: 'Find Rentals', href: '/listings?status=for_rent' }
  },
  projects: {
    label: 'Projects',
    columns: [
      {
        title: 'Browse',
        items: [
          { label: 'All New Projects', href: '/projects', phase: 'explore' },
          { label: 'Browse Developers', href: '/developers', phase: 'explore' },
          { label: 'Understand Markets', href: '/areas', description: 'Prices & trends by city', phase: 'understand' },
        ]
      },
      {
        title: 'Calculators',
        items: [
          { label: 'True Cost Calculator', href: '/tools?tool=totalcost', description: 'New build costs', phase: 'check' },
          { label: 'Investment Returns', href: '/tools?tool=investment', description: 'Pre-sale ROI', phase: 'check' },
          { label: 'Mortgage Calculator', href: '/tools?tool=mortgage', description: 'Payment planning', phase: 'move_forward' },
        ]
      },
      {
        title: 'Guides',
        items: [
          { label: 'New vs Resale', href: '/guides/new-vs-resale', description: 'Risks & benefits', phase: 'understand' },
          { label: 'Complete Buying Guide', href: '/guides/buying-in-israel', description: 'Full process overview', phase: 'understand' },
          { label: 'Talking to Professionals', href: '/guides/talking-to-professionals', description: 'Lawyers & agents', phase: 'check' },
        ]
      }
    ],
    cta: { label: 'Explore Projects', href: '/projects' }
  }
};

// Tool categorization by journey phase for the Tools page
export const TOOLS_BY_PHASE: Record<string, { title: string; description: string; tools: string[] }> = {
  define: {
    title: 'Define What Fits You',
    description: 'Understand your budget and options before you start searching.',
    tools: ['affordability', 'rentvsbuy']
  },
  check: {
    title: 'Calculate True Costs',
    description: 'Know the full picture before making an offer.',
    tools: ['totalcost', 'investment']
  },
  move_forward: {
    title: 'Move Forward Confidently',
    description: 'Plan your financing and prepare your documents.',
    tools: ['mortgage', 'documents']
  },
  after_deal: {
    title: 'After the Deal',
    description: 'Plan for post-purchase costs and improvements.',
    tools: ['renovation']
  }
};

// Guide categorization by journey phase for the Guides page
export const GUIDES_BY_PHASE: Record<string, { title: string; description: string; slugs: string[] }> = {
  understand: {
    title: 'Understand the System',
    description: 'How Israeli real estate works — especially for internationals.',
    slugs: ['buying-in-israel', 'rent-vs-buy']
  },
  explore: {
    title: 'Explore Real Options',
    description: 'Make sense of what you\'re seeing in the market.',
    slugs: ['understanding-listings', 'new-vs-resale']
  },
  check: {
    title: 'Check Before You Commit',
    description: 'Due diligence, true costs, and professional guidance.',
    slugs: ['purchase-tax', 'true-cost', 'talking-to-professionals']
  },
  move_forward: {
    title: 'Move Forward Confidently',
    description: 'Financing, legal process, and closing.',
    slugs: ['mortgages']
  }
};
