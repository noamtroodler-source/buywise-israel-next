/**
 * AdminColistingReports — buyer reports that a co-listing cluster is wrong.
 *
 * Buyers can flag a property's "Also listed by" block from PropertyDetail
 * when they think the algorithm has grouped two different apartments as
 * one. Reports land here for admin triage.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  Flag, CheckCircle2, XCircle, ExternalLink, Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  useAdminColistingReports,
  useResolveColistingReport,
  type ColistingReportRow,
} from '@/hooks/useAdminColisting';

const STATUS_CONFIG: Record<ColistingReportRow['status'], { label: string; className: string }> = {
  pending:    { label: 'Pending review', className: 'bg-semantic-amber/15 text-foreground' },
  accepted:   { label: 'Accepted',       className: 'bg-semantic-green/15 text-semantic-green' },
  dismissed:  { label: 'Dismissed',      className: 'bg-muted text-muted-foreground' },
};

function ResolveReportDialog({
  report, open, onOpenChange,
}: {
  report: ColistingReportRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [resolution, setResolution] = useState<'accepted' | 'dismissed' | null>(null);
  const [notes, setNotes] = useState('');
  const resolve = useResolveColistingReport();

  const close = () => {
    setResolution(null);
    setNotes('');
    onOpenChange(false);
  };

  const submit = async () => {
    if (!report || !resolution) return;
    await resolve.mutateAsync({
      reportId: report.id,
      status: resolution,
      notes: notes.trim() || undefined,
    });
    close();
  };

  if (!report) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-2">
            <Flag className="h-6 w-6 text-muted-foreground" />
          </div>
          <DialogTitle className="text-center">Resolve report</DialogTitle>
          <DialogDescription className="text-center">
            Accept if the cluster is wrong and should be split. Dismiss if the report is noise
            or the cluster is correct.
          </DialogDescription>
        </DialogHeader>

        {report.reason && (
          <Card className="rounded-lg border-border bg-muted/40">
            <CardContent className="p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Reporter reason</p>
              <p className="text-sm text-foreground">"{report.reason}"</p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          <Label htmlFor="report-notes">Admin notes (optional)</Label>
          <Textarea
            id="report-notes"
            placeholder="Action taken, or why dismissed..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="rounded-xl"
          />
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setResolution('dismissed')}
            disabled={resolve.isPending}
            className={cn('rounded-xl flex-1', resolution === 'dismissed' && 'border-primary')}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Dismiss
          </Button>
          <Button
            onClick={() => setResolution('accepted')}
            disabled={resolve.isPending}
            className={cn('rounded-xl flex-1', resolution === 'accepted' && 'ring-2 ring-primary ring-offset-2')}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Accept
          </Button>
        </DialogFooter>

        <Button
          onClick={submit}
          disabled={!resolution || resolve.isPending}
          className="w-full rounded-xl mt-2"
          size="lg"
        >
          {resolve.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {resolution === 'accepted' && 'Confirm: accept report'}
          {resolution === 'dismissed' && 'Confirm: dismiss report'}
          {!resolution && 'Pick an action above'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminColistingReports() {
  const [tab, setTab] = useState<ColistingReportRow['status'] | 'all'>('pending');
  const [active, setActive] = useState<ColistingReportRow | null>(null);

  const { data: reports = [], isLoading } = useAdminColistingReports(tab);
  const pending = useAdminColistingReports('pending').data ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-5xl"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Flag className="w-5 h-5 text-primary" />
          Co-listing cluster reports
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Buyer flags that a property's "also listed by" cluster groups two different apartments.
          Accept to investigate + split; dismiss noise.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending
            {pending.length > 0 && (
              <Badge className="ml-2 text-[10px] bg-semantic-amber text-foreground">
                {pending.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <Card className="p-10 text-center rounded-xl">
          <Flag className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No reports in this view.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {reports.map((r) => {
            const cfg = STATUS_CONFIG[r.status];
            const isPending = r.status === 'pending';
            return (
              <Card
                key={r.id}
                className={cn('rounded-xl', isPending ? 'border-semantic-amber/40' : 'border-border')}
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Badge className={cn('text-xs', cfg.className)}>{cfg.label}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    {isPending && (
                      <Button size="sm" className="rounded-xl" onClick={() => setActive(r)}>
                        Review
                      </Button>
                    )}
                  </div>

                  {r.property && (
                    <Link
                      to={`/property/${r.property.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {r.property.title || r.property.address || 'Property'}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                  {r.property?.city && (
                    <p className="text-xs text-muted-foreground">
                      {r.property.address ? `${r.property.address}, ` : ''}{r.property.city}
                    </p>
                  )}

                  {r.reason && (
                    <div className="rounded-lg bg-muted/40 border border-border px-3 py-2">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                        Reporter reason
                      </p>
                      <p className="text-sm text-foreground">"{r.reason}"</p>
                    </div>
                  )}

                  {r.reporter_email && (
                    <p className="text-xs text-muted-foreground">
                      Reporter: {r.reporter_email}
                    </p>
                  )}

                  {r.admin_notes && (
                    <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
                      <p className="text-[10px] text-primary uppercase tracking-wide mb-1">Admin notes</p>
                      <p className="text-sm text-foreground">{r.admin_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ResolveReportDialog
        report={active}
        open={!!active}
        onOpenChange={(o) => !o && setActive(null)}
      />
    </motion.div>
  );
}
