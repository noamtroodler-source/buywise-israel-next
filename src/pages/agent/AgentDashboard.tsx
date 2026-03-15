import { useState, useMemo, useEffect, useCallback } from 'react';
import { useQueryClient, useIsFetching } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2, Plus, Eye, Home, BarChart3, FileText, Clock,
  CheckCircle, AlertCircle, Settings, RefreshCw, ShieldCheck, ShieldAlert,
  ArrowLeft, X, PartyPopper, Mail, PenLine, ExternalLink, MessageSquare,
  BadgeCheck, Star
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { PullToRefresh } from '@/components/shared/PullToRefresh';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLeadStats } from '@/hooks/useAgentLeads';
import { useAgentProfile, useAgentProperties, AgentProperty } from '@/hooks/useAgentProperties';
import { OnboardingChecklist } from '@/components/agent/OnboardingChecklist';
import { NotificationBell } from '@/components/agent/NotificationBell';
import { STALE_THRESHOLD_DAYS } from '@/hooks/useAgentProfile';
import { differenceInDays, parseISO, format, isToday, isYesterday } from 'date-fns';
import { useAdvertiserTracking } from '@/hooks/useAdvertiserTracking';
import { useMyAgentPerformance } from '@/hooks/useMyAgentPerformance';
import { PerformanceInsights } from '@/components/agent/PerformanceInsights';
import { useBlogQuotaCheck } from '@/hooks/useBlogQuota';
import { useMyBlogPosts } from '@/hooks/useProfessionalBlog';
import { useIsMobile } from '@/hooks/use-mobile';
import { WidgetErrorBoundary } from '@/components/shared/WidgetErrorBoundary';
import {
  SnapshotStripSkeleton,
  QuickActionsSkeleton,
  PerformanceSkeleton,
  RecentPropertiesSkeleton,
  SidebarCardSkeleton,
  HeaderSkeleton,
} from '@/components/agent/DashboardSkeletons';

