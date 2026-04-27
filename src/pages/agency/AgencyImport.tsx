import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Globe, Loader2, Download, CheckCircle2,
  XCircle, AlertCircle, FileText, RefreshCw, Trash2,
  Info, MinusCircle, ShieldAlert, ToggleLeft, Lightbulb, ArrowLeftRight,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useMyAgency, useAgencyStats } from '@/hooks/useAgencyManagement';
import { InfoBanner } from '@/components/tools/shared/InfoBanner';
import { EnhancedEmptyState } from '@/components/shared/EnhancedEmptyState';
import {
  useImportJobs,
  useImportJobItems,
  useDiscoverListings,
  useProcessBatch,
  useDeleteImportJob,
  useRetryFailed,
  useProcessAll,
  useUpdateAutoSync,
  useResumeJob,
} from '@/hooks/useImportListings';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useRealtimeImportProgress } from '@/hooks/useRealtimeImportProgress';
import { ImportProgressBar } from '@/components/agency/ImportProgressBar';

function normalizeUrl(raw: string): string {
  let url = raw.trim();
  if (!url.startsWith('http')) url = `https://${url}`;
  try {
    const parsed = new URL(url);
    parsed.hostname = parsed.hostname.toLowerCase();
    if (parsed.pathname.endsWith('/') && parsed.pathname.length > 1) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    return parsed.toString();
  } catch {
    return url.toLowerCase().replace(/\/+$/, '');
  }
}

