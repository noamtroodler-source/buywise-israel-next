import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Loader2, CheckCircle2, XCircle, AlertTriangle,
  Filter, SkipForward, ImageOff, AlertCircle, Copy,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMyAgency } from '@/hooks/useAgencyManagement';
import {
  useImportJobItems,
  useImportJobs,
  useApproveItem,
  useSkipItem,
  ImportJobItem,
} from '@/hooks/useImportListings';
import { ImportReviewCard } from '@/components/agency/ImportReviewCard';
import { useRealtimeImportProgress } from '@/hooks/useRealtimeImportProgress';

type FilterTab = 'all' | 'pending' | 'done' | 'failed' | 'low_confidence' | 'no_photos' | 'duplicates';

export default function AgencyImportReview() {
  const { jobId } = useParams<{ jobId: string }>();
  const { data: agency, isLoading: agencyLoading } = useMyAgency();
  const { data: jobs = [] } = useImportJobs(agency?.id);
  const { data: items = [], isLoading: itemsLoading } = useImportJobItems(jobId);
  const approveMutation = useApproveItem();
  const skipMutation = useSkipItem();
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const job = jobs.find(j => j.id === jobId);

  const getConfidence = (i: ImportJobItem) => i.confidence_score ?? i.extracted_data?.confidence_score ?? 0;
  const getPhotoCount = (i: ImportJobItem) => i.extracted_data?.image_urls?.length || 0;
  const hasDuplicate = (i: ImportJobItem) => !!i.extracted_data?.cross_source_match_id;

  const filteredItems = useMemo(() => {
    switch (filterTab) {
      case 'pending': return items.filter(i => ['pending', 'processing'].includes(i.status));
      case 'done': return items.filter(i => i.status === 'done');
      case 'failed': return items.filter(i => ['failed', 'skipped'].includes(i.status));
      case 'low_confidence': return items.filter(i => i.status === 'pending' && getConfidence(i) < 60);
      case 'no_photos': return items.filter(i => i.status === 'pending' && getPhotoCount(i) === 0);
      case 'duplicates': return items.filter(i => hasDuplicate(i));
      default: return items;
    }
  }, [items, filterTab]);

  const counts = useMemo(() => ({
    all: items.length,
    pending: items.filter(i => ['pending', 'processing'].includes(i.status)).length,
    done: items.filter(i => i.status === 'done').length,
    failed: items.filter(i => ['failed', 'skipped'].includes(i.status)).length,
    low_confidence: items.filter(i => i.status === 'pending' && getConfidence(i) < 60).length,
    no_photos: items.filter(i => i.status === 'pending' && getPhotoCount(i) === 0).length,
    duplicates: items.filter(i => hasDuplicate(i)).length,
  }), [items]);

  const handleApprove = (item: ImportJobItem, editedData?: any) => {
    const data = editedData || item.extracted_data;
    approveMutation.mutate({ itemId: item.id, extractedData: data });
  };

  const handleSkip = (item: ImportJobItem) => {
    skipMutation.mutate(item.id);
  };

  const handleBulkApprove = () => {
    const highConfidence = items.filter(
      i => i.status === 'pending' && getConfidence(i) >= 80
    );
    if (highConfidence.length === 0) return;
    for (const item of highConfidence) {
      approveMutation.mutate({ itemId: item.id, extractedData: item.extracted_data });
    }
  };

  const handleBulkSkipLow = () => {
    const lowConfidence = items.filter(
      i => i.status === 'pending' && getConfidence(i) < 40
    );
    if (lowConfidence.length === 0) return;
    for (const item of lowConfidence) {
      skipMutation.mutate(item.id);
    }
  };

  if (agencyLoading || itemsLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const highConfidenceCount = items.filter(
    i => i.status === 'pending' && getConfidence(i) >= 80
  ).length;

  const lowConfidenceCount = items.filter(
    i => i.status === 'pending' && getConfidence(i) < 40
  ).length;

  return (
    <Layout>
      <div className="container py-8 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="rounded-xl">
              <Link to="/agency/import"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Review Imported Listings</h1>
              {job && (
                <p className="text-muted-foreground text-sm">
                  {job.website_url} · {items.length} items
                </p>
              )}
            </div>
          </div>

          {/* Stats + Bulk Actions */}
          <Card className="rounded-2xl border-primary/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{counts.done}</p>
                    <p className="text-xs text-muted-foreground">Approved</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">{counts.pending}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-500">{counts.failed}</p>
                    <p className="text-xs text-muted-foreground">Failed/Skipped</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {highConfidenceCount > 0 && (
                    <Button
                      onClick={handleBulkApprove}
                      disabled={approveMutation.isPending}
                      className="rounded-xl"
                      size="sm"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approve High Confidence ({highConfidenceCount})
                    </Button>
                  )}
                  {lowConfidenceCount > 0 && (
                    <Button
                      onClick={handleBulkSkipLow}
                      disabled={skipMutation.isPending}
                      variant="outline"
                      className="rounded-xl"
                      size="sm"
                    >
                      <SkipForward className="h-4 w-4 mr-2" />
                      Skip Low Confidence ({lowConfidenceCount})
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filter Tabs */}
          <Tabs value={filterTab} onValueChange={(v) => setFilterTab(v as FilterTab)}>
            <TabsList className="rounded-xl flex-wrap h-auto gap-1 p-1">
              <TabsTrigger value="all" className="rounded-lg text-xs">All ({counts.all})</TabsTrigger>
              <TabsTrigger value="pending" className="rounded-lg text-xs">Pending ({counts.pending})</TabsTrigger>
              <TabsTrigger value="done" className="rounded-lg text-xs">Approved ({counts.done})</TabsTrigger>
              <TabsTrigger value="failed" className="rounded-lg text-xs">Failed ({counts.failed})</TabsTrigger>
              {counts.low_confidence > 0 && (
                <TabsTrigger value="low_confidence" className="rounded-lg text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Low Conf ({counts.low_confidence})
                </TabsTrigger>
              )}
              {counts.no_photos > 0 && (
                <TabsTrigger value="no_photos" className="rounded-lg text-xs">
                  <ImageOff className="h-3 w-3 mr-1" />
                  No Photos ({counts.no_photos})
                </TabsTrigger>
              )}
              {counts.duplicates > 0 && (
                <TabsTrigger value="duplicates" className="rounded-lg text-xs">
                  <Copy className="h-3 w-3 mr-1" />
                  Duplicates ({counts.duplicates})
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>

          {/* Items List */}
          <div className="space-y-4">
            {filteredItems.length === 0 && (
              <Card className="rounded-2xl">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No items match this filter</p>
                </CardContent>
              </Card>
            )}
            {filteredItems.map(item => (
              <ImportReviewCard
                key={item.id}
                item={item}
                isExpanded={expandedItemId === item.id}
                onToggle={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
                onApprove={(editedData) => handleApprove(item, editedData)}
                onSkip={() => handleSkip(item)}
                isApproving={approveMutation.isPending}
                isSkipping={skipMutation.isPending}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
