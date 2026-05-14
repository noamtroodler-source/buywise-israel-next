import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldCheck, AlertTriangle, XCircle, CheckCircle2, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface AuditIssue {
  severity: 'warning' | 'critical';
  kind: string;
  detail: string;
}

interface AuditReport {
  id: string;
  title: string;
  source_url: string;
  severity: 'ok' | 'warning' | 'critical';
  stored: any;
  live: any;
  issues: AuditIssue[];
}

interface AuditResult {
  summary: { total: number; ok: number; warning: number; critical: number };
  reports: AuditReport[];
  run_at: string;
}

export function AgencyAuditPanel({ agencyId }: { agencyId: string }) {
  const [result, setResult] = useState<AuditResult | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [sampleSize, setSampleSize] = useState(5);

  const run = useMutation({
    mutationFn: async (): Promise<AuditResult> => {
      const { data, error } = await supabase.functions.invoke('audit-agency-listings', {
        body: { agency_id: agencyId, sample_size: sampleSize },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as AuditResult;
    },
    onSuccess: (data) => {
      setResult(data);
      toast.success(`Audit complete: ${data.summary.ok} OK, ${data.summary.warning} warnings, ${data.summary.critical} critical`);
    },
    onError: (e: any) => toast.error(`Audit failed: ${e.message}`),
  });

  const sevIcon = (s: string) => {
    if (s === 'ok') return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (s === 'warning') return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    return <XCircle className="h-4 w-4 text-destructive" />;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Listing Quality Audit
          </CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={sampleSize}
              onChange={(e) => setSampleSize(Number(e.target.value))}
              className="h-8 rounded-md border bg-background px-2 text-sm"
              disabled={run.isPending}
            >
              {[3, 5, 10].map(n => <option key={n} value={n}>{n} listings</option>)}
            </select>
            <Button size="sm" onClick={() => run.mutate()} disabled={run.isPending}>
              {run.isPending ? (
                <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Auditing…</>
              ) : 'Run sample audit'}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Re-fetches a random sample from the live agency site and compares photos, listing type, features, and key fields. No changes are made.
        </p>
      </CardHeader>
      <CardContent>
        {!result && !run.isPending && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Click "Run sample audit" to spot-check imported listings.
          </p>
        )}
        {run.isPending && (
          <div className="flex items-center justify-center py-8 gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Running audit (~30–60s)…
          </div>
        )}
        {result && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600" /> {result.summary.ok} OK
              </Badge>
              <Badge variant="outline" className="gap-1">
                <AlertTriangle className="h-3 w-3 text-amber-500" /> {result.summary.warning} warning
              </Badge>
              <Badge variant="outline" className="gap-1">
                <XCircle className="h-3 w-3 text-destructive" /> {result.summary.critical} critical
              </Badge>
              <span className="text-xs text-muted-foreground ml-auto">
                {new Date(result.run_at).toLocaleString()}
              </span>
            </div>

            <div className="space-y-2">
              {result.reports.map((r) => {
                const isOpen = !!expanded[r.id];
                return (
                  <div key={r.id} className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpanded(s => ({ ...s, [r.id]: !s[r.id] }))}
                      className="w-full flex items-center gap-2 p-3 hover:bg-muted/50 text-left"
                    >
                      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      {sevIcon(r.severity)}
                      <span className="font-medium text-sm flex-1 truncate">{r.title || '(untitled)'}</span>
                      <Badge variant="outline" className="text-xs">{r.issues.length} issue{r.issues.length === 1 ? '' : 's'}</Badge>
                    </button>

                    {isOpen && (
                      <div className="border-t p-3 space-y-3 bg-muted/20 text-sm">
                        <div className="flex items-center gap-2">
                          <a
                            href={r.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1 text-xs"
                          >
                            <ExternalLink className="h-3 w-3" /> Open live page
                          </a>
                          <a
                            href={`/property/${r.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1 text-xs"
                          >
                            <ExternalLink className="h-3 w-3" /> Open stored listing
                          </a>
                        </div>

                        {r.issues.length === 0 ? (
                          <p className="text-green-700 text-sm">No issues detected.</p>
                        ) : (
                          <ul className="space-y-1.5">
                            {r.issues.map((iss, i) => (
                              <li key={i} className="flex items-start gap-2">
                                {iss.severity === 'critical'
                                  ? <XCircle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                                  : <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />}
                                <div>
                                  <span className="font-medium text-xs uppercase tracking-wide text-muted-foreground mr-2">{iss.kind.replace(/_/g, ' ')}</span>
                                  <span className="text-xs">{iss.detail}</span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}

                        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                          <div>
                            <div className="text-xs font-semibold text-muted-foreground mb-1">Stored ({r.stored.photo_count} photos)</div>
                            <div className="text-xs text-muted-foreground space-y-0.5">
                              {r.stored.price && <div>Price: ₪{Number(r.stored.price).toLocaleString()}</div>}
                              {r.stored.bedrooms != null && <div>Bedrooms: {r.stored.bedrooms}</div>}
                              {r.stored.size_sqm && <div>Size: {r.stored.size_sqm} sqm</div>}
                              {r.stored.neighborhood && <div>Neighborhood: {r.stored.neighborhood}</div>}
                              <div>Features: {(r.stored.features || []).join(', ') || '—'}</div>
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-muted-foreground mb-1">Live ({r.live.photo_count ?? '?'} photos)</div>
                            <div className="text-xs text-muted-foreground space-y-0.5">
                              {r.live.type && <div>Type: <Badge variant="outline" className="text-[10px]">{r.live.type}</Badge></div>}
                              {r.live.fields?.price_nis && <div>Price: ₪{Number(r.live.fields.price_nis).toLocaleString()}</div>}
                              {r.live.fields?.bedrooms != null && <div>Bedrooms: {r.live.fields.bedrooms}</div>}
                              {r.live.fields?.size_sqm && <div>Size: {r.live.fields.size_sqm} sqm</div>}
                              {r.live.fields?.neighborhood && <div>Neighborhood: {r.live.fields.neighborhood}</div>}
                              <div>Features: {(r.live.features || []).join(', ') || '—'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
