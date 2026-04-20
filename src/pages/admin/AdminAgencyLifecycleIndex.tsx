import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Building2, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useAllAgenciesLifecycle } from '@/hooks/useAgencyProvisioning';

const STATUS_TONE: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'outline',
  provisioning: 'secondary',
  quality_review: 'secondary',
  ready_for_handover: 'default',
  handed_over: 'default',
  claimed: 'default',
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  provisioning: 'Provisioning',
  quality_review: 'Quality review',
  ready_for_handover: 'Ready for handover',
  handed_over: 'Handed over',
  claimed: 'Claimed',
};

/**
 * Phase 9 — full lifecycle index of every agency, including post-handover and
 * claimed states (which are filtered out of the in-progress workspace sidebar).
 */
export default function AdminAgencyLifecycleIndex() {
  const { data: rows = [], isLoading } = useAllAgenciesLifecycle();

  const counts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.management_status] = (acc[r.management_status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Agencies — Lifecycle</h1>
          <p className="text-sm text-muted-foreground">
            Every agency on the platform with its current provisioning state.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {(['draft','provisioning','quality_review','ready_for_handover','handed_over','claimed'] as const).map((s) => (
          <Card key={s} className="p-3">
            <p className="text-xs text-muted-foreground">{STATUS_LABEL[s]}</p>
            <p className="text-xl font-bold">{counts[s] ?? 0}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center">
            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
          </div>
        ) : rows.length === 0 ? (
          <p className="py-10 text-sm text-muted-foreground text-center">No agencies yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Agents</TableHead>
                <TableHead className="text-right">Listings</TableHead>
                <TableHead>Email strategy</TableHead>
                <TableHead>Provisioned</TableHead>
                <TableHead>Handed over</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const inProgress = ['draft','provisioning','quality_review','ready_for_handover'].includes(r.management_status);
                const href = inProgress
                  ? `/admin/agency-provisioning?agency=${r.id}`
                  : `/admin/agency-provisioning/${r.id}`;
                return (
                  <TableRow key={r.id} className="hover:bg-muted/40">
                    <TableCell>
                      <Link to={href} className="font-medium hover:underline">
                        {r.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{r.slug}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_TONE[r.management_status] ?? 'outline'}>
                        {STATUS_LABEL[r.management_status] ?? r.management_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{r.agent_count}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.listing_count}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.agent_email_strategy === 'send_after_owner' ? 'After owner' : 'All now'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.provisioned_at
                        ? formatDistanceToNow(new Date(r.provisioned_at), { addSuffix: true })
                        : '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.handover_completed_at
                        ? formatDistanceToNow(new Date(r.handover_completed_at), { addSuffix: true })
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Link to={href} className="text-muted-foreground hover:text-foreground">
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
