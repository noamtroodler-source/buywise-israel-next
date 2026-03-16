import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Loader2, CheckCircle2, XCircle, AlertTriangle,
  ExternalLink, Eye, Filter,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMyAgency } from '@/hooks/useAgencyManagement';
import {
  useImportJobItems,
  useImportJobs,
  useApproveItem,
  ImportJobItem,
} from '@/hooks/useImportListings';
import { ImportReviewCard } from '@/components/agency/ImportReviewCard';
import { cn } from '@/lib/utils';

type FilterTab = 'all' | 'pending' | 'done' | 'failed';

export default function AgencyImportReview() {
  const { jobId } = useParams<{ jobId: string }>();
  const { data: agency, isLoading: agencyLoading } = useMyAgency();
  const { data: jobs = [] } = useImportJobs(agency?.id);
  const { data: items = [], isLoading: itemsLoading } = useImportJobItems(jobId);
  const approveMutation = useApproveItem();
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const job = jobs.find(j => j.id === jobId);

  const filteredItems = useMemo(() => {
    switch (filterTab) {
      case 'pending': return items.filter(i => ['pending', 'processing'].includes(i.status));
      case 'done': return items.filter(i => i.status === 'done');
      case 'failed': return items.filter(i => ['failed', 'skipped'].includes(i.status));
      default: return items;
    }
  }, [items, filterTab]);

  const counts = useMemo(() => ({
    all: items.length,
    pending: items.filter(i => ['pending', 'processing'].includes(i.status)).length,
    done: items.filter(i => i.status === 'done').length,
    failed: items.filter(i => ['failed', 'skipped'].includes(i.status)).length,
  }), [items]);

  const handleApprove = (item: ImportJobItem, editedData?: any) => {
    const data = editedData || item.extracted_data;
    approveMutation.mutate({ itemId: item.id, extractedData: data });
  };

  const handleBulkApprove = () => {
    const highConfidence = items.filter(
      i => i.status === 'pending' && (i.confidence_score ?? i.extracted_data?.confidence_score ?? 0) >= 80
    );
    if (highConfidence.length === 0) return;
    for (const item of highConfidence) {
      approveMutation.mutate({ itemId: item.id, extractedData: item.extracted_data });
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
    i => i.status === 'pending' && (i.confidence_score ?? i.extracted_data?.confidence_score ?? 0) >= 80
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
                {highConfidenceCount > 0 && (
                  <Button
                    onClick={handleBulkApprove}
                    disabled={approveMutation.isPending}
                    className="rounded-xl"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve All High Confidence ({highConfidenceCount})
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Filter Tabs */}
          <Tabs value={filterTab} onValueChange={(v) => setFilterTab(v as FilterTab)}>
            <TabsList className="rounded-xl">
              <TabsTrigger value="all" className="rounded-lg">All ({counts.all})</TabsTrigger>
              <TabsTrigger value="pending" className="rounded-lg">Pending ({counts.pending})</TabsTrigger>
              <TabsTrigger value="done" className="rounded-lg">Approved ({counts.done})</TabsTrigger>
              <TabsTrigger value="failed" className="rounded-lg">Failed ({counts.failed})</TabsTrigger>
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
                isApproving={approveMutation.isPending}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
