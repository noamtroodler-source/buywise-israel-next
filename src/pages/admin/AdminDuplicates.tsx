import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search } from 'lucide-react';
import { DuplicateCompareCard } from '@/components/admin/DuplicateCompareCard';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

type StatusFilter = 'pending' | 'merged' | 'dismissed' | 'all';
type MethodFilter = 'all' | 'phash' | 'cross_source';

export default function AdminDuplicates() {
  const [tab, setTab] = useState<StatusFilter>('pending');
  const [methodFilter, setMethodFilter] = useState<MethodFilter>('all');
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: pairs, isLoading } = useQuery({
    queryKey: ['duplicate-pairs', tab, methodFilter],
    queryFn: async () => {
      let query = supabase
        .from('duplicate_pairs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (tab !== 'all') {
        query = query.eq('status', tab);
      }
      if (methodFilter !== 'all') {
        query = query.eq('detection_method', methodFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) return [];

      const propIds = new Set<string>();
      data.forEach((p: any) => {
        propIds.add(p.property_a);
        propIds.add(p.property_b);
      });

      const { data: properties } = await supabase
        .from('properties')
        .select('id, title, city, neighborhood, price, bedrooms, size_sqm, images, views_count, listing_status, created_at, agent_id, import_source, merged_source_urls, data_quality_score')
        .in('id', [...propIds]);

      const propMap = new Map(properties?.map((p: any) => [p.id, p]) || []);

      return data.map((pair: any) => ({
        ...pair,
        propertyA: propMap.get(pair.property_a) || { id: pair.property_a },
        propertyB: propMap.get(pair.property_b) || { id: pair.property_b },
      }));
    },
  });

  const scanMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('detect-duplicates');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Scan complete: ${data.inserted} new pairs found`);
      queryClient.invalidateQueries({ queryKey: ['duplicate-pairs'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const mergeMutation = useMutation({
    mutationFn: async ({ pairId, winnerId, loserId }: { pairId: string; winnerId: string; loserId: string }) => {
      const { error } = await supabase.rpc('merge_properties', {
        p_winner_id: winnerId,
        p_loser_id: loserId,
        p_pair_id: pairId,
        p_admin_id: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Properties merged');
      queryClient.invalidateQueries({ queryKey: ['duplicate-pairs'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const dismissMutation = useMutation({
    mutationFn: async (pairId: string) => {
      const { error } = await supabase
        .from('duplicate_pairs')
        .update({ status: 'dismissed', resolved_by: user?.id, resolved_at: new Date().toISOString() })
        .eq('id', pairId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Pair dismissed');
      queryClient.invalidateQueries({ queryKey: ['duplicate-pairs'] });
    },
  });

  const pendingCount = pairs?.filter((p: any) => p.status === 'pending').length ?? 0;
  const isBusy = mergeMutation.isPending || dismissMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Duplicate Properties</h2>
          <p className="text-sm text-muted-foreground">Review and merge duplicate listings detected via image similarity or cross-source matching</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => scanMutation.mutate()}
          disabled={scanMutation.isPending}
        >
          {scanMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Search className="h-4 w-4 mr-1" />}
          Scan Now
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as StatusFilter)} className="flex-1">
          <TabsList>
            <TabsTrigger value="pending">
              Pending {pendingCount > 0 && <Badge variant="destructive" className="ml-1 text-xs">{pendingCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="merged">Merged</TabsTrigger>
            <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={methodFilter} onValueChange={(v) => setMethodFilter(v as MethodFilter)}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Detection method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="phash">Image Match</SelectItem>
            <SelectItem value="cross_source">Cross-Source</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !pairs?.length ? (
        <p className="text-center text-muted-foreground py-12">
          No {tab === 'all' ? '' : tab} duplicate pairs found{methodFilter !== 'all' ? ` (${methodFilter === 'phash' ? 'Image Match' : 'Cross-Source'})` : ''}
        </p>
      ) : (
        <div className="space-y-4">
          {pairs.map((pair: any) => (
            <DuplicateCompareCard
              key={pair.id}
              pairId={pair.id}
              propertyA={pair.propertyA}
              propertyB={pair.propertyB}
              similarityScore={pair.similarity_score}
              detectionMethod={pair.detection_method}
              onKeep={(pairId, winnerId, loserId) => mergeMutation.mutate({ pairId, winnerId, loserId })}
              onDismiss={(pairId) => dismissMutation.mutate(pairId)}
              isLoading={isBusy}
            />
          ))}
        </div>
      )}
    </div>
  );
}
