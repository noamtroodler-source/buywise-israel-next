import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, Clock, AlertTriangle, ExternalLink, RefreshCw, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function getNextReviewDate(frequency: string, from: Date): string | null {
  const d = new Date(from);
  switch (frequency) {
    case 'monthly': d.setMonth(d.getMonth() + 1); break;
    case 'quarterly': d.setMonth(d.getMonth() + 3); break;
    case 'annual': d.setFullYear(d.getFullYear() + 1); break;
    case 'biennial': d.setFullYear(d.getFullYear() + 2); break;
    case 'on_change': return null;
    default: d.setFullYear(d.getFullYear() + 1);
  }
  return d.toISOString();
}

export default function AdminDataGovernance() {
  const queryClient = useQueryClient();

  const { data: schedule = [], isLoading } = useQuery({
    queryKey: ['data-review-schedule-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_review_schedule')
        .select('*')
        .order('category');
      if (error) throw error;
      return data;
    },
  });

  const markReviewed = useMutation({
    mutationFn: async (item: typeof schedule[0]) => {
      const now = new Date();
      const nextDue = getNextReviewDate(item.review_frequency, now);
      const { error } = await supabase
        .from('data_review_schedule')
        .update({
          last_reviewed_at: now.toISOString(),
          next_review_due: nextDue,
          updated_at: now.toISOString(),
        })
        .eq('id', item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-review-schedule-admin'] });
      queryClient.invalidateQueries({ queryKey: ['data-review-schedule'] });
      toast.success('Marked as reviewed');
    },
    onError: () => toast.error('Failed to update'),
  });

  const now = new Date();
  const overdue = schedule.filter(s => s.next_review_due && new Date(s.next_review_due) < now);
  const dueSoon = schedule.filter(s => {
    if (!s.next_review_due) return false;
    const d = new Date(s.next_review_due);
    return d >= now && (d.getTime() - now.getTime()) < 30 * 24 * 60 * 60 * 1000;
  });
  const current = schedule.filter(s => {
    if (!s.next_review_due) return true; // on_change items are current until triggered
    return new Date(s.next_review_due) >= now && !dueSoon.includes(s);
  });

  function getDaysUntil(dateStr: string | null): string {
    if (!dateStr) return '—';
    const days = Math.ceil((new Date(dateStr).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return `${Math.abs(days)}d overdue`;
    if (days === 0) return 'Today';
    return `${days}d`;
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-bold">Data Governance</h2>
          <p className="text-sm text-muted-foreground">Track data freshness and review cycles</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-2xl font-bold text-destructive">{overdue.length}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-2xl font-bold text-amber-600">{dueSoon.length}</p>
                <p className="text-xs text-muted-foreground">Due Soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold text-primary">{current.length}</p>
                <p className="text-xs text-muted-foreground">Current</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Review Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Last Reviewed</TableHead>
                  <TableHead>Next Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedule.map(item => {
                  const isOverdue = item.next_review_due && new Date(item.next_review_due) < now;
                  const isNearDue = item.next_review_due && !isOverdue && 
                    (new Date(item.next_review_due).getTime() - now.getTime()) < 30 * 24 * 60 * 60 * 1000;

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.category}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">
                          {item.review_frequency.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(item.last_reviewed_at)}</TableCell>
                      <TableCell className="text-sm">
                        <span className={cn(
                          isOverdue && 'text-destructive font-medium',
                          isNearDue && 'text-amber-600 font-medium'
                        )}>
                          {item.next_review_due ? getDaysUntil(item.next_review_due) : '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {isOverdue ? (
                          <Badge variant="destructive" className="text-xs gap-1">
                            <AlertTriangle className="h-3 w-3" /> Overdue
                          </Badge>
                        ) : isNearDue ? (
                          <Badge className="text-xs gap-1 bg-amber-500/20 text-amber-700 border-amber-500/30">
                            <Clock className="h-3 w-3" /> Due Soon
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Current
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                            {item.source_authority}
                          </span>
                          {item.source_url && (
                            <a href={item.source_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() => markReviewed.mutate(item)}
                          disabled={markReviewed.isPending}
                        >
                          <RefreshCw className="h-3 w-3" />
                          Mark Reviewed
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {schedule.filter(s => s.notes).map(item => (
              <div key={item.id} className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground/80">{item.label}:</span>{' '}
                {item.notes}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
