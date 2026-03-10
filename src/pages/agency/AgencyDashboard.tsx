import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Building2, Users, Home, Eye, Plus, Loader2, 
  Settings, ExternalLink, ArrowLeft, BadgeCheck, Clock,
  FileText, Megaphone, PenLine, CreditCard, Star,
  BarChart3, AlertCircle
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  useMyAgency, 
  useAgencyTeam, 
  useAgencyJoinRequests,
  useAgencyStats,
} from '@/hooks/useAgencyManagement';
import { useAgencyAnnouncements } from '@/hooks/useAgencyAnnouncements';
import { useFeaturedListings } from '@/hooks/useFeaturedListings';
import { useMyBlogPosts } from '@/hooks/useProfessionalBlog';
import { AgencyNotificationBell } from '@/components/agency/AgencyNotificationBell';
import { AgencyPerformanceInsights } from '@/components/agency/AgencyPerformanceInsights';
import { AgencyOnboardingProgress } from '@/components/agency/AgencyOnboardingProgress';
import { NoPlanBanner } from '@/components/billing/NoPlanBanner';
import { ImportWelcomeBanner } from '@/components/agency/ImportWelcomeBanner';
import { AgencyAnnouncements } from '@/components/agency/AgencyAnnouncements';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useBlogQuotaCheck } from '@/hooks/useBlogQuota';
import { useIsMobile } from '@/hooks/use-mobile';

