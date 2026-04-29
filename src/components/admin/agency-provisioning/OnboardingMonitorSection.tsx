import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, CheckCircle2, Clock, Copy, KeyRound, Mail, RefreshCw, ShieldCheck, UserCheck, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { ProvisioningAgency, useAgencyAgents, useResendSetupLink } from '@/hooks/useAgencyProvisioning';

const APP_URL = 'https://buywiseisrael.com';

type LatestEmail = {
  template_name: string;
  recipient_email: string;
  status: string;
  error_message: string | null;
  created_at: string;
};

type SetupToken = {
  token: string;
  user_id: string;
  purpose: 'owner_setup' | 'agent_setup';
  created_at: string;
  used_at: string | null;
};

type AuditEntry = {
  action: string;
  target_user_id: string | null;
  created_at: string;
};

type ProfileRow = {
  id: string;
  last_active_at: string | null;
  updated_at: string | null;
};

type MonitorPerson = {
  id: string;
  role: 'Owner' | 'Agent';
  name: string;
  email: string | null;
  userId: string | null;
  emailStatus: LatestEmail | null;
  token: SetupToken | null;
  passwordCompletedAt: string | null;
  lastActiveAt: string | null;
  profileUpdatedAt: string | null;
  recordUpdatedAt?: string | null;
};

interface Props {
  agency: ProvisioningAgency;
}

