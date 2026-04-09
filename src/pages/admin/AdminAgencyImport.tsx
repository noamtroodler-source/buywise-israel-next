import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Globe, Loader2, Download, CheckCircle2,
  XCircle, AlertCircle, FileText, RefreshCw, Trash2,
  Info, Building, ArrowLeftRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InfoBanner } from '@/components/tools/shared/InfoBanner';
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
import { useRealtimeImportProgress } from '@/hooks/useRealtimeImportProgress';
import { ImportProgressBar } from '@/components/agency/ImportProgressBar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

export default function AdminAgencyImport() {
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [importType, setImportType] = useState<'resale' | 'rental' | 'all'>('all');
  const [sourceType, setSourceType] = useState<'website' | 'yad2' | 'madlan'>('website');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  // Fetch all agencies for the dropdown
  const { data: agencies = [], isLoading: agenciesLoading } = useQuery({
    queryKey: ['admin-agencies-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agencies')
        .select('id, name, slug, logo_url, auto_sync_url')
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  const selectedAgency = agencies.find(a => a.id === selectedAgencyId);

  const { data: jobs = [], isLoading: jobsLoading } = useImportJobs(selectedAgencyId || undefined);
  const discoverMutation = useDiscoverListings();
  const processBatchMutation = useProcessBatch();
  const deleteJobMutation = useDeleteImportJob();
  const retryFailedMutation = useRetryFailed();
  const updateAutoSyncMutation = useUpdateAutoSync();
  const resumeJobMutation = useResumeJob();
  const { startProcessAll, stopProcessAll, isProcessingAll, processingStartTime, processedSoFar } = useProcessAll();

  const currentJob = jobs.length === 0
    ? undefined
    : activeJobId
      ? jobs.find(j => j.id === activeJobId)
      : jobs.find(j => ['discovering', 'ready', 'processing'].includes(j.status)) || jobs[0];

  const { data: jobItems = [] } = useImportJobItems(currentJob?.id);
  useRealtimeImportProgress(currentJob?.id);

  const handleDiscover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgencyId || !websiteUrl.trim()) return;

    const result = await discoverMutation.mutateAsync({
      agencyId: selectedAgencyId,
      websiteUrl: websiteUrl.trim(),
      importType,
      sourceType,
    });

    if (result.job_id) {
      setActiveJobId(result.job_id);
    }
    setWebsiteUrl('');
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
  const discoveringSourceType = isBackgroundDiscovering ? currentJob?.source_type : sourceType;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Import Listings (Admin)</h2>
        <p className="text-muted-foreground text-sm">Import listings on behalf of any agency</p>
      </div>

      {/* Agency Selector */}
      <Card className="rounded-2xl border-primary/10">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent rounded-t-2xl">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building className="h-5 w-5 text-primary" />
            Select Agency
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {agenciesLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading agencies...
            </div>
          ) : (
            <Select value={selectedAgencyId} onValueChange={setSelectedAgencyId}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Choose an agency..." />
              </SelectTrigger>
              <SelectContent>
                {agencies.map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {selectedAgency && (
            <p className="text-xs text-muted-foreground mt-2">
              ID: <code className="text-[10px]">{selectedAgency.id}</code>
              {selectedAgency.auto_sync_url && (
                <> · Auto-sync: {selectedAgency.auto_sync_url}</>
              )}
            </p>
          )}
        </CardContent>
      </Card>

      {!selectedAgencyId && (
        <InfoBanner variant="tip">Select an agency above to start importing listings on their behalf.</InfoBanner>
      )}

      {selectedAgencyId && (
        <>
          {/* Discover */}
          <Card className="rounded-2xl border-primary/10">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent rounded-t-2xl">
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="h-5 w-5 text-primary" />
                Step 1: Discover Listings
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                {(['website', 'yad2', 'madlan'] as const).map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={sourceType === type ? 'default' : 'outline'}
                    size="sm"
                    className="rounded-lg"
                    onClick={() => setSourceType(type)}
                  >
                    {type === 'website' ? 'Agency Website' : type === 'yad2' ? 'Yad2' : 'Madlan'}
                  </Button>
                ))}
              </div>

              <form onSubmit={handleDiscover} className="flex flex-col sm:flex-row gap-3">
                <Input
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder={sourceType === 'yad2' ? 'https://www.yad2.co.il/realestate/agency/...' : sourceType === 'madlan' ? 'https://www.madlan.co.il/for-sale/israel--office--...' : 'https://agency-website.com'}
                  className="rounded-xl flex-1"
                  required
                  disabled={isDiscovering}
                />
                <Button type="submit" disabled={isDiscovering || !websiteUrl.trim()} className="rounded-xl">
                  {isDiscovering ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Scanning...</>
                  ) : (
                    <><Globe className="h-4 w-4 mr-2" />Discover</>
                  )}
                </Button>
              </form>

              {isDiscovering && (
                <p className="text-sm text-muted-foreground mt-3 animate-pulse">
                  {discoveringSourceType === 'yad2' || discoveringSourceType === 'madlan'
                    ? 'Scanning Yad2 agency page... This may take 2-5 minutes.'
                    : 'Scanning website for listing pages... This may take 2-5 minutes.'}
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
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Source: <span className="text-foreground font-medium">{currentJob.website_url}</span>
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

                  {doneCount > 0 && (
                    <div className="space-y-2">
                      <Button variant="outline" asChild className="rounded-xl">
                        <Link to="/admin/properties">
                          <FileText className="h-4 w-4 mr-2" />
                          View Imported ({doneCount})
                        </Link>
                      </Button>
                      <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs text-muted-foreground">
                        <ArrowLeftRight className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        <span><strong className="text-foreground">Next step:</strong> Assign imported listings to agents from Admin → Properties.</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Job history */}
                {jobs.length > 1 && (
                  <div className="border-t pt-4 mt-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Previous Jobs</p>
                    <div className="space-y-1">
                      {jobs.filter(j => j.id !== currentJob?.id).map(j => (
                        <button
                          key={j.id}
                          onClick={() => setActiveJobId(j.id)}
                          className="w-full flex items-center justify-between text-xs px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <span className="truncate">{j.website_url}</span>
                          <Badge variant="outline" className="text-[10px] ml-2">{j.status}</Badge>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
