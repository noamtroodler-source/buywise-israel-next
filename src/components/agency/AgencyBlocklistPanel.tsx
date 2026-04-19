/**
 * AgencyBlocklistPanel
 *
 * Surfaces the URLs an agency is blocked from re-importing because of a
 * resolved cross-agency conflict. Without this view, agencies would silently
 * have imports skipped and have no idea why. The panel lets them see the
 * blocked URL, the reason, and (for legitimate cases) remove the block.
 */
import { ShieldOff, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAgencyBlocklist, useRemoveBlocklistEntry } from '@/hooks/useAgencyBlocklist';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  agencyId?: string;
}

export function AgencyBlocklistPanel({ agencyId }: Props) {
  const { data: entries = [], isLoading } = useAgencyBlocklist(agencyId);
  const remove = useRemoveBlocklistEntry();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="p-10 text-center">
          <ShieldOff className="w-10 h-10 mx-auto text-emerald-500 mb-3" />
          <h3 className="font-semibold mb-1">No blocked URLs</h3>
          <p className="text-sm text-muted-foreground">
            Nothing is blocked from importing. URLs only get blocked when a cross-agency ownership conflict is resolved against you.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border">
        <ShieldOff className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="text-sm text-muted-foreground flex-1">
          <p className="font-medium text-foreground mb-0.5">Blocked listings ({entries.length})</p>
          <p>
            These URLs are skipped during your auto-sync because another agency was confirmed as their owner. If a block is wrong, remove it and the URL can be imported again.
          </p>
        </div>
      </div>

      {entries.map((entry) => (
        <Card key={entry.id} className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30 text-[10px]">
                    Blocked
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                  </span>
                </div>
                <a
                  href={entry.blocked_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium hover:underline flex items-center gap-1 truncate"
                >
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span className="truncate">{entry.blocked_url}</span>
                </a>
                {entry.reason && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Reason: {entry.reason}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground hover:text-destructive shrink-0"
                disabled={remove.isPending}
                onClick={() => remove.mutate(entry.id)}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Unblock
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
