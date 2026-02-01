import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ListingStatus = 'for_sale' | 'for_rent' | 'sold' | 'rented';
export type PropertyType = 'apartment' | 'house' | 'penthouse' | 'garden_apartment' | 'duplex' | 'studio' | 'villa' | 'townhouse' | 'land' | 'commercial' | 'other';

interface PropertyQuestion {
  id: string;
  question_text: string;
  why_it_matters: string;
  category: string;
  applies_to: {
    listing_status?: string[];
    property_type?: string[];
    conditions?: {
      year_built_before?: number;
      has_vaad_bayit?: boolean;
      has_parking?: boolean;
      price_reduced?: boolean;
      days_on_market_over?: number;
      missing_fields?: string[];
    };
  } | null;
  priority: number;
}

export interface PropertyContext {
  listingStatus: ListingStatus;
  propertyType?: PropertyType | string;
  yearBuilt?: number;
  hasVaadBayit: boolean;
  hasParking: boolean;
  daysOnMarket: number;
  priceReduced: boolean;
  missingFields: string[];
}

function matchesConditions(
  question: PropertyQuestion, 
  context: PropertyContext
): boolean {
  const appliesTo = question.applies_to;
  
  // If no applies_to, it applies to everything
  if (!appliesTo || Object.keys(appliesTo).length === 0) {
    return true;
  }

  // Check listing_status filter
  if (appliesTo.listing_status && appliesTo.listing_status.length > 0) {
    if (!appliesTo.listing_status.includes(context.listingStatus)) {
      return false;
    }
  }

  // Check property_type filter
  if (appliesTo.property_type && appliesTo.property_type.length > 0) {
    if (context.propertyType && !appliesTo.property_type.includes(context.propertyType)) {
      return false;
    }
  }

  // Check conditions
  const conditions = appliesTo.conditions;
  if (conditions) {
    // Year built condition
    if (conditions.year_built_before && context.yearBuilt) {
      if (context.yearBuilt >= conditions.year_built_before) {
        return false;
      }
    }

    // Vaad bayit condition
    if (conditions.has_vaad_bayit !== undefined) {
      if (context.hasVaadBayit !== conditions.has_vaad_bayit) {
        return false;
      }
    }

    // Parking condition
    if (conditions.has_parking !== undefined) {
      if (context.hasParking !== conditions.has_parking) {
        return false;
      }
    }

    // Price reduced condition
    if (conditions.price_reduced !== undefined) {
      if (context.priceReduced !== conditions.price_reduced) {
        return false;
      }
    }

    // Days on market condition
    if (conditions.days_on_market_over !== undefined) {
      if (context.daysOnMarket <= conditions.days_on_market_over) {
        return false;
      }
    }

    // Missing fields condition
    if (conditions.missing_fields && conditions.missing_fields.length > 0) {
      const hasMissingField = conditions.missing_fields.some(
        field => context.missingFields.includes(field)
      );
      if (!hasMissingField) {
        return false;
      }
    }
  }

  return true;
}

async function fetchPropertyQuestions(): Promise<PropertyQuestion[]> {
  const { data, error } = await supabase
    .from('property_questions')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: false });

  if (error) {
    console.error('Error fetching property questions:', error);
    return [];
  }

  return (data || []) as PropertyQuestion[];
}

export function usePropertyQuestions(context: PropertyContext) {
  const query = useQuery({
    queryKey: ['property-questions'],
    queryFn: fetchPropertyQuestions,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Filter questions based on context
  const filteredQuestions = (query.data || [])
    .filter(q => matchesConditions(q, context))
    .slice(0, 8); // Return top 8 most relevant

  return {
    questions: filteredQuestions,
    isLoading: query.isLoading,
    error: query.error,
  };
}

// For projects - simpler context
export interface ProjectContext {
  isNewConstruction: true;
  hasPaymentSchedule: boolean;
  hasBankGuarantee: boolean;
  deliveryYear?: number;
}

export function useProjectQuestions(context: ProjectContext) {
  const query = useQuery({
    queryKey: ['property-questions'],
    queryFn: fetchPropertyQuestions,
    staleTime: 1000 * 60 * 60,
  });

  // Filter for construction-related questions
  const filteredQuestions = (query.data || [])
    .filter(q => q.category === 'construction' || q.category === 'pricing' || q.category === 'legal')
    .slice(0, 8);

  return {
    questions: filteredQuestions,
    isLoading: query.isLoading,
    error: query.error,
  };
}
