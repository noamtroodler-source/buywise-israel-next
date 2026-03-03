import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays } from 'date-fns';

export interface WarmUser {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  last_active_at: string | null;
  favorites_count: number;
  guides_read: number;
  has_buyer_profile: boolean;
  target_cities: string[];
  heat_score: number;
  last_email_at: string | null;
  last_email_trigger: string | null;
}

function calculateHeatScore(
  favCount: number,
  guidesRead: number,
  hasBuyerProfile: boolean,
  lastActiveAt: string | null
): number {
  const base = (favCount * 3) + (guidesRead * 5) + (hasBuyerProfile ? 10 : 0);
  const daysSinceActive = lastActiveAt
    ? differenceInDays(new Date(), new Date(lastActiveAt))
    : 999;
  const recencyBonus = Math.max(0, 14 - daysSinceActive);
  return base + recencyBonus;
}

export function useWarmLeads() {
  return useQuery({
    queryKey: ['admin-warm-leads'],
    queryFn: async () => {
      // Fetch all profiles
      const { data: profiles, error: profilesErr } = await supabase
        .from('profiles')
        .select('id, email, full_name, last_active_at, phone');
      if (profilesErr) throw profilesErr;

      // Fetch favorites counts grouped by user
      const { data: favRows, error: favErr } = await supabase
        .from('favorites')
        .select('user_id');
      if (favErr) throw favErr;

      const favCounts = new Map<string, number>();
      favRows?.forEach(r => {
        favCounts.set(r.user_id, (favCounts.get(r.user_id) || 0) + 1);
      });

      // Fetch guide content visits grouped by user
      const { data: guideRows, error: guideErr } = await supabase
        .from('content_visits')
        .select('user_id')
        .eq('content_type', 'guide');
      if (guideErr) throw guideErr;

      const guideCounts = new Map<string, number>();
      guideRows?.forEach(r => {
        guideCounts.set(r.user_id, (guideCounts.get(r.user_id) || 0) + 1);
      });

      // Fetch buyer profiles
      const { data: buyerRows, error: buyerErr } = await supabase
        .from('buyer_profiles')
        .select('user_id, target_cities');
      if (buyerErr) throw buyerErr;

      const buyerMap = new Map<string, string[]>();
      buyerRows?.forEach(r => {
        buyerMap.set(r.user_id, (r.target_cities as string[]) || []);
      });

      // Build warm users list
      const warmUsers: WarmUser[] = (profiles || [])
        .map(p => {
          const favCount = favCounts.get(p.id) || 0;
          const guidesRead = guideCounts.get(p.id) || 0;
          const hasBuyerProfile = buyerMap.has(p.id);
          const targetCities = buyerMap.get(p.id) || [];
          const heatScore = calculateHeatScore(favCount, guidesRead, hasBuyerProfile, p.last_active_at);

          return {
            id: p.id,
            email: p.email,
            full_name: p.full_name,
            last_active_at: p.last_active_at,
            favorites_count: favCount,
            guides_read: guidesRead,
            has_buyer_profile: hasBuyerProfile,
            target_cities: targetCities,
            heat_score: heatScore,
          };
        })
        .filter(u => u.heat_score > 0)
        .sort((a, b) => b.heat_score - a.heat_score)
        .slice(0, 50);

      return warmUsers;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export interface RetentionEmailLog {
  id: string;
  user_id: string;
  user_email: string | null;
  trigger_type: string;
  sent_at: string;
  metadata: Record<string, unknown> | null;
}

export function useRetentionEmailsLog() {
  return useQuery({
    queryKey: ['admin-retention-emails-log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('retention_emails_log' as any)
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(100);
      if (error) throw error;

      // Enrich with user emails
      const userIds = [...new Set((data || []).map((r: any) => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);

      const emailMap = new Map<string, string>();
      profiles?.forEach(p => emailMap.set(p.id, p.email || ''));

      return (data || []).map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        user_email: emailMap.get(r.user_id) || null,
        trigger_type: r.trigger_type,
        sent_at: r.sent_at,
        metadata: r.metadata,
      })) as RetentionEmailLog[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
