import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Play, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

interface OverageRecord {
  id: string;
  entity_type: string;
  entity_id: string;
  billing_period_start: string;
  resource_type: string;
  plan_limit: number;
  actual_count: number;
  overage_units: number;
  rate_ils_per_unit: number;
  total_amount_ils: number;
  status: string;
  notes: string | null;
  subscription_id: string | null;
}

function resourceLabel(type: string) {
  if (type === 'project') return 'Projects';
  if (type === 'seat') return 'Seats';
  return 'Listings';
}

function statusBadge(status: string) {
  if (status === 'invoiced') return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30">Invoiced</Badge>;
  if (status === 'waived') return <Badge variant="secondary">Waived</Badge>;
  return <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30">Pending</Badge>;
}

export default function AdminOverages() {
  const queryClient = useQueryClient();
  const [waiveTarget, setWaiveTarget] = useState<OverageRecord | null>(null);
  const [waiveNote, setWaiveNote] = useState('');
  const [isSnapshotting, setIsSnapshotting] = useState(false);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['admin-overage-records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('overage_records' as any)
        .select('*')
        .order('billing_period_start', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as OverageRecord[];
    },
  });

  const pendingRecords = records.filter((r) => r.status === 'pending');
  const totalPending = pendingRecords.reduce((sum, r) => sum + r.total_amount_ils, 0);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { error } = await supabase
        .from('overage_records' as any)
        .update({ status, notes: notes ?? null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-overage-records'] });
      toast.success('Overage record updated');
      setWaiveTarget(null);
      setWaiveNote('');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleRunSnapshot = async () => {
    setIsSnapshotting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('snapshot-overages', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) throw error;
      toast.success(`Snapshot complete — ${data.overages_written} overage records written`);
      queryClient.invalidateQueries({ queryKey: ['admin-overage-records'] });
    } catch (err: any) {
      toast.error(err.message ?? 'Snapshot failed');
    } finally {
      setIsSnapshotting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Overage Billing</h2>
            <p className="text-sm text-muted-foreground">Track and manage subscription overages</p>
          </div>
        </div>
        <Button
          onClick={handleRunSnapshot}
          disabled={isSnapshotting}
          className="rounded-xl gap-2"
        >
          {isSnapshotting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Run Snapshot
        </Button>
      </div>

      {/* Summary card */}
      <Card className="rounded-2xl border-primary/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-muted-foreground">Total Pending Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-foreground">₪{totalPending.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground mt-1">{pendingRecords.length} pending overage records</p>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="rounded-2xl border-primary/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">All Overage Records</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : records.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No overage records yet. Run a snapshot to compute current overages.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Entity ID</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead className="text-right">Limit</TableHead>
                  <TableHead className="text-right">Actual</TableHead>
                  <TableHead className="text-right">Over by</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(parseISO(r.billing_period_start), 'MMM yyyy')}
                    </TableCell>
                    <TableCell className="text-sm capitalize">{r.entity_type}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono max-w-[120px] truncate">
                      {r.entity_id}
                    </TableCell>
                    <TableCell className="text-sm">{resourceLabel(r.resource_type)}</TableCell>
                    <TableCell className="text-right text-sm">{r.plan_limit}</TableCell>
                    <TableCell className="text-right text-sm">{r.actual_count}</TableCell>
                    <TableCell className="text-right text-sm font-semibold text-destructive">+{r.overage_units}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">₪{r.rate_ils_per_unit}</TableCell>
                    <TableCell className="text-right text-sm font-bold text-foreground">₪{r.total_amount_ils.toLocaleString()}</TableCell>
                    <TableCell>{statusBadge(r.status)}</TableCell>
                    <TableCell>
                      {r.status === 'pending' && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 rounded-lg gap-1 text-xs"
                            onClick={() => updateStatus.mutate({ id: r.id, status: 'invoiced' })}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            Invoice
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 rounded-lg gap-1 text-xs"
                            onClick={() => { setWaiveTarget(r); setWaiveNote(''); }}
                          >
                            <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                            Waive
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Waive dialog */}
      <Dialog open={!!waiveTarget} onOpenChange={(open) => !open && setWaiveTarget(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Waive Overage Charge</DialogTitle>
            <DialogDescription>
              Waive ₪{waiveTarget?.total_amount_ils.toLocaleString()} overage for {waiveTarget?.entity_type} ({resourceLabel(waiveTarget?.resource_type ?? '')}) — {waiveTarget ? format(parseISO(waiveTarget.billing_period_start), 'MMM yyyy') : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Textarea
              placeholder="Reason for waiving (optional)"
              value={waiveNote}
              onChange={(e) => setWaiveNote(e.target.value)}
              className="rounded-xl"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setWaiveTarget(null)}>Cancel</Button>
            <Button
              className="rounded-xl"
              onClick={() => waiveTarget && updateStatus.mutate({ id: waiveTarget.id, status: 'waived', notes: waiveNote || undefined })}
              disabled={updateStatus.isPending}
            >
              {updateStatus.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm Waive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
