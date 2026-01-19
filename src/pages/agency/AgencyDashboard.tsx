import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Building2, Users, Home, Eye, Plus, Copy, Check, Loader2, 
  UserPlus, Settings, ExternalLink, ArrowLeft, BadgeCheck, Clock
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
  useAgencyStats,
  useApproveJoinRequest,
  useRejectJoinRequest,
} from '@/hooks/useAgencyManagement';
import { useState } from 'react';
import { toast } from 'sonner';

export default function AgencyDashboard() {
  const { data: agency, isLoading: agencyLoading } = useMyAgency();
  const { data: team = [] } = useAgencyTeam(agency?.id);
  const { data: joinRequests = [] } = useAgencyJoinRequests(agency?.id);
  const { data: stats } = useAgencyStats(agency?.id);
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
          <div className="h-20 w-20 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-6">
            <Building2 className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h1 className="text-2xl font-bold mb-2">No Agency Found</h1>
          <p className="text-muted-foreground mb-6">
            You don't have an agency registered yet.
          </p>
          <Button asChild className="rounded-xl">
            <Link to="/agency/register">
              <Plus className="h-4 w-4 mr-2" />
              Register Your Agency
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const statCards = [
    { label: 'Team Members', value: stats?.totalAgents || 0, icon: Users },
    { label: 'Active Listings', value: stats?.activeListings || 0, icon: Home },
    { label: 'Pending Review', value: stats?.pendingListings || 0, icon: Clock },
    { label: 'Total Views', value: stats?.totalViews || 0, icon: Eye },
  ];

  return (
    <Layout>
      <div className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Premium Header with gradient */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.08),transparent_50%)]" />
            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild className="rounded-xl hover:bg-primary/10 flex-shrink-0">
                  <Link to="/">
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <div className="h-14 w-14 rounded-2xl bg-primary/10 shadow-sm flex items-center justify-center">
                  <Building2 className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-foreground">{agency.name}</h1>
                    {agency.is_verified && (
                      <BadgeCheck className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <p className="text-muted-foreground">Agency Dashboard</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" asChild className="rounded-xl border-primary/20 hover:bg-primary/5">
                  <Link to="/agency/analytics">
                    <Eye className="h-4 w-4 mr-2" />
                    Analytics
                  </Link>
                </Button>
                <Button variant="outline" asChild className="rounded-xl border-primary/20 hover:bg-primary/5">
                  <Link to="/agency/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </Button>
                <Button variant="outline" asChild className="rounded-xl border-primary/20 hover:bg-primary/5">
                  <Link to={`/agencies/${agency.slug}`}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Public Page
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Stats with animations */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-primary/10 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl hover:border-primary/20 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-primary/10">
                        <stat.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="team">
            <TabsList className="bg-muted/50 border border-border/50 rounded-xl p-1">
              <TabsTrigger value="team" className="gap-2 rounded-lg">
                <Users className="h-4 w-4" />
                Team
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

            <TabsContent value="team" className="space-y-4 mt-4">
              <Card className="rounded-2xl border-primary/10">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent rounded-t-2xl flex flex-row items-center justify-between">
                  <CardTitle>Team Members</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {team.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                        <Users className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                      <p className="font-medium text-foreground mb-1">No team members yet</p>
                      <p className="text-sm">Share your invite code to add agents to your agency</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {team.map((agent, index) => (
                        <motion.div
                          key={agent.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
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
                              <Badge variant="outline" className="border-primary/30 text-primary">Verified</Badge>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
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
                          <Button
                            size="sm"
                            className="rounded-xl"
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

              {/* Invite Code */}
              <Card className="rounded-2xl border-primary/10">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent rounded-t-2xl">
                  <CardTitle>Invite Code</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {agency.default_invite_code && (
                    <div className="p-5 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                            <Copy className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-primary">Default Invite Code</p>
                            <p className="text-xl font-mono font-bold tracking-wider">{agency.default_invite_code}</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl border-primary/30 hover:bg-primary/10"
                          onClick={() => copyToClipboard(agency.default_invite_code!)}
                        >
                          {copiedCode === agency.default_invite_code ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        Share this code with agents to let them join your agency
                      </p>
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
