import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BuyerType } from '@/lib/calculations/purchaseTax';

export type ListingStatus = 'for_sale' | 'for_rent' | 'sold' | 'rented';
export type PropertyType = 'apartment' | 'house' | 'penthouse' | 'garden_apartment' | 'duplex' | 'studio' | 'villa' | 'townhouse' | 'land' | 'commercial' | 'other';

interface BuyerRelevance {
  buyer_types?: string[];
  residency_status?: string[];
  purchase_purpose?: string[];
  is_universal?: boolean;
}

interface PropertyQuestion {
  id: string;
  question_text: string;
  why_it_matters: string;
  category: string;
  applies_to: {
    listing_status?: string[];
    property_type?: string[];
    is_new_construction?: boolean; // Only show on project pages
    is_resale?: boolean; // Only show on resale property pages
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
  buyer_relevance: BuyerRelevance | null;
}

interface ScoredQuestion extends PropertyQuestion {
  relevanceScore: number;
}

export interface PropertyContext {
  // Property fields
  listingStatus: ListingStatus;
  propertyType?: PropertyType | string;
  yearBuilt?: number;
  hasVaadBayit: boolean;
  hasParking: boolean;
  daysOnMarket: number;
  priceReduced: boolean;
  missingFields: string[];
  isNewConstruction?: boolean; // Is this a new construction project or resale?
  
