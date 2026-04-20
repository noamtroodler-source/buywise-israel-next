/**
 * AdminPrimaryDisputes — queue of open + resolved primary-agency disputes.
 *
 * Agents file a dispute via the wizard's "Not sure" path when they believe
 * another agency is wrongly holding primary on a property they also
 * represent. Admin reviews here and either upholds (transfer primary to the
 * disputing agency) or dismisses.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  Gavel, ShieldAlert, CheckCircle2, XCircle, Search, Building2,
  ArrowRight, ExternalLink, Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  useAdminPrimaryDisputes,
  useResolveDispute,
  type PrimaryDisputeRow,
} from '@/hooks/useAdminColisting';

const STATUS_CONFIG: Record<PrimaryDisputeRow['status'], { label: string; className: string }> = {
  pending:          { label: 'Pending review', className: 'bg-semantic-amber/15 text-foreground' },
  resolved_uphold:  { label: 'Upheld',          className: 'bg-semantic-green/15 text-semantic-green' },
  resolved_dismiss: { label: 'Dismissed',       className: 'bg-muted text-muted-foreground' },
  withdrawn:        { label: 'Withdrawn',       className: 'bg-muted text-muted-foreground' },
};

function AgencyRow({
  label, name, logoUrl,
}: { label: string; name: string; logoUrl: string | null | undefined }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Avatar className="h-7 w-7 border border-border/50 flex-shrink-0">
        {logoUrl && <AvatarImage src={logoUrl} alt={name} />}
        <AvatarFallback className="bg-muted">
          <Building2 className="h-3 w-3 text-muted-foreground" />
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-xs font-medium text-foreground truncate">{name}</p>
      </div>
    </div>
  );
}

function ResolveDisputeDialog({
  dispute, open, onOpenChange,
}: {
  dispute: PrimaryDisputeRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [resolution, setResolution] = useState<'resolved_uphold' | 'resolved_dismiss' | null>(null);
  const [notes, setNotes] = useState('');
  const resolve = useResolveDispute();

  const close = () => {
    setResolution(null);
    setNotes('');
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!dispute || !resolution) return;
    await resolve.mutateAsync({
      disputeId: dispute.id,
      resolution,
      notes: notes.trim() || undefined,
    });
    close();
  };

  if (!dispute) return null;
  const disputingName = dispute.disputing_agency?.name ?? 'Unknown';
  const targetName = dispute.target_agency?.name ?? 'Unknown';

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-semantic-amber/15 mb-2">
            <Gavel className="h-6 w-6 text-semantic-amber" />
          </div>
          <DialogTitle className="text-center">Resolve dispute</DialogTitle>
          <DialogDescription className="text-center">
            <strong>{disputingName}</strong> has disputed <strong>{targetName}</strong>'s primary status.
            Uphold to transfer primary; dismiss to close with no change.
          </DialogDescription>
        </DialogHeader>

        {dispute.reason && (
          <Card className="rounded-lg border-border bg-muted/40">
            <CardContent className="p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Reason given</p>
              <p className="text-sm text-foreground">"{dispute.reason}"</p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          <Label htmlFor="admin-notes">Admin notes (optional)</Label>
          <Textarea
            id="admin-notes"
            placeholder="Record the rationale for this resolution..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="rounded-xl"
          />
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setResolution('resolved_dismiss')}
            disabled={resolve.isPending}
            className={cn('rounded-xl flex-1', resolution === 'resolved_dismiss' && 'border-primary')}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Dismiss
          </Button>
          <Button
            onClick={() => setResolution('resolved_uphold')}
            disabled={resolve.isPending}
            className={cn('rounded-xl flex-1', resolution === 'resolved_uphold' && 'ring-2 ring-primary ring-offset-2')}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Uphold
          </Button>
        </DialogFooter>

        <Button
          onClick={handleSubmit}
          disabled={!resolution || resolve.isPending}
          className="w-full rounded-xl mt-2"
          size="lg"
        >
          {resolve.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {resolution === 'resolved_uphold' && 'Confirm: uphold dispute, reassign primary'}
          {resolution === 'resolved_dismiss' && 'Confirm: dismiss dispute'}
          {!resolution && 'Pick an action above'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminPrimaryDisputes() {
  const [tab, setTab] = useState<PrimaryDisputeRow['status'] | 'all'>('pending');
  const [search, setSearch] = useState('');
  const [activeDispute, setActiveDispute] = useState<PrimaryDisputeRow | null>(null);

  const { data: disputes = [], isLoading } = useAdminPrimaryDisputes({ status: tab });
  const allDisputes = useAdminPrimaryDisputes({ status: 'all' }).data ?? [];

  const filtered = search
    ? disputes.filter((d) => {
        const q = search.toLowerCase();
        return (
          d.property?.title?.toLowerCase().includes(q) ||
          d.property?.city?.toLowerCase().includes(q) ||
          d.disputing_agency?.name.toLowerCase().includes(q) ||
          d.target_agency?.name.toLowerCase().includes(q)
        );
      })
    : disputes;

  const pendingCount = allDisputes.filter((d) => d.status === 'pending').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-5xl"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Gavel className="w-5 h-5 text-primary" />
          Primary-agency disputes
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Agencies file disputes when they believe another agency wrongly holds primary status.
          Uphold transfers primary; dismiss closes with no change.
        </p>
      </div>

      {/* Status tabs + search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="flex-1">
          <TabsList>
            <TabsTrigger value="pending">
              Pending
              {pendingCount > 0 && (
                <Badge className="ml-2 text-[10px] bg-semantic-amber text-foreground">{pendingCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="resolved_uphold">Upheld</TabsTrigger>
            <TabsTrigger value="resolved_dismiss">Dismissed</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative sm:w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search property or agency..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center rounded-xl">
          <ShieldAlert className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No disputes in this view.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => {
            const cfg = STATUS_CONFIG[d.status];
            const isPending = d.status === 'pending';
            return (
              <Card key={d.id} className={cn('rounded-xl', isPending ? 'border-semantic-amber/40' : 'border-border')}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Badge className={cn('text-xs', cfg.className)}>{cfg.label}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(d.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    {isPending && (
                      <Button
                        size="sm"
                        className="rounded-xl"
                        onClick={() => setActiveDispute(d)}
                      >
                        Review
                      </Button>
                    )}
                  </div>

                  {d.property && (
                    <Link
                      to={`/property/${d.property.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {d.property.title || d.property.address || 'Property'}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}

                  <div className="flex items-center gap-4 flex-wrap">
                    <AgencyRow
                      label="Disputing"
                      name={d.disputing_agency?.name ?? 'Unknown'}
                      logoUrl={d.disputing_agency?.logo_url}
                    />
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <AgencyRow
                      label="Target (current primary)"
                      name={d.target_agency?.name ?? 'Unknown'}
                      logoUrl={d.target_agency?.logo_url}
                    />
                  </div>

                  {d.reason && (
                    <div className="rounded-lg bg-muted/40 border border-border px-3 py-2">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Reason</p>
                      <p className="text-sm text-foreground">"{d.reason}"</p>
                    </div>
                  )}

                  {d.admin_notes && (
                    <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
                      <p className="text-[10px] text-primary uppercase tracking-wide mb-1">Admin notes</p>
                      <p className="text-sm text-foreground">{d.admin_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ResolveDisputeDialog
        dispute={activeDispute}
        open={!!activeDispute}
        onOpenChange={(o) => !o && setActiveDispute(null)}
      />
    </motion.div>
  );
}
