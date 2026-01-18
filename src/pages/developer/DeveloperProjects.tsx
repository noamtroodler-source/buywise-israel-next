import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, Edit, Trash2, Eye, Loader2, Clock, CheckCircle, AlertCircle, 
  XCircle, FileText, Send, MoreHorizontal, FolderKanban
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDeveloperProjects, useDeleteProject, useSubmitProjectForReview, DeveloperProject } from '@/hooks/useDeveloperProjects';

type VerificationStatus = 'draft' | 'pending_review' | 'approved' | 'changes_requested' | 'rejected';

const getVerificationBadge = (status: string | null | undefined) => {
  switch (status) {
    case 'draft':
      return { label: 'Draft', icon: FileText, className: 'bg-muted text-muted-foreground' };
    case 'pending_review':
      return { label: 'Pending Review', icon: Clock, className: 'bg-primary/10 text-primary' };
    case 'approved':
      return { label: 'Approved', icon: CheckCircle, className: 'bg-primary/10 text-primary' };
    case 'changes_requested':
      return { label: 'Changes Requested', icon: AlertCircle, className: 'bg-orange-100 text-orange-700' };
    case 'rejected':
      return { label: 'Rejected', icon: XCircle, className: 'bg-muted text-muted-foreground' };
    default:
      return { label: 'Unknown', icon: FileText, className: 'bg-muted text-muted-foreground' };
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'planning': return 'Planning';
    case 'pre_sale': return 'Pre-Sale';
    case 'under_construction': return 'Under Construction';
    case 'completed': return 'Completed';
    default: return status;
  }
};

export default function DeveloperProjects() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'all';
  const { data: projects = [], isLoading } = useDeveloperProjects();
  const deleteProject = useDeleteProject();
  const submitForReview = useSubmitProjectForReview();

  const filterByStatus = (status: VerificationStatus | 'all') => {
    if (status === 'all') return projects;
    return projects.filter(p => p.verification_status === status);
  };

  const statusCounts = {
    all: projects.length,
    draft: filterByStatus('draft').length,
    pending_review: filterByStatus('pending_review').length,
    changes_requested: filterByStatus('changes_requested').length,
    approved: filterByStatus('approved').length,
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const ProjectRow = ({ project }: { project: DeveloperProject }) => {
    const badge = getVerificationBadge(project.verification_status);
    const BadgeIcon = badge.icon;

    return (
      <div className="flex flex-col gap-3 p-4 rounded-lg border border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={project.images?.[0] || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100'}
              alt={project.name}
              className="h-16 w-16 rounded-lg object-cover flex-shrink-0"
            />
            <div className="min-w-0">
              <h3 className="font-semibold line-clamp-1">{project.name}</h3>
              <p className="text-sm text-muted-foreground truncate">{project.address || project.city}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="outline">{getStatusLabel(project.status)}</Badge>
                {project.price_from && (
                  <span className="text-sm font-medium">
                    From ₪{project.price_from.toLocaleString()}
                  </span>
                )}
                <Badge className={`${badge.className} gap-1`}>
                  <BadgeIcon className="h-3 w-3" />
                  {badge.label}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            {/* Progress indicator */}
            {project.status === 'under_construction' && project.construction_progress_percent !== null && (
              <div className="hidden sm:flex flex-col items-end gap-1 min-w-[100px]">
                <span className="text-xs text-muted-foreground">
                  {project.construction_progress_percent}% complete
                </span>
                <Progress value={project.construction_progress_percent} className="h-2 w-24" />
              </div>
            )}

            {/* Units */}
            {project.total_units && (
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium">
                  {project.available_units || 0}/{project.total_units}
                </p>
                <p className="text-xs text-muted-foreground">Units Available</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              {project.verification_status === 'draft' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => submitForReview.mutate(project.id)}
                  disabled={submitForReview.isPending}
                >
                  <Send className="h-4 w-4 mr-1" />
                  Submit
                </Button>
              )}

              <Button variant="ghost" size="sm" asChild>
                <Link to={`/developer/projects/${project.id}/edit`}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Link>
              </Button>

              {project.verification_status === 'approved' && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/projects/${project.slug}`}>
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Link>
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`/developer/projects/${project.id}/edit`)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Project
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Project</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{project.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteProject.mutate(project.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Admin feedback */}
        {project.verification_status === 'changes_requested' && project.admin_feedback && (
          <div className="bg-orange-50 border border-orange-200 rounded-md p-3 text-sm">
            <p className="font-medium text-orange-800 mb-1">Admin Feedback:</p>
            <p className="text-orange-700">{project.admin_feedback}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <div className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">My Projects</h1>
            <Button asChild>
              <Link to="/developer/projects/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Link>
            </Button>
          </div>

          {projects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Projects Yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first development project to get started
                </p>
                <Button asChild>
                  <Link to="/developer/projects/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Project
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue={initialTab} className="space-y-4">
              <TabsList className="flex-wrap h-auto gap-1">
                <TabsTrigger value="all" className="gap-1">
                  All <span className="text-xs text-muted-foreground">({statusCounts.all})</span>
                </TabsTrigger>
                <TabsTrigger value="draft" className="gap-1">
                  Drafts <span className="text-xs text-muted-foreground">({statusCounts.draft})</span>
                </TabsTrigger>
                <TabsTrigger value="pending_review" className="gap-1">
                  Pending <span className="text-xs text-muted-foreground">({statusCounts.pending_review})</span>
                </TabsTrigger>
                <TabsTrigger value="changes_requested" className="gap-1">
                  Changes Needed <span className="text-xs text-muted-foreground">({statusCounts.changes_requested})</span>
                </TabsTrigger>
                <TabsTrigger value="approved" className="gap-1">
                  Live <span className="text-xs text-muted-foreground">({statusCounts.approved})</span>
                </TabsTrigger>
              </TabsList>

              {(['all', 'draft', 'pending_review', 'changes_requested', 'approved'] as const).map((tab) => (
                <TabsContent key={tab} value={tab} className="space-y-4">
                  {filterByStatus(tab === 'all' ? 'all' : tab).map((project) => (
                    <ProjectRow key={project.id} project={project} />
                  ))}
                  {filterByStatus(tab === 'all' ? 'all' : tab).length === 0 && (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground">
                        No projects in this category
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