export default function AgencyDashboard() {
  const { data: agency, isLoading: agencyLoading } = useMyAgency();
  const { data: team = [] } = useAgencyTeam(agency?.id);
  const { data: joinRequests = [] } = useAgencyJoinRequests(agency?.id);
  const { data: stats } = useAgencyStats(agency?.id);
  const { data: announcements = [] } = useAgencyAnnouncements(agency?.id);
  const { data: featuredListings = [] } = useFeaturedListings(agency?.id);
  const { data: blogPosts = [] } = useMyBlogPosts('agency', agency?.id);
  const { canSubmit: canSubmitBlog } = useBlogQuotaCheck('agency', agency?.id);
  const isMobile = useIsMobile();

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

  const pendingRequests = joinRequests.length;

  // Quick action navigation items
  const quickActions = [
    { label: 'Listings', icon: FileText, href: '/agency/listings', count: stats?.activeListings, color: 'text-primary', bg: 'bg-primary/10', hoverBg: 'hover:bg-primary/5' },
    { label: 'Team', icon: Users, href: '/agency/team', count: team.length, badge: pendingRequests > 0 ? `${pendingRequests} pending` : undefined, color: 'text-primary', bg: 'bg-primary/10', hoverBg: 'hover:bg-primary/5' },
    { label: 'Analytics', icon: BarChart3, href: '/agency/analytics', color: 'text-primary', bg: 'bg-primary/10', hoverBg: 'hover:bg-primary/5' },
    { label: 'Blog', icon: PenLine, href: canSubmitBlog ? '/agency/blog/new' : '/agency', count: blogPosts.length, color: 'text-primary', bg: 'bg-primary/10', hoverBg: 'hover:bg-primary/5', disabled: !canSubmitBlog, tooltip: !canSubmitBlog ? 'Blog limit reached' : undefined },
    { label: 'Featured', icon: Star, href: '/agency/featured', count: featuredListings.length, color: 'text-primary', bg: 'bg-primary/10', hoverBg: 'hover:bg-primary/5', subtitle: featuredListings.filter(fl => !fl.is_free_credit).length > 0 ? `₪${(featuredListings.filter(fl => !fl.is_free_credit).length * 299).toLocaleString()}/mo` : undefined },
    { label: 'Billing', icon: CreditCard, href: '/agency/billing', color: 'text-primary', bg: 'bg-primary/10', hoverBg: 'hover:bg-primary/5' },
  ];

  // Snapshot stats for inline strip
  const snapshotItems = [
    { label: 'listings', value: stats?.activeListings || 0 },
    { label: 'agents', value: stats?.totalAgents || 0 },
    { label: 'all-time views', value: stats?.totalViews || 0 },
    ...(stats?.pendingListings ? [{ label: 'pending', value: stats.pendingListings }] : []),
  ];

  return (
    <Layout>
      <div className="container py-8 pb-24 md:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Compact Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
                  <h1 className="text-xl font-bold text-foreground">{agency.name}</h1>
                  {agency.is_verified && <BadgeCheck className="h-5 w-5 text-primary" />}
                </div>
                <p className="text-sm text-muted-foreground">Agency Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AgencyNotificationBell />
              <Button variant="ghost" size="icon" asChild className="rounded-xl hover:bg-primary/10">
                <Link to="/agency/settings">
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="rounded-xl border-primary/20 hover:bg-primary/5">
                <Link to={`/agencies/${agency.slug}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Public Page
                </Link>
              </Button>
            </div>
          </div>

          {/* Snapshot Strip */}
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

          {/* Priority Lane — only show the most urgent banner */}
          <ImportWelcomeBanner activeListings={stats?.activeListings || 0} />
          <NoPlanBanner />

          {/* Onboarding (conditionally shows) */}
          <AgencyOnboardingProgress agency={agency} teamCount={team.length} listingsCount={stats?.activeListings} />

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {quickActions.map((action, index) => {
              const content = (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Link 
                    to={action.disabled ? '#' : action.href}
                    className={`group relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-border/50 bg-card ${action.hoverBg} hover:border-primary/30 transition-all text-center h-full min-h-[120px] ${action.disabled ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <div className={`p-2.5 rounded-xl ${action.bg} transition-colors`}>
                      <action.icon className={`h-5 w-5 ${action.color}`} />
                    </div>
                    <span className="text-xs font-medium text-foreground">{action.label}</span>
                    {action.count !== undefined && action.count > 0 && (
                      <span className="text-[10px] text-muted-foreground">{action.count}</span>
                    )}
                    {action.subtitle && (
                      <span className="text-[10px] text-muted-foreground">{action.subtitle}</span>
                    )}
                    {action.badge && (
                      <Badge className="absolute -top-1.5 -right-1.5 text-[10px] px-1.5 py-0 bg-primary text-primary-foreground">
                        {action.badge}
                      </Badge>
                    )}
                  </Link>
                </motion.div>
              );

              if (action.tooltip) {
                return (
                  <Tooltip key={action.label}>
                    <TooltipTrigger asChild>{content}</TooltipTrigger>
                    <TooltipContent>{action.tooltip}</TooltipContent>
                  </Tooltip>
                );
              }
              return content;
            })}
          </div>

          {/* Two-Column Layout: Performance + Activity */}
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Left Column — wider */}
            <div className="lg:col-span-3 space-y-6">
              {/* Performance Insights — subtle bg wrap */}
              <div className="bg-muted/30 rounded-2xl p-4">
                <AgencyPerformanceInsights />
              </div>
            </div>

            {/* Right Column — narrower */}
            <div className="lg:col-span-2 space-y-6">
              {/* Pending Join Requests (if any) */}
              {pendingRequests > 0 && (
                <Card className="rounded-2xl border-primary/20 bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-xl bg-primary/10">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{pendingRequests} Join Request{pendingRequests !== 1 ? 's' : ''}</p>
                        <p className="text-xs text-muted-foreground">Agents waiting for approval</p>
                      </div>
                    </div>
                    <Button size="sm" asChild className="rounded-xl w-full">
                      <Link to="/agency/team">
                        Review Requests
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Team Announcements — always show compact */}
              <Card className="rounded-2xl border-border/50">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-primary" />
                    Team Announcements
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <AgencyAnnouncements agencyId={agency.id} compact />
                </CardContent>
              </Card>

              {/* Latest Blog Post */}
              {blogPosts.length > 0 && (
                <Card className="rounded-2xl border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-xl bg-amber-500/10">
                        <PenLine className="h-4 w-4 text-amber-600 dark:text-amber-400" />
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
            <Button
              asChild
              size="lg"
              className="rounded-full h-14 w-14 shadow-lg shadow-primary/25 p-0"
            >
              <Link to="/agency/listings/new">
                <Plus className="h-6 w-6" />
              </Link>
            </Button>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
