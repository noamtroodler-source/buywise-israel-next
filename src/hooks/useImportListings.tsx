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
  import_type: string;
  source_type?: string | null;
  failure_reason?: string | null;
  is_incremental: boolean;
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
  extracted_data: Record<string, unknown> | null;
  confidence_score: number | null;
  matched_property_id?: string | null;
  duplicate_decision?: string | null;
  duplicate_decision_band?: string | null;
  duplicate_reason_codes?: string[] | null;
  duplicate_match_scores?: Record<string, unknown> | null;
  duplicate_review_required?: boolean | null;
  duplicate_review_status?: string | null;
  duplicate_review_recommended_action?: string | null;
  duplicate_review_notes?: string | null;
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
  });
}

export function useDiscoverListings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ agencyId, websiteUrl, importType = 'both', sourceType = 'website' }: { agencyId: string; websiteUrl: string; importType?: string; sourceType?: string }) => {
      const { data, error } = await supabase.functions.invoke('import-agency-listings', {
        body: { action: 'discover', agency_id: agencyId, website_url: websiteUrl, import_type: importType, source_type: sourceType },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as {
        job_id: string | null;
        total_listings: number;
        total_discovered: number;
        new_urls?: number;
        skipped_existing?: number;
        resumed?: boolean;
        started_async?: boolean;
      };
    },
    onSuccess: (data) => {
      if (data.started_async) {
        toast.success('Discovery started — scanning continues in the background. This may take 2-5 minutes.');
      } else if (data.new_urls === 0 || (!data.job_id && data.skipped_existing)) {
        toast.info(`Your site is up to date — no new listings found. (${data.total_discovered} URLs scanned, ${data.skipped_existing || 0} already imported)`);
      } else if (data.skipped_existing && data.skipped_existing > 0) {
        toast.success(`Found ${data.new_urls || data.total_listings} new listing pages (${data.skipped_existing} already imported)`);
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
        body: { action: 'process_batch', job_id: jobId, background: true },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { processed?: number; succeeded?: number; failed?: number; remaining?: number; status: string; started_async?: boolean };
    },
    onSuccess: (data) => {
      toast.success(data.started_async
        ? 'Import started — processing continues in the background.'
        : `Batch complete: ${data.succeeded || 0} imported, ${data.failed || 0} skipped/failed, ${data.remaining || 0} remaining`);
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

export function useRetryRecoverableSkipped() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const { data, error } = await supabase.functions.invoke('import-agency-listings', {
        body: { action: 'retry_recoverable_skipped', job_id: jobId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { reset_count: number; scanned_count: number };
    },
    onSuccess: (data) => {
      toast.success(`${data.reset_count} recoverable skipped items reset — ready to retry`);
      queryClient.invalidateQueries({ queryKey: ['importJobs'] });
      queryClient.invalidateQueries({ queryKey: ['importJobItems'] });
    },
    onError: (err: Error) => {
      toast.error(`Retry skipped failed: ${err.message}`);
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

export function useApproveItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, extractedData }: { itemId: string; extractedData: Record<string, unknown> }) => {
      const { data, error } = await supabase.functions.invoke('import-agency-listings', {
        body: { action: 'approve_item', item_id: itemId, extracted_data: extractedData },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { property_id: string };
    },
    onSuccess: () => {
      toast.success('Listing approved and imported');
      queryClient.invalidateQueries({ queryKey: ['importJobItems'] });
      queryClient.invalidateQueries({ queryKey: ['importJobs'] });
      queryClient.invalidateQueries({ queryKey: ['agencyListingsManagement'] });
    },
    onError: (err: Error) => {
      toast.error(`Approve failed: ${err.message}`);
    },
  });
}

export function useResolveDuplicateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, resolution, notes }: { itemId: string; resolution: string; notes?: string }) => {
      const { data, error } = await supabase.functions.invoke('import-agency-listings', {
        body: { action: 'resolve_duplicate_review', item_id: itemId, resolution, notes: notes || null },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { item_id: string; resolution: string; next_status: string };
    },
    onSuccess: (data) => {
      toast.success(data.next_status === 'pending' ? 'Item released for import' : 'Duplicate review updated');
      queryClient.invalidateQueries({ queryKey: ['importJobItems'] });
      queryClient.invalidateQueries({ queryKey: ['importJobs'] });
    },
    onError: (err: Error) => {
      toast.error(`Review update failed: ${err.message}`);
    },
  });
}

export function useUpdateAutoSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ agencyId, enabled, url }: { agencyId: string; enabled: boolean; url?: string }) => {
      const updates: any = { auto_sync_enabled: enabled };
      if (url !== undefined) updates.auto_sync_url = url;
      const { error } = await supabase
        .from('agencies')
        .update(updates)
        .eq('id', agencyId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success(vars.enabled ? 'Auto-sync enabled' : 'Auto-sync disabled');
      queryClient.invalidateQueries({ queryKey: ['myAgency'] });
    },
    onError: (err: Error) => {
      toast.error(`Failed to update sync: ${err.message}`);
    },
  });
}

