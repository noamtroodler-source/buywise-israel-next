import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Globe, Loader2, Download, CheckCircle2,
  XCircle, AlertCircle, FileText, RefreshCw, Trash2,
  ArrowLeftRight, Upload,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  useImportJobs,
  useImportJobItems,
  useProcessBatch,
  useDeleteImportJob,
  useRetryFailed,
  useRetryRecoverableSkipped,
  useProcessAll,
  useResumeJob,
} from '@/hooks/useImportListings';
import { useAgencySources, useTriggerAgencySourcesSync, useTriggerSourceSync, useUpsertAgencySources } from '@/hooks/useAgencySources';
import { cn } from '@/lib/utils';
import { useRealtimeImportProgress } from '@/hooks/useRealtimeImportProgress';
import { ImportProgressBar } from '@/components/agency/ImportProgressBar';

const SOURCE_META = {
  website: { label: 'Agency website', placeholder: 'https://agency-website.com/listings', priority: 1 as const },
  madlan: { label: 'Madlan', placeholder: 'https://www.madlan.co.il/agentsOffice/re_office_...', priority: 2 as const },
  yad2: { label: 'Yad2', placeholder: 'https://www.yad2.co.il/realestate/agency/...', priority: 3 as const },
};

const getJobSourceLabel = (sourceType?: string | null) => {
  if (sourceType === 'madlan') return 'Madlan';
  if (sourceType === 'yad2') return 'Yad2';
  return 'Agency website';
};

const getImportTypeLabel = (importType?: string | null) => {
  if (importType === 'both' || importType === 'all') return 'Sale + rental';
  if (importType === 'rental') return 'Rental only';
  return 'Sale only';
};

/**
 * Embedded admin import tool — scoped to a single agency. Used inside the
 * Agency Provisioning workspace so admins can pull listings on behalf of the
 * agency currently being set up.
 */
