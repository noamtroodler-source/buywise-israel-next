import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ImportJob {
  id: string;
  agency_id: string;
  website_url: string;
  status: string;
  total_urls: number;
  processed_count: number;
  failed_count: number;
  discovered_urls: string[];
  created_at: string;
  updated_at: string;
}

export interface ImportJobItem {
  id: string;
  job_id: string;
  url: string;
  status: string;
  property_id: string | null;
  project_id: string | null;
  error_message: string | null;
  extracted_data: any;
  created_at: string;
}

export function useImportJobs(agencyId: string | undefined) {
  return useQuery({
    queryKey: ['importJobs', agencyId],
    queryFn: async () => {
      if (!agencyId) return [];
      const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ImportJob[];
    },
    enabled: !!agencyId,
  });
}

export function useImportJobItems(jobId: string | undefined) {
  return useQuery({
    queryKey: ['importJobItems', jobId],
    queryFn: async () => {
      if (!jobId) return [];
      const { data, error } = await supabase
        .from('import_job_items')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as ImportJobItem[];
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      // Auto-refresh while processing
      const data = query.state.data as ImportJobItem[] | undefined;
      const hasProcessing = data?.some(i => i.status === 'processing');
      return hasProcessing ? 3000 : false;
    },
  });
}

export function useDiscoverListings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ agencyId, websiteUrl }: { agencyId: string; websiteUrl: string }) => {
      const { data, error } = await supabase.functions.invoke('import-agency-listings', {
        body: { action: 'discover', agency_id: agencyId, website_url: websiteUrl },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { job_id: string; total_listings: number; total_discovered: number };
    },
    onSuccess: (data) => {
      toast.success(`Found ${data.total_listings} listing pages`);
      queryClient.invalidateQueries({ queryKey: ['importJobs'] });
    },
    onError: (err: Error) => {
      toast.error(`Discovery failed: ${err.message}`);
    },
  });
}

export function useProcessBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const { data, error } = await supabase.functions.invoke('import-agency-listings', {
        body: { action: 'process_batch', job_id: jobId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { processed: number; succeeded: number; failed: number; remaining: number; status: string };
    },
    onSuccess: (data) => {
      toast.success(`Batch complete: ${data.succeeded} imported, ${data.failed} skipped/failed, ${data.remaining} remaining`);
      queryClient.invalidateQueries({ queryKey: ['importJobs'] });
      queryClient.invalidateQueries({ queryKey: ['importJobItems'] });
      queryClient.invalidateQueries({ queryKey: ['agencyListingsManagement'] });
    },
    onError: (err: Error) => {
      toast.error(`Batch failed: ${err.message}`);
    },
  });
}
