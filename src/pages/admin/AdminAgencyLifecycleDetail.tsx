import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Send, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProvisioningAgency, useAgencyAgents, useResendSetupLink } from '@/hooks/useAgencyProvisioning';
import { AuditLogSection } from '@/components/admin/agency-provisioning/AuditLogSection';
import { RevealCredentialsModal } from '@/components/admin/agency-provisioning/RevealCredentialsModal';

/**
 * Phase 9 — read-only post-handover detail page for an agency. Reachable from
 * the lifecycle index for agencies in handed_over / claimed state.
 */
export default function AdminAgencyLifecycleDetail() {
  const { agencyId = null } = useParams<{ agencyId: string }>();
  const { data: agency, isLoading } = useProvisioningAgency(agencyId);
  const { data: agents = [] } = useAgencyAgents(agencyId);
  const resend = useResendSetupLink();

  const [revealUser, setRevealUser] = useState<{ id: string; label: string } | null>(null);

  if (isLoading) {
    return <div className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>;
  }
  if (!agency) {
    return <p className="text-sm text-muted-foreground">Agency not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/agencies"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{agency.name}</h1>
          <p className="text-sm text-muted-foreground">
            <Badge variant="outline" className="mr-2">{agency.management_status}</Badge>
            {agency.slug}
          </p>
        </div>
      </div>

      <Card className="p-5">
        <h2 className="text-base font-semibold mb-3">Provisioned accounts</h2>
        <div className="space-y-2">
          {agency.admin_user_id && (
            <div className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
              <div>
                <p className="text-sm font-medium">Owner account</p>
                <p className="text-xs text-muted-foreground">{agency.email ?? '—'}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => resend.mutate({ userId: agency.admin_user_id!, purpose: 'owner_setup' })}
                  disabled={resend.isPending}
                >
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  Resend setup link
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRevealUser({ id: agency.admin_user_id!, label: 'Owner' })}
                >
                  <KeyRound className="h-3.5 w-3.5 mr-1.5" />
                  Reveal credentials
                </Button>
              </div>
            </div>
          )}
          {agents.filter(a => a.user_id).map((a) => (
            <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
              <div>
                <p className="text-sm font-medium">{a.name}</p>
                <p className="text-xs text-muted-foreground">{a.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => resend.mutate({ userId: a.user_id!, purpose: 'agent_setup' })}
                  disabled={resend.isPending}
                >
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  Resend
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRevealUser({ id: a.user_id!, label: a.name })}
                >
                  <KeyRound className="h-3.5 w-3.5 mr-1.5" />
                  Reveal
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <AuditLogSection agencyId={agency.id} />

      <RevealCredentialsModal
        open={!!revealUser}
        onOpenChange={(o) => { if (!o) setRevealUser(null); }}
        userId={revealUser?.id ?? null}
        subjectLabel={revealUser?.label}
      />
    </div>
  );
}
