import { useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building, Plus, Eye, BarChart3, Loader2, FileText, Clock, CheckCircle, AlertCircle, Settings, FolderKanban, ShieldCheck, ShieldAlert, ArrowLeft, MessageSquare, Home, Mail, PenLine } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useDeveloperProfile } from '@/hooks/useDeveloperProfile';
import { useDeveloperProjects } from '@/hooks/useDeveloperProjects';
import { DeveloperNotificationBell } from '@/components/developer/DeveloperNotificationBell';
import { DeveloperOnboardingProgress } from '@/components/developer/DeveloperOnboardingProgress';
import { SubscriptionStatusCard } from '@/components/billing/SubscriptionStatusCard';

import { useAdvertiserTracking } from '@/hooks/useAdvertiserTracking';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function DeveloperDashboard() {
  const { data: developerProfile, isLoading: profileLoading } = useDeveloperProfile();
  const { data: projects = [], isLoading: projectsLoading } = useDeveloperProjects();
  const { trackDashboardView } = useAdvertiserTracking();

  const isLoading = profileLoading || projectsLoading;

  // Track dashboard view on mount
  useEffect(() => {
    if (developerProfile?.id) {
      trackDashboardView(developerProfile.id, 'developer', 'dashboard');
    }
  }, [developerProfile?.id, trackDashboardView]);

  // Count by verification status
  const statusCounts = useMemo(() => ({
    draft: projects.filter(p => p.verification_status === 'draft').length,
    pending_review: projects.filter(p => p.verification_status === 'pending_review').length,
    changes_requested: projects.filter(p => p.verification_status === 'changes_requested').length,
    approved: projects.filter(p => p.verification_status === 'approved').length,
  }), [projects]);

  const totalViews = projects.reduce((sum, p) => sum + (p.views_count || 0), 0);
  const totalUnits = projects.reduce((sum, p) => sum + (p.total_units || 0), 0);
  const availableUnits = projects.reduce((sum, p) => sum + (p.available_units || 0), 0);

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
    { key: 'draft', label: 'Drafts', icon: FileText, color: 'text-muted-foreground', bg: 'bg-muted' },
    { key: 'pending_review', label: 'Pending Review', icon: Clock, color: 'text-primary', bg: 'bg-primary/10' },
    { key: 'changes_requested', label: 'Changes Requested', icon: AlertCircle, color: 'text-primary', bg: 'bg-primary/10' },
    { key: 'approved', label: 'Live', icon: CheckCircle, color: 'text-primary', bg: 'bg-primary/10' },
  ];

  return (
    <Layout>
      {/* Header Section with Gradient Background */}
      <div className="relative bg-gradient-to-b from-primary/5 via-primary/[0.02] to-background overflow-hidden">
        {/* Decorative blur elements */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl translate-y-1/2" />
        
        <div className="container relative py-10 lg:py-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
          >
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild className="rounded-xl hover:bg-primary/10 flex-shrink-0">
                <Link to="/">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center shadow-sm">
                <Building className="h-8 w-8 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-foreground">
                    Welcome, {developerProfile?.name}
                  </h1>
                  {developerProfile?.verification_status === 'approved' && (
                    <Badge variant="default" className="bg-primary/10 text-primary border-0 gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mt-1">
                  Manage your development projects and track performance
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <DeveloperNotificationBell />
              <Button variant="outline" asChild className="rounded-xl">
                <Link to="/developer/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
              <Button variant="outline" asChild className="rounded-xl">
                <Link to="/developer/analytics">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Link>
              </Button>
              <Button asChild className="rounded-xl shadow-md">
                <Link to="/developer/projects/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Project
                </Link>
              </Button>
              <Button asChild className="rounded-xl shadow-md">
                <Link to="/developer/blog/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Blog
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Subscription Status */}
          <motion.div variants={itemVariants}>
            <SubscriptionStatusCard />
          </motion.div>

          {/* Onboarding Progress */}
          <motion.div variants={itemVariants}>
            <DeveloperOnboardingProgress />
          </motion.div>

          {/* New Development Showcase */}
          <motion.div variants={itemVariants}>
            <Card className="rounded-2xl border-primary/10 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Home className="h-5 w-5 text-primary" />
                  New Development Showcase
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  BuyWise Israel highlights a limited number of new residential developments on the homepage.
                </p>
                <p className="text-sm text-muted-foreground">
                  Development placements rotate monthly and are reviewed individually to ensure clarity and focus for buyers.
                </p>
                <p className="text-sm text-muted-foreground">
                  Availability, fit, and pricing are discussed per project.
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
                
                <p className="text-xs text-muted-foreground/70 pt-1">
                  Homepage exposure does not include guaranteed placement, ranking, or performance metrics.
                </p>
              </CardContent>
            </Card>
          </motion.div>


          {/* Pending Verification Alert */}
          {developerProfile?.verification_status === 'pending' && (
            <motion.div variants={itemVariants}>
              <Alert className="bg-primary/5 border-primary/20 rounded-2xl">
                <ShieldAlert className="h-5 w-5 text-primary" />
                <AlertTitle className="text-foreground">Company Verification Pending</AlertTitle>
                <AlertDescription className="text-muted-foreground">
                  Your company is currently under review. You can create draft projects, but you won't be able to submit them for publication until your account is verified. This typically takes 24-48 hours.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Changes Requested Alert */}
          {statusCounts.changes_requested > 0 && (
            <motion.div variants={itemVariants}>
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Action Required</p>
                  <p className="text-sm text-muted-foreground">
                    {statusCounts.changes_requested} project{statusCounts.changes_requested > 1 ? 's' : ''} need{statusCounts.changes_requested === 1 ? 's' : ''} changes before approval.
                  </p>
                </div>
                <Button variant="default" size="sm" asChild className="flex-shrink-0 rounded-xl">
                  <Link to="/developer/projects?tab=changes_requested">Review Now</Link>
                </Button>
              </div>
            </motion.div>
          )}


          {/* Stats Cards */}
          <motion.div variants={itemVariants} className="grid gap-4 grid-cols-2 lg:grid-cols-6">
            {statusCards.map((s, index) => (
              <motion.div
                key={s.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="rounded-2xl border-border/50 hover:shadow-lg hover:border-primary/30 transition-all duration-300">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${s.bg}`}>
                        <s.icon className={`h-5 w-5 ${s.color}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{statusCounts[s.key as keyof typeof statusCounts]}</p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="rounded-2xl border-border/50 hover:shadow-lg hover:border-primary/30 transition-all duration-300">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10">
                      <Eye className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{totalViews}</p>
                      <p className="text-xs text-muted-foreground">Total Views</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="rounded-2xl border-border/50 hover:shadow-lg hover:border-primary/30 transition-all duration-300">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10">
                      <FolderKanban className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{availableUnits}/{totalUnits}</p>
                      <p className="text-xs text-muted-foreground">Units Available</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link to="/developer/projects" className="group">
              <Card className="rounded-2xl border-border/50 hover:shadow-lg hover:border-primary/30 transition-all duration-300 h-full">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <FolderKanban className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">Manage Projects</h3>
                    <p className="text-sm text-muted-foreground">
                      View, edit, or manage your developments
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/developer/analytics" className="group">
              <Card className="rounded-2xl border-border/50 hover:shadow-lg hover:border-primary/30 transition-all duration-300 h-full">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <BarChart3 className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">View Analytics</h3>
                    <p className="text-sm text-muted-foreground">
                      Track project performance
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/developer/projects/new" className="group">
              <Card className="rounded-2xl border-border/50 hover:shadow-lg hover:border-primary/30 transition-all duration-300 h-full">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Plus className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">Add New Project</h3>
                    <p className="text-sm text-muted-foreground">
                      Create a new development listing
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/developer/blog" className="group">
              <Card className="rounded-2xl border-border/50 hover:shadow-lg hover:border-primary/30 transition-all duration-300 h-full">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <PenLine className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">Write Blog</h3>
                    <p className="text-sm text-muted-foreground">
                      Share development insights
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          {/* Recent Projects */}
          {projects.length > 0 && (
            <motion.div variants={itemVariants}>
              <Card className="rounded-2xl border-border/50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Recent Projects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {projects.slice(0, 5).map((project, index) => (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={project.images?.[0] || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100'}
                            alt={project.name}
                            className="h-14 w-14 rounded-xl object-cover"
                          />
                          <div>
                            <p className="font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">{project.name}</p>
                            <p className="text-sm text-muted-foreground">{project.city}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant="secondary"
                            className={`
                              ${project.verification_status === 'approved'
                                ? 'bg-primary/10 text-primary border-0'
                                : project.verification_status === 'pending_review'
                                ? 'bg-primary/10 text-primary border-0'
                                : project.verification_status === 'changes_requested'
                                ? 'bg-primary/10 text-primary border-0'
                                : 'bg-muted text-muted-foreground border-0'
                              }
                            `}
                          >
                            {project.verification_status === 'approved' ? 'Live' :
                             project.verification_status === 'pending_review' ? 'Pending' :
                             project.verification_status === 'changes_requested' ? 'Changes Needed' :
                             'Draft'}
                          </Badge>
                          <Button variant="ghost" size="sm" asChild className="rounded-lg">
                            <Link to={`/developer/projects/${project.id}/edit`}>Edit</Link>
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Empty State */}
          {projects.length === 0 && (
            <motion.div variants={itemVariants}>
              <Card className="rounded-2xl border-border/50 overflow-hidden">
                <div className="relative bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                      <FolderKanban className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">No Projects Yet</h3>
                    <p className="text-muted-foreground text-center mb-6 max-w-md">
                      Start showcasing your developments to thousands of potential buyers. Create your first project listing today.
                    </p>
                    <Button asChild size="lg" className="rounded-xl shadow-md">
                      <Link to="/developer/projects/new">
                        <Plus className="h-5 w-5 mr-2" />
                        Add Your First Project
                      </Link>
                    </Button>
                  </CardContent>
                </div>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
