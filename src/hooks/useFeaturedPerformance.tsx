import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FeaturedPerformanceItem {
  id: string;
  featured_listing_id: string;
  property_id: string;
  agency_id: string;
  snapshot_views: number;
  snapshot_saves: number;
  snapshot_inquiries: number;
  featured_at: string;
  // Current stats from property
  current_views: number;
  current_saves: number;
  current_inquiries: number;
  // Computed lift
  lift_views: number;
  lift_saves: number;
  lift_inquiries: number;
  // Property info
  property_title: string;
  property_city: string;
  agency_name: string | null;
}

export interface FeaturedPerformanceSummary {
  activeCount: number;
  totalLiftViews: number;
  totalLiftSaves: number;
  totalLiftInquiries: number;
}

export function useFeaturedPerformanceAdmin() {
  return useQuery<FeaturedPerformanceItem[]>({
    queryKey: ['featured-performance-admin'],
    queryFn: async () => {
      // Get all active featured listings with their snapshots
      const { data: snapshots, error } = await supabase
        .from('featured_performance')
        .select('*');

      if (error) throw error;
      if (!snapshots || snapshots.length === 0) return [];

      const propertyIds = snapshots.map(s => s.property_id);
      const agencyIds = [...new Set(snapshots.map(s => s.agency_id))];

      // Fetch current property stats and agency names in parallel
      const [propertiesRes, agenciesRes, inquiriesRes] = await Promise.all([
        supabase
          .from('properties')
          .select('id, title, city, views_count, total_saves')
          .in('id', propertyIds),
        supabase
          .from('agencies')
          .select('id, name')
          .in('id', agencyIds),
        // Count inquiries per property
        supabase
          .from('property_inquiries')
          .select('property_id')
          .in('property_id', propertyIds),
      ]);

      const propertyMap = new Map(
        (propertiesRes.data || []).map(p => [p.id, p])
      );
      const agencyMap = new Map(
        (agenciesRes.data || []).map(a => [a.id, a])
      );

      // Count inquiries per property
      const inquiryCounts = new Map<string, number>();
      (inquiriesRes.data || []).forEach(row => {
        inquiryCounts.set(row.property_id, (inquiryCounts.get(row.property_id) || 0) + 1);
      });

      return snapshots.map(snap => {
        const prop = propertyMap.get(snap.property_id);
        const agency = agencyMap.get(snap.agency_id);
        const currentViews = prop?.views_count ?? snap.snapshot_views;
        const currentSaves = prop?.total_saves ?? snap.snapshot_saves;
        const currentInquiries = inquiryCounts.get(snap.property_id) ?? snap.snapshot_inquiries;

        return {
          id: snap.id,
          featured_listing_id: snap.featured_listing_id,
          property_id: snap.property_id,
          agency_id: snap.agency_id,
          snapshot_views: snap.snapshot_views,
          snapshot_saves: snap.snapshot_saves,
          snapshot_inquiries: snap.snapshot_inquiries,
          featured_at: snap.featured_at,
          current_views: currentViews,
          current_saves: currentSaves,
          current_inquiries: currentInquiries,
          lift_views: Math.max(0, currentViews - snap.snapshot_views),
          lift_saves: Math.max(0, currentSaves - snap.snapshot_saves),
          lift_inquiries: Math.max(0, currentInquiries - snap.snapshot_inquiries),
          property_title: prop?.title ?? 'Unknown',
          property_city: prop?.city ?? '',
          agency_name: agency?.name ?? null,
        };
      });
    },
  });
}

export function useFeaturedPerformanceSummary() {
  return useQuery<FeaturedPerformanceSummary>({
    queryKey: ['featured-performance-summary'],
    queryFn: async () => {
      // Get active featured listings count
      const { count: activeCount } = await supabase
        .from('featured_listings')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get all snapshots for active listings
      const { data: activeFeatured } = await supabase
        .from('featured_listings')
        .select('id, property_id')
        .eq('is_active', true);

      if (!activeFeatured || activeFeatured.length === 0) {
        return { activeCount: activeCount ?? 0, totalLiftViews: 0, totalLiftSaves: 0, totalLiftInquiries: 0 };
      }

      const featuredIds = activeFeatured.map(f => f.id);
      const propertyIds = activeFeatured.map(f => f.property_id);

      const [snapshotsRes, propertiesRes, inquiriesRes] = await Promise.all([
        supabase
          .from('featured_performance')
          .select('featured_listing_id, snapshot_views, snapshot_saves, snapshot_inquiries, property_id')
          .in('featured_listing_id', featuredIds),
        supabase
          .from('properties')
          .select('id, views_count, total_saves')
          .in('id', propertyIds),
        supabase
          .from('property_inquiries')
          .select('property_id')
          .in('property_id', propertyIds),
      ]);

      const propertyMap = new Map(
        (propertiesRes.data || []).map(p => [p.id, p])
      );
      const inquiryCounts = new Map<string, number>();
      (inquiriesRes.data || []).forEach(row => {
        inquiryCounts.set(row.property_id, (inquiryCounts.get(row.property_id) || 0) + 1);
      });

      let totalLiftViews = 0;
      let totalLiftSaves = 0;
      let totalLiftInquiries = 0;

      (snapshotsRes.data || []).forEach(snap => {
        const prop = propertyMap.get(snap.property_id);
        totalLiftViews += Math.max(0, (prop?.views_count ?? 0) - snap.snapshot_views);
        totalLiftSaves += Math.max(0, (prop?.total_saves ?? 0) - snap.snapshot_saves);
        totalLiftInquiries += Math.max(0, (inquiryCounts.get(snap.property_id) ?? 0) - snap.snapshot_inquiries);
      });

      return {
        activeCount: activeCount ?? 0,
        totalLiftViews,
        totalLiftSaves,
        totalLiftInquiries,
      };
    },
  });
}

/** Get performance data for a specific property (for inline badges) */
export function useFeaturedPropertyPerformance(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['featured-property-performance', propertyId],
    queryFn: async () => {
      if (!propertyId) return null;

      const { data: snap } = await supabase
        .from('featured_performance')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!snap) return null;

      const [propRes, inquiryRes] = await Promise.all([
        supabase.from('properties').select('views_count, total_saves').eq('id', propertyId).single(),
        supabase.from('property_inquiries').select('id', { count: 'exact', head: true }).eq('property_id', propertyId),
      ]);

      const currentViews = propRes.data?.views_count ?? snap.snapshot_views;
      const currentSaves = propRes.data?.total_saves ?? snap.snapshot_saves;
      const currentInquiries = inquiryRes.count ?? snap.snapshot_inquiries;

      return {
        lift_views: Math.max(0, currentViews - snap.snapshot_views),
        lift_saves: Math.max(0, currentSaves - snap.snapshot_saves),
        lift_inquiries: Math.max(0, currentInquiries - snap.snapshot_inquiries),
        featured_at: snap.featured_at,
      };
    },
    enabled: !!propertyId,
  });
}
