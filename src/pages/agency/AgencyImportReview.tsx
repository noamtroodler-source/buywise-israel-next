import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Loader2, CheckCircle2, XCircle, AlertTriangle,
  ExternalLink, ChevronDown,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useMyAgency } from '@/hooks/useAgencyManagement';
import {
  useImportJobItems,
  useImportJobs,
  useResolveDuplicateReview,
} from '@/hooks/useImportListings';
import { useRealtimeImportProgress } from '@/hooks/useRealtimeImportProgress';

const decisionLabels: Record<string, string> = {
  exact_source_match: 'Source duplicate',
  high_confidence_same_unit: 'Same unit likely',
  possible_same_unit: 'Possible same unit',
  same_building_likely_different_unit: 'Same building, different unit',
  same_building_insufficient_unit_evidence: 'Same building, needs review',
  no_match: 'No duplicate match',
};

const reasonLabels: Record<string, string> = {
  same_building_key: 'Same building key',
  same_building_strong: 'Strong building match',
  same_unit_possible: 'Possible unit match',
  same_unit_strong: 'Strong unit match',
  same_floor: 'Same floor',
  different_floor: 'Different floor',
  same_apartment_number: 'Same apartment number',
  different_apartment_number: 'Different apartment number',
  missing_apartment_number: 'Missing apartment number',
  incoming_missing_apartment_number: 'Incoming missing apartment number',
  size_within_3_sqm: 'Size within 3 sqm',
  size_within_7_sqm: 'Size within 7 sqm',
  bedrooms_match: 'Bedrooms match',
  price_within_3_percent: 'Price within 3%',
  quarantined_for_duplicate_review: 'Held for duplicate review',
};

function labelize(value?: string | null) {
  if (!value) return 'Unknown';
  return reasonLabels[value] || decisionLabels[value] || value.replace(/^band_/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function AgencyImportReview() {
  const { jobId } = useParams<{ jobId: string }>();
  const { data: agency, isLoading: agencyLoading } = useMyAgency();
  const { data: jobs = [] } = useImportJobs(agency?.id);
  const { data: items = [], isLoading: itemsLoading } = useImportJobItems(jobId);
  const resolveDuplicateReview = useResolveDuplicateReview();
  useRealtimeImportProgress(jobId);

  const job = jobs.find(j => j.id === jobId);

  if (agencyLoading || itemsLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const doneCount = items.filter(i => i.status === 'done').length;
  const failedCount = items.filter(i => i.status === 'failed').length;
  const skippedCount = items.filter(i => i.status === 'skipped').length;
  const pendingCount = items.filter(i => ['pending', 'processing'].includes(i.status)).length;
  const failedItems = items.filter(i => i.status === 'failed');
  const duplicateReviewItems = items.filter(i => i.status === 'needs_duplicate_review' || i.duplicate_review_required);

  return (
    <Layout>
      <div className="container py-8 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="rounded-xl">
              <Link to="/agency/import"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Import Summary</h1>
              {job && (
                <p className="text-muted-foreground text-sm">{job.website_url}</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="rounded-2xl border-primary/10">
              <CardContent className="p-4 text-center">
                <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto mb-1" />
                <p className="text-2xl font-bold">{doneCount}</p>
                <p className="text-xs text-muted-foreground">Imported as Drafts</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-primary/10">
              <CardContent className="p-4 text-center">
                <XCircle className="h-5 w-5 text-red-500 mx-auto mb-1" />
                <p className="text-2xl font-bold">{failedCount}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-primary/10">
              <CardContent className="p-4 text-center">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
                <p className="text-2xl font-bold">{skippedCount}</p>
                <p className="text-xs text-muted-foreground">Skipped</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-primary/10">
              <CardContent className="p-4 text-center">
                <Loader2 className={`h-5 w-5 mx-auto mb-1 text-muted-foreground ${pendingCount > 0 ? 'animate-spin text-primary' : ''}`} />
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Remaining</p>
              </CardContent>
            </Card>
          </div>

          {duplicateReviewItems.length > 0 && (
            <Card className="rounded-2xl border-[hsl(var(--warning))]/20 bg-[hsl(var(--warning))]/5">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-[hsl(var(--warning-foreground))] mt-0.5" />
                  <div>
                    <h2 className="font-semibold">{duplicateReviewItems.length} listing{duplicateReviewItems.length !== 1 ? 's' : ''} need duplicate review</h2>
                    <p className="text-sm text-muted-foreground">These were held because the system found possible same-unit evidence.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {duplicateReviewItems.map(item => (
                    <div key={item.id} className="rounded-xl border border-border bg-background p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <p className="truncate font-mono text-xs text-muted-foreground">{item.url}</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">{labelize(item.duplicate_decision_band)}</Badge>
                            {item.matched_property_id && <Badge variant="secondary">Match: {item.matched_property_id.slice(0, 8)}</Badge>}
                          </div>
                        </div>
                        <Button size="sm" variant="outline" asChild className="shrink-0 rounded-lg">
                          <a href={item.url} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" /></a>
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(item.duplicate_reason_codes || []).slice(0, 8).map(code => (
                          <Badge key={code} variant="secondary" className="text-xs">{labelize(code)}</Badge>
                        ))}
                      </div>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <Button size="sm" className="rounded-lg" disabled={resolveDuplicateReview.isPending} onClick={() => resolveDuplicateReview.mutate({ itemId: item.id, resolution: 'approved_create_separate' })}>
                          Create separate
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-lg" disabled={resolveDuplicateReview.isPending} onClick={() => resolveDuplicateReview.mutate({ itemId: item.id, resolution: 'confirmed_same_building_different_unit' })}>
                          Same building, different unit
                        </Button>
                        <Button size="sm" variant="ghost" className="rounded-lg" disabled={resolveDuplicateReview.isPending} onClick={() => resolveDuplicateReview.mutate({ itemId: item.id, resolution: 'needs_more_info' })}>
                          Needs more info
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Primary CTA */}
          {doneCount > 0 && (
            <Card className="rounded-2xl border-green-500/20 bg-green-500/5">
              <CardContent className="p-6 text-center space-y-3">
                <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto" />
                <div>
                  <p className="font-semibold text-lg">
                    {doneCount} listing{doneCount !== 1 ? 's' : ''} imported as drafts
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Review and edit them in your listings page using the property wizard, then submit for review when ready.
                  </p>
                </div>
                <Button asChild className="rounded-xl" size="lg">
                  <Link to="/agency/listings">
                    Go to Listings
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Failed items (collapsible) */}
          {failedItems.length > 0 && (
            <Collapsible>
              <Card className="rounded-2xl border-red-500/10">
                <CollapsibleTrigger asChild>
                  <CardContent className="p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="font-medium text-sm">
                          {failedItems.length} failed item{failedItems.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-2">
                    {failedItems.map(item => (
                      <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-muted-foreground font-mono text-xs">{item.url}</p>
                          <p className="text-red-600 mt-0.5">{item.error_message || 'Unknown error'}</p>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {item.error_type || 'error'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Back to import link */}
          <div className="text-center">
            <Button variant="ghost" asChild className="rounded-xl text-muted-foreground">
              <Link to="/agency/import">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Import
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