export function ImportListingsSection({ agencyId, agencyName }: { agencyId: string; agencyName?: string }) {
  const [sourceUrls, setSourceUrls] = useState<Record<'website' | 'yad2' | 'madlan', string>>({
    website: '',
    yad2: '',
    madlan: '',
  });
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const { data: jobs = [] } = useImportJobs(agencyId);
  const { data: sources = [] } = useAgencySources(agencyId);
  const upsertSourcesMutation = useUpsertAgencySources();
  const syncAllSourcesMutation = useTriggerAgencySourcesSync();
  const syncOneSourceMutation = useTriggerSourceSync();
  const processBatchMutation = useProcessBatch();
  const deleteJobMutation = useDeleteImportJob();
  const retryFailedMutation = useRetryFailed();
  const retryRecoverableSkippedMutation = useRetryRecoverableSkipped();
  const resumeJobMutation = useResumeJob();
  const { startProcessAll, stopProcessAll, isProcessingAll, processingStartTime, processedSoFar } = useProcessAll();

  useEffect(() => {
    setSourceUrls({
      website: sources.find((source) => source.source_type === 'website')?.source_url || '',
      yad2: sources.find((source) => source.source_type === 'yad2')?.source_url || '',
      madlan: sources.find((source) => source.source_type === 'madlan')?.source_url || '',
    });
  }, [sources]);

  const activeSources = useMemo(
    () => sources.filter((source) => source.is_active && source.source_url),
    [sources]
  );

  const currentJob = jobs.length === 0
    ? undefined
    : activeJobId
      ? jobs.find(j => j.id === activeJobId)
      : jobs.find(j => ['discovering', 'ready', 'processing'].includes(j.status)) || jobs[0];

  const currentJobSourceLabel = getJobSourceLabel(currentJob?.source_type);
  const currentJobImportTypeLabel = getImportTypeLabel(currentJob?.import_type);
  const currentJobDiagnostics = useMemo(() => {
    if (!currentJob?.failure_reason) return null;
    try { return JSON.parse(currentJob.failure_reason) as Record<string, unknown>; }
    catch { return null; }
  }, [currentJob?.failure_reason]);

  const { data: jobItems = [] } = useImportJobItems(currentJob?.id);
  useRealtimeImportProgress(currentJob?.id);

  const handleSaveAndDiscover = async (e: React.FormEvent) => {
    e.preventDefault();
    const entries = (['website', 'madlan', 'yad2'] as const)
      .map((sourceType) => ({ source_type: sourceType, source_url: sourceUrls[sourceType].trim(), priority: SOURCE_META[sourceType].priority }))
      .filter((source) => source.source_url.length > 0);
    if (entries.length === 0) return;

    const savedSources = await upsertSourcesMutation.mutateAsync({
      agency_id: agencyId,
      sources: entries,
    });

    const results = await syncAllSourcesMutation.mutateAsync({ sources: savedSources, importType: 'both' });
    const firstJobId = results.find((result) => result.data?.job_id)?.data?.job_id;
    if (firstJobId) {
      setActiveJobId(firstJobId);
    }
  };

  const handleProcessBatch = () => {
    if (!currentJob?.id) return;
    processBatchMutation.mutate(currentJob.id);
  };

  const doneCount = jobItems.filter(i => i.status === 'done').length;
  const skippedCount = jobItems.filter(i => i.status === 'skipped').length;
  const failedCount = jobItems.filter(i => i.status === 'failed').length;
  const transientCount = jobItems.filter(i => i.status === 'failed' && i.error_type === 'transient').length;
  const permanentCount = jobItems.filter(i => i.status === 'failed' && i.error_type === 'permanent').length;
  const pendingCount = jobItems.filter(i => i.status === 'pending').length;
  const processingCount = jobItems.filter(i => i.status === 'processing').length;
  const totalItems = jobItems.length;
  const mergedCount = jobItems.filter(i => i.status === 'done' && /merged/i.test(i.error_message || '')).length;
  const flaggedCount = jobItems.filter(i => (i.extracted_data as any)?.provisioning_audit_status === 'flagged').length;
  const reasonBuckets = useMemo(() => {
    const classify = (message?: string | null) => {
      const text = (message || '').toLowerCase();
      if (text.includes('nan') || text.includes('malformed')) return 'Malformed URL';
      if (text.includes('timeout') || text.includes('network') || text.includes('rate') || text.includes('scrape failed') || text.includes('captcha')) return 'Fetch / blocked';
      if (text.includes('not a listing')) return 'Not a listing';
      if (text.includes('sold') || text.includes('rented')) return 'Sold / rented';
      if (text.includes('city not supported')) return 'Unsupported city';
      if (text.includes('validation failed')) return 'Validation failed';
      if (text.includes('low confidence')) return 'Low confidence';
      if (text.includes('duplicate') || text.includes('merged')) return 'Duplicate / merged';
      if (text.includes('too short') || text.includes('no extraction')) return 'Extraction incomplete';
      return 'Other';
    };
    return jobItems
      .filter((item) => ['skipped', 'failed'].includes(item.status))
      .reduce<Record<string, { count: number; samples: string[] }>>((acc, item) => {
        const key = classify(item.error_message);
        acc[key] ||= { count: 0, samples: [] };
        acc[key].count += 1;
        if (acc[key].samples.length < 2) acc[key].samples.push(item.url);
        return acc;
      }, {});
  }, [jobItems]);
  const recoverableSkippedCount = jobItems.filter((item) => {
    const message = item.error_message || '';
    return item.status === 'skipped' && item.error_type === 'permanent' && /Low confidence|Page content too short|AI returned no extraction data|Not a listing page|Pre-check timed out|Pre-check network error|malformed/i.test(message);
  }).length;

  const STALL_THRESHOLD_MS = 10 * 60 * 1000;
  const isStalled = currentJob?.status === 'processing' && !isProcessingAll && (() => {
    const heartbeat = (currentJob as any).last_heartbeat || (currentJob as any).updated_at;
    if (!heartbeat) return false;
    return Date.now() - new Date(heartbeat).getTime() > STALL_THRESHOLD_MS;
  })();

  const isBackgroundDiscovering = currentJob?.status === 'discovering';
  const isDiscovering = upsertSourcesMutation.isPending || syncAllSourcesMutation.isPending || syncOneSourceMutation.isPending || isBackgroundDiscovering;
  const isProcessing = processBatchMutation.isPending || (currentJob?.status === 'processing' && !isStalled) || isProcessingAll;
  const isReady = (currentJob?.status === 'ready' && pendingCount > 0) || isStalled;
  const isCompleted = currentJob?.status === 'completed';
  const discoveringSourceType = isBackgroundDiscovering ? currentJob?.source_type : undefined;

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Import listings</h2>
            <p className="text-sm text-muted-foreground">
              Pull listings from Yad2, Madlan, or {agencyName ?? 'their'} website on their behalf.
            </p>
          </div>
        </div>
      </div>

      {/* Discover */}
      <Card className="rounded-2xl border-primary/10">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent rounded-t-2xl">
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-5 w-5 text-primary" />
            Step 1: Add listing sources
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="rounded-xl border border-primary/15 bg-primary/5 p-3 text-xs text-muted-foreground">
            <strong className="text-foreground">Priority:</strong> Agency website is preferred for owned photos and listing content. Madlan and Yad2 enrich missing details, matching, and conflict checks.
          </div>

          <form onSubmit={handleSaveAndDiscover} className="space-y-3">
            {(['website', 'madlan', 'yad2'] as const).map((type) => (
              <div key={type} className="grid gap-1.5 md:grid-cols-[160px_1fr] md:items-center">
                <Label className="text-sm">{SOURCE_META[type].label}</Label>
                <Input
                  value={sourceUrls[type]}
                  onChange={(e) => setSourceUrls((prev) => ({ ...prev, [type]: e.target.value }))}
                  placeholder={SOURCE_META[type].placeholder}
                  className="rounded-xl"
                  disabled={isDiscovering}
                />
              </div>
            ))}

            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                type="submit"
                disabled={isDiscovering || !Object.values(sourceUrls).some((url) => url.trim())}
                className="rounded-xl"
              >
              {isDiscovering ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving and scanning...</>
              ) : (
                <><Globe className="h-4 w-4 mr-2" />Save sources + discover listings</>
              )}
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={isDiscovering || activeSources.length === 0}
                onClick={async () => {
                  const results = await syncAllSourcesMutation.mutateAsync({ sources: activeSources, importType: 'both' });
                  const firstJobId = results.find((result) => result.data?.job_id)?.data?.job_id;
                  if (firstJobId) setActiveJobId(firstJobId);
                }}
                className="rounded-xl"
              >
                <RefreshCw className={cn('h-4 w-4 mr-2', syncAllSourcesMutation.isPending && 'animate-spin')} />
                Discover from all active sources
              </Button>
            </div>
          </form>

          {sources.length > 0 && (
            <div className="space-y-2 border-t pt-3">
              <p className="text-xs font-medium text-muted-foreground">Saved sources</p>
              {sources.map((source) => (
                <div key={source.id} className="flex flex-col gap-2 rounded-xl border p-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{SOURCE_META[source.source_type].label}</Badge>
                      <Badge variant={source.is_active ? 'outline' : 'secondary'}>{source.is_active ? 'Active' : 'Paused'}</Badge>
                    </div>
                    <p className="truncate text-muted-foreground">{source.source_url}</p>
                    <p className="text-muted-foreground">
                      Last synced: {source.last_synced_at ? new Date(source.last_synced_at).toLocaleString() : 'Never'}
                      {source.last_failure_reason ? ` · ${source.last_failure_reason}` : ''}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isDiscovering}
                    onClick={() => syncOneSourceMutation.mutate({ source, importType: 'both' })}
                    className="rounded-lg sm:shrink-0"
                  >
                    <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', syncOneSourceMutation.isPending && 'animate-spin')} />
                    Sync
                  </Button>
                </div>
              ))}
            </div>
          )}

          {isDiscovering && (
            <p className="text-sm text-muted-foreground mt-3 animate-pulse">
              {discoveringSourceType === 'yad2'
                ? 'Scanning Yad2 agency page… This may take 2–5 minutes.'
                : discoveringSourceType === 'madlan'
                ? 'Scanning Madlan office page… This may take 2–5 minutes.'
                : 'Scanning website for listing pages… This may take 2–5 minutes.'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Import Progress */}
      {currentJob && (
        <Card className="rounded-2xl border-primary/10">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent rounded-t-2xl">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Download className="h-5 w-5 text-primary" />
                Step 2: Import listings
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl text-muted-foreground hover:text-destructive"
                disabled={deleteJobMutation.isPending}
                onClick={() => {
                  if (confirm('Delete this import job and all its items?')) {
                    deleteJobMutation.mutate(currentJob!.id);
                    setActiveJobId(null);
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-1 text-muted-foreground">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{currentJobSourceLabel}</Badge>
                  <Badge variant="outline">{currentJobImportTypeLabel}</Badge>
                  <span className="text-foreground font-medium">{currentJob.total_urls || totalItems} queued</span>
                </div>
                <p className="truncate">Source URL: <span className="text-foreground font-medium">{currentJob.website_url}</span></p>
                <p className="text-xs">These controls import this source job only, not every saved source at once.</p>
              </div>
              <Badge variant="outline" className={cn(
                isCompleted && 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]',
                isStalled && 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning-foreground))]',
                isDiscovering && 'bg-primary/10 text-primary animate-pulse',
                isProcessing && 'bg-primary/10 text-primary animate-pulse',
                isReady && !isStalled && 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning-foreground))]',
              )}>
                {(isDiscovering || isProcessing) && <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />}
                {isStalled ? 'Stalled' : currentJob.status}
              </Badge>
            </div>

            {isStalled && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(var(--warning))]/10 border border-[hsl(var(--warning))]/20">
                <AlertCircle className="h-4 w-4 text-[hsl(var(--warning-foreground))] shrink-0" />
                <p className="text-sm font-medium text-[hsl(var(--warning-foreground))] flex-1">
                  This import appears to have stalled.
                </p>
                <Button
                  onClick={() => resumeJobMutation.mutate(currentJob!.id)}
                  disabled={resumeJobMutation.isPending}
                  size="sm"
                  variant="outline"
                  className="shrink-0 rounded-lg"
                >
                  {resumeJobMutation.isPending ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1.5" />}
                  Resume
                </Button>
              </div>
            )}

            {isProcessingAll && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20"
              >
                <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                <p className="text-sm font-medium text-primary flex-1">Importing listings…</p>
                <Button onClick={stopProcessAll} variant="ghost" size="sm" className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg">
                  Stop
                </Button>
              </motion.div>
            )}

            <ImportProgressBar
              totalItems={totalItems}
              doneCount={doneCount}
              skippedCount={skippedCount}
              failedCount={failedCount}
              pendingCount={pendingCount}
              processingCount={processingCount}
              startTime={processingStartTime}
              processedSoFar={processedSoFar}
              isActive={isProcessingAll}
            />

            <div className="flex gap-3 flex-wrap">
              {(isReady || (isCompleted && pendingCount > 0)) && (
                <>
                  {isProcessingAll ? (
                    <Button onClick={stopProcessAll} variant="destructive" className="rounded-xl">
                      <XCircle className="h-4 w-4 mr-2" />Stop Import
                    </Button>
                  ) : (
                    <Button
                      onClick={() => startProcessAll(currentJob!.id)}
                      disabled={processBatchMutation.isPending}
                      className="rounded-xl"
                    >
                      {processBatchMutation.isPending ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
                      ) : (
                        <><Download className="h-4 w-4 mr-2" />Import All Remaining ({pendingCount})</>
                      )}
                    </Button>
                  )}

                  <Button onClick={handleProcessBatch} disabled={isProcessing} variant="outline" className="rounded-xl">
                    <Download className="h-4 w-4 mr-2" />
                    {doneCount + skippedCount + failedCount > 0 ? 'Next' : 'First'} Batch ({Math.min(pendingCount, 9)})
                  </Button>
                </>
              )}

              {failedCount > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => retryFailedMutation.mutate(currentJob!.id)}
                    disabled={retryFailedMutation.isPending || transientCount === 0}
                    className="rounded-xl"
                  >
                    {retryFailedMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Resetting...</>
                    ) : (
                      <><RefreshCw className="h-4 w-4 mr-2" />Retry ({transientCount})</>
                    )}
                  </Button>
                  {permanentCount > 0 && (
                    <span className="text-xs text-muted-foreground">{permanentCount} permanent</span>
                  )}
                </div>
              )}

              {recoverableSkippedCount > 0 && (
                <Button
                  variant="outline"
                  onClick={() => retryRecoverableSkippedMutation.mutate(currentJob!.id)}
                  disabled={retryRecoverableSkippedMutation.isPending}
                  className="rounded-xl"
                >
                  {retryRecoverableSkippedMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Resetting...</>
                  ) : (
                    <><RefreshCw className="h-4 w-4 mr-2" />Retry recoverable skipped ({recoverableSkippedCount})</>
                  )}
                </Button>
              )}

              {doneCount > 0 && (
                <div className="space-y-2">
                  <Button variant="outline" asChild className="rounded-xl">
                    <Link to="/admin/properties">
                      <FileText className="h-4 w-4 mr-2" />
                      View imported ({doneCount})
                    </Link>
                  </Button>
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs text-muted-foreground">
                    <ArrowLeftRight className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span><strong className="text-foreground">Next step:</strong> Assign imported listings to agents from the roster above, or jump to Admin → Properties.</span>
                  </div>
                </div>
              )}
            </div>

            {Object.keys(reasonBuckets).length > 0 && (
              <div className="grid gap-2 border-t pt-4 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(reasonBuckets).map(([reason, bucket]) => (
                  <div key={reason} className="rounded-xl border bg-muted/20 p-3 text-xs">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="font-medium text-foreground">{reason}</span>
                      <Badge variant="secondary">{bucket.count}</Badge>
                    </div>
                    <div className="space-y-1 text-muted-foreground">
                      {bucket.samples.map((url) => (
                        <p key={url} className="truncate">{url}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Job history */}
            {jobs.length > 1 && (
              <div className="border-t pt-4 mt-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">Previous jobs</p>
                <div className="space-y-1">
                  {jobs.filter(j => j.id !== currentJob?.id).map(j => (
                    <button
                      key={j.id}
                      onClick={() => setActiveJobId(j.id)}
                      className="w-full flex items-center justify-between gap-3 text-xs px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <span className="min-w-0 flex-1 truncate text-left">
                        <span className="font-medium text-foreground">{getJobSourceLabel(j.source_type)}</span>
                        <span className="text-muted-foreground"> · {getImportTypeLabel(j.import_type)} · {j.total_urls || 0} queued · {j.website_url}</span>
                      </span>
                      <Badge variant="outline" className="text-[10px] ml-2 shrink-0">{j.status}</Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!currentJob && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
          <span>
            <strong className="text-foreground">Tip:</strong> Paste the agency's Yad2 profile URL, Madlan office page,
            or their own website above and hit Discover. Active sale and rental listings are pulled; projects are skipped.
          </span>
        </div>
      )}
    </Card>
  );
}
