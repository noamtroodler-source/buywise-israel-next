import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ClipboardCheck, FileText, AlertCircle, CheckCircle, XCircle, Filter,
  Building2, Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useAdminProjects,
  useProjectReviewStats,
  useApproveProject,
  useRequestProjectChanges,
  useRejectProject,
  ProjectVerificationStatus,
} from '@/hooks/useAdminProjects';
import { ProjectReviewCard } from '@/components/admin/ProjectReviewCard';
import { useAddFeaturedProject } from '@/hooks/useHomepageFeatured';
import { toast } from 'sonner';

export default function AdminProjects() {
  const [activeTab, setActiveTab] = useState<ProjectVerificationStatus | 'all'>('pending_review');

  const { data: stats, isLoading: statsLoading } = useProjectReviewStats();
  const { data: projects = [], isLoading: projectsLoading } = useAdminProjects(
    activeTab === 'all' ? undefined : activeTab
  );

  const approveProject = useApproveProject();
  const requestChanges = useRequestProjectChanges();
  const rejectProject = useRejectProject();
  const addFeaturedProject = useAddFeaturedProject();

  const isLoading = statsLoading || projectsLoading;
  const isMutating = approveProject.isPending || requestChanges.isPending || rejectProject.isPending || addFeaturedProject.isPending;

  const statCards = [
    { key: 'pending_review', label: 'Pending Review', icon: ClipboardCheck, color: 'text-primary', bgColor: 'bg-primary/10' },
    { key: 'changes_requested', label: 'Changes Requested', icon: AlertCircle, color: 'text-primary', bgColor: 'bg-primary/10' },
    { key: 'approved', label: 'Approved', icon: CheckCircle, color: 'text-primary', bgColor: 'bg-primary/10' },
    { key: 'rejected', label: 'Rejected', icon: XCircle, color: 'text-destructive', bgColor: 'bg-destructive/10' },
    { key: 'draft', label: 'Drafts', icon: FileText, color: 'text-muted-foreground', bgColor: 'bg-muted' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Project Review Queue</h2>
          <p className="text-muted-foreground">Review and approve new construction projects</p>
        </div>
        {stats?.pending_review && stats.pending_review > 0 && (
          <Badge className="bg-primary/10 text-primary text-base px-3 py-1">
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
            projects.map((project) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <ProjectReviewCard
                  project={project}
                  onApprove={(id, notes, featureThis, featureSlotType) => {
                    approveProject.mutate(
                      { id, adminFeedback: notes },
                      {
                        onSuccess: () => {
                          if (featureThis && featureSlotType) {
                            const expiresAt = new Date();
                            expiresAt.setDate(expiresAt.getDate() + 30);
                            
                            addFeaturedProject.mutate({
                              projectId: id,
                              slotType: featureSlotType,
                              position: 1,
                              expiresAt,
                            });
                            
                            toast.success(`Project featured as ${featureSlotType === 'project_hero' ? 'Hero' : 'Secondary'}`);
                          }
                        }
                      }
                    );
                  }}
                  onRequestChanges={(id, feedback) => requestChanges.mutate({ id, feedback })}
                  onReject={(id, reason) => rejectProject.mutate({ id, reason })}
                  isLoading={isMutating}
                />
              </motion.div>
            ))
          )}
        </div>
      </Tabs>
    </div>
  );
}
