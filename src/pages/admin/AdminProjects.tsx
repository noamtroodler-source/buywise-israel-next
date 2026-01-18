import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ClipboardCheck, FileText, AlertCircle, CheckCircle, XCircle, Filter,
  Building2, MapPin, Calendar, Home, Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useAdminProjects,
  useProjectReviewStats,
  useApproveProject,
  useRequestProjectChanges,
  useRejectProject,
  ProjectVerificationStatus,
} from '@/hooks/useAdminProjects';
import { format } from 'date-fns';

const statusConfig: Record<ProjectVerificationStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  draft: { label: 'Draft', variant: 'outline', color: 'text-muted-foreground' },
  pending_review: { label: 'Pending Review', variant: 'secondary', color: 'text-yellow-600' },
  changes_requested: { label: 'Changes Requested', variant: 'outline', color: 'text-orange-600' },
  approved: { label: 'Approved', variant: 'default', color: 'text-green-600' },
  rejected: { label: 'Rejected', variant: 'destructive', color: 'text-red-600' },
};

export default function AdminProjects() {
  const [activeTab, setActiveTab] = useState<ProjectVerificationStatus | 'all'>('pending_review');
  const [feedbackDialog, setFeedbackDialog] = useState<{
    open: boolean;
    action: 'approve' | 'changes' | 'reject';
    projectId: string;
    projectName: string;
  } | null>(null);
  const [feedback, setFeedback] = useState('');

  const { data: stats, isLoading: statsLoading } = useProjectReviewStats();
  const { data: projects = [], isLoading: projectsLoading } = useAdminProjects(
    activeTab === 'all' ? undefined : activeTab
  );

  const approveProject = useApproveProject();
  const requestChanges = useRequestProjectChanges();
  const rejectProject = useRejectProject();

  const isLoading = statsLoading || projectsLoading;
  const isMutating = approveProject.isPending || requestChanges.isPending || rejectProject.isPending;

  const handleSubmitAction = () => {
    if (!feedbackDialog) return;

    const { action, projectId } = feedbackDialog;
    switch (action) {
      case 'approve':
        approveProject.mutate({ id: projectId, adminFeedback: feedback || undefined });
        break;
      case 'changes':
        if (!feedback.trim()) return;
        requestChanges.mutate({ id: projectId, feedback });
        break;
      case 'reject':
        if (!feedback.trim()) return;
        rejectProject.mutate({ id: projectId, reason: feedback });
        break;
    }
    setFeedbackDialog(null);
    setFeedback('');
  };

  const statCards = [
    { key: 'pending_review', label: 'Pending Review', icon: ClipboardCheck, color: 'text-yellow-600', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { key: 'changes_requested', label: 'Changes Requested', icon: AlertCircle, color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-900/20' },
    { key: 'approved', label: 'Approved', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20' },
    { key: 'rejected', label: 'Rejected', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-900/20' },
    { key: 'draft', label: 'Drafts', icon: FileText, color: 'text-muted-foreground', bgColor: 'bg-muted' },
  ];

  const formatPrice = (price: number | null) => {
    if (!price) return 'N/A';
    return `₪${(price / 1000000).toFixed(1)}M`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Project Review Queue</h2>
          <p className="text-muted-foreground">Review and approve new construction projects</p>
        </div>
        {stats?.pending_review && stats.pending_review > 0 && (
          <Badge className="bg-yellow-100 text-yellow-800 text-base px-3 py-1">
            {stats.pending_review} awaiting review
          </Badge>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statCards.map((stat) => (
          <motion.div
            key={stat.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => setActiveTab(stat.key as ProjectVerificationStatus)}
            className="cursor-pointer"
          >
            <Card className={`${activeTab === stat.key ? 'ring-2 ring-primary' : ''} transition-all`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {statsLoading ? '-' : stats?.[stat.key as keyof typeof stats] || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Projects Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ProjectVerificationStatus | 'all')}>
        <TabsList className="mb-4">
          <TabsTrigger value="pending_review" className="gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Pending
            {stats?.pending_review ? <Badge variant="secondary" className="ml-1">{stats.pending_review}</Badge> : null}
          </TabsTrigger>
          <TabsTrigger value="changes_requested" className="gap-2">
            <AlertCircle className="h-4 w-4" />
            Changes
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="h-4 w-4" />
            Rejected
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            <Filter className="h-4 w-4" />
            All
          </TabsTrigger>
        </TabsList>

        {/* Projects Content */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : projects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-1">No projects to review</h3>
                <p className="text-muted-foreground">
                  {activeTab === 'pending_review' 
                    ? "Great job! You've reviewed all pending projects."
                    : `No projects with status "${activeTab.replace('_', ' ')}"`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            projects.map((project) => {
              const status = (project.verification_status || 'draft') as ProjectVerificationStatus;
              const statusInfo = statusConfig[status];

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex flex-col lg:flex-row gap-4">
                        {/* Image */}
                        <div className="lg:w-48 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {project.images?.[0] ? (
                            <img 
                              src={project.images[0]} 
                              alt={project.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Building2 className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <h3 className="font-semibold text-lg">{project.name}</h3>
                              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                            </div>
                            {project.submitted_at && (
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(project.submitted_at), 'MMM d, yyyy')}
                              </div>
                            )}
                          </div>

                          <div className="grid gap-2 text-sm mb-3">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>{project.city}{project.neighborhood && `, ${project.neighborhood}`}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Home className="h-4 w-4" />
                              <span>{project.total_units || 0} units • {formatPrice(project.price_from)} - {formatPrice(project.price_to)}</span>
                            </div>
                            {project.developer && (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={project.developer.logo_url || undefined} />
                                  <AvatarFallback><Building2 className="h-3 w-3" /></AvatarFallback>
                                </Avatar>
                                <span className="text-muted-foreground">
                                  {project.developer.name}
                                  {project.developer.is_verified && (
                                    <CheckCircle className="h-3 w-3 text-green-600 inline ml-1" />
                                  )}
                                </span>
                              </div>
                            )}
                          </div>

                          {project.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {project.description}
                            </p>
                          )}

                          {project.admin_feedback && status !== 'approved' && (
                            <div className="text-sm bg-muted p-2 rounded mb-3">
                              <strong>Feedback:</strong> {project.admin_feedback}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex lg:flex-col gap-2 lg:w-32 flex-shrink-0">
                          {status === 'pending_review' && (
                            <>
                              <Button
                                size="sm"
                                className="flex-1"
                                disabled={isMutating}
                                onClick={() => setFeedbackDialog({
                                  open: true,
                                  action: 'approve',
                                  projectId: project.id,
                                  projectName: project.name,
                                })}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isMutating}
                                onClick={() => setFeedbackDialog({
                                  open: true,
                                  action: 'changes',
                                  projectId: project.id,
                                  projectName: project.name,
                                })}
                              >
                                <AlertCircle className="h-4 w-4 mr-1" />
                                Changes
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={isMutating}
                                onClick={() => setFeedbackDialog({
                                  open: true,
                                  action: 'reject',
                                  projectId: project.id,
                                  projectName: project.name,
                                })}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {status === 'changes_requested' && (
                            <Button
                              size="sm"
                              className="flex-1"
                              disabled={isMutating}
                              onClick={() => setFeedbackDialog({
                                open: true,
                                action: 'approve',
                                projectId: project.id,
                                projectName: project.name,
                              })}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </Tabs>

      {/* Feedback Dialog */}
      <Dialog open={feedbackDialog?.open} onOpenChange={(open) => !open && setFeedbackDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {feedbackDialog?.action === 'approve' && 'Approve Project'}
              {feedbackDialog?.action === 'changes' && 'Request Changes'}
              {feedbackDialog?.action === 'reject' && 'Reject Project'}
            </DialogTitle>
            <DialogDescription>
              {feedbackDialog?.action === 'approve' && `Approve "${feedbackDialog?.projectName}" for publication.`}
              {feedbackDialog?.action === 'changes' && `Request changes for "${feedbackDialog?.projectName}". Please provide feedback.`}
              {feedbackDialog?.action === 'reject' && `Reject "${feedbackDialog?.projectName}". Please provide a reason.`}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={feedbackDialog?.action === 'approve' ? 'Optional notes...' : 'Required feedback...'}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeedbackDialog(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitAction}
              disabled={feedbackDialog?.action !== 'approve' && !feedback.trim()}
              variant={feedbackDialog?.action === 'reject' ? 'destructive' : 'default'}
            >
              {feedbackDialog?.action === 'approve' && 'Approve'}
              {feedbackDialog?.action === 'changes' && 'Request Changes'}
              {feedbackDialog?.action === 'reject' && 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
