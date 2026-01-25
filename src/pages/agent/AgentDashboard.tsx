import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Plus, Eye, Home, BarChart3, Loader2, FileText, Clock, CheckCircle, AlertCircle, Settings, Users, RefreshCw, ShieldCheck, ShieldAlert, ArrowLeft, X, PartyPopper, Mail, PenLine } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useLeadStats } from '@/hooks/useAgentLeads';
import { useAgentProfile, useAgentProperties, AgentProperty } from '@/hooks/useAgentProperties';
import { OnboardingChecklist } from '@/components/agent/OnboardingChecklist';
import { STALE_THRESHOLD_DAYS } from '@/hooks/useAgentProfile';
import { differenceInDays, parseISO, format, isToday, isYesterday } from 'date-fns';
import { useAdvertiserTracking } from '@/hooks/useAdvertiserTracking';

export default function AgentDashboard() {
  const { data: agentProfile, isLoading: profileLoading } = useAgentProfile();
  const { data: properties = [], isLoading: propertiesLoading } = useAgentProperties();
  const { data: leadStats } = useLeadStats();
  const { trackDashboardView, trackAnalyticsView } = useAdvertiserTracking();

  // Track dashboard view on mount
  useEffect(() => {
    if (agentProfile?.id) {
      trackDashboardView(agentProfile.id, 'agent', 'dashboard');
    }
  }, [agentProfile?.id, trackDashboardView]);
  
  // Onboarding checklist dismiss state (persisted in localStorage)
  const [showOnboarding, setShowOnboarding] = useState(() => {
    const dismissed = localStorage.getItem('agent-onboarding-dismissed');
    return dismissed !== 'true';
  });

  const handleDismissOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('agent-onboarding-dismissed', 'true');
  };

  // Track dismissed approval alerts in localStorage
  const [dismissedApprovals, setDismissedApprovals] = useState<string[]>(() => {
    const stored = localStorage.getItem('dismissed-approval-alerts');
    return stored ? JSON.parse(stored) : [];
  });

  // State for expanding batch approval list
  const [showAllApproved, setShowAllApproved] = useState(false);

  // Find recently approved properties (within last 7 days)
  const recentlyApproved = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return properties.filter(p => {
      if (p.verification_status !== 'approved' || !p.reviewed_at) return false;
      if (dismissedApprovals.includes(p.id)) return false;
      const reviewedDate = parseISO(p.reviewed_at);
      return reviewedDate >= sevenDaysAgo;
    }).sort((a, b) => 
      new Date(b.reviewed_at!).getTime() - new Date(a.reviewed_at!).getTime()
    );
  }, [properties, dismissedApprovals]);

  // Visible approved properties (collapsed to 3 by default when batch)
  const visibleApproved = showAllApproved 
    ? recentlyApproved 
    : recentlyApproved.slice(0, 3);

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
    
    if (isToday(date)) {
      return `Today at ${time}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${time}`;
    } else {
      return `${format(date, 'MMM d, yyyy')} at ${time}`;
    }
  };

  const isLoading = profileLoading || propertiesLoading;

  // Count by verification status
  const statusCounts = {
    draft: properties.filter(p => (p as any).verification_status === 'draft').length,
    pending_review: properties.filter(p => (p as any).verification_status === 'pending_review').length,
    changes_requested: properties.filter(p => (p as any).verification_status === 'changes_requested').length,
    approved: properties.filter(p => (p as any).verification_status === 'approved').length,
    rejected: properties.filter(p => (p as any).verification_status === 'rejected').length,
  };
  
  const totalViews = properties.reduce((sum, p) => sum + (p.views_count || 0), 0);

  // Count stale listings (approved listings older than threshold)
  const staleListings = useMemo(() => {
    const now = new Date();
    return properties.filter(p => {
      if ((p as any).verification_status !== 'approved') return false;
      const renewedAt = (p as any).last_renewed_at || p.created_at;
      if (!renewedAt) return false;
      const daysSinceRenewal = differenceInDays(now, parseISO(renewedAt));
      return daysSinceRenewal >= STALE_THRESHOLD_DAYS;
    });
  }, [properties]);

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const statusCards = [
    { key: 'draft', label: 'Drafts', icon: FileText, color: 'text-muted-foreground', bg: 'bg-muted/50' },
    { key: 'pending_review', label: 'Pending Review', icon: Clock, color: 'text-primary', bg: 'bg-primary/10' },
    { key: 'changes_requested', label: 'Changes Requested', icon: AlertCircle, color: 'text-primary', bg: 'bg-primary/10' },
    { key: 'approved', label: 'Live', icon: CheckCircle, color: 'text-primary', bg: 'bg-primary/10' },
  ];

  const quickActions = [
    { title: 'Manage Properties', desc: 'View, edit, or delete your listings', icon: Home, href: '/agent/properties' },
    { title: 'Leads', desc: 'Manage buyer inquiries', icon: Users, href: '/agent/leads', badge: leadStats?.new },
    { title: 'Add New Property', desc: 'Create a new property listing', icon: Plus, href: '/agent/properties/new' },
    { title: 'Write Blog', desc: 'Share your market insights', icon: PenLine, href: '/agent/blog' },
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
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Welcome, {agentProfile?.name}
                  </h1>
                  <p className="text-muted-foreground">
                    {agentProfile?.agency_name || 'Independent Agent'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" asChild className="border-primary/20 hover:bg-primary/5">
                  <Link to="/agent/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </Button>
                <Button variant="outline" asChild className="border-primary/20 hover:bg-primary/5">
                  <Link to="/agent/analytics">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </Link>
                </Button>
                <Button asChild>
                  <Link to="/agent/properties/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Property
                  </Link>
                </Button>
                <Button asChild>
                  <Link to="/agent/blog/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Blog
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Property Went Live Alerts - Single vs Batch */}
          {recentlyApproved.length === 1 ? (
            // Single approval - full card
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-4">
                <button
                  onClick={() => handleDismissApproval(recentlyApproved[0].id)}
                  className="absolute top-3 right-3 p-1 rounded-lg hover:bg-primary/10 transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
                <div className="flex items-start gap-4 pr-8">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <PartyPopper className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">
                      Congratulations! Your listing is now live
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      <span className="font-medium text-foreground">"{recentlyApproved[0].title}"</span> was approved and went live {formatApprovalDate(recentlyApproved[0].reviewed_at!)}
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      asChild
                      className="h-auto p-0 mt-2 text-primary"
                    >
                      <Link to={`/properties/${recentlyApproved[0].id}`}>
                        View Listing →
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : recentlyApproved.length >= 2 ? (
            // Batch approvals - consolidated card
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-4">
                <button
                  onClick={handleDismissAllApprovals}
                  className="absolute top-3 right-3 p-1 rounded-lg hover:bg-primary/10 transition-colors"
                  title="Dismiss all"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
                
                {/* Header */}
                <div className="flex items-start gap-4 pr-8">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <PartyPopper className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      🎉 {recentlyApproved.length} Listings Are Now Live!
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Your properties were approved and are visible to buyers
                    </p>
                  </div>
                </div>
                
                {/* Compact property list */}
                <div className="mt-4 space-y-2 bg-background/50 rounded-lg p-3">
                  {visibleApproved.map((property) => (
                    <div 
                      key={property.id}
                      className="flex items-center justify-between text-sm gap-2"
                    >
                      <span className="truncate text-foreground font-medium min-w-0 flex-1">
                        "{property.title}"
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-muted-foreground text-xs hidden sm:inline">
                          {formatApprovalDate(property.reviewed_at!)}
                        </span>
                        <Link 
                          to={`/properties/${property.id}`}
                          className="text-primary hover:text-primary/80 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button 
                          onClick={() => handleDismissApproval(property.id)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title="Dismiss"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Show more toggle */}
                  {recentlyApproved.length > 3 && !showAllApproved && (
                    <button 
                      onClick={() => setShowAllApproved(true)}
                      className="text-sm text-primary hover:underline pt-1"
                    >
                      Show {recentlyApproved.length - 3} more
                    </button>
                  )}
                  {showAllApproved && recentlyApproved.length > 3 && (
                    <button 
                      onClick={() => setShowAllApproved(false)}
                      className="text-sm text-muted-foreground hover:underline pt-1"
                    >
                      Show less
                    </button>
                  )}
                </div>
                
                {/* Footer actions */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-primary/10">
                  <Button variant="link" asChild className="h-auto p-0 text-primary">
                    <Link to="/agent/properties?tab=approved">
                      View All Live Listings →
                    </Link>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleDismissAllApprovals}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Dismiss All
                  </Button>
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
              </AlertDescription>
            </Alert>
          )}

          {/* Verified Agent Badge */}
          {agentProfile?.status === 'active' && (
            <div className="flex items-center gap-2 text-sm text-primary">
              <ShieldCheck className="h-4 w-4" />
              <span className="font-medium">Verified Agent</span>
            </div>
          )}

          {/* Onboarding Checklist for new agents */}
          {showOnboarding && (
            <OnboardingChecklist
              agentProfile={agentProfile}
              properties={properties.map(p => ({
                id: p.id,
                verification_status: (p as any).verification_status,
                views_count: p.views_count,
              }))}
              onDismiss={handleDismissOnboarding}
            />
          )}

          {/* Homepage Exposure Information */}
          <Card className="rounded-2xl border-primary/10 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Home className="h-5 w-5 text-primary" />
                Homepage Exposure (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                BuyWise Israel periodically highlights a limited number of resale and rental listings on the homepage.
              </p>
              <p className="text-sm text-muted-foreground">
                Listings rotate weekly and are curated to maintain a high-quality experience for buyers. Placement is limited and not guaranteed.
              </p>
              <p className="text-sm text-muted-foreground">
                Availability, fit, and pricing are reviewed per listing.
              </p>
              
              <div className="pt-2 border-t border-border/50">
                <a 
                  href="mailto:hello@buywiseisrael.com" 
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  hello@buywiseisrael.com
                </a>
              </div>
              
              <p className="text-xs text-muted-foreground italic">
                One listing per agent at a time.
              </p>
              
              <p className="text-xs text-muted-foreground/70 pt-1">
                Homepage exposure does not include guaranteed placement, ranking, or performance metrics.
              </p>
            </CardContent>
          </Card>

          {staleListings.length > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-foreground">Listings Need Renewal</p>
                <p className="text-sm text-muted-foreground">
                  {staleListings.length} listing{staleListings.length > 1 ? 's are' : ' is'} over {STALE_THRESHOLD_DAYS} days old. Renew to stay visible to buyers.
                </p>
              </div>
              <Button variant="outline" size="sm" asChild className="flex-shrink-0 border-primary/30 text-primary hover:bg-primary/10">
                <Link to="/agent/properties?tab=stale">Renew Now</Link>
              </Button>
            </div>
          )}

          {/* Changes Requested Alert - Blue palette */}
          {statusCounts.changes_requested > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-foreground">Action Required</p>
                <p className="text-sm text-muted-foreground">
                  {statusCounts.changes_requested} listing{statusCounts.changes_requested > 1 ? 's' : ''} need{statusCounts.changes_requested === 1 ? 's' : ''} changes before approval.
                </p>
              </div>
              <Button variant="outline" size="sm" asChild className="flex-shrink-0 border-primary/30 text-primary hover:bg-primary/10">
                <Link to="/agent/properties?tab=changes_requested">View</Link>
              </Button>
            </div>
          )}

          {/* Status Cards with premium styling */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
            {statusCards.map((s, index) => (
              <motion.div
                key={s.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-primary/10 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl hover:border-primary/20 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${s.bg}`}>
                        <s.icon className={`h-5 w-5 ${s.color}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{statusCounts[s.key as keyof typeof statusCounts]}</p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-primary/10 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl hover:border-primary/20 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10">
                      <Eye className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{totalViews}</p>
                      <p className="text-xs text-muted-foreground">Total Views</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Quick Actions with unified styling */}
          <div className="grid gap-4 sm:grid-cols-3">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + index * 0.05 }}
              >
                <Card className="cursor-pointer hover:shadow-md transition-all rounded-2xl border-primary/10 hover:border-primary/20 group">
                  <Link to={action.href}>
                    <CardContent className="flex items-center gap-4 p-6">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                        <action.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{action.title}</h3>
                          {action.badge && action.badge > 0 && (
                            <Badge variant="default" className="text-xs">
                              {action.badge} new
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {action.desc}
                        </p>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Recent Properties with premium styling */}
          {properties.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="rounded-2xl border-primary/10">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent rounded-t-2xl">
                  <CardTitle>Recent Properties</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {properties.slice(0, 5).map((property, index) => (
                      <motion.div
                        key={property.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.45 + index * 0.05 }}
                        className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={property.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=100'}
                            alt={property.title}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-medium line-clamp-1">{property.title}</p>
                            <p className="text-sm text-muted-foreground">{property.city}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                            (property as any).verification_status === 'approved' 
                              ? 'bg-primary/10 text-primary' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {(property as any).verification_status === 'approved' ? 'Live' : 
                             (property as any).verification_status === 'pending_review' ? 'Pending' :
                             (property as any).verification_status === 'changes_requested' ? 'Changes Needed' :
                             'Draft'}
                          </span>
                          <Button variant="ghost" size="sm" asChild className="hover:bg-primary/10 hover:text-primary">
                            <Link to={`/agent/properties/${property.id}/edit`}>Edit</Link>
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