export function useSkipItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('import_job_items')
        .update({ status: 'skipped' } as any)
        .eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Item skipped');
      queryClient.invalidateQueries({ queryKey: ['importJobItems'] });
      queryClient.invalidateQueries({ queryKey: ['importJobs'] });
    },
    onError: (err: Error) => {
      toast.error(`Skip failed: ${err.message}`);
    },
  });
}

export function useResumeJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const { data, error } = await supabase.functions.invoke('import-agency-listings', {
        body: { action: 'resume_job', job_id: jobId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { reset_count: number };
    },
    onSuccess: (data) => {
      toast.success(`Job resumed — ${data.reset_count} item${data.reset_count !== 1 ? 's' : ''} reset for reprocessing`);
      queryClient.invalidateQueries({ queryKey: ['importJobs'] });
      queryClient.invalidateQueries({ queryKey: ['importJobItems'] });
    },
    onError: (err: Error) => {
      toast.error(`Resume failed: ${err.message}`);
    },
  });
}

export function useQuarantineMadlanBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agencyId: string) => {
      const { data, error } = await supabase.functions.invoke('import-agency-listings', {
        body: { action: 'quarantine_madlan_batch', agency_id: agencyId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { quarantined_count: number };
    },
    onSuccess: (data) => {
      toast.success(`Quarantined ${data.quarantined_count} Madlan listings for review`);
      queryClient.invalidateQueries({ queryKey: ['importJobs'] });
      queryClient.invalidateQueries({ queryKey: ['agencyListingsManagement'] });
    },
    onError: (err: Error) => {
      toast.error(`Quarantine failed: ${err.message}`);
    },
  });
}


export function useProcessAll() {
  const queryClient = useQueryClient();
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const stopRef = useRef(false);
  const startTimeRef = useRef<number | null>(null);
  const processedCountRef = useRef(0);
  const [processedSoFar, setProcessedSoFar] = useState(0);
  const [processingStartTime, setProcessingStartTime] = useState<number | null>(null);

  const startProcessAll = async (jobId: string) => {
    setIsProcessingAll(true);
    stopRef.current = false;
    startTimeRef.current = Date.now();
    processedCountRef.current = 0;
    setProcessingStartTime(Date.now());
    setProcessedSoFar(0);
    let totalSucceeded = 0;
    let totalFailed = 0;

    try {
      while (!stopRef.current) {
        const { data, error } = await supabase.functions.invoke(
          'import-agency-listings',
          { body: { action: 'process_batch', job_id: jobId, background: true } }
        );
        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        if (data.started_async) {
          toast.success('Import started — processing continues in the background.');
          queryClient.invalidateQueries({ queryKey: ['importJobs'] });
          queryClient.invalidateQueries({ queryKey: ['importJobItems'] });
          break;
        }

        totalSucceeded += data.succeeded;
        totalFailed += data.failed;
        processedCountRef.current += data.succeeded + data.failed;
        setProcessedSoFar(processedCountRef.current);

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
      startTimeRef.current = null;
      setProcessingStartTime(null);
    }
  };

  const stopProcessAll = () => { stopRef.current = true; };

  return { startProcessAll, stopProcessAll, isProcessingAll, processingStartTime, processedSoFar };
}
