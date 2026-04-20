/**
 * AdminMergeReversals — read-only audit of property merges within their
 * 30-day reversal window. Surfaces which properties got merged when, by
 * whom, and when the window closes.
 *
 * The actual un-merge RPC is not wired up yet — the loser_snapshot restore
 * has subtle correctness questions (images, FK cascades, stats) that
 * deserve a focused design pass once we have a real regret case. For now
 * this page gives admin visibility so no merge slips by unnoticed.
 */
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, format, differenceInDays } from 'date-fns';
import {
  Combine, Clock, AlertTriangle, ExternalLink, ArrowRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAdminMergeEvents } from '@/hooks/useAdminColisting';

function daysRemaining(deadline: string): number {
  return Math.max(0, differenceInDays(new Date(deadline), new Date()));
}

export default function AdminMergeReversals() {
  const { data: events = [], isLoading } = useAdminMergeEvents();

  const inWindow = events.filter((e) => !e.unmerged_at && daysRemaining(e.unmerge_deadline) > 0);
  const expired = events.filter((e) => !e.unmerged_at && daysRemaining(e.unmerge_deadline) === 0);
  const unmerged = events.filter((e) => !!e.unmerged_at);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-5xl"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Combine className="w-5 h-5 text-primary" />
          Merge reversals
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Audit of property merges within the 30-day reversal window. Un-merge is manual for now
          — open a ticket with the winner + loser IDs if a merge needs undoing.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <div className="text-2xl font-bold">{inWindow.length}</div>
              <p className="text-xs text-muted-foreground">Reversible (within 30 days)</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-2xl font-bold">{expired.length}</div>
              <p className="text-xs text-muted-foreground">Window expired</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <Combine className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-2xl font-bold">{unmerged.length}</div>
              <p className="text-xs text-muted-foreground">Already un-merged</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <Card className="p-10 text-center rounded-xl">
          <Combine className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No merges recorded yet.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {events.map((e) => {
            const remaining = daysRemaining(e.unmerge_deadline);
            const isUnmerged = !!e.unmerged_at;
            const isExpired = !isUnmerged && remaining === 0;
            return (
              <Card
                key={e.id}
                className={cn(
                  'rounded-xl',
                  isUnmerged ? 'border-border bg-muted/20'
                    : isExpired ? 'border-border opacity-80'
                    : 'border-primary/20'
                )}
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      {isUnmerged ? (
                        <Badge className="bg-muted text-muted-foreground text-xs">Un-merged</Badge>
                      ) : isExpired ? (
                        <Badge className="bg-muted text-muted-foreground text-xs">Window expired</Badge>
                      ) : (
                        <Badge className="bg-primary/10 text-primary text-xs">
                          {remaining} day{remaining === 1 ? '' : 's'} left
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(e.merged_at), { addSuffix: true })}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(e.merged_at), 'MMM d, yyyy · HH:mm')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <Link
                      to={`/property/${e.winner_property_id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-foreground hover:text-primary hover:underline"
                    >
                      <span className="font-medium">Winner</span>
                      <code className="font-mono text-[10px] text-muted-foreground">
                        {e.winner_property_id.slice(0, 8)}…
                      </code>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <span className="font-medium">Loser</span>
                      <code className="font-mono text-[10px]">
                        {e.loser_property_id.slice(0, 8)}…
                      </code>
                      <span className="italic opacity-80">(unpublished)</span>
                    </span>
                  </div>

                  <p className="text-[10px] text-muted-foreground">
                    Reversal deadline: {format(new Date(e.unmerge_deadline), 'MMM d, yyyy')}
                    {isUnmerged && e.unmerged_at && (
                      <> · Reversed {format(new Date(e.unmerged_at), 'MMM d, yyyy')}</>
                    )}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
