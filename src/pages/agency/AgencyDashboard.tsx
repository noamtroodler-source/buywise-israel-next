import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Building2, Users, Home, Eye, Plus, Copy, Check, Loader2, 
  UserPlus, Settings, ExternalLink, ArrowLeft, BadgeCheck, Clock, Hash,
  FileText, Megaphone, Mail, PenLine, CreditCard, Star
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
  useAgencyInvites,
} from '@/hooks/useAgencyManagement';
import { useAgencyAnnouncements } from '@/hooks/useAgencyAnnouncements';
import { useFeaturedListings } from '@/hooks/useFeaturedListings';
import { useMyBlogPosts, useSubmitForReview, useDeleteBlogPost } from '@/hooks/useProfessionalBlog';
import { useBlogQuotaCheck } from '@/hooks/useBlogQuota';
import { BlogArticleTable } from '@/components/blog/BlogArticleTable';
import { BlogQuotaBanner } from '@/components/blog/BlogQuotaBanner';
import { useState } from 'react';
import { toast } from 'sonner';
import { CreateInviteDialog } from '@/components/agency/CreateInviteDialog';
import { AgencyOnboardingProgress } from '@/components/agency/AgencyOnboardingProgress';
import { AgencyAnnouncements } from '@/components/agency/AgencyAnnouncements';
import { AgencyNotificationBell } from '@/components/agency/AgencyNotificationBell';
import { AgencyPerformanceInsights } from '@/components/agency/AgencyPerformanceInsights';
import { SubscriptionStatusCard } from '@/components/billing/SubscriptionStatusCard';
import { NoPlanBanner } from '@/components/billing/NoPlanBanner';
import { UsageMeters } from '@/components/billing/UsageMeters';
import { useSeatLimitCheck } from '@/hooks/useSeatLimitCheck';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SeatSummaryCard } from '@/components/agency/SeatSummaryCard';
import { SeatManagementPanel } from '@/components/agency/SeatManagementPanel';
import { SeatOverageConsentDialog } from '@/components/agency/SeatOverageConsentDialog';

