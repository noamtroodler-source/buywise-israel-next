import { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Activity } from 'lucide-react';
import { useAgencyAuditLog } from '@/hooks/useAgencyProvisioning';

interface Props {
  agencyId: string;
}

const ACTION_LABELS: Record<string, string> = {
  owner_account_provisioned: 'Owner account created',
  agent_account_provisioned: 'Agent account created',
  credentials_revealed: 'Credentials revealed',
  setup_link_resent: 'Setup link resent',
  setup_password_completed: 'Password set by user',
  agency_handed_over: 'Agency handed over',
  owner_welcome_email_sent: 'Owner welcome email sent',
  agent_welcome_email_sent: 'Agent welcome email sent',
  listings_audited: 'Listings audit run',
};

const ACTION_TONE: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  credentials_revealed: 'destructive',
  setup_link_resent: 'secondary',
  agency_handed_over: 'default',
};

/**
 * Phase 9 — append-only audit timeline for an agency. Sourced from
 * agency_provisioning_audit and rendered in reverse chronological order.
 */
export function AuditLogSection({ agencyId }: Props) {
  const { data: entries = [], isLoading } = useAgencyAuditLog(agencyId);

  const grouped = useMemo(() => {
    const byDay = new Map<string, typeof entries>();
    for (const e of entries) {
      const day = new Date(e.created_at).toISOString().slice(0, 10);
      const arr = byDay.get(day) ?? [];
      arr.push(e);
      byDay.set(day, arr);
    }
    return Array.from(byDay.entries());
  }, [entries]);

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-4 w-4 text-primary" />
        <h2 className="text-base font-semibold">Audit log</h2>
        <span className="text-xs text-muted-foreground">
          {entries.length} {entries.length === 1 ? 'event' : 'events'}
        </span>
      </div>

      {isLoading ? (
        <div className="py-8 text-center">
          <Loader2 className="h-5 w-5 animate-spin mx-auto" />
        </div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">
          No provisioning actions recorded yet.
        </p>
      ) : (
        <div className="space-y-4">
          {grouped.map(([day, items]) => (
            <div key={day}>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                {new Date(day).toLocaleDateString(undefined, {
                  weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                })}
              </p>
              <div className="space-y-1.5">
                {items.map((e) => {
                  const label = ACTION_LABELS[e.action] ?? e.action.replace(/_/g, ' ');
                  const tone = ACTION_TONE[e.action] ?? 'outline';
                  const meta = e.metadata && typeof e.metadata === 'object' ? e.metadata : null;
                  const detail = meta
                    ? Object.entries(meta)
                        .filter(([k]) => k !== 'token' && k !== 'password')
                        .slice(0, 3)
                        .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
                        .join(' · ')
                    : null;
                  return (
                    <div
                      key={e.id}
                      className="flex items-start gap-3 p-2.5 rounded-lg border border-border/50 bg-card/50"
                    >
                      <Badge variant={tone} className="text-[10px] mt-0.5 shrink-0">
                        {label}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        {detail && (
                          <p className="text-xs text-muted-foreground truncate">{detail}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
