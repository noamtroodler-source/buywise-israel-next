import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BuyerInsights {
  totalProfiles: number;
  
  // Buyer type distribution
  buyerTypeDistribution: {
    type: string;
    count: number;
    percentage: number;
  }[];
  
  // Budget distribution
  budgetDistribution: {
    range: string;
    count: number;
    minBudget: number;
    maxBudget: number;
  }[];
  
  // Target cities demand
  targetCitiesDemand: {
    city: string;
    count: number;
  }[];
  
  // Purchase timeline
  timelineDistribution: {
    timeline: string;
    count: number;
    percentage: number;
  }[];
  
  // Property type preferences
  propertyPreferences: {
    type: string;
    count: number;
  }[];
  
  // Residency status
  residencyDistribution: {
    status: string;
    count: number;
    percentage: number;
  }[];
  
  // Market fit analysis
  marketFit: {
    buyersWithinMarket: number;
    totalBuyersWithBudget: number;
    affordabilityPercent: number;
    avgListingPrice: number;
    avgBuyerBudgetMax: number;
  };
}

const TIMELINE_LABELS: Record<string, string> = {
  'immediate': 'Immediate',
  '1_3_months': '1-3 Months',
  '3_6_months': '3-6 Months',
  '6_12_months': '6-12 Months',
  'flexible': 'Flexible',
};

const BUYER_TYPE_LABELS: Record<string, string> = {
  'individual': 'First Home Buyer',
  'couple': 'Upgrading Buyer',
  'investor': 'Investor',
  'company': 'Company',
};

const RESIDENCY_LABELS: Record<string, string> = {
  'citizen': 'Israeli Citizen',
  'oleh': 'New Oleh',
  'resident': 'Resident',
  'foreign': 'Foreign Buyer',
};

export function useBuyerInsightsAnalytics() {
  return useQuery({
    queryKey: ['buyer-insights-analytics'],
    queryFn: async (): Promise<BuyerInsights> => {
      // Fetch buyer profiles
      const { data: profiles } = await supabase
        .from('buyer_profiles')
        .select('*');

      // Fetch current listing prices for market comparison
      const { data: listings } = await supabase
        .from('properties')
        .select('price')
        .eq('is_published', true)
        .in('listing_status', ['for_sale']);

      if (!profiles || profiles.length === 0) {
        return {
          totalProfiles: 0,
          buyerTypeDistribution: [],
          budgetDistribution: [],
          targetCitiesDemand: [],
          timelineDistribution: [],
          propertyPreferences: [],
          residencyDistribution: [],
          marketFit: {
            buyersWithinMarket: 0,
            totalBuyersWithBudget: 0,
            affordabilityPercent: 0,
            avgListingPrice: 0,
            avgBuyerBudgetMax: 0,
          },
        };
      }

      const total = profiles.length;

      // Buyer type distribution
      const typeCounts: Record<string, number> = {};
      profiles.forEach(p => {
        const type = p.buyer_entity || 'unknown';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });
      
      const buyerTypeDistribution = Object.entries(typeCounts)
        .map(([type, count]) => ({
          type: BUYER_TYPE_LABELS[type] || type,
          count,
          percentage: (count / total) * 100,
        }))
        .sort((a, b) => b.count - a.count);

      // Budget distribution
      const budgetRanges = [
        { range: '< ₪1M', min: 0, max: 1000000 },
        { range: '₪1M - 2M', min: 1000000, max: 2000000 },
        { range: '₪2M - 3M', min: 2000000, max: 3000000 },
        { range: '₪3M - 5M', min: 3000000, max: 5000000 },
        { range: '₪5M - 10M', min: 5000000, max: 10000000 },
        { range: '> ₪10M', min: 10000000, max: Infinity },
      ];

      const budgetDistribution = budgetRanges.map(range => {
        const count = profiles.filter(p => {
          const maxBudget = p.budget_max || 0;
          return maxBudget >= range.min && maxBudget < range.max;
        }).length;
        return {
          range: range.range,
          count,
          minBudget: range.min,
          maxBudget: range.max === Infinity ? 50000000 : range.max,
        };
      });

      // Target cities demand - flatten arrays and count
      const cityCounts: Record<string, number> = {};
      profiles.forEach(p => {
        const cities = p.target_cities || [];
        cities.forEach((city: string) => {
          cityCounts[city] = (cityCounts[city] || 0) + 1;
        });
      });
      
      const targetCitiesDemand = Object.entries(cityCounts)
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);

      // Timeline distribution
      const timelineCounts: Record<string, number> = {};
      profiles.forEach(p => {
        const timeline = p.purchase_timeline || 'flexible';
        timelineCounts[timeline] = (timelineCounts[timeline] || 0) + 1;
      });
      
      const timelineDistribution = Object.entries(timelineCounts)
        .map(([timeline, count]) => ({
          timeline: TIMELINE_LABELS[timeline] || timeline,
          count,
          percentage: (count / total) * 100,
        }))
        .sort((a, b) => b.count - a.count);

      // Property type preferences
      const prefCounts: Record<string, number> = {};
      profiles.forEach(p => {
        const prefs = p.property_type_preferences || [];
        prefs.forEach((pref: string) => {
          prefCounts[pref] = (prefCounts[pref] || 0) + 1;
        });
      });
      
      const propertyPreferences = Object.entries(prefCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);

      // Residency distribution
      const residencyCounts: Record<string, number> = {};
      profiles.forEach(p => {
        const status = p.residency_status || 'citizen';
        residencyCounts[status] = (residencyCounts[status] || 0) + 1;
      });
      
      const residencyDistribution = Object.entries(residencyCounts)
        .map(([status, count]) => ({
          status: RESIDENCY_LABELS[status] || status,
          count,
          percentage: (count / total) * 100,
        }))
        .sort((a, b) => b.count - a.count);

      // Market fit analysis
      const listingPrices = (listings || []).map(l => l.price).filter(Boolean);
      const avgListingPrice = listingPrices.length > 0 
        ? listingPrices.reduce((a, b) => a + b, 0) / listingPrices.length 
        : 0;

      const buyersWithBudget = profiles.filter(p => p.budget_max && p.budget_max > 0);
      const avgBuyerBudgetMax = buyersWithBudget.length > 0
        ? buyersWithBudget.reduce((sum, p) => sum + (p.budget_max || 0), 0) / buyersWithBudget.length
        : 0;

      const buyersWithinMarket = buyersWithBudget.filter(p => 
        (p.budget_max || 0) >= avgListingPrice * 0.8
      ).length;

      return {
        totalProfiles: total,
        buyerTypeDistribution,
        budgetDistribution,
        targetCitiesDemand,
        timelineDistribution,
        propertyPreferences,
        residencyDistribution,
        marketFit: {
          buyersWithinMarket,
          totalBuyersWithBudget: buyersWithBudget.length,
          affordabilityPercent: buyersWithBudget.length > 0 
            ? (buyersWithinMarket / buyersWithBudget.length) * 100 
            : 0,
          avgListingPrice,
          avgBuyerBudgetMax,
        },
      };
    },
    staleTime: 60000,
  });
}
