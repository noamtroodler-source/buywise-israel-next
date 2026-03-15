import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Users, UserPlus, Plus, Copy, Check, Hash, Loader2, ShieldAlert
} from 'lucide-react';
import { EnhancedEmptyState } from '@/components/shared/EnhancedEmptyState';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useMyAgency, 
  useAgencyTeam, 
  useAgencyJoinRequests,
  useApproveJoinRequest,
  useRejectJoinRequest,
  useAgencyInvites,
} from '@/hooks/useAgencyManagement';
import { useSeatLimitCheck } from '@/hooks/useSeatLimitCheck';
import { SeatSummaryCard } from '@/components/agency/SeatSummaryCard';
import { SeatManagementPanel } from '@/components/agency/SeatManagementPanel';
import { SeatOverageConsentDialog } from '@/components/agency/SeatOverageConsentDialog';
import { CreateInviteDialog } from '@/components/agency/CreateInviteDialog';
import { useState } from 'react';
import { toast } from 'sonner';
import { AgencyTeamSkeleton } from '@/components/agency/skeletons/AgencyPageSkeletons';

export default function AgencyTeam() {
  const { data: agency, isLoading, isAgencyAdmin } = useMyAgency();
  const { data: team = [] } = useAgencyTeam(agency?.id);
  const { data: joinRequests = [] } = useAgencyJoinRequests(agency?.id);
  const { data: invites = [] } = useAgencyInvites(agency?.id);
  const approveRequest = useApproveJoinRequest();
  const rejectRequest = useRejectJoinRequest();
  const { canInvite, currentSeats, maxSeats, isOverLimit } = useSeatLimitCheck();

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [createInviteOpen, setCreateInviteOpen] = useState(false);
  const [consentDialogOpen, setConsentDialogOpen] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<{ requestId: string; agentId: string } | null>(null);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (isLoading) {
    return <AgencyTeamSkeleton />;
  }

  if (agency && !isAgencyAdmin) {
    return (
      <Layout>
        <div className="container py-16 max-w-lg">
          <EnhancedEmptyState
            icon={ShieldAlert}
            title="Admin access required"
            description="Only the agency admin can manage the team."
            primaryAction={{ label: 'Back to Dashboard', href: '/agency' }}
          />
        </div>
      </Layout>
    );
  }

  if (!agency) {
    return (
      <Layout>
        <div className="container py-16">
          <EnhancedEmptyState
            icon={Users}
            title="No Agency Found"
            description="You need an agency to manage your team."
            primaryAction={{ label: 'Go to Agency', href: '/agency' }}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="rounded-xl hover:bg-primary/10">
            <Link to="/agency">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Team Management</h1>
          </div>
        </div>

        <SeatSummaryCard />

        <Tabs defaultValue="members">
          <TabsList className="bg-muted/50 border border-border/50 rounded-xl p-1">
            <TabsTrigger value="members" className="gap-2 rounded-lg">
              <Users className="h-4 w-4" />
              Members
              {team.length > 0 && <Badge variant="secondary">{team.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="invites" className="gap-2 rounded-lg">
              <UserPlus className="h-4 w-4" />
              Invites
              {joinRequests.length > 0 && (
                <Badge className="bg-primary/20 text-primary hover:bg-primary/20">{joinRequests.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="mt-4">
            <Card className="rounded-2xl border-primary/10">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent rounded-t-2xl">
                <CardTitle>Team Members</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <SeatManagementPanel agents={team} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invites" className="space-y-4 mt-4">
            {/* Join Requests */}
            {joinRequests.length > 0 && (
              <Card className="rounded-2xl border-primary/10">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent rounded-t-2xl">
                  <CardTitle>Pending Join Requests</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  {joinRequests.map((request, index) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {request.agent.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{request.agent.name}</p>
                          <p className="text-sm text-muted-foreground">{request.agent.email}</p>
                          {request.agent.license_number && (
                            <p className="text-xs text-muted-foreground">
                              License: {request.agent.license_number}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                size="sm"
                                className="rounded-xl"
                                onClick={() => {
                                  if (isOverLimit) {
                                    setPendingApproval({ requestId: request.id, agentId: request.agent_id });
                                    setConsentDialogOpen(true);
                                  } else {
                                    approveRequest.mutate({
                                      requestId: request.id,
                                      agentId: request.agent_id,
                                      agencyId: agency.id,
                                    });
                                  }
                                }}
                                disabled={approveRequest.isPending || !canInvite}
                              >
                                Approve
                              </Button>
                            </span>
                          </TooltipTrigger>
                          {!canInvite && (
                            <TooltipContent>
                              Seat limit reached ({currentSeats}/{maxSeats}). Upgrade to approve more agents.
                            </TooltipContent>
                          )}
                        </Tooltip>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => rejectRequest.mutate({ requestId: request.id })}
                          disabled={rejectRequest.isPending}
                        >
                          Reject
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Invite Codes */}
            <Card className="rounded-2xl border-primary/10">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent rounded-t-2xl flex flex-row items-center justify-between">
                <CardTitle>Invite Codes</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button 
                        size="sm" 
                        className="rounded-xl"
                        onClick={() => setCreateInviteOpen(true)}
                        disabled={!canInvite}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        New Code
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!canInvite && (
                    <TooltipContent>
                      You've used {currentSeats}/{maxSeats} team seats. Upgrade your plan to add more.
                    </TooltipContent>
                  )}
                </Tooltip>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {/* Default Invite Code */}
                {agency.default_invite_code && (() => {
                  const inviteLink = `${window.location.origin}/auth?role=agent&tab=signup&code=${agency.default_invite_code}`;
                  return (
                    <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <Hash className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-xl font-bold font-mono tracking-wider text-foreground">
                                {agency.default_invite_code}
                              </p>
                              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                                Default
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate" title={inviteLink}>
                              {inviteLink}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl border-primary/30 hover:bg-primary/10 flex-shrink-0"
                          onClick={() => copyToClipboard(inviteLink)}
                        >
                          {copiedCode === inviteLink ? (
                            <><Check className="h-4 w-4 mr-1" />Copied</>
                          ) : (
                            <><Copy className="h-4 w-4 mr-1" />Copy Link</>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })()}

                {/* Custom Invite Codes */}
                {invites.filter(invite => invite.code !== agency?.default_invite_code).map((invite, index) => {
                  const inviteLink = `${window.location.origin}/auth?role=agent&tab=signup&code=${invite.code}`;
                  return (
                    <motion.div
                      key={invite.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-xl border ${invite.is_active ? 'bg-muted/30 border-border/50' : 'bg-muted/20 border-border/30 opacity-60'}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-lg font-bold font-mono tracking-wider">
                              {invite.code}
                            </p>
                            {invite.label && (
                              <Badge variant="secondary" className="text-xs">{invite.label}</Badge>
                            )}
                            {!invite.is_active && (
                              <Badge variant="outline" className="text-xs text-destructive border-destructive/30">
                                Deactivated
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            {invite.uses_remaining !== null && <span>{invite.uses_remaining} uses left</span>}
                            {invite.expires_at && <span>Expires: {new Date(invite.expires_at).toLocaleDateString()}</span>}
                          </div>
                        </div>
                        {invite.is_active && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl border-primary/30 hover:bg-primary/10 flex-shrink-0"
                            onClick={() => copyToClipboard(inviteLink)}
                          >
                            {copiedCode === inviteLink ? (
                              <><Check className="h-4 w-4 mr-1" />Copied</>
                            ) : (
                              <><Copy className="h-4 w-4 mr-1" />Copy</>
                            )}
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}

                <p className="text-xs text-muted-foreground">
                  Share invite codes with agents to let them sign up and join your agency instantly
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <CreateInviteDialog 
        agencyId={agency.id}
        open={createInviteOpen}
        onOpenChange={setCreateInviteOpen}
      />

      {maxSeats !== null && (
        <SeatOverageConsentDialog
          open={consentDialogOpen}
          onOpenChange={setConsentDialogOpen}
          currentSeats={currentSeats}
          maxSeats={maxSeats}
          isLoading={approveRequest.isPending}
          onConfirm={() => {
            if (pendingApproval) {
              approveRequest.mutate({
                requestId: pendingApproval.requestId,
                agentId: pendingApproval.agentId,
                agencyId: agency.id,
              });
              setPendingApproval(null);
            }
          }}
        />
      )}
    </Layout>
  );
}
