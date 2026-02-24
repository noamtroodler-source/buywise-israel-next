import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Globe, Loader2, Download, CheckCircle2,
  XCircle, AlertCircle, FileText, RefreshCw,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useMyAgency } from '@/hooks/useAgencyManagement';
import {
  useImportJobs,
  useImportJobItems,
  useDiscoverListings,
  useProcessBatch,
} from '@/hooks/useImportListings';
import { cn } from '@/lib/utils';

export default function AgencyImport() {
  const { data: agency, isLoading: agencyLoading } = useMyAgency();
  const { data: jobs = [], isLoading: jobsLoading } = useImportJobs(agency?.id);
  const discoverMutation = useDiscoverListings();
  const processBatchMutation = useProcessBatch();

  const [websiteUrl, setWebsiteUrl] = useState('');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  // Use the most recent active job or the one selected
  const currentJob = activeJobId
    ? jobs.find(j => j.id === activeJobId)
    : jobs.find(j => ['discovering', 'ready', 'processing'].includes(j.status)) || jobs[0];

  const { data: jobItems = [] } = useImportJobItems(currentJob?.id);

  const handleDiscover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agency?.id || !websiteUrl.trim()) return;

    const result = await discoverMutation.mutateAsync({
      agencyId: agency.id,
      websiteUrl: websiteUrl.trim(),
    });

    setActiveJobId(result.job_id);
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
  const failedCount = jobItems.filter(i => ['failed', 'skipped'].includes(i.status)).length;
  const pendingCount = jobItems.filter(i => i.status === 'pending').length;
  const processingCount = jobItems.filter(i => i.status === 'processing').length;
  const totalItems = jobItems.length;
  const progressPercent = totalItems > 0 ? Math.round(((doneCount + failedCount) / totalItems) * 100) : 0;

  const isDiscovering = discoverMutation.isPending;
  const isProcessing = processBatchMutation.isPending || currentJob?.status === 'processing';
  const isReady = currentJob?.status === 'ready' && pendingCount > 0;
  const isCompleted = currentJob?.status === 'completed';

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="rounded-xl">
              <Link to="/agency"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Import Listings</h1>
              <p className="text-muted-foreground">Import property listings from your website automatically</p>
            </div>
          </div>

          {/* Step 1: Discover */}
          <Card className="rounded-2xl border-primary/10">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent rounded-t-2xl">
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Step 1: Discover Listings
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Paste your agency website URL. We'll scan it and find all property listing pages automatically.
              </p>
              <form onSubmit={handleDiscover} className="flex gap-3">
                <Input
                  type="url"
                  value={websiteUrl}
                  onChange={e => setWebsiteUrl(e.target.value)}
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
                  Scanning your website for listing pages... This may take 30-60 seconds.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Import Progress */}
          {currentJob && (
            <Card className="rounded-2xl border-primary/10">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent rounded-t-2xl">
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-primary" />
                  Step 2: Import Listings
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* Job info */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Source: <span className="text-foreground font-medium">{currentJob.website_url}</span>
                  </span>
                  <Badge variant="outline" className={cn(
                    isCompleted && 'bg-green-500/10 text-green-600',
                    isProcessing && 'bg-blue-500/10 text-blue-600',
                    isReady && 'bg-yellow-500/10 text-yellow-600',
                  )}>
                    {currentJob.status}
                  </Badge>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>{doneCount + failedCount} of {totalItems} processed</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <Progress value={progressPercent} className="h-3" />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Imported', value: doneCount, icon: CheckCircle2, color: 'text-green-600' },
                    { label: 'Failed', value: failedCount, icon: XCircle, color: 'text-red-500' },
                    { label: 'Pending', value: pendingCount, icon: AlertCircle, color: 'text-yellow-600' },
                    { label: 'Processing', value: processingCount, icon: RefreshCw, color: 'text-blue-500' },
                  ].map(stat => (
                    <div key={stat.label} className="text-center p-3 rounded-xl bg-muted/30">
                      <stat.icon className={cn('h-4 w-4 mx-auto mb-1', stat.color)} />
                      <p className="text-lg font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  {(isReady || (isCompleted && pendingCount > 0)) && (
                    <Button
                      onClick={handleProcessBatch}
                      disabled={isProcessing}
                      className="rounded-xl"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing Batch...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Import Next Batch ({Math.min(pendingCount, 10)} listings)
                        </>
                      )}
                    </Button>
                  )}

                  {doneCount > 0 && (
                    <Button variant="outline" asChild className="rounded-xl">
                      <Link to="/agency/listings">
                        <FileText className="h-4 w-4 mr-2" />
                        View Imported Drafts
                      </Link>
                    </Button>
                  )}
                </div>

                {isCompleted && pendingCount === 0 && (
                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-sm">
                    <CheckCircle2 className="h-4 w-4 inline mr-2 text-green-600" />
                    Import complete! {doneCount} listings imported as drafts.
                    Review and publish them from your Listings page.
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Past Jobs */}
          {jobs.length > 1 && (
            <Card className="rounded-2xl border-primary/10">
              <CardHeader>
                <CardTitle className="text-lg">Past Imports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {jobs.map(job => (
                    <button
                      key={job.id}
                      onClick={() => setActiveJobId(job.id)}
                      className={cn(
                        'w-full text-left p-3 rounded-xl border transition-colors',
                        currentJob?.id === job.id
                          ? 'border-primary/30 bg-primary/5'
                          : 'border-border hover:bg-muted/30'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium truncate">{job.website_url}</p>
                          <p className="text-xs text-muted-foreground">
                            {job.processed_count} imported · {new Date(job.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">{job.status}</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
