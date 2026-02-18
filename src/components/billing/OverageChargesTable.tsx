import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useOverageRecords } from '@/hooks/useOverageRecords';

interface OverageChargesTableProps {
  entityId?: string;
}

function statusBadge(status: string) {
  if (status === 'invoiced') {
    return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30">Invoiced</Badge>;
  }
  if (status === 'waived') {
    return <Badge variant="secondary">Waived</Badge>;
  }
  return <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30">Pending — next statement</Badge>;
}

function resourceLabel(type: string) {
  if (type === 'project') return 'Projects';
  if (type === 'seat') return 'Seats';
  return 'Listings';
}

export function OverageChargesTable({ entityId }: OverageChargesTableProps) {
  const { data: records = [], isLoading } = useOverageRecords(entityId);

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-primary/10">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (records.length === 0) return null;

  return (
    <Card className="rounded-2xl border-primary/10">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-primary" />
          Overage Charges
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead className="text-right">Over by</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-sm text-muted-foreground">
                  {format(parseISO(r.billing_period_start), 'MMM yyyy')}
                </TableCell>
                <TableCell className="text-sm">{resourceLabel(r.resource_type)}</TableCell>
                <TableCell className="text-right text-sm font-medium">+{r.overage_units}</TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">₪{r.rate_ils_per_unit}/unit</TableCell>
                <TableCell className="text-right text-sm font-semibold text-foreground">₪{r.total_amount_ils.toLocaleString()}</TableCell>
                <TableCell>{statusBadge(r.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
