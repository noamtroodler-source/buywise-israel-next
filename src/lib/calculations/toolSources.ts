/**
 * Source configurations for all calculator tools
 * Used for trust signals and transparency
 */

export interface ToolSource {
  name: string;
  url?: string;
  effectiveDate?: string;
}

export interface ToolSourceConfig {
  primarySources: ToolSource[];
  lastVerified: string;
  categories: string[];
}

export const TOOL_SOURCES: Record<string, ToolSourceConfig> = {
  mortgage: {
    primarySources: [
      { 
        name: 'Bank of Israel Directive 329 v11', 
        url: 'https://www.boi.org.il/en/banking-supervision/', 
        effectiveDate: '2025-04-01' 
      }
    ],
    lastVerified: '2025-01',
    categories: ['LTV Limits', 'PTI Limits', 'Track Regulations']
  },
  
  affordability: {
    primarySources: [
      { 
        name: 'Bank of Israel Directive 329 v11', 
        url: 'https://www.boi.org.il/en/banking-supervision/', 
        effectiveDate: '2025-04-01' 
      }
    ],
    lastVerified: '2025-01',
    categories: ['PTI Limits', 'LTV by Buyer Type', 'Income Verification Rules']
  },
  
  trueCost: {
    primarySources: [
      { 
        name: 'Israel Tax Authority', 
        url: 'https://www.gov.il/en/departments/israel_tax_authority', 
        effectiveDate: '2025-01-15' 
      },
      { 
        name: 'Ministry of Justice (Tabu)', 
        url: 'https://www.gov.il/en/departments/tabu', 
        effectiveDate: '2025-01-01' 
      }
    ],
    lastVerified: '2025-01',
    categories: ['Purchase Tax Brackets', 'Registration Fees', 'VAT Rate', 'Professional Fees']
  },
  
  purchaseTax: {
    primarySources: [
      { 
        name: 'Israel Tax Authority', 
        url: 'https://www.gov.il/en/departments/israel_tax_authority', 
        effectiveDate: '2025-01-15' 
      }
    ],
    lastVerified: '2025-01',
    categories: ['Tax Brackets', 'Buyer Type Exemptions', 'Oleh Benefits']
  },
  
  investment: {
    primarySources: [
      { 
        name: 'Israel Tax Authority', 
        url: 'https://www.gov.il/en/departments/israel_tax_authority', 
        effectiveDate: '2025-01-15' 
      },
      { 
        name: 'Central Bureau of Statistics', 
        url: 'https://www.cbs.gov.il/en', 
        effectiveDate: '2024-12-01' 
      }
    ],
    lastVerified: '2025-01',
    categories: ['Capital Gains Tax', 'Rental Income Tax', 'Market Benchmarks']
  },
  
  rentVsBuy: {
    primarySources: [
      { 
        name: 'Israel Tax Authority', 
        url: 'https://www.gov.il/en/departments/israel_tax_authority', 
        effectiveDate: '2025-01-15' 
      },
      { 
        name: 'Bank of Israel', 
        url: 'https://www.boi.org.il/en/', 
        effectiveDate: '2025-04-01' 
      }
    ],
    lastVerified: '2025-01',
    categories: ['Purchase Costs', 'Mortgage Rates', 'Tax Implications']
  },
  
  renovation: {
    primarySources: [
      { 
        name: 'Israel Builders Association', 
        effectiveDate: '2024-12-01' 
      },
      { 
        name: 'Market Survey 2024-2025' 
      }
    ],
    lastVerified: '2025-01',
    categories: ['Labor Costs', 'Material Costs', 'Contractor Rates']
  },
  
  newConstruction: {
    primarySources: [
      { 
        name: 'Israel Tax Authority', 
        url: 'https://www.gov.il/en/departments/israel_tax_authority', 
        effectiveDate: '2025-01-15' 
      },
      { 
        name: 'Central Bureau of Statistics', 
        url: 'https://www.cbs.gov.il/en', 
        effectiveDate: '2024-12-01' 
      }
    ],
    lastVerified: '2025-01',
    categories: ['CPI Linkage', 'VAT', 'Payment Schedules']
  },
  
  documents: {
    primarySources: [
      { 
        name: 'Ministry of Justice', 
        url: 'https://www.gov.il/en/departments/justice', 
        effectiveDate: '2025-01-01' 
      },
      { 
        name: 'Israel Land Authority', 
        url: 'https://land.gov.il/en', 
        effectiveDate: '2025-01-01' 
      }
    ],
    lastVerified: '2025-01',
    categories: ['Required Documents', 'Registration Process', 'Timeline']
  },
  
  rentalIncome: {
    primarySources: [
      { 
        name: 'Israel Tax Authority', 
        url: 'https://www.gov.il/en/departments/israel_tax_authority', 
        effectiveDate: '2025-01-15' 
      }
    ],
    lastVerified: '2025-01',
    categories: ['Tax Exemption Threshold', 'Flat Rate Option', 'Progressive Tax']
  }
};

/**
 * Format effective date for display
 */
export function formatEffectiveDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/**
 * Get a concise source summary for compact display
 */
export function getSourceSummary(toolType: string): string {
  const config = TOOL_SOURCES[toolType];
  if (!config) return '';
  
  const sourceNames = config.primarySources.map(s => s.name.split(' ')[0]).join(', ');
  return `${sourceNames} · ${config.lastVerified}`;
}
