// Support both flat string and nested {date, source} formats
export type SourceValue = string | { date?: string; source?: string } | boolean | number | null | undefined;

// Friendly labels for source categories
export const SOURCE_LABELS: Record<string, string | null> = {
  // Specific data types (preferred format)
  price_data: 'Price Data',
  rental_data: 'Rental Data',
  arnona: 'Arnona',
  arnona_data: 'Arnona',
  price_history: 'Price History',
  market_factors: 'Market Factors',
  demographics: 'Demographics',
  
  // Generic hierarchy (older format)
  primary: 'Primary Source',
  secondary: 'Secondary Sources',
  profile: 'Profile Data',
  
  // Boolean flags - handle specially, don't display as regular text
  tier_1_government: null,
  earliest_reliable_year: null,
};

// Categories that should show as badges, not text
export const BADGE_CATEGORIES = ['tier_1_government'];

// Categories to skip entirely
export const HIDDEN_CATEGORIES = ['earliest_reliable_year'];

// Common source abbreviations for inline display
export const SOURCE_ABBREVIATIONS: Record<string, string> = {
  'Central Bureau of Statistics': 'CBS',
  'Israel Tax Authority': 'ITA',
  'Bank of Israel': 'BoI',
  'Municipality': 'Muni',
  'Madlan': 'Madlan',
  'Kantahome': 'Kantahome',
  'Yad2': 'Yad2',
};

/**
 * Get the label for a source category key
 */
export function getSourceLabel(key: string): string | null {
  if (key in SOURCE_LABELS) {
    return SOURCE_LABELS[key];
  }
  // Auto-generate from key: some_key -> Some Key
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Check if a source value is meaningful (not empty/null/undefined)
 */
export function hasValue(value: SourceValue): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return true;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'object') {
    return Boolean(value.source?.trim() || value.date?.trim());
  }
  return false;
}

/**
 * Extract the source string from either format
 */
export function getSourceString(value: SourceValue): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    return value.source || '';
  }
  return '';
}

/**
 * Format source value for display (includes date if available)
 */
export function formatSourceDisplay(value: SourceValue): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    const parts: string[] = [];
    if (value.source) parts.push(value.source);
    if (value.date) parts.push(`(${value.date})`);
    return parts.join(' ') || '';
  }
  return '';
}

/**
 * Abbreviate a source name for inline display
 */
export function abbreviateSource(source: string): string {
  for (const [full, abbrev] of Object.entries(SOURCE_ABBREVIATIONS)) {
    if (source.toLowerCase().includes(full.toLowerCase())) {
      return abbrev;
    }
  }
  // Return first word or first 10 chars
  const words = source.split(/[,\s]+/).filter(Boolean);
  return words[0]?.substring(0, 10) || source;
}

/**
 * Check if sources include government verification
 */
export function hasGovernmentVerification(sources: Record<string, SourceValue> | null | undefined): boolean {
  if (!sources) return false;
  return sources.tier_1_government === true;
}

/**
 * Filter sources to only meaningful entries for display
 */
export function getDisplayableSources(sources: Record<string, SourceValue> | null | undefined): Array<{
  key: string;
  label: string;
  value: string;
}> {
  if (!sources) return [];
  
  return Object.entries(sources)
    .filter(([key, value]) => {
      // Skip hidden categories
      if (HIDDEN_CATEGORIES.includes(key)) return false;
      // Skip badge categories (handled separately)
      if (BADGE_CATEGORIES.includes(key)) return false;
      // Skip empty values
      if (!hasValue(value)) return false;
      // Skip boolean values (they're badges, not text)
      if (typeof value === 'boolean') return false;
      return true;
    })
    .map(([key, value]) => ({
      key,
      label: getSourceLabel(key) || key,
      value: formatSourceDisplay(value),
    }))
    .filter(item => item.value.length > 0);
}

/**
 * Get abbreviated sources for inline badge display
 */
export function getAbbreviatedSources(sources: Record<string, SourceValue> | null | undefined): string[] {
  const displayable = getDisplayableSources(sources);
  const sourceStrings = displayable.map(item => getSourceString(sources![item.key]));
  
  return [...new Set(
    sourceStrings
      .filter(Boolean)
      .map(abbreviateSource)
  )];
}
