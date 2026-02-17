import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, History, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { format } from 'date-fns';

interface CreditTransaction {
  id: string;
  amount: number;
  balance_after: number;
  transaction_type: string;
  credit_type: string;
  description: string | null;
  created_at: string;
  expires_at: string | null;
}

export function CreditHistoryTable() {
  const { data: sub } = useSubscription();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['creditHistory', sub?.entityType, sub?.entityId],
    queryFn: async (): Promise<CreditTransaction[]> => {
      if (!sub?.entityId) return [];

      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('entity_type', sub.entityType)
        .eq('entity_id', sub.entityId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as CreditTransaction[];
    },
    enabled: !!sub?.entityId,
  });

  const txnTypeLabel = (type: string) => {
    switch (type) {
      case 'purchase': return 'Purchase';
      case 'spend': return 'Spent';
      case 'bonus': return 'Bonus';
      case 'subscription_grant': return 'Plan Grant';
      case 'refund': return 'Refund';
      case 'expiry': return 'Expired';
      default: return type;
    }
  };

  return (
    <Card className="rounded-2xl border-border hover:shadow-lg hover:border-primary/30 transition-all">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <History className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle>Credit History</CardTitle>
            <CardDescription>Recent credit transactions</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No credit transactions yet</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((txn) => (
              <div key={txn.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                    txn.amount > 0 ? 'bg-green-500/10' : 'bg-destructive/10'
                  }`}>
                    {txn.amount > 0 ? (
                      <ArrowDownRight className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{txnTypeLabel(txn.transaction_type)}</p>
                    {txn.description && (
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">{txn.description}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${txn.amount > 0 ? 'text-green-600' : 'text-destructive'}`}>
                    {txn.amount > 0 ? '+' : ''}{txn.amount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(txn.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
