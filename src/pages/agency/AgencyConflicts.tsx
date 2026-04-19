/**
 * AgencyConflicts — /agency/conflicts
 * Lets agency admins review fields where multiple sources (Yad2, Madlan,
 * Website) reported different values during a cross-source merge. The agency
 * picks which source wins, or dismisses the conflict.
 */
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, CheckCircle2, X, Loader2, ShieldCheck } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMyAgency } from '@/hooks/useAgencyManagement';
import { useImportConflicts, useResolveConflict, useDismissConflict, type ImportConflict } from '@/hooks/useImportConflicts';
import { formatDistanceToNow } from 'date-fns';

const SOURCE_LABEL: Record<string, string> = {
  yad2: 'Yad2',
  madlan: 'Madlan',
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
          <h1 className="text-3xl font-bold mb-1">Source conflicts</h1>
          <p className="text-muted-foreground">
            When Yad2, Madlan, and your website disagree on a field, we flag it here so you can pick the right value.
          </p>
        </div>

        <Card className="mb-6 rounded-2xl border-primary/10 bg-primary/5">
          <CardContent className="p-4 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-0.5">How automatic merging works</p>
              <p className="text-muted-foreground">
                We trust <strong>Yad2 → Madlan → Website</strong> in that order for structured fields like price and size.
                A conflict only appears here when the difference is <strong>greater than 10%</strong> — small differences are auto-merged.
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
                No source conflicts to review. Your listings are merging cleanly across Yad2, Madlan, and your website.
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
      </div>
    </Layout>
  );
}