export default function AgentDashboard() {
  const { data: agentProfile, isLoading: profileLoading } = useAgentProfile();
  const { data: properties = [], isLoading: propertiesLoading } = useAgentProperties();
  const { data: leadStats } = useLeadStats();
  const { trackDashboardView } = useAdvertiserTracking();
  const { used: blogQuotaUsed, limit: blogQuotaLimit, canSubmit: canSubmitBlog, isLoading: blogQuotaLoading } = useBlogQuotaCheck('agent', agentProfile?.id);
  const { data: blogPosts = [] } = useMyBlogPosts('agent', agentProfile?.id);
  const isMobile = useIsMobile();
  const { data: performanceData, isLoading: performanceLoading } = useMyAgentPerformance();
  const queryClient = useQueryClient();
  const isFetchingAny = useIsFetching({ queryKey: ['agentProperties'] }) + useIsFetching({ queryKey: ['my-agent-performance'] }) + useIsFetching({ queryKey: ['leadStats'] });
  const [isManualRefresh, setIsManualRefresh] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsManualRefresh(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['agentProperties'] }),
      queryClient.invalidateQueries({ queryKey: ['my-agent-performance'] }),
      queryClient.invalidateQueries({ queryKey: ['leadStats'] }),
      queryClient.invalidateQueries({ queryKey: ['agentProfile'] }),
    ]);
    // Small delay so the spinner is visible
    await new Promise(r => setTimeout(r, 400));
    setIsManualRefresh(false);
  }, [queryClient]);

  // Track dashboard view on mount
  useEffect(() => {
    if (agentProfile?.id) {
      trackDashboardView(agentProfile.id, 'agent', 'dashboard');
    }
  }, [agentProfile?.id, trackDashboardView]);


  // Track dismissed approval alerts
  const [dismissedApprovals, setDismissedApprovals] = useState<string[]>(() => {
    const stored = localStorage.getItem('dismissed-approval-alerts');
    return stored ? JSON.parse(stored) : [];
  });
  const [showAllApproved, setShowAllApproved] = useState(false);

  // Recently approved properties (within 7 days)
  const recentlyApproved = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return properties.filter(p => {
      if ((p as any).verification_status !== 'approved' || !(p as any).reviewed_at) return false;
      if (dismissedApprovals.includes(p.id)) return false;
      return parseISO((p as any).reviewed_at) >= sevenDaysAgo;
    }).sort((a, b) =>
      new Date((b as any).reviewed_at!).getTime() - new Date((a as any).reviewed_at!).getTime()
    );
  }, [properties, dismissedApprovals]);

  const visibleApproved = showAllApproved ? recentlyApproved : recentlyApproved.slice(0, 3);

  const handleDismissApproval = (propertyId: string) => {
    const updated = [...dismissedApprovals, propertyId];
    setDismissedApprovals(updated);
    localStorage.setItem('dismissed-approval-alerts', JSON.stringify(updated));
  };
  const handleDismissAllApprovals = () => {
    const allIds = recentlyApproved.map(p => p.id);
    const updated = [...dismissedApprovals, ...allIds];
    setDismissedApprovals(updated);
    localStorage.setItem('dismissed-approval-alerts', JSON.stringify(updated));
    setShowAllApproved(false);
  };

  const formatApprovalDate = (dateString: string) => {
    const date = parseISO(dateString);
    const time = format(date, 'h:mm a');
    if (isToday(date)) return `Today at ${time}`;
    if (isYesterday(date)) return `Yesterday at ${time}`;
    return `${format(date, 'MMM d, yyyy')} at ${time}`;
  };

  // Status counts
  const statusCounts = {
    draft: properties.filter(p => (p as any).verification_status === 'draft').length,
    pending_review: properties.filter(p => (p as any).verification_status === 'pending_review').length,
    changes_requested: properties.filter(p => (p as any).verification_status === 'changes_requested').length,
    approved: properties.filter(p => (p as any).verification_status === 'approved').length,
    rejected: properties.filter(p => (p as any).verification_status === 'rejected').length,
  };
  const totalViews = properties.reduce((sum, p) => sum + (p.views_count || 0), 0);

  // Stale listings
  const staleListings = useMemo(() => {
    const now = new Date();
    return properties.filter(p => {
      if ((p as any).verification_status !== 'approved') return false;
      const renewedAt = (p as any).last_renewed_at || p.created_at;
      if (!renewedAt) return false;
      return differenceInDays(now, parseISO(renewedAt)) >= STALE_THRESHOLD_DAYS;
    });
  }, [properties]);

  // Snapshot strip data
  const snapshotItems = [
    { label: 'live', value: statusCounts.approved },
    ...(statusCounts.draft > 0 ? [{ label: 'drafts', value: statusCounts.draft }] : []),
    ...(statusCounts.pending_review > 0 ? [{ label: 'pending', value: statusCounts.pending_review }] : []),
    { label: 'total views', value: totalViews },
  ];

  // Quick actions grid
  const quickActions = [
    { label: 'Listings', icon: FileText, href: '/agent/properties', count: statusCounts.approved, color: 'text-primary', bg: 'bg-primary/10', hoverBg: 'hover:bg-primary/5' },
    { label: 'Leads', icon: MessageSquare, href: '/agent/leads', badge: leadStats?.new && leadStats.new > 0 ? `${leadStats.new} new` : undefined, color: 'text-primary', bg: 'bg-primary/10', hoverBg: 'hover:bg-primary/5' },
    { label: 'Analytics', icon: BarChart3, href: '/agent/analytics', color: 'text-primary', bg: 'bg-primary/10', hoverBg: 'hover:bg-primary/5' },
    { label: 'Blog', icon: PenLine, href: '/agent/blog', count: blogPosts.length, color: 'text-primary', bg: 'bg-primary/10', hoverBg: 'hover:bg-primary/5' },
    { label: 'Settings', icon: Settings, href: '/agent/settings', color: 'text-primary', bg: 'bg-primary/10', hoverBg: 'hover:bg-primary/5' },
    { label: 'Public Page', icon: ExternalLink, href: agentProfile ? `/agents/${agentProfile.id}` : '#', color: 'text-primary', bg: 'bg-primary/10', hoverBg: 'hover:bg-primary/5' },
  ];

  return (
    <Layout>
      <PullToRefresh onRefresh={handleRefresh} disabled={!isMobile} className="min-h-0">
      <div className="container py-8 pb-24 md:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Compact Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {profileLoading ? (
              <HeaderSkeleton />
            ) : (
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild className="rounded-xl hover:bg-primary/10 flex-shrink-0">
                  <Link to="/">
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-foreground">{agentProfile?.name}</h1>
                    {agentProfile?.status === 'active' && <BadgeCheck className="h-5 w-5 text-primary" />}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {agentProfile?.agency_name || 'Independent Agent'} · Agent Dashboard
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRefresh}
                      disabled={isManualRefresh}
                      className="rounded-xl hover:bg-primary/10"
                    >
                      <RefreshCw className={`h-4 w-4 ${isManualRefresh || isFetchingAny > 0 ? 'animate-spin' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh dashboard</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <NotificationBell />
              <Button variant="ghost" size="icon" asChild className="rounded-xl hover:bg-primary/10">
                <Link to="/agent/settings">
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="rounded-xl border-primary/20 hover:bg-primary/5 hidden sm:inline-flex">
                <Link to={agentProfile ? `/agents/${agentProfile.id}` : '#'}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Public Page
                </Link>
              </Button>
            </div>
          </div>

          {/* Snapshot Strip */}
          {propertiesLoading ? (
            <SnapshotStripSkeleton />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1"
            >
              {snapshotItems.map((item, i) => (
                <span key={item.label} className="flex items-center gap-1.5 text-sm">
                  {i > 0 && <span className="text-muted-foreground/40 mr-1.5">·</span>}
                  <span className="font-semibold text-foreground">{item.value.toLocaleString()}</span>
                  <span className="text-muted-foreground">{item.label}</span>
                </span>
              ))}
            </motion.div>
          )}

          {/* Property Went Live Alerts */}
          {recentlyApproved.length === 1 ? (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-4">
                <button onClick={() => handleDismissApproval(recentlyApproved[0].id)} className="absolute top-3 right-3 p-1 rounded-lg hover:bg-primary/10 transition-colors">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
                <div className="flex items-start gap-4 pr-8">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <PartyPopper className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">Congratulations! Your listing is now live</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      <span className="font-medium text-foreground">"{recentlyApproved[0].title}"</span> was approved {formatApprovalDate((recentlyApproved[0] as any).reviewed_at!)}
                    </p>
                    <Button variant="link" size="sm" asChild className="h-auto p-0 mt-2 text-primary">
                      <Link to={`/properties/${recentlyApproved[0].id}`}>View Listing →</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : recentlyApproved.length >= 2 ? (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-4">
                <button onClick={handleDismissAllApprovals} className="absolute top-3 right-3 p-1 rounded-lg hover:bg-primary/10 transition-colors" title="Dismiss all">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
                <div className="flex items-start gap-4 pr-8">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <PartyPopper className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">🎉 {recentlyApproved.length} Listings Are Now Live!</h3>
                    <p className="text-sm text-muted-foreground">Your properties were approved and are visible to buyers</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 bg-background/50 rounded-lg p-3">
                  {visibleApproved.map((property) => (
                    <div key={property.id} className="flex items-center justify-between text-sm gap-2">
                      <span className="truncate text-foreground font-medium min-w-0 flex-1">"{property.title}"</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-muted-foreground text-xs hidden sm:inline">{formatApprovalDate((property as any).reviewed_at!)}</span>
                        <Link to={`/properties/${property.id}`} className="text-primary hover:text-primary/80 transition-colors"><Eye className="h-4 w-4" /></Link>
                        <button onClick={() => handleDismissApproval(property.id)} className="text-muted-foreground hover:text-foreground transition-colors" title="Dismiss"><X className="h-3 w-3" /></button>
                      </div>
                    </div>
                  ))}
                  {recentlyApproved.length > 3 && !showAllApproved && (
                    <button onClick={() => setShowAllApproved(true)} className="text-sm text-primary hover:underline pt-1">Show {recentlyApproved.length - 3} more</button>
                  )}
                  {showAllApproved && recentlyApproved.length > 3 && (
                    <button onClick={() => setShowAllApproved(false)} className="text-sm text-muted-foreground hover:underline pt-1">Show less</button>
                  )}
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-primary/10">
                  <Button variant="link" asChild className="h-auto p-0 text-primary"><Link to="/agent/properties?tab=approved">View All Live Listings →</Link></Button>
                  <Button variant="ghost" size="sm" onClick={handleDismissAllApprovals} className="text-muted-foreground hover:text-foreground">Dismiss All</Button>
                </div>
              </div>
            </motion.div>
          ) : null}

          {/* Pending Verification Alert */}
          {agentProfile?.status === 'pending' && (
            <Alert className="bg-primary/5 border-primary/20 rounded-xl">
              <ShieldAlert className="h-5 w-5 text-primary" />
              <AlertTitle className="text-foreground">License Verification Pending</AlertTitle>
              <AlertDescription className="text-muted-foreground">
                Your agent license is currently under review. You can create draft listings, but you won't be able to submit them for publication until your account is verified. This typically takes 24-48 hours.
                <br />
                <a href="mailto:hello@buywiseisrael.com" className="text-primary hover:underline font-medium mt-2 inline-block">
                  Questions while you wait? Email us →
                </a>
              </AlertDescription>
            </Alert>
          )}

          {/* Onboarding Checklist */}
          <WidgetErrorBoundary fallbackTitle="Couldn't load onboarding checklist">
            <OnboardingChecklist
              agentProfile={agentProfile}
              properties={properties.map(p => ({
                id: p.id,
                verification_status: (p as any).verification_status,
                views_count: p.views_count,
              }))}
            />
          </WidgetErrorBoundary>

          {/* Quick Actions Grid */}
          {profileLoading ? (
            <QuickActionsSkeleton />
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Link
                    to={action.href}
                    className={`group relative flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border border-border/50 bg-card ${action.hoverBg} hover:border-primary/30 transition-all text-center h-full min-h-[96px]`}
                  >
                    <div className={`p-2.5 rounded-xl ${action.bg} transition-colors`}>
                      <action.icon className={`h-5 w-5 ${action.color}`} />
                    </div>
                    <span className="text-xs font-medium text-foreground">{action.label}</span>
                    {action.badge && (
                      <Badge className="absolute -top-1.5 -right-1.5 text-[10px] px-1.5 py-0 bg-primary text-primary-foreground">
                        {action.badge}
                      </Badge>
                    )}
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {/* Two-Column Layout: Performance + Sidebar */}
          <div className="grid md:grid-cols-5 gap-6 md:items-start">
            {/* Left Column — Performance */}
            <div className="md:col-span-3 space-y-4">
              <WidgetErrorBoundary fallbackTitle="Couldn't load performance data">
                {performanceLoading ? (
                  <PerformanceSkeleton />
                ) : performanceData ? (
                  <PerformanceInsights
                    metrics={{
                      viewsThisWeek: performanceData.viewsThisWeek,
                      viewsLastWeek: performanceData.viewsLastWeek,
                      inquiriesThisWeek: performanceData.inquiriesThisWeek,
                      inquiriesLastWeek: performanceData.inquiriesLastWeek,
                      listingsActive: performanceData.listingsActive,
                      listingsLastWeek: performanceData.listingsLastWeek,
                      conversionRate: performanceData.conversionRate,
                      conversionRateLastWeek: performanceData.conversionRateLastWeek,
                    }}
                    topListingTitle={performanceData.topListingTitle ?? undefined}
                    className="rounded-2xl border-border/50"
                  />
                ) : null}
              </WidgetErrorBoundary>

              {/* Recent Properties */}
              <WidgetErrorBoundary fallbackTitle="Couldn't load recent properties">
                {propertiesLoading ? (
                  <RecentPropertiesSkeleton />
                ) : properties.length === 0 ? (
                  <Card className="rounded-2xl border-border/50">
                    <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="p-3 rounded-xl bg-primary/10 mb-3">
                        <Home className="h-6 w-6 text-primary" />
                      </div>
                      <p className="text-sm font-medium text-foreground">No listings yet</p>
                      <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-xs">
                        Create your first listing to start attracting buyers and tracking performance.
                      </p>
                      <Button asChild size="sm" className="rounded-xl gap-2">
                        <Link to="/agent/properties/new">
                          <Plus className="h-4 w-4" />
                          Create Your First Listing
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="rounded-2xl border-border/50">
                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-primary" />
                          Recent Properties
                        </span>
                        <Button variant="link" size="sm" asChild className="h-auto p-0 text-xs text-primary">
                          <Link to="/agent/properties">View All</Link>
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className="space-y-2">
                        {properties.slice(0, 3).map((property) => (
                          <div key={property.id} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={property.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=100'}
                                alt={property.title}
                                className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="font-medium text-sm line-clamp-1">{property.title}</p>
                                <p className="text-xs text-muted-foreground">{property.city}</p>
                              </div>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-lg font-medium flex-shrink-0 ${
                              (property as any).verification_status === 'approved'
                                ? 'bg-primary/10 text-primary'
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {(property as any).verification_status === 'approved' ? 'Live' :
                               (property as any).verification_status === 'pending_review' ? 'Pending' :
                               (property as any).verification_status === 'changes_requested' ? 'Changes' :
                               'Draft'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </WidgetErrorBoundary>
            </div>

            {/* Right Column — Contextual Sidebar */}
            <div className="md:col-span-2 space-y-4">
              {/* Stale Listings Alert */}
              <WidgetErrorBoundary fallbackTitle="Couldn't load stale listings">
                {staleListings.length > 0 && (
                  <Card className="rounded-2xl border-primary/20 bg-primary/5">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-xl bg-primary/10">
                          <RefreshCw className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Listings Need Renewal</p>
                          <p className="text-xs text-muted-foreground">
                            {staleListings.length} listing{staleListings.length > 1 ? 's' : ''} over {STALE_THRESHOLD_DAYS} days old
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" asChild className="rounded-xl w-full border-primary/30 text-primary hover:bg-primary/10">
                        <Link to="/agent/properties?tab=stale">Renew Now</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </WidgetErrorBoundary>

              {/* Changes Requested Alert */}
              <WidgetErrorBoundary fallbackTitle="Couldn't load action items">
                {statusCounts.changes_requested > 0 && (
                  <Card className="rounded-2xl border-primary/20 bg-primary/5">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-xl bg-primary/10">
                          <AlertCircle className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Action Required</p>
                          <p className="text-xs text-muted-foreground">
                            {statusCounts.changes_requested} listing{statusCounts.changes_requested > 1 ? 's' : ''} need{statusCounts.changes_requested === 1 ? 's' : ''} changes
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" asChild className="rounded-xl w-full border-primary/30 text-primary hover:bg-primary/10">
                        <Link to="/agent/properties?tab=changes_requested">Review</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </WidgetErrorBoundary>

              {/* Homepage Exposure (condensed) */}
              <Card className="rounded-2xl border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <Home className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm font-medium">Homepage Exposure</p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    BuyWise Israel periodically highlights listings on the homepage. Placement is curated and limited.
                  </p>
                  <a
                    href="mailto:hello@buywiseisrael.com"
                    className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:underline"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    hello@buywiseisrael.com
                  </a>
                  <p className="text-[10px] text-muted-foreground/70 mt-2">
                    One listing per agent at a time. Not guaranteed.
                  </p>
                </CardContent>
              </Card>

              {/* Latest Blog Post */}
              {blogPosts.length > 0 && (
                <Link to="/agent/blog" className="block">
                  <Card className="rounded-2xl border-border/50 hover:border-primary/20 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-accent">
                          <PenLine className="h-4 w-4 text-primary" />
                        </div>
                        <p className="text-sm font-medium">Latest Article</p>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                        {blogPosts[0]?.title || 'Untitled'}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {blogPosts[0]?.verification_status || 'draft'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {blogPosts.length} total article{blogPosts.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )}
            </div>
          </div>
        </motion.div>

        {/* Mobile FAB — New Listing */}
        {isMobile && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 260, damping: 20 }}
            className="fixed bottom-20 right-4 z-40"
          >
            <Button asChild size="lg" className="rounded-full h-14 w-14 shadow-lg shadow-primary/25 p-0">
              <Link to="/agent/properties/new">
                <Plus className="h-6 w-6" />
              </Link>
            </Button>
          </motion.div>
        )}
      </div>
      </PullToRefresh>
    </Layout>
  );
}
