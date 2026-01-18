import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays } from 'date-fns';

export interface InventoryHealth {
  // Status breakdown
  statusBreakdown: {
    status: string;
    count: number;
    percentage: number;
  }[];
  
  // Listing type breakdown
  listingTypeBreakdown: {
    type: string;
    count: number;
    percentage: number;
  }[];
  
  // Property type breakdown
  propertyTypeBreakdown: {
    type: string;
    count: number;
    percentage: number;
  }[];
  
  // Verification status
  verificationBreakdown: {
    status: string;
    count: number;
  }[];
  
  // Quality metrics
  qualityMetrics: {
    withImages: number;
    withoutImages: number;
    shortDescriptions: number;
    staleListings: number;
    missingPrice: number;
  };
  
  totalListings: number;
}

export function useInventoryHealth() {
  return useQuery({
    queryKey: ['inventory-health'],
    queryFn: async (): Promise<InventoryHealth> => {
      const thirtyDaysAgo = subDays(new Date(), 30);

      const { data: properties } = await supabase
        .from('properties')
        .select('id, listing_status, property_type, verification_status, images, description, updated_at, price');

      if (!properties || properties.length === 0) {
        return {
          statusBreakdown: [],
          listingTypeBreakdown: [],
          propertyTypeBreakdown: [],
          verificationBreakdown: [],
          qualityMetrics: {
            withImages: 0,
            withoutImages: 0,
            shortDescriptions: 0,
            staleListings: 0,
            missingPrice: 0,
          },
          totalListings: 0,
        };
      }

      const total = properties.length;

      // Status breakdown (listing_status)
      const statusCounts: Record<string, number> = {};
      properties.forEach(p => {
        const status = p.listing_status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      const statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({
        status: formatStatus(status),
        count,
        percentage: (count / total) * 100,
      }));

      // Property type breakdown
      const typeCounts: Record<string, number> = {};
      properties.forEach(p => {
        const type = p.property_type || 'unknown';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });

      const propertyTypeBreakdown = Object.entries(typeCounts)
        .map(([type, count]) => ({
          type: formatPropertyType(type),
          count,
          percentage: (count / total) * 100,
        }))
        .sort((a, b) => b.count - a.count);

      // Verification status breakdown
      const verificationCounts: Record<string, number> = {};
      properties.forEach(p => {
        const status = p.verification_status || 'unknown';
        verificationCounts[status] = (verificationCounts[status] || 0) + 1;
      });

      const verificationBreakdown = Object.entries(verificationCounts).map(([status, count]) => ({
        status: formatVerificationStatus(status),
        count,
      }));

      // Quality metrics
      let withImages = 0;
      let withoutImages = 0;
      let shortDescriptions = 0;
      let staleListings = 0;
      let missingPrice = 0;

      properties.forEach(p => {
        // Check images
        if (p.images && Array.isArray(p.images) && p.images.length > 0) {
          withImages++;
        } else {
          withoutImages++;
        }

        // Check description length
        if (!p.description || p.description.length < 100) {
          shortDescriptions++;
        }

        // Check if stale (not updated in 30 days)
        if (p.updated_at && new Date(p.updated_at) < thirtyDaysAgo) {
          staleListings++;
        }

        // Check price
        if (!p.price || p.price === 0) {
          missingPrice++;
        }
      });

      // Derive listing type from listing_status
      const listingTypes = {
        'For Sale': 0,
        'For Rent': 0,
        'Sold': 0,
        'Rented': 0,
        'Other': 0,
      };

      properties.forEach(p => {
        const status = p.listing_status?.toLowerCase() || '';
        if (status.includes('sale') || status === 'for_sale') {
          listingTypes['For Sale']++;
        } else if (status.includes('rent') && !status.includes('rented')) {
          listingTypes['For Rent']++;
        } else if (status === 'sold') {
          listingTypes['Sold']++;
        } else if (status === 'rented') {
          listingTypes['Rented']++;
        } else {
          listingTypes['Other']++;
        }
      });

      const listingTypeBreakdown = Object.entries(listingTypes)
        .filter(([_, count]) => count > 0)
        .map(([type, count]) => ({
          type,
          count,
          percentage: (count / total) * 100,
        }));

      return {
        statusBreakdown,
        listingTypeBreakdown,
        propertyTypeBreakdown,
        verificationBreakdown,
        qualityMetrics: {
          withImages,
          withoutImages,
          shortDescriptions,
          staleListings,
          missingPrice,
        },
        totalListings: total,
      };
    },
  });
}

function formatStatus(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function formatPropertyType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function formatVerificationStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending_review: 'Pending Review',
    approved: 'Approved',
    rejected: 'Rejected',
    draft: 'Draft',
  };
  return statusMap[status] || status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
