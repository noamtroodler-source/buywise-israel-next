import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Download, Receipt, ExternalLink, CreditCard, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

interface Invoice {
  id: string;
  number: string;
  created: number;
  amount_paid: number;
  currency: string;
  status: string;
  description: string;
  invoice_pdf: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid: 'bg-green-500/10 text-green-600 border-green-500/20',
    open: 'bg-primary/10 text-primary border-primary/20',
    void: 'bg-muted text-muted-foreground border-border',
    uncollectible: 'bg-destructive/10 text-destructive border-destructive/20',
  };
  const labels: Record<string, string> = {
    paid: 'Paid',
    open: 'Open',
    void: 'Void',
    uncollectible: 'Uncollectible',
  };
  return (
    <Badge variant="outline" className={styles[status] ?? styles.void}>
      {labels[status] ?? status}
    </Badge>
  );
}

function InvoiceRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-7 w-7 rounded-lg" />
      </div>
    </div>
  );
}

export function InvoiceHistoryTable() {
  const { data: sub } = useSubscription();
  const hasSubscription = sub && sub.status !== 'none';
  const isTrialing = sub?.status === 'trialing';

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', sub?.entityType, sub?.entityId],
    queryFn: async (): Promise<Invoice[]> => {
      if (!sub?.entityId) return [];
      const { data, error } = await supabase.functions.invoke('list-invoices', {
        body: { entity_type: sub.entityType, entity_id: sub.entityId },
      });
      if (error) throw error;
      return data?.invoices ?? [];
    },
    enabled: !!sub?.entityId && !!hasSubscription && !isTrialing,
  });

  return (
    <Card className="rounded-2xl border-border hover:shadow-lg hover:border-primary/30 transition-all">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Receipt className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle>Invoice History</CardTitle>
            <CardDescription>Past payments and receipts</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!hasSubscription ? (
          <div className="text-center py-8 space-y-3">
            <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">No active subscription</p>
              <p className="text-xs text-muted-foreground">
                Subscribe to a paid plan to see your invoice history.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild className="rounded-xl">
              <Link to="/pricing">View Pricing</Link>
            </Button>
          </div>
        ) : isTrialing ? (
          <div className="text-center py-8 space-y-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Free trial active</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Invoices will appear here once your trial ends and billing begins.
              </p>
            </div>
          </div>
        ) : isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <InvoiceRowSkeleton key={i} />)}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">No invoices yet</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Your first invoice will appear here after your first billing cycle.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {data.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30 gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {inv.description || inv.number || 'Invoice'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(inv.created * 1000), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <StatusBadge status={inv.status} />
                  <span className="text-sm font-bold text-foreground">
                    ₪{(inv.amount_paid / 100).toLocaleString()}
                  </span>
                  {inv.invoice_pdf ? (
                    <a
                      href={inv.invoice_pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-7 w-7 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-colors"
                      title="Download PDF"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <div className="h-7 w-7" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
