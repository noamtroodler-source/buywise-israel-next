import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Zap, Clock, TrendingUp, Package, XCircle, Search } from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { toast } from 'sonner';

interface BoostRow {
  id: string;
  entity_type: string;
  entity_id: string;
  target_type: string;
  target_id: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_at: string;
  product: {
    name: string;
    slug: string;
    credit_cost: number;
    duration_days: number;
  } | null;
}

function useAdminBoosts(productFilter?: string) {
  return useQuery({
    queryKey: ['admin', 'boosts', productFilter],
    queryFn: async () => {
      let query = supabase
        .from('active_boosts')
        .select(`
          id, entity_type, entity_id, target_type, target_id,
          starts_at, ends_at, is_active, created_at,
          product:product_id (name, slug, credit_cost, duration_days)
        `)
        .order('created_at', { ascending: false })
        .limit(200);

      const { data, error } = await query;
      if (error) throw error;

      let rows = (data as unknown as BoostRow[]) ?? [];

      if (productFilter && productFilter !== 'all') {
        rows = rows.filter(r => r.product?.slug === productFilter);
      }

      return rows;
    },
  });
}

function useBoostStats() {
  return useQuery({
    queryKey: ['admin', 'boostStats'],
    queryFn: async () => {
      const now = new Date().toISOString();

      const { count: activeCount } = await supabase
        .from('active_boosts')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .gt('ends_at', now);

      // Credits spent this month
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { data: spendData } = await supabase
        .from('credit_transactions')
        .select('amount')
        .eq('transaction_type', 'spend')
        .gte('created_at', monthStart.toISOString());

      const creditsSpent = spendData?.reduce((sum, t) => sum + Math.abs(t.amount), 0) ?? 0;

      // Slot usage per product
      const { data: products } = await supabase
        .from('visibility_products')
        .select('id, name, slug, max_slots')
        .eq('is_active', true);

      const { data: activeBoosts } = await supabase
        .from('active_boosts')
        .select('product_id')
        .eq('is_active', true)
        .gt('ends_at', now);

      const slotUsage = products?.map(p => {
        const used = activeBoosts?.filter(b => b.product_id === p.id).length ?? 0;
        return { name: p.name, slug: p.slug, used, max: p.max_slots };
      }) ?? [];

      return { activeCount: activeCount ?? 0, creditsSpent, slotUsage };
    },
  });
}

function useDeactivateBoost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (boostId: string) => {
      const { error } = await supabase
        .from('active_boosts')
        .update({ is_active: false })
        .eq('id', boostId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'boosts'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'boostStats'] });
      toast.success('Boost deactivated');
    },
    onError: () => toast.error('Failed to deactivate boost'),
  });
}

export default function AdminBoosts() {
  const [productFilter, setProductFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const { data: boosts, isLoading } = useAdminBoosts(productFilter);
  const { data: stats } = useBoostStats();
  const deactivate = useDeactivateBoost();

  const filteredBoosts = boosts?.filter(b => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      b.target_id.toLowerCase().includes(s) ||
      b.entity_id.toLowerCase().includes(s) ||
      b.product?.name?.toLowerCase().includes(s)
    );
  });

  const uniqueSlugs = [...new Set(boosts?.map(b => b.product?.slug).filter(Boolean))];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Boost Management</h2>
        <p className="text-sm text-muted-foreground">View and manage all active visibility boosts</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.activeCount ?? 0}</p>
                <p className="text-xs text-muted-foreground">Active Boosts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.creditsSpent ?? 0}</p>
                <p className="text-xs text-muted-foreground">Credits Spent This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.slotUsage?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground">Boost Products</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Slot Usage */}
      {stats?.slotUsage && stats.slotUsage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Slot Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {stats.slotUsage.map(s => (
                <div key={s.slug} className="flex items-center justify-between p-3 rounded-lg border">
                  <span className="text-sm font-medium truncate">{s.name}</span>
                  <Badge variant={s.max && s.used >= s.max ? 'destructive' : 'secondary'}>
                    {s.used}{s.max ? `/${s.max}` : ''}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={productFilter} onValueChange={setProductFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Products" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {uniqueSlugs.map(slug => (
              <SelectItem key={slug} value={slug!}>{slug}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Boosts Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : !filteredBoosts?.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No boosts found</TableCell>
                </TableRow>
              ) : (
                filteredBoosts.map(boost => {
                  const expired = isPast(new Date(boost.ends_at));
                  const active = boost.is_active && !expired;
                  return (
                    <TableRow key={boost.id}>
                      <TableCell>
                        <div className="font-medium text-sm">{boost.product?.name ?? 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground">{boost.product?.credit_cost} credits</div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{boost.target_type}</code>
                        <div className="text-xs text-muted-foreground truncate max-w-[120px]">{boost.target_id.slice(0, 8)}...</div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{boost.entity_type}</code>
                        <div className="text-xs text-muted-foreground truncate max-w-[120px]">{boost.entity_id.slice(0, 8)}...</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(boost.starts_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{format(new Date(boost.ends_at), 'MMM d, yyyy')}</div>
                        {active && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(boost.ends_at), { addSuffix: true })}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={active ? 'default' : 'secondary'}>
                          {active ? 'Active' : expired ? 'Expired' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {active && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Deactivate Boost</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will immediately deactivate this boost. The credits will not be refunded. Continue?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deactivate.mutate(boost.id)}>
                                  Deactivate
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
