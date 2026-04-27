/**
 * AgencyConflicts — /agency/conflicts
 * Lets agency admins review imported fields where saved and incoming values
 * disagree. The agency picks which value wins, or dismisses the conflict.
 */
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, CheckCircle2, X, Loader2, ShieldCheck, ShieldOff } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useMyAgency } from '@/hooks/useAgencyManagement';
import { useImportConflicts, useResolveConflict, useDismissConflict, type ImportConflict } from '@/hooks/useImportConflicts';
import { CrossAgencyConflictsList } from '@/components/agency/CrossAgencyConflictsList';
import { AgencyBlocklistPanel } from '@/components/agency/AgencyBlocklistPanel';
import { formatDistanceToNow } from 'date-fns';

const SOURCE_LABEL: Record<string, string> = {
  yad2: 'Imported value',
  madlan: 'Imported value',
  website_scrape: 'Website',
  website: 'Website',
};

const SOURCE_TONE: Record<string, string> = {
  yad2: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  madlan: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
  website_scrape: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  website: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
};

function formatValue(field: string, val: any): string {
  if (val == null) return '—';
  if (typeof val === 'object') return JSON.stringify(val);
  if (field === 'price' && typeof val === 'number') return `₪${val.toLocaleString()}`;
  if (field === 'size_sqm' && typeof val === 'number') return `${val} m²`;
  return String(val);
}

function ConflictRow({ conflict }: { conflict: ImportConflict }) {
  const resolve = useResolveConflict();
  const dismiss = useDismissConflict();
  const isResolving = resolve.isPending || dismiss.isPending;

  const handleResolve = (winning: 'existing' | 'incoming') => {
    const value = winning === 'existing' ? conflict.existing_value : conflict.incoming_value;
    const source = (winning === 'existing' ? conflict.existing_source : conflict.incoming_source) || 'unknown';
    resolve.mutate({
      conflictId: conflict.id,
      propertyId: conflict.property_id,
      fieldName: conflict.field_name,
      winningValue: value,
      winningSource: source,
    });
  };

  return (
    <Card className="rounded-2xl border-amber-500/20">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <Link
              to={`/agency/properties/${conflict.property_id}/edit`}
              className="font-semibold hover:underline truncate block"
            >
              {conflict.property?.title || 'Untitled property'}
            </Link>
            <p className="text-xs text-muted-foreground">
              {conflict.property?.city} · {conflict.property?.address || 'No address'}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(conflict.created_at), { addSuffix: true })}
            </p>
            {conflict.diff_percent != null && (
              <Badge variant="outline" className="mt-1 bg-amber-500/10 text-amber-700 border-amber-500/30 text-[10px]">
                {conflict.diff_percent.toFixed(1)}% difference
              </Badge>
            )}
          </div>
        </div>

        <div className="mb-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Conflicting field</p>
          <p className="font-mono text-sm">{conflict.field_name}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Existing value */}
          <div className="rounded-xl border border-border p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Currently saved</span>
              {conflict.existing_source && (
                <Badge variant="outline" className={SOURCE_TONE[conflict.existing_source] || ''}>
                  {SOURCE_LABEL[conflict.existing_source] || conflict.existing_source}
                </Badge>
              )}
            </div>
            <p className="text-lg font-semibold mb-3">{formatValue(conflict.field_name, conflict.existing_value)}</p>
            <Button
              size="sm"
              variant="outline"
              className="w-full rounded-lg"
              disabled={isResolving}
              onClick={() => handleResolve('existing')}
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Keep this
            </Button>
          </div>

          {/* Incoming value */}
          <div className="rounded-xl border border-border p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">New from import</span>
              {conflict.incoming_source && (
                <Badge variant="outline" className={SOURCE_TONE[conflict.incoming_source] || ''}>
                  {SOURCE_LABEL[conflict.incoming_source] || conflict.incoming_source}
                </Badge>
              )}
            </div>
            <p className="text-lg font-semibold mb-3">{formatValue(conflict.field_name, conflict.incoming_value)}</p>
            <Button
              size="sm"
              className="w-full rounded-lg"
              disabled={isResolving}
              onClick={() => handleResolve('incoming')}
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Use this instead
            </Button>
          </div>
        </div>

        <div className="mt-3 flex justify-end">
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground"
            disabled={isResolving}
            onClick={() => dismiss.mutate(conflict.id)}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AgencyConflicts() {
  const { data: agency, isLoading: agencyLoading } = useMyAgency();
  const { data: conflicts = [], isLoading } = useImportConflicts(agency?.id, 'pending');
  const [searchParams] = (() => {
    try { return [new URLSearchParams(window.location.search)]; } catch { return [new URLSearchParams()]; }
  })();
  const tabParam = searchParams.get('tab');
  const initialTab =
    tabParam === 'cross-agency' ? 'cross-agency' :
    tabParam === 'blocklist' ? 'blocklist' :
    'fields';

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Link
          to="/agency/import"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to import
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-1">Conflicts</h1>
          <p className="text-muted-foreground">
            Review imported field disagreements and resolve cross-agency ownership disputes.
          </p>
        </div>

        <Tabs defaultValue={initialTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="fields">Field conflicts</TabsTrigger>
            <TabsTrigger value="cross-agency">Cross-agency disputes</TabsTrigger>
            <TabsTrigger value="blocklist">Blocked URLs</TabsTrigger>
          </TabsList>

          <TabsContent value="fields">
            <Card className="mb-6 rounded-2xl border-primary/10 bg-primary/5">
              <CardContent className="p-4 flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-0.5">How automatic merging works</p>
                  <p className="text-muted-foreground">
                    Your agency website is preferred for owned content and photos, while imported data can fill missing structured fields.
                    A conflict appears here when price or size differs by <strong>more than 10%</strong>.
                  </p>
                </div>
              </CardContent>
            </Card>

            {(agencyLoading || isLoading) && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isLoading && conflicts.length === 0 && (
              <Card className="rounded-2xl">
                <CardContent className="p-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold mb-1">All clear</h3>
                  <p className="text-muted-foreground text-sm">
                    No import conflicts to review. Your listings are merging cleanly.
                  </p>
                </CardContent>
              </Card>
            )}

            {!isLoading && conflicts.length > 0 && (
              <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                {conflicts.length} pending conflict{conflicts.length === 1 ? '' : 's'}
              </div>
            )}

            <div className="space-y-4">
              {conflicts.map((c) => (
                <ConflictRow key={c.id} conflict={c} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="cross-agency">
            <Card className="mb-6 rounded-2xl border-amber-500/20 bg-amber-500/5">
              <CardContent className="p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-0.5">When two agencies try to import the same listing</p>
                  <p className="text-muted-foreground">
                    We block the duplicate import automatically and flag it here. Confirm who actually owns the listing — or mark it as a co-listing if you both legitimately represent it.
                  </p>
                </div>
              </CardContent>
            </Card>
            {agency?.id && <CrossAgencyConflictsList agencyId={agency.id} />}
          </TabsContent>

          <TabsContent value="blocklist">
            <Card className="mb-6 rounded-2xl border-muted bg-muted/20">
              <CardContent className="p-4 flex items-start gap-3">
                <ShieldOff className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-0.5">Why some imports get skipped</p>
                  <p className="text-muted-foreground">
                    When a cross-agency conflict is resolved against you, the disputed URL is added here so future syncs don't keep re-attempting it. Remove an entry if the situation has changed.
                  </p>
                </div>
              </CardContent>
            </Card>
            <AgencyBlocklistPanel agencyId={agency?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
