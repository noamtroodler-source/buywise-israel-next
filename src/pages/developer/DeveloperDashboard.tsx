import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building, Plus, Eye, BarChart3, Loader2, FileText, Clock, CheckCircle, AlertCircle, Settings, FolderKanban, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useDeveloperProfile } from '@/hooks/useDeveloperProfile';
import { useDeveloperProjects } from '@/hooks/useDeveloperProjects';

export default function DeveloperDashboard() {
  const { data: developerProfile, isLoading: profileLoading } = useDeveloperProfile();
  const { data: projects = [], isLoading: projectsLoading } = useDeveloperProjects();

  const isLoading = profileLoading || projectsLoading;

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
    { key: 'changes_requested', label: 'Changes Requested', icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
    { key: 'approved', label: 'Live', icon: CheckCircle, color: 'text-primary', bg: 'bg-primary/10' },
  ];

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
                <Building className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Welcome, {developerProfile?.name}
                </h1>
                <p className="text-muted-foreground">
                  Developer Dashboard
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to="/developer/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/developer/analytics">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Link>
              </Button>
              <Button asChild>
                <Link to="/developer/projects/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Project
                </Link>
              </Button>
            </div>
          </div>

          {/* Pending Verification Alert */}
          {developerProfile?.verification_status === 'pending' && (
            <Alert className="bg-blue-50 border-blue-200">
              <ShieldAlert className="h-5 w-5 text-blue-600" />
              <AlertTitle className="text-blue-800">Company Verification Pending</AlertTitle>
              <AlertDescription className="text-blue-700">
                Your company is currently under review. You can create draft projects, but you won't be able to submit them for publication until your account is verified. This typically takes 24-48 hours.
              </AlertDescription>
            </Alert>
          )}

          {/* Verified Badge */}
          {developerProfile?.verification_status === 'approved' && (
            <div className="flex items-center gap-2 text-sm text-primary">
              <ShieldCheck className="h-4 w-4" />
              <span className="font-medium">Verified Developer</span>
            </div>
          )}

          {/* Changes Requested Alert */}
          {statusCounts.changes_requested > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-orange-800">Action Required</p>
                <p className="text-sm text-orange-700">
                  {statusCounts.changes_requested} project{statusCounts.changes_requested > 1 ? 's' : ''} need{statusCounts.changes_requested === 1 ? 's' : ''} changes before approval.
                </p>
              </div>
              <Button variant="outline" size="sm" asChild className="flex-shrink-0">
                <Link to="/developer/projects?tab=changes_requested">View</Link>
              </Button>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-6">
            {statusCards.map((s) => (
              <Card key={s.key}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${s.bg}`}>
                      <s.icon className={`h-5 w-5 ${s.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{statusCounts[s.key as keyof typeof statusCounts]}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Eye className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalViews}</p>
                    <p className="text-xs text-muted-foreground">Total Views</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/20">
                    <FolderKanban className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{availableUnits}/{totalUnits}</p>
                    <p className="text-xs text-muted-foreground">Units Available</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <Link to="/developer/projects">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <FolderKanban className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Manage Projects</h3>
                    <p className="text-sm text-muted-foreground">
                      View, edit, or manage your developments
                    </p>
                  </div>
                </CardContent>
              </Link>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <Link to="/developer/analytics">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">View Analytics</h3>
                    <p className="text-sm text-muted-foreground">
                      Track project performance
                    </p>
                  </div>
                </CardContent>
              </Link>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <Link to="/developer/projects/new">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center">
                    <Plus className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Add New Project</h3>
                    <p className="text-sm text-muted-foreground">
                      Create a new development listing
                    </p>
                  </div>
                </CardContent>
              </Link>
            </Card>
          </div>

          {/* Recent Projects */}
          {projects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects.slice(0, 5).map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={project.images?.[0] || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100'}
                          alt={project.name}
                          className="h-12 w-12 rounded object-cover"
                        />
                        <div>
                          <p className="font-medium line-clamp-1">{project.name}</p>
                          <p className="text-sm text-muted-foreground">{project.city}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          project.verification_status === 'approved'
                            ? 'bg-primary/10 text-primary'
                            : project.verification_status === 'pending_review'
                            ? 'bg-blue-50 text-blue-700'
                            : project.verification_status === 'changes_requested'
                            ? 'bg-orange-50 text-orange-700'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {project.verification_status === 'approved' ? 'Live' :
                           project.verification_status === 'pending_review' ? 'Pending' :
                           project.verification_status === 'changes_requested' ? 'Changes Needed' :
                           'Draft'}
                        </span>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/developer/projects/${project.id}/edit`}>Edit</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {projects.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Projects Yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Start by adding your first development project
                </p>
                <Button asChild>
                  <Link to="/developer/projects/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Project
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