export default function AgencyDashboard() {
  const { data: agency, isLoading: agencyLoading } = useMyAgency();
  const { data: team = [] } = useAgencyTeam(agency?.id);
  const { data: joinRequests = [] } = useAgencyJoinRequests(agency?.id);
  const { data: invites = [] } = useAgencyInvites(agency?.id);
  const { data: stats } = useAgencyStats(agency?.id);
  const { data: announcements = [] } = useAgencyAnnouncements(agency?.id);
  const { data: featuredListings = [] } = useFeaturedListings(agency?.id);
  const { data: blogPosts = [], isLoading: postsLoading } = useMyBlogPosts('agency', agency?.id);
  const { used: blogQuotaUsed, limit: blogQuotaLimit, canSubmit: canSubmitBlog } = useBlogQuotaCheck('agency', agency?.id);
  const submitForReview = useSubmitForReview();
  const deleteBlogPost = useDeleteBlogPost();
  const approveRequest = useApproveJoinRequest();
  const rejectRequest = useRejectJoinRequest();
  
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [createInviteOpen, setCreateInviteOpen] = useState(false);
  const [consentDialogOpen, setConsentDialogOpen] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<{ requestId: string; agentId: string } | null>(null);
  const { canInvite, currentSeats, maxSeats, isOverLimit, usagePercent: seatUsagePercent } = useSeatLimitCheck();

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
    { label: 'All-Time Views', value: stats?.totalViews || 0, icon: Eye },
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
                <AgencyNotificationBell />
                <Button variant="outline" asChild className="rounded-xl border-primary/20 hover:bg-primary/5">
                  <Link to="/agency/listings">
                    <FileText className="h-4 w-4 mr-2" />
                    Listings
                  </Link>
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button variant="outline" asChild={canSubmitBlog} disabled={!canSubmitBlog} className="rounded-xl border-primary/20 hover:bg-primary/5">
                        {canSubmitBlog ? (
                          <Link to="/agency/blog/new">
                            <PenLine className="h-4 w-4 mr-2" />
                            Blog
                          </Link>
                        ) : (
                          <>
                            <PenLine className="h-4 w-4 mr-2" />
                            Blog
                          </>
                        )}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!canSubmitBlog && (
                    <TooltipContent>Monthly blog limit reached. Resets on the 1st.</TooltipContent>
                  )}
                </Tooltip>
                <Button variant="outline" asChild className="rounded-xl border-primary/20 hover:bg-primary/5">
                  <Link to="/agency/analytics">
                    <Eye className="h-4 w-4 mr-2" />
                    Analytics
                  </Link>
                </Button>
                <Button variant="outline" asChild className="rounded-xl border-primary/20 hover:bg-primary/5">
                  <Link to="/agency/billing">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Billing
                  </Link>
                </Button>
                <Button variant="outline" asChild className="rounded-xl border-primary/20 hover:bg-primary/5">
                  <Link to="/agency/featured">
                    <Star className="h-4 w-4 mr-2" />
                    Featured
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

          {/* No Plan Activation Banner */}
          <NoPlanBanner />

          {/* Subscription Status */}
          <SubscriptionStatusCard />

          {/* Usage Meters */}
          <UsageMeters entityType="agency" authorType="agency" profileId={agency?.id} />

          {/* Performance Insights */}
          <AgencyPerformanceInsights />

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

          {/* Onboarding Progress */}
          <AgencyOnboardingProgress agency={agency} teamCount={team.length} listingsCount={stats?.activeListings} />

          {/* Featured Listings Summary */}
          <Card className="rounded-2xl border-primary/10 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Star className="h-5 w-5 text-primary" />
                Featured Listings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Feature your listings across BuyWise Israel for ₪299/month each. Featured listings get priority placement and a "Featured" badge.
              </p>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-2xl font-bold">{featuredListings.length}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    ₪{(featuredListings.filter(fl => !fl.is_free_credit).length * 299).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Monthly</p>
                </div>
              </div>
              <Button variant="outline" asChild className="rounded-xl border-primary/20 hover:bg-primary/5">
                <Link to="/agency/featured">
                  <Star className="h-4 w-4 mr-2" />
                  Manage Featured Listings
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Tabs defaultValue="team">
            <TabsList className="bg-muted/50 border border-border/50 rounded-xl p-1 flex-wrap h-auto">
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
              <TabsTrigger value="announcements" className="gap-2 rounded-lg">
                <Megaphone className="h-4 w-4" />
                Announcements
                {announcements.filter(a => a.is_pinned).length > 0 && (
                  <Badge variant="secondary">{announcements.filter(a => a.is_pinned).length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="blog" className="gap-2 rounded-lg">
                <PenLine className="h-4 w-4" />
                Blog
                {blogPosts.length > 0 && (
                  <Badge variant="secondary">{blogPosts.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="team" className="space-y-4 mt-4">
              <SeatSummaryCard />
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

              {/* All Invite Codes */}
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
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-1" />
                                Copy Link
                              </>
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
                                <Badge variant="secondary" className="text-xs">
                                  {invite.label}
                                </Badge>
                              )}
                              {!invite.is_active && (
                                <Badge variant="outline" className="text-xs text-destructive border-destructive/30">
                                  Deactivated
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              {invite.uses_remaining !== null && (
                                <span>{invite.uses_remaining} uses left</span>
                              )}
                              {invite.expires_at && (
                                <span>Expires: {new Date(invite.expires_at).toLocaleDateString()}</span>
                              )}
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
                                <>
                                  <Check className="h-4 w-4 mr-1" />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="h-4 w-4 mr-1" />
                                  Copy
                                </>
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

            <TabsContent value="announcements" className="space-y-4 mt-4">
              <AgencyAnnouncements agencyId={agency.id} />
            </TabsContent>

            <TabsContent value="blog" className="space-y-4 mt-4">
              {!canSubmitBlog && blogQuotaLimit !== null && (
                <BlogQuotaBanner used={blogQuotaUsed} limit={blogQuotaLimit} />
              )}
              <Card className="rounded-2xl border-primary/10">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent rounded-t-2xl flex flex-row items-center justify-between">
                  <CardTitle>Agency Articles</CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button asChild={canSubmitBlog} disabled={!canSubmitBlog} className="rounded-xl">
                          {canSubmitBlog ? (
                            <Link to="/agency/blog/new">
                              <Plus className="h-4 w-4 mr-2" />
                              Write Article
                            </Link>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Write Article
                            </>
                          )}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!canSubmitBlog && (
                      <TooltipContent>Monthly blog limit reached ({blogQuotaUsed}/{blogQuotaLimit}). Resets on the 1st.</TooltipContent>
                    )}
                  </Tooltip>
                </CardHeader>
                <CardContent className="pt-4">
                  <BlogArticleTable 
                    posts={blogPosts} 
                    isLoading={postsLoading}
                    editBasePath="/agency/blog"
                    onSubmitForReview={(postId) => submitForReview.mutate(postId)}
                    onDelete={(postId) => deleteBlogPost.mutate(postId)}
                    isSubmitting={submitForReview.isPending}
                    isDeleting={deleteBlogPost.isPending}
                    quotaUsed={blogQuotaUsed}
                    quotaLimit={blogQuotaLimit}
                    canSubmitQuota={canSubmitBlog}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Create Invite Dialog */}
      <CreateInviteDialog 
        agencyId={agency.id}
        open={createInviteOpen}
        onOpenChange={setCreateInviteOpen}
      />

      {/* Seat Overage Consent Dialog */}
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