  // Buyer context (optional - only for authenticated users with profiles)
  buyerType?: BuyerType;
  residencyStatus?: 'israeli_resident' | 'oleh_hadash' | 'non_resident';
  purchasePurpose?: 'primary_residence' | 'investment' | 'vacation_home';
  isAuthenticated: boolean;
}

function matchesPropertyConditions(
  question: PropertyQuestion, 
  context: PropertyContext
): boolean {
  const appliesTo = question.applies_to;
  
  // If no applies_to, it applies to everything (universal question)
  if (!appliesTo || Object.keys(appliesTo).length === 0) {
    return true;
  }

  // CRITICAL: Check new construction vs resale filter FIRST
  // Questions marked is_new_construction should ONLY appear on project pages
  if (appliesTo.is_new_construction === true && !context.isNewConstruction) {
    return false;
  }
  
  // Questions marked is_resale should ONLY appear on resale property pages
  if (appliesTo.is_resale === true && context.isNewConstruction) {
    return false;
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

/**
 * Calculate relevance score for a question based on property and buyer context.
 * Higher scores = more relevant questions.
 */
function calculateRelevanceScore(
  question: PropertyQuestion,
  context: PropertyContext
): number {
  let score = question.priority || 50;
  const buyerRelevance = question.buyer_relevance;

  // PROPERTY CONDITIONS BONUS (+20 max)
  // Questions that match specific property conditions are more relevant
  if (question.applies_to?.conditions) {
    const conditions = question.applies_to.conditions;
    let conditionMatches = 0;
    
    if (conditions.has_vaad_bayit !== undefined && context.hasVaadBayit === conditions.has_vaad_bayit) {
      conditionMatches++;
    }
    if (conditions.price_reduced !== undefined && context.priceReduced === conditions.price_reduced) {
      conditionMatches++;
    }
    if (conditions.days_on_market_over !== undefined && context.daysOnMarket > conditions.days_on_market_over) {
      conditionMatches++;
    }
    if (conditions.year_built_before !== undefined && context.yearBuilt && context.yearBuilt < conditions.year_built_before) {
      conditionMatches++;
    }
    
    score += conditionMatches * 5; // Up to +20 for 4 condition matches
  }

  // BUYER TYPE MATCH BONUS (+25 max) - only for authenticated users with buyer profile
  if (context.isAuthenticated && context.buyerType) {
    if (buyerRelevance?.is_universal) {
      // Universal questions get moderate boost for authenticated users
      score += 10;
    } else if (buyerRelevance?.buyer_types?.includes(context.buyerType)) {
      // Direct buyer type match gets highest boost
      score += 25;
    }

    // Residency status match (+10)
    if (context.residencyStatus && buyerRelevance?.residency_status?.includes(context.residencyStatus)) {
      score += 10;
    }

    // Purchase purpose match (+10)
    if (context.purchasePurpose && buyerRelevance?.purchase_purpose?.includes(context.purchasePurpose)) {
      score += 10;
    }
  } else {
    // GUEST USERS: prioritize universal questions and first-time buyer questions
    if (buyerRelevance?.is_universal) {
      score += 15; // Universal questions are great for guests
    }
    if (buyerRelevance?.buyer_types?.includes('first_time')) {
      score += 10; // First-time buyer questions are good defaults
    }
    // Rental questions for rental listings
    if (context.listingStatus === 'for_rent' && buyerRelevance?.buyer_types?.includes('renter')) {
      score += 20; // Renter questions are highly relevant for rentals
    }
  }

  return score;
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

  // Filter and score questions based on context
  const { filteredQuestions, isPersonalized } = useMemo(() => {
    const allQuestions = query.data || [];
    
    // First filter by property conditions
    const propertyFiltered = allQuestions.filter(q => matchesPropertyConditions(q, context));
    
    // Then score and sort by relevance
    const scored: ScoredQuestion[] = propertyFiltered.map(q => ({
      ...q,
      relevanceScore: calculateRelevanceScore(q, context),
    }));
    
    // Sort by score descending, then by priority as tiebreaker
    scored.sort((a, b) => {
      const scoreDiff = b.relevanceScore - a.relevanceScore;
      if (scoreDiff !== 0) return scoreDiff;
      return (b.priority || 0) - (a.priority || 0);
    });
    
    return {
      filteredQuestions: scored.slice(0, 8), // Return top 8 most relevant
      isPersonalized: context.isAuthenticated && !!context.buyerType,
    };
  }, [query.data, context]);

  return {
    questions: filteredQuestions,
    isLoading: query.isLoading,
    error: query.error,
    isPersonalized,
  };
}

// For projects - context with project-specific fields
export interface ProjectContext {
  isNewConstruction: true;
  hasPaymentSchedule: boolean;
  hasBankGuarantee: boolean;
  deliveryYear?: number;
  // Buyer context
  buyerType?: BuyerType;
  residencyStatus?: 'israeli_resident' | 'oleh_hadash' | 'non_resident';
  purchasePurpose?: 'primary_residence' | 'investment' | 'vacation_home';
  isAuthenticated: boolean;
}

export function useProjectQuestions(context: ProjectContext) {
  const query = useQuery({
    queryKey: ['property-questions'],
    queryFn: fetchPropertyQuestions,
    staleTime: 1000 * 60 * 60,
  });

  const { filteredQuestions, isPersonalized } = useMemo(() => {
    const allQuestions = query.data || [];
    
    // Filter for project-appropriate questions:
    // 1. Include questions marked for new construction
    // 2. Include universal questions (no is_resale or is_new_construction flag)
    // 3. Exclude questions marked specifically for resale
    // 4. Focus on construction, pricing, and legal categories
    const projectFiltered = allQuestions.filter(q => {
      // Exclude resale-only questions
      if (q.applies_to?.is_resale === true) {
        return false;
      }
      
      // Include new construction questions
      if (q.applies_to?.is_new_construction === true) {
        return true;
      }
      
      // Include universal questions in relevant categories
      if (q.category === 'construction' || q.category === 'pricing' || q.category === 'legal') {
        // Only if no resale flag
        return !q.applies_to?.is_resale;
      }
      
      return false;
    });
    
    // Score questions for projects
    const scored = projectFiltered.map(q => {
      let score = q.priority || 50;
      const buyerRelevance = q.buyer_relevance;
      
      // Construction category gets boost
      if (q.category === 'construction') {
        score += 15;
      }
      
      // Buyer type matching for authenticated users
      if (context.isAuthenticated && context.buyerType) {
        if (buyerRelevance?.is_universal) {
          score += 10;
        } else if (buyerRelevance?.buyer_types?.includes(context.buyerType)) {
          score += 25;
        }
        
        if (context.residencyStatus && buyerRelevance?.residency_status?.includes(context.residencyStatus)) {
          score += 10;
        }
      } else {
        // Guest defaults
        if (buyerRelevance?.is_universal) {
          score += 15;
        }
        if (buyerRelevance?.buyer_types?.includes('first_time')) {
          score += 10;
        }
      }
      
      return { ...q, relevanceScore: score };
    });
    
    scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    return {
      filteredQuestions: scored.slice(0, 8),
      isPersonalized: context.isAuthenticated && !!context.buyerType,
    };
  }, [query.data, context]);

  return {
    questions: filteredQuestions,
    isLoading: query.isLoading,
    error: query.error,
    isPersonalized,
  };
}