export default function AgencyImport() {
  const { data: agency, isLoading: agencyLoading, isAgencyAdmin } = useMyAgency();
  const { data: stats } = useAgencyStats(agency?.id);
  const { data: jobs = [], isLoading: jobsLoading } = useImportJobs(agency?.id);
  const discoverMutation = useDiscoverListings();
  const processBatchMutation = useProcessBatch();
  const deleteJobMutation = useDeleteImportJob();
  const retryFailedMutation = useRetryFailed();
  const updateAutoSyncMutation = useUpdateAutoSync();
  const resumeJobMutation = useResumeJob();
  const { startProcessAll, stopProcessAll, isProcessingAll, processingStartTime, processedSoFar } = useProcessAll();
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [importType, setImportType] = useState<'resale' | 'rental' | 'all'>('all');
  const sourceType = 'website' as const;
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  // Use the most recent active job or the one selected
  const currentJob = jobs.length === 0
    ? undefined
    : activeJobId
      ? jobs.find(j => j.id === activeJobId)
      : jobs.find(j => ['discovering', 'ready', 'processing'].includes(j.status)) || jobs[0];

  const { data: jobItems = [] } = useImportJobItems(currentJob?.id);
  useRealtimeImportProgress(currentJob?.id);

  const handleDiscover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agency?.id || !websiteUrl.trim()) return;

    const result = await discoverMutation.mutateAsync({
      agencyId: agency.id,
      websiteUrl: websiteUrl.trim(),
      importType,
      sourceType,
    });

    // Only switch to job if one was created (new_urls > 0)
    if (result.job_id) {
      setActiveJobId(result.job_id);
    }
    setWebsiteUrl('');
  };

  const handleProcessBatch = () => {
    if (!currentJob?.id) return;
    processBatchMutation.mutate(currentJob.id);
  };

  if (agencyLoading || jobsLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (agency && !isAgencyAdmin) {
    return (
      <Layout>
        <div className="container py-16 max-w-lg">
          <EnhancedEmptyState
            icon={ShieldAlert}
            title="Admin access required"
            description="Only the agency admin can import listings."
            primaryAction={{ label: 'Back to Dashboard', href: '/agency' }}
          />
        </div>
      </Layout>
    );
  }

  if (!agency) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-2">No Agency Found</h1>
          <Button asChild><Link to="/agency/register">Register Agency</Link></Button>
        </div>
      </Layout>
    );
  }

  const doneCount = jobItems.filter(i => i.status === 'done').length;
  const skippedCount = jobItems.filter(i => i.status === 'skipped').length;
  const failedCount = jobItems.filter(i => i.status === 'failed').length;
  const transientCount = jobItems.filter(i => i.status === 'failed' && i.error_type === 'transient').length;
  const permanentCount = jobItems.filter(i => i.status === 'failed' && i.error_type === 'permanent').length;
  const pendingCount = jobItems.filter(i => i.status === 'pending').length;
  const processingCount = jobItems.filter(i => i.status === 'processing').length;
  const totalItems = jobItems.length;
  

  // Stall detection: job says 'processing' but no heartbeat for 30+ minutes
  const STALL_THRESHOLD_MS = 10 * 60 * 1000;
  const isStalled = currentJob?.status === 'processing' && !isProcessingAll && (() => {
    const heartbeat = (currentJob as any).last_heartbeat || (currentJob as any).updated_at;
    if (!heartbeat) return false;
    return Date.now() - new Date(heartbeat).getTime() > STALL_THRESHOLD_MS;
  })();

  const isBackgroundDiscovering = currentJob?.status === 'discovering';
  const isDiscovering = discoverMutation.isPending || isBackgroundDiscovering;
  const isProcessing = processBatchMutation.isPending || (currentJob?.status === 'processing' && !isStalled) || isProcessingAll;
  const isReady = (currentJob?.status === 'ready' && pendingCount > 0) || isStalled;
  const isCompleted = currentJob?.status === 'completed';
  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 0 + 1, y: 0 }} className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="rounded-xl">
              <Link to="/agency"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Import Listings</h1>
              <p className="text-muted-foreground">Import active sale and rental listings from your agency website</p>
            </div>
          </div>


          <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
            <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Active sale and rental listings are imported together. Projects and developments are always skipped — add those via the{' '}
              <Link to="/agency/projects/new" className="text-primary font-medium hover:underline">
                Project Wizard
              </Link>{' '}
              for best results.
            </p>
          </div>

          <Card className="rounded-2xl border-primary/10">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent rounded-t-2xl">
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Step 1: Discover Listings
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="text-sm text-muted-foreground space-y-2">
                <p>Paste your agency's <strong className="text-foreground">homepage URL</strong>.</p>
              </div>

              <form onSubmit={handleDiscover} className="flex flex-col sm:flex-row gap-3">
                <Input
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://your-agency-website.com"
                  className="rounded-xl flex-1"
                  required
                  disabled={isDiscovering}
                />
                <Button type="submit" disabled={isDiscovering || !websiteUrl.trim()} className="rounded-xl">
                  {isDiscovering ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4 mr-2" />
                      Discover
                    </>
                  )}
                </Button>
              </form>

              {isDiscovering && (
                <p className="text-sm text-muted-foreground mt-3 animate-pulse">
                  Scanning your website for listing pages... This may take 2-5 minutes.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Auto-Sync Toggle */}
          {agency && (
            <Card className="rounded-2xl border-primary/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Auto-Sync</h3>
                    <p className="text-xs text-muted-foreground">
                      Automatically check for new listings daily
                      {(agency as any).last_sync_at && (
                        <> · Last sync: {new Date((agency as any).last_sync_at).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                  <Switch
                    checked={(agency as any).auto_sync_enabled || false}
                    onCheckedChange={(checked) => {
                      updateAutoSyncMutation.mutate({
                        agencyId: agency.id,
                        enabled: checked,
                        url: (agency as any).auto_sync_url || agency.website || undefined,
                      });
                    }}
                    disabled={updateAutoSyncMutation.isPending || !(agency.website || (agency as any).auto_sync_url)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Import Progress */}
          {currentJob && (
            <Card className="rounded-2xl border-primary/10">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5 text-primary" />
                    Step 2: Import Listings
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
                {/* Job info */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Website: <span className="text-foreground font-medium">{currentJob.website_url}</span>
                  </span>
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

                {/* Stalled job warning + Resume button */}
                {isStalled && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(var(--warning))]/10 border border-[hsl(var(--warning))]/20">
                    <AlertCircle className="h-4 w-4 text-[hsl(var(--warning-foreground))] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[hsl(var(--warning-foreground))]">
                        This import appears to have stalled. Some items may be stuck in processing.
                      </p>
                    </div>
                    <Button
                      onClick={() => resumeJobMutation.mutate(currentJob!.id)}
                      disabled={resumeJobMutation.isPending}
                      size="sm"
                      variant="outline"
                      className="shrink-0 rounded-lg border-[hsl(var(--warning))]/30 text-[hsl(var(--warning-foreground))] hover:bg-[hsl(var(--warning))]/10"
                    >
                      {resumeJobMutation.isPending ? (
                        <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3 mr-1.5" />
                      )}
                      Resume
                    </Button>
                  </div>
                )}

                {/* Auto-import active indicator */}
                {isProcessingAll && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20"
                  >
                    <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary">
                        Importing listings…
                      </p>
                    </div>
                    <Button
                      onClick={stopProcessAll}
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                    >
                      Stop
                    </Button>
                  </motion.div>
                )}

                {/* Progress bar */}
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

                {/* Action buttons */}
                <div className="flex gap-3 flex-wrap">
                  {(isReady || (isCompleted && pendingCount > 0)) && (
                    <>
                      {/* Import All / Stop button */}
                      {isProcessingAll ? (
                        <Button
                          onClick={stopProcessAll}
                          variant="destructive"
                          className="rounded-xl"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Stop Import
                        </Button>
                      ) : (
                        <Button
                          onClick={() => startProcessAll(currentJob!.id)}
                          disabled={processBatchMutation.isPending}
                          className="rounded-xl"
                        >
                          {processBatchMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Import All Remaining ({pendingCount})
                            </>
                          )}
                        </Button>
                      )}

                      {/* Single batch button */}
                      <Button
                        onClick={handleProcessBatch}
                        disabled={isProcessing}
                        variant="outline"
                        className="rounded-xl"
                      >
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
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Resetting...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry ({transientCount})
                          </>
                        )}
                      </Button>
                      {permanentCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {permanentCount} permanent
                        </span>
                      )}
                    </div>
                  )}

                  {doneCount > 0 && (
                    <div className="space-y-2">
                      <Button variant="outline" asChild className="rounded-xl">
                        <Link to="/agency/listings">
                          <FileText className="h-4 w-4 mr-2" />
                          View Imported Drafts ({doneCount})
                        </Link>
                      </Button>
                      <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs text-muted-foreground">
                        <ArrowLeftRight className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        <span><strong className="text-foreground">Next step:</strong> Assign imported listings to your agents from the Listings table. Once assigned, agents can review, edit, and submit them for approval.</span>
                      </div>
                    </div>
                  )}
                </div>

                {isCompleted && pendingCount === 0 && (
                  <div className="p-4 rounded-xl bg-[hsl(var(--success))]/10 border border-[hsl(var(--success))]/20 text-sm">
                    <CheckCircle2 className="h-4 w-4 inline mr-2 text-[hsl(var(--success))]" />
                    Import complete! {doneCount} listings imported, {skippedCount} skipped{failedCount > 0 ? `, ${failedCount} failed` : ''}.
                    Review and publish them from your Listings page.
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        </motion.div>
      </div>
    </Layout>
  );
}
