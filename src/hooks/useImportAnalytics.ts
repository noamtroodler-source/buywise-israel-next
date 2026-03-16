import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ImportAnalyticsData {
  // KPIs
  discoveryRate: number;
  extractionAccuracy: number;
  importSuccessRate: number;
  // Summary
  totalJobs: number;
  totalItems: number;
  uniqueAgencies: number;
  // Costs
  costSummary: { resourceType: string; totalQuantity: number; unit: string }[];
  // Source breakdown
  sourceBreakdown: { source: string; jobs: number; items: number; succeeded: number; failed: number; successRate: number }[];
  // Agency leaderboard
  agencyLeaderboard: { agencyId: string; agencyName: string; jobs: number; items: number; succeeded: number; successRate: number }[];
  // Error breakdown
  errorBreakdown: { errorType: string; count: number }[];
  // Confidence distribution
  confidenceBuckets: { bucket: string; count: number }[];
  // Recent jobs
  recentJobs: { id: string; agencyId: string; websiteUrl: string; status: string; totalUrls: number; processedCount: number; failedCount: number; importType: string; createdAt: string; costs: { firecrawl: number; apify: number; aiTokens: number } }[];
}

export function useImportAnalytics() {
  return useQuery({
    queryKey: ['importAnalytics'],
    queryFn: async (): Promise<ImportAnalyticsData> => {
      // Fetch all jobs, items, and costs in parallel
      const [jobsRes, itemsRes, costsRes] = await Promise.all([
        supabase.from('import_jobs').select('*').order('created_at', { ascending: false }),
        supabase.from('import_job_items').select('id, job_id, status, error_type, confidence_score'),
        supabase.from('import_job_costs').select('job_id, resource_type, quantity, unit'),
      ]);

      if (jobsRes.error) throw jobsRes.error;
      if (itemsRes.error) throw itemsRes.error;

      const jobs = jobsRes.data || [];
      const items = itemsRes.data || [];
      const costs = costsRes.data || [];

      // KPIs
      const totalDiscoveredUrls = jobs.reduce((sum, j) => sum + ((j.discovered_urls as string[])?.length || 0), 0);
      const totalUrlsOnSource = jobs.reduce((sum, j) => sum + (j.total_urls || 0), 0);
      const discoveryRate = totalUrlsOnSource > 0 ? (totalDiscoveredUrls / totalUrlsOnSource) * 100 : 0;

      const doneItems = items.filter(i => i.status === 'done');
      const highConfidenceItems = doneItems.filter(i => (i.confidence_score ?? 0) >= 70);
      const extractionAccuracy = doneItems.length > 0 ? (highConfidenceItems.length / doneItems.length) * 100 : 0;

      const nonSkippedItems = items.filter(i => i.status !== 'skipped');
      const importSuccessRate = nonSkippedItems.length > 0 ? (doneItems.length / nonSkippedItems.length) * 100 : 0;

      // Unique agencies
      const agencyIds = new Set(jobs.map(j => j.agency_id));

      // Cost summary
      const costMap = new Map<string, { total: number; unit: string }>();
      const jobCostMap = new Map<string, { firecrawl: number; apify: number; aiTokens: number }>();
      for (const c of costs) {
        const key = c.resource_type;
        const entry = costMap.get(key) || { total: 0, unit: c.unit };
        entry.total += c.quantity;
        costMap.set(key, entry);

        const jc = jobCostMap.get(c.job_id) || { firecrawl: 0, apify: 0, aiTokens: 0 };
        if (c.resource_type === 'firecrawl') jc.firecrawl += c.quantity;
        else if (c.resource_type === 'apify') jc.apify += c.quantity;
        else if (c.resource_type === 'ai_tokens') jc.aiTokens += c.quantity;
        jobCostMap.set(c.job_id, jc);
      }
      const costSummary = Array.from(costMap.entries()).map(([resourceType, d]) => ({
        resourceType, totalQuantity: d.total, unit: d.unit,
      }));

      // Source breakdown
      const sourceMap = new Map<string, { jobs: number; items: Set<string>; succeeded: number; failed: number }>();
      const jobIdToSource = new Map<string, string>();
      jobs.forEach(j => {
        const src = j.import_type || 'unknown';
        jobIdToSource.set(j.id, src);
        const entry = sourceMap.get(src) || { jobs: 0, items: new Set<string>(), succeeded: 0, failed: 0 };
        entry.jobs++;
        sourceMap.set(src, entry);
      });
      items.forEach(i => {
        const src = jobIdToSource.get(i.job_id) || 'unknown';
        const entry = sourceMap.get(src);
        if (entry) {
          entry.items.add(i.id);
          if (i.status === 'done') entry.succeeded++;
          if (i.status === 'failed') entry.failed++;
        }
      });
      const sourceBreakdown = Array.from(sourceMap.entries()).map(([source, d]) => ({
        source, jobs: d.jobs, items: d.items.size, succeeded: d.succeeded, failed: d.failed,
        successRate: d.items.size > 0 ? (d.succeeded / d.items.size) * 100 : 0,
      }));

      // Agency leaderboard
      const agencyMap = new Map<string, { jobs: number; items: number; succeeded: number; url: string }>();
      jobs.forEach(j => {
        const entry = agencyMap.get(j.agency_id) || { jobs: 0, items: 0, succeeded: 0, url: j.website_url || '' };
        entry.jobs++;
        agencyMap.set(j.agency_id, entry);
      });
      items.forEach(i => {
        const job = jobs.find(j => j.id === i.job_id);
        if (job) {
          const entry = agencyMap.get(job.agency_id);
          if (entry) {
            entry.items++;
            if (i.status === 'done') entry.succeeded++;
          }
        }
      });
      const agencyLeaderboard = Array.from(agencyMap.entries())
        .map(([agencyId, d]) => ({
          agencyId,
          agencyName: d.url ? new URL(d.url).hostname.replace('www.', '') : agencyId.slice(0, 8),
          jobs: d.jobs, items: d.items, succeeded: d.succeeded,
          successRate: d.items > 0 ? (d.succeeded / d.items) * 100 : 0,
        }))
        .sort((a, b) => b.items - a.items)
        .slice(0, 10);

      // Error breakdown
      const errorMap = new Map<string, number>();
      items.filter(i => i.status === 'failed').forEach(i => {
        const t = i.error_type || 'unknown';
        errorMap.set(t, (errorMap.get(t) || 0) + 1);
      });
      const errorBreakdown = Array.from(errorMap.entries())
        .map(([errorType, count]) => ({ errorType, count }))
        .sort((a, b) => b.count - a.count);

      // Confidence distribution
      const buckets = { '0–40': 0, '40–60': 0, '60–80': 0, '80–100': 0 };
      doneItems.forEach(i => {
        const s = i.confidence_score ?? 0;
        if (s < 40) buckets['0–40']++;
        else if (s < 60) buckets['40–60']++;
        else if (s < 80) buckets['60–80']++;
        else buckets['80–100']++;
      });
      const confidenceBuckets = Object.entries(buckets).map(([bucket, count]) => ({ bucket, count }));

      // Recent jobs with costs
      const recentJobs = jobs.slice(0, 20).map(j => ({
        id: j.id,
        agencyId: j.agency_id,
        websiteUrl: j.website_url,
        status: j.status,
        totalUrls: j.total_urls,
        processedCount: j.processed_count,
        failedCount: j.failed_count,
        importType: j.import_type,
        createdAt: j.created_at,
        costs: jobCostMap.get(j.id) || { firecrawl: 0, apify: 0, aiTokens: 0 },
      }));

      return {
        discoveryRate: Math.round(discoveryRate * 10) / 10,
        extractionAccuracy: Math.round(extractionAccuracy * 10) / 10,
        importSuccessRate: Math.round(importSuccessRate * 10) / 10,
        totalJobs: jobs.length,
        totalItems: items.length,
        uniqueAgencies: agencyIds.size,
        costSummary,
        sourceBreakdown,
        agencyLeaderboard,
        errorBreakdown,
        confidenceBuckets,
        recentJobs,
      };
    },
    staleTime: 60_000,
  });
}