export function OnboardingMonitorSection({ agency }: Props) {
  const queryClient = useQueryClient();
  const { data: agents = [] } = useAgencyAgents(agency.id);
  const resend = useResendSetupLink();

  const userIds = useMemo(
    () => [agency.admin_user_id, ...agents.map((agent) => agent.user_id)].filter(Boolean) as string[],
    [agency.admin_user_id, agents],
  );
  const emails = useMemo(
    () => [agency.email, ...agents.map((agent) => agent.email)].filter(Boolean).map((email) => email!.toLowerCase()),
    [agency.email, agents],
  );

  const monitor = useQuery({
    queryKey: ['agency-onboarding-monitor', agency.id, userIds.join(','), emails.join(',')],
    enabled: !!agency.id,
    queryFn: async () => {
      const [tokenRes, auditRes, emailRes, profileRes] = await Promise.all([
        userIds.length
          ? supabase
              .from('password_setup_tokens')
              .select('token, user_id, purpose, created_at, used_at')
              .in('user_id', userIds)
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [], error: null }),
        supabase
          .from('agency_provisioning_audit')
          .select('action, target_user_id, created_at')
          .eq('agency_id', agency.id)
          .in('action', ['password_setup_completed', 'agency_handed_over', 'setup_link_resent'])
          .order('created_at', { ascending: false }),
        emails.length
          ? supabase
              .from('email_send_log')
              .select('message_id, template_name, recipient_email, status, error_message, created_at')
              .in('template_name', ['owner-welcome', 'agent-welcome'])
              .in('recipient_email', emails)
              .order('created_at', { ascending: false })
              .limit(200)
          : Promise.resolve({ data: [], error: null }),
        userIds.length
          ? supabase
              .from('profiles')
              .select('id, last_active_at, updated_at')
              .in('id', userIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      const firstError = tokenRes.error || auditRes.error || emailRes.error || profileRes.error;
      if (firstError) throw firstError;

      return {
        tokens: (tokenRes.data || []) as SetupToken[],
        audit: (auditRes.data || []) as AuditEntry[],
        emails: (emailRes.data || []) as LatestEmail[],
        profiles: (profileRes.data || []) as ProfileRow[],
      };
    },
  });

  const people = useMemo<MonitorPerson[]>(() => {
    const data = monitor.data;
    const latestEmailByKey = new Map<string, LatestEmail>();
    for (const row of data?.emails || []) {
      const key = `${row.template_name}:${row.recipient_email.toLowerCase()}`;
      if (!latestEmailByKey.has(key)) latestEmailByKey.set(key, row);
    }

    const latestTokenByKey = new Map<string, SetupToken>();
    for (const token of data?.tokens || []) {
      const key = `${token.user_id}:${token.purpose}`;
      if (!latestTokenByKey.has(key)) latestTokenByKey.set(key, token);
    }

    const setupCompletedByUser = new Map<string, string>();
    for (const entry of data?.audit || []) {
      if (entry.action !== 'password_setup_completed' || !entry.target_user_id) continue;
      if (!setupCompletedByUser.has(entry.target_user_id)) {
        setupCompletedByUser.set(entry.target_user_id, entry.created_at);
      }
    }

    const profileByUser = new Map((data?.profiles || []).map((profile) => [profile.id, profile]));

    const ownerProfile = agency.admin_user_id ? profileByUser.get(agency.admin_user_id) : null;
    const rows: MonitorPerson[] = [
      {
        id: `owner-${agency.id}`,
        role: 'Owner',
        name: agency.name,
        email: agency.email,
        userId: agency.admin_user_id,
        emailStatus: agency.email ? latestEmailByKey.get(`owner-welcome:${agency.email.toLowerCase()}`) || null : null,
        token: agency.admin_user_id ? latestTokenByKey.get(`${agency.admin_user_id}:owner_setup`) || null : null,
        passwordCompletedAt: agency.admin_user_id ? setupCompletedByUser.get(agency.admin_user_id) || null : null,
        lastActiveAt: ownerProfile?.last_active_at || null,
        profileUpdatedAt: ownerProfile?.updated_at || null,
        recordUpdatedAt: agency.updated_at || null,
      },
    ];

    for (const agent of agents) {
      const profile = agent.user_id ? profileByUser.get(agent.user_id) : null;
      rows.push({
        id: agent.id,
        role: 'Agent',
        name: agent.name,
        email: agent.email,
        userId: agent.user_id,
        emailStatus: agent.email ? latestEmailByKey.get(`agent-welcome:${agent.email.toLowerCase()}`) || null : null,
        token: agent.user_id ? latestTokenByKey.get(`${agent.user_id}:agent_setup`) || null : null,
        passwordCompletedAt: agent.user_id ? setupCompletedByUser.get(agent.user_id) || null : null,
        lastActiveAt: agent.last_active_at || profile?.last_active_at || null,
        profileUpdatedAt: profile?.updated_at || null,
        recordUpdatedAt: agent.updated_at || null,
      });
    }

    return rows;
  }, [agency, agents, monitor.data]);

  const stats = useMemo(() => {
    const total = people.length;
    return {
      total,
      emailsSent: people.filter((p) => p.emailStatus?.status === 'sent' || p.emailStatus?.status === 'pending').length,
      passwordsSet: people.filter((p) => p.passwordCompletedAt || p.token?.used_at).length,
      active: people.filter((p) => p.lastActiveAt).length,
      issues: people.filter((p) => getPersonIssue(p)).length,
    };
  }, [people]);

  const handoverAudit = monitor.data?.audit.find((entry) => entry.action === 'agency_handed_over') || null;

  async function copySetupLink(person: MonitorPerson) {
    if (!person.token || person.token.used_at) return;
    await navigator.clipboard.writeText(`${APP_URL}/auth/setup-password?token=${person.token.token}`);
    toast.success('Setup link copied');
  }

  async function issueFreshLink(person: MonitorPerson) {
    if (!person.userId) return;
    const purpose = person.role === 'Owner' ? 'owner_setup' : 'agent_setup';
    const result = await resend.mutateAsync({ userId: person.userId, purpose });
    await navigator.clipboard.writeText(`${APP_URL}/auth/setup-password?token=${result.token}`);
    queryClient.invalidateQueries({ queryKey: ['agency-onboarding-monitor', agency.id] });
    toast.success('Fresh setup link copied');
  }

  return (
    <Card className="p-6 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Onboarding Monitor
          </h2>
          <p className="text-sm text-muted-foreground">
            Admin-only view of welcome emails, password setup, and first portal activity.
          </p>
          {handoverAudit && (
            <p className="text-xs text-muted-foreground mt-1">
              Last handover {relative(handoverAudit.created_at)}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => monitor.refetch()}
          disabled={monitor.isFetching}
          className="gap-2"
        >
          <RefreshCw className={monitor.isFetching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat icon={Users} label="People" value={stats.total} />
        <Stat icon={Mail} label="Emails logged" value={stats.emailsSent} />
        <Stat icon={KeyRound} label="Passwords set" value={stats.passwordsSet} />
        <Stat icon={UserCheck} label="Portal active" value={stats.active} />
        <Stat icon={AlertTriangle} label="Needs attention" value={stats.issues} />
      </div>

      {monitor.isLoading ? (
        <div className="rounded-lg border p-6 text-sm text-muted-foreground">Loading onboarding status…</div>
      ) : monitor.isError ? (
        <div className="rounded-lg border p-4 text-sm text-destructive">
          Could not load onboarding monitor: {(monitor.error as any)?.message || 'Unknown error'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Person</th>
                <th className="px-3 py-2 text-left font-medium">Email</th>
                <th className="px-3 py-2 text-left font-medium">Password setup</th>
                <th className="px-3 py-2 text-left font-medium">Portal activity</th>
                <th className="px-3 py-2 text-left font-medium">Issue</th>
                <th className="px-3 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {people.map((person) => {
                const issue = getPersonIssue(person);
                return (
                  <tr key={person.id}>
                    <td className="px-3 py-3 align-top">
                      <div className="font-medium text-foreground">{person.name}</div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <Badge variant={person.role === 'Owner' ? 'default' : 'secondary'}>{person.role}</Badge>
                        {!person.userId && <Badge variant="outline">No account</Badge>}
                      </div>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <StatusBadge status={person.emailStatus?.status || null} fallback={person.email ? 'Not sent yet' : 'No email'} />
                      {person.emailStatus?.created_at && (
                        <div className="text-xs text-muted-foreground mt-1">{relative(person.emailStatus.created_at)}</div>
                      )}
                      {person.emailStatus?.error_message && (
                        <div className="text-xs text-destructive mt-1 max-w-[220px] truncate">{person.emailStatus.error_message}</div>
                      )}
                    </td>
                    <td className="px-3 py-3 align-top">
                      {person.passwordCompletedAt || person.token?.used_at ? (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Set
                        </Badge>
                      ) : person.token ? (
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" /> Link unused
                        </Badge>
                      ) : person.userId ? (
                        <Badge variant="outline">No link</Badge>
                      ) : (
                        <Badge variant="outline">Not provisioned</Badge>
                      )}
                      {(person.passwordCompletedAt || person.token?.used_at || person.token?.created_at) && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {person.passwordCompletedAt
                            ? `Completed ${relative(person.passwordCompletedAt)}`
                            : person.token?.used_at
                              ? `Used ${relative(person.token.used_at)}`
                              : `Issued ${relative(person.token!.created_at)}`}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 align-top">
                      {person.lastActiveAt ? (
                        <Badge variant="secondary" className="gap-1">
                          <UserCheck className="h-3 w-3" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="outline">No activity yet</Badge>
                      )}
                      {person.lastActiveAt && (
                        <div className="text-xs text-muted-foreground mt-1">{relative(person.lastActiveAt)}</div>
                      )}
                    </td>
                    <td className="px-3 py-3 align-top">
                      {issue ? (
                        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <AlertTriangle className="h-3.5 w-3.5 text-destructive mt-0.5" />
                          <span>{issue}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                          Rolling
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 align-top text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copySetupLink(person)}
                          disabled={!person.token || !!person.token.used_at}
                          className="gap-1.5"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Copy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => issueFreshLink(person)}
                          disabled={!person.userId || resend.isPending}
                          className="gap-1.5"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                          Fresh link
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function StatusBadge({ status, fallback }: { status: string | null; fallback: string }) {
  if (!status) return <Badge variant="outline">{fallback}</Badge>;
  if (status === 'sent') return <Badge variant="secondary">Sent</Badge>;
  if (status === 'pending') return <Badge variant="outline">Queued</Badge>;
  if (status === 'suppressed') return <Badge variant="outline">Suppressed</Badge>;
  if (status === 'dlq' || status === 'failed' || status === 'bounced' || status === 'complained') {
    return <Badge variant="destructive">Failed</Badge>;
  }
  return <Badge variant="outline">{status}</Badge>;
}

function getPersonIssue(person: MonitorPerson): string | null {
  const emailStatus = person.emailStatus?.status;
  if (!person.email) return 'Missing email address.';
  if (!person.userId) return 'Account is not provisioned yet.';
  if (!person.emailStatus) return 'Welcome email is not logged yet.';
  if (emailStatus === 'failed' || emailStatus === 'dlq' || emailStatus === 'bounced' || emailStatus === 'complained') {
    return 'Email failed. Check the error and issue a fresh setup link if needed.';
  }
  if (emailStatus === 'suppressed') return 'Email is suppressed for this recipient.';
  if (!person.passwordCompletedAt && !person.token?.used_at) return 'Setup link has not been used yet.';
  if (!person.lastActiveAt) return 'Password is set, but no portal activity is recorded yet.';
  return null;
}

function relative(value: string) {
  return formatDistanceToNow(new Date(value), { addSuffix: true });
}
