import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Building2, Users, Home, Eye, Plus, Copy, Check, Loader2, 
  UserPlus, Settings, ExternalLink 
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useMyAgency, 
  useAgencyTeam, 
  useAgencyJoinRequests,
  useAgencyInvites,
  useAgencyStats,
  useCreateInviteCode,
  useApproveJoinRequest,
  useRejectJoinRequest,
} from '@/hooks/useAgencyManagement';
import { useState } from 'react';
import { toast } from 'sonner';

export default function AgencyDashboard() {
  const { data: agency, isLoading: agencyLoading } = useMyAgency();
  const { data: team = [] } = useAgencyTeam(agency?.id);
  const { data: joinRequests = [] } = useAgencyJoinRequests(agency?.id);
  const { data: invites = [] } = useAgencyInvites(agency?.id);
  const { data: stats } = useAgencyStats(agency?.id);
  const createInvite = useCreateInviteCode();
  const approveRequest = useApproveJoinRequest();
  const rejectRequest = useRejectJoinRequest();
  
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (agencyLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!agency) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">No Agency Found</h1>
          <p className="text-muted-foreground mb-6">
            You don't have an agency registered yet.
          </p>
          <Button asChild>
            <Link to="/agency/register">
              <Plus className="h-4 w-4 mr-2" />
              Register Your Agency
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{agency.name}</h1>
                <p className="text-muted-foreground">Agency Dashboard</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to={`/agencies/${agency.slug}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Public Page
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.totalAgents || 0}</p>
                    <p className="text-xs text-muted-foreground">Team Members</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-50">
                    <Home className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.activeListings || 0}</p>
                    <p className="text-xs text-muted-foreground">Active Listings</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-50">
                    <Home className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.pendingListings || 0}</p>
                    <p className="text-xs text-muted-foreground">Pending Review</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <Eye className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.totalViews || 0}</p>
                    <p className="text-xs text-muted-foreground">Total Views</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="team">
            <TabsList>
              <TabsTrigger value="team" className="gap-2">
                <Users className="h-4 w-4" />
                Team
                {team.length > 0 && <Badge variant="secondary">{team.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="invites" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Invites
                {joinRequests.length > 0 && (
                  <Badge variant="destructive">{joinRequests.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="team" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Team Members</CardTitle>
                </CardHeader>
                <CardContent>
                  {team.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No team members yet</p>
                      <p className="text-sm">Share your invite code to add agents</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {team.map((agent) => (
                        <div key={agent.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium">
                                {agent.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{agent.name}</p>
                              <p className="text-sm text-muted-foreground">{agent.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                              {agent.status}
                            </Badge>
                            {agent.is_verified && (
                              <Badge variant="outline" className="text-green-600">Verified</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="invites" className="space-y-4">
              {/* Join Requests */}
              {joinRequests.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Join Requests</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {joinRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{request.agent.name}</p>
                          <p className="text-sm text-muted-foreground">{request.agent.email}</p>
                          {request.agent.license_number && (
                            <p className="text-xs text-muted-foreground">
                              License: {request.agent.license_number}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => approveRequest.mutate({
                              requestId: request.id,
                              agentId: request.agent_id,
                              agencyId: agency.id,
                            })}
                            disabled={approveRequest.isPending}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectRequest.mutate({ requestId: request.id })}
                            disabled={rejectRequest.isPending}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Invite Codes */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Invite Codes</CardTitle>
                  <Button
                    size="sm"
                    onClick={() => createInvite.mutate({ agencyId: agency.id })}
                    disabled={createInvite.isPending}
                  >
                    {createInvite.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-1" />
                        New Code
                      </>
                    )}
                  </Button>
                </CardHeader>
                <CardContent>
                  {/* Default Code */}
                  {agency.default_invite_code && (
                    <div className="mb-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-primary">Default Invite Code</p>
                          <p className="text-lg font-mono font-bold">{agency.default_invite_code}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(agency.default_invite_code!)}
                        >
                          {copiedCode === agency.default_invite_code ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Share this code with agents to let them join your agency
                      </p>
                    </div>
                  )}

                  {/* Other Codes */}
                  {invites.filter(i => i.code !== agency.default_invite_code).length > 0 && (
                    <div className="space-y-2">
                      {invites
                        .filter(i => i.code !== agency.default_invite_code)
                        .map((invite) => (
                          <div key={invite.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div>
                              <p className="font-mono font-medium">{invite.code}</p>
                              <p className="text-xs text-muted-foreground">
                                {invite.uses_remaining !== null
                                  ? `${invite.uses_remaining} uses remaining`
                                  : 'Unlimited uses'}
                                {!invite.is_active && ' • Inactive'}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(invite.code)}
                            >
                              {copiedCode === invite.code ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </Layout>
  );
}
