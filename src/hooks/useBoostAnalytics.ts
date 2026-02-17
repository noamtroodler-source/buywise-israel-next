import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from './useSubscription';

export interface BoostAnalyticsItem {
  boostId: string;
  productName: string;
  productSlug: string;
  targetId: string;
  targetType: string;
  targetName: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  creditCost: number;
  viewsDuringBoost: number;
  savesDuringBoost: number;
  inquiriesDuringBoost: number;
}

export interface BoostAnalyticsData {
  totalCreditsSpent: number;
  activeBoostCount: number;
  completedBoostCount: number;
  avgViewsPerBoost: number;
  boostDetails: BoostAnalyticsItem[];
  monthlySpend: { month: string; credits: number }[];
}

export function useBoostAnalytics() {
  const { data: sub } = useSubscription();
  const entityType = sub?.entityType;
  const entityId = sub?.entityId;

  return useQuery({
    queryKey: ['boost-analytics', entityType, entityId],
    queryFn: async (): Promise<BoostAnalyticsData> => {
      if (!entityType || !entityId) {
        return {
          totalCreditsSpent: 0,
          activeBoostCount: 0,
          completedBoostCount: 0,
          avgViewsPerBoost: 0,
          boostDetails: [],
          monthlySpend: [],
        };
      }

      const now = new Date().toISOString();

      // Fetch all boosts for this entity with product details
      const { data: boosts, error: boostsError } = await supabase
        .from('active_boosts')
        .select('*, visibility_products(name, slug, credit_cost)')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (boostsError) throw boostsError;
      if (!boosts || boosts.length === 0) {
        return {
          totalCreditsSpent: 0,
          activeBoostCount: 0,
          completedBoostCount: 0,
          avgViewsPerBoost: 0,
          boostDetails: [],
          monthlySpend: [],
        };
      }

      const activeBoosts = boosts.filter(b => b.is_active && b.ends_at > now);
      const completedBoosts = boosts.filter(b => !b.is_active || b.ends_at <= now);

      // Gather all target IDs to fetch names
      const propertyTargetIds = boosts.filter(b => b.target_type === 'property').map(b => b.target_id);
      const projectTargetIds = boosts.filter(b => b.target_type === 'project').map(b => b.target_id);

      // Fetch target names in parallel
      const [propertiesResult, projectsResult] = await Promise.all([
        propertyTargetIds.length > 0
          ? supabase.from('properties').select('id, title').in('id', propertyTargetIds)
          : { data: [] as { id: string; title: string }[] },
        projectTargetIds.length > 0
          ? supabase.from('projects').select('id, name').in('id', projectTargetIds)
          : { data: [] as { id: string; name: string }[] },
      ]);

      const propertyNames: Record<string, string> = {};
      (propertiesResult.data || []).forEach(p => { propertyNames[p.id] = p.title; });
      const projectNames: Record<string, string> = {};
      (projectsResult.data || []).forEach(p => { projectNames[p.id] = p.name; });

      // For each boost, count views/saves/inquiries during the boost window
      const boostDetails: BoostAnalyticsItem[] = await Promise.all(
        boosts.map(async (boost) => {
          const product = boost.visibility_products as any;
          const targetName = boost.target_type === 'property'
            ? propertyNames[boost.target_id] || 'Unknown Property'
            : projectNames[boost.target_id] || 'Unknown Project';

          let viewsDuringBoost = 0;
          let savesDuringBoost = 0;
          let inquiriesDuringBoost = 0;

          if (boost.target_type === 'property') {
            const [viewsRes, savesRes, inquiriesRes] = await Promise.all([
              supabase
                .from('property_views')
                .select('id', { count: 'exact', head: true })
                .eq('property_id', boost.target_id)
                .gte('viewed_at', boost.starts_at)
                .lte('viewed_at', boost.ends_at),
              supabase
                .from('favorites')
                .select('id', { count: 'exact', head: true })
                .eq('property_id', boost.target_id)
                .gte('created_at', boost.starts_at)
                .lte('created_at', boost.ends_at),
              supabase
                .from('property_inquiries')
                .select('id', { count: 'exact', head: true })
                .eq('property_id', boost.target_id)
                .gte('created_at', boost.starts_at)
                .lte('created_at', boost.ends_at),
            ]);
            viewsDuringBoost = viewsRes.count || 0;
            savesDuringBoost = savesRes.count || 0;
            inquiriesDuringBoost = inquiriesRes.count || 0;
          } else if (boost.target_type === 'project') {
            const [viewsRes, savesRes, inquiriesRes] = await Promise.all([
              supabase
                .from('project_views')
                .select('id', { count: 'exact', head: true })
                .eq('project_id', boost.target_id)
                .gte('viewed_at', boost.starts_at)
                .lte('viewed_at', boost.ends_at),
              supabase
                .from('project_favorites')
                .select('id', { count: 'exact', head: true })
                .eq('project_id', boost.target_id)
                .gte('created_at', boost.starts_at)
                .lte('created_at', boost.ends_at),
              supabase
                .from('project_inquiries')
                .select('id', { count: 'exact', head: true })
                .eq('project_id', boost.target_id)
                .gte('created_at', boost.starts_at)
                .lte('created_at', boost.ends_at),
            ]);
            viewsDuringBoost = viewsRes.count || 0;
            savesDuringBoost = savesRes.count || 0;
            inquiriesDuringBoost = inquiriesRes.count || 0;
          }

          return {
            boostId: boost.id,
            productName: product?.name || 'Unknown',
            productSlug: product?.slug || '',
            targetId: boost.target_id,
            targetType: boost.target_type,
            targetName,
            startsAt: boost.starts_at,
            endsAt: boost.ends_at,
            isActive: boost.is_active && boost.ends_at > now,
            creditCost: product?.credit_cost || 0,
            viewsDuringBoost,
            savesDuringBoost,
            inquiriesDuringBoost,
          };
        })
      );

      // Calculate totals
      const totalCreditsSpent = boostDetails.reduce((sum, b) => sum + b.creditCost, 0);
      const totalViews = boostDetails.reduce((sum, b) => sum + b.viewsDuringBoost, 0);
      const avgViewsPerBoost = boostDetails.length > 0 ? Math.round(totalViews / boostDetails.length) : 0;

      // Monthly spend breakdown
      const monthlyMap: Record<string, number> = {};
      boostDetails.forEach(b => {
        const month = b.startsAt.substring(0, 7); // YYYY-MM
        monthlyMap[month] = (monthlyMap[month] || 0) + b.creditCost;
      });
      const monthlySpend = Object.entries(monthlyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6) // last 6 months
        .map(([month, credits]) => ({ month, credits }));

      return {
        totalCreditsSpent,
        activeBoostCount: activeBoosts.length,
        completedBoostCount: completedBoosts.length,
        avgViewsPerBoost,
        boostDetails,
        monthlySpend,
      };
    },
    enabled: !!entityType && !!entityId,
    staleTime: 5 * 60 * 1000,
  });
}
