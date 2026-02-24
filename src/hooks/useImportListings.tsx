import { useState, useRef } from 'react';
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
  error_type: string | null;
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
    refetchInterval: (query) => {
      const data = query.state.data as ImportJob[] | undefined;
      const hasActive = data?.some(j => ['discovering', 'ready', 'processing'].includes(j.status));
      return hasActive ? 3000 : false;
    },
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
      const hasActive = data?.some(i => ['processing', 'pending'].includes(i.status));
      return hasActive ? 3000 : false;
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
      return data as { job_id: string; total_listings: number; total_discovered: number; resumed?: boolean };
    },
    onSuccess: (data) => {
      if (data.resumed) {
        toast.info('Resumed existing job for this URL');
      } else {
        toast.success(`Found ${data.total_listings} listing pages`);
      }
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

export function useRetryFailed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const { data, error } = await supabase.functions.invoke('import-agency-listings', {
        body: { action: 'retry_failed', job_id: jobId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { reset_count: number; transient_count: number; permanent_count: number };
    },
    onSuccess: (data) => {
      const msg = data.permanent_count > 0
        ? `${data.reset_count} retryable items reset. ${data.permanent_count} permanent failures unchanged.`
        : `${data.reset_count} failed items reset — ready to retry`;
      toast.success(msg);
      queryClient.invalidateQueries({ queryKey: ['importJobs'] });
      queryClient.invalidateQueries({ queryKey: ['importJobItems'] });
    },
    onError: (err: Error) => {
      toast.error(`Retry failed: ${err.message}`);
    },
  });
}

export function useDeleteImportJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const { error: itemsErr } = await supabase
        .from('import_job_items')
        .delete()
        .eq('job_id', jobId);
      if (itemsErr) throw itemsErr;

      const { error: jobErr } = await supabase
        .from('import_jobs')
        .delete()
        .eq('id', jobId);
      if (jobErr) throw jobErr;
    },
    onSuccess: () => {
      toast.success('Import job deleted');
      queryClient.invalidateQueries({ queryKey: ['importJobs'] });
      queryClient.invalidateQueries({ queryKey: ['importJobItems'] });
    },
    onError: (err: Error) => {
      toast.error(`Delete failed: ${err.message}`);
    },
  });
}

export function useProcessAll() {
  const queryClient = useQueryClient();
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const stopRef = useRef(false);

  const startProcessAll = async (jobId: string) => {
    setIsProcessingAll(true);
    stopRef.current = false;
    let totalSucceeded = 0;
    let totalFailed = 0;

    try {
      while (!stopRef.current) {
        const { data, error } = await supabase.functions.invoke(
          'import-agency-listings',
          { body: { action: 'process_batch', job_id: jobId } }
        );
        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        totalSucceeded += data.succeeded;
        totalFailed += data.failed;

        queryClient.invalidateQueries({ queryKey: ['importJobs'] });
        queryClient.invalidateQueries({ queryKey: ['importJobItems'] });

        if (data.remaining === 0 || data.status === 'completed') break;
      }

      queryClient.invalidateQueries({ queryKey: ['agencyListingsManagement'] });

      if (stopRef.current) {
        toast.info(`Import paused. ${totalSucceeded} imported, ${totalFailed} skipped/failed so far.`);
      } else {
        toast.success(
          `Import complete! ${totalSucceeded} listings imported, ${totalFailed} skipped/failed.`,
          { duration: 10000 }
        );
      }
    } catch (err: any) {
      toast.error(`Import failed: ${err.message}`);
    } finally {
      setIsProcessingAll(false);
    }
  };

  const stopProcessAll = () => { stopRef.current = true; };

  return { startProcessAll, stopProcessAll, isProcessingAll };
}
