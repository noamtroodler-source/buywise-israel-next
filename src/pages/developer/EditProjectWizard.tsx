import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Save, Send, Loader2, CheckCircle, Clock, AlertCircle, XCircle, FileText } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProjectWizardProvider, useProjectWizard } from '@/components/developer/wizard/ProjectWizardContext';
import { StepBasics } from '@/components/developer/wizard/steps/StepBasics';
import { StepDetails } from '@/components/developer/wizard/steps/StepDetails';
import { StepAmenities } from '@/components/developer/wizard/steps/StepAmenities';
import { StepPhotos } from '@/components/developer/wizard/steps/StepPhotos';
import { StepDescription } from '@/components/developer/wizard/steps/StepDescription';
import { StepReview } from '@/components/developer/wizard/steps/StepReview';
import { useDeveloperProject, useUpdateProject, useSubmitProjectForReview } from '@/hooks/useDeveloperProjects';
import { useDeveloperProfile } from '@/hooks/useDeveloperProfile';
import { Progress } from '@/components/ui/progress';

const steps = [
  { id: 0, name: 'Basics', description: 'Project fundamentals' },
  { id: 1, name: 'Details', description: 'Pricing & units' },
  { id: 2, name: 'Amenities', description: 'Features & facilities' },
  { id: 3, name: 'Photos', description: 'Project images' },
  { id: 4, name: 'Description', description: 'Marketing content' },
  { id: 5, name: 'Review', description: 'Final check' },
];

const getStatusInfo = (status: string | null | undefined) => {
  switch (status) {
    case 'draft':
      return { label: 'Draft', icon: FileText, className: 'bg-muted text-muted-foreground' };
    case 'pending_review':
      return { label: 'Pending Review', icon: Clock, className: 'bg-primary/10 text-primary' };
    case 'approved':
      return { label: 'Live', icon: CheckCircle, className: 'bg-primary/10 text-primary' };
    case 'changes_requested':
      return { label: 'Changes Requested', icon: AlertCircle, className: 'bg-destructive/10 text-destructive' };
    case 'rejected':
      return { label: 'Rejected', icon: XCircle, className: 'bg-destructive/10 text-destructive' };
    default:
      return { label: 'Unknown', icon: FileText, className: 'bg-muted text-muted-foreground' };
  }
};

function WizardProgress({ currentStep }: { currentStep: number }) {
  const progressPercent = ((currentStep + 1) / steps.length) * 100;
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{steps[currentStep]?.name}</span>
        <span className="text-muted-foreground">Step {currentStep + 1} of {steps.length}</span>
      </div>
      <Progress value={progressPercent} className="h-2" />
      <div className="hidden sm:flex justify-between">
        {steps.map((step, idx) => (
          <div 
            key={step.id} 
            className={`text-xs ${idx <= currentStep ? 'text-primary font-medium' : 'text-muted-foreground'}`}
          >
            {step.name}
          </div>
        ))}
      </div>
    </div>
  );
}

function EditWizardContent({ projectId }: { projectId: string }) {
  const navigate = useNavigate();
  const { data: project, isLoading, error } = useDeveloperProject(projectId);
  const { data: developerProfile } = useDeveloperProfile();
  const updateProject = useUpdateProject();
  const submitForReview = useSubmitProjectForReview();
  
  const { data, currentStep, setCurrentStep, goNext, goBack, canGoNext, isLastStep, loadFromSaved } = useProjectWizard();
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load project data into wizard context
  useEffect(() => {
    if (project && !hasLoaded) {
      loadFromSaved({
        name: project.name || '',
        status: (project.status as any) || 'planning',
        city: project.city || '',
        neighborhood: project.neighborhood || '',
        address: project.address || '',
        latitude: project.latitude ?? undefined,
        longitude: project.longitude ?? undefined,
        total_units: project.total_units ?? undefined,
        available_units: project.available_units ?? undefined,
        price_from: project.price_from ?? undefined,
        price_to: project.price_to ?? undefined,
        construction_start: project.construction_start ?? undefined,
        completion_date: project.completion_date ?? undefined,
        construction_progress_percent: project.construction_progress_percent ?? 0,
        amenities: project.amenities || [],
        images: project.images || [],
        floor_plans: project.floor_plans || [],
        description: project.description || '',
      });
      setHasLoaded(true);
    }
  }, [project, hasLoaded, loadFromSaved]);

  const handleSaveChanges = async () => {
    if (!project) return;
    
    await updateProject.mutateAsync({
      id: project.id,
      name: data.name,
      status: data.status as any,
      city: data.city,
      neighborhood: data.neighborhood || null,
      address: data.address || null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      price_from: data.price_from ?? null,
      price_to: data.price_to ?? null,
      total_units: data.total_units ?? null,
      available_units: data.available_units ?? null,
      construction_start: data.construction_start ?? null,
      completion_date: data.completion_date ?? null,
      construction_progress_percent: data.construction_progress_percent ?? 0,
      amenities: data.amenities,
      images: data.images,
      floor_plans: data.floor_plans,
      description: data.description || null,
    });
  };

  const handleResubmit = async () => {
    if (!project) return;
    
    // First save changes
    await handleSaveChanges();
    // Then submit for review
    await submitForReview.mutateAsync(project.id);
    navigate('/developer/projects');
  };

  const handleEditStep = (step: number) => {
    setCurrentStep(step);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <StepBasics />;
      case 1: return <StepDetails />;
      case 2: return <StepAmenities />;
      case 3: return <StepPhotos />;
      case 4: return <StepDescription />;
      case 5: return <StepReview onEditStep={handleEditStep} />;
      default: return null;
    }
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

  if (error || !project) {
    return (
      <Layout>
        <div className="container py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
          <p className="text-muted-foreground mb-6">The project you're looking for doesn't exist or you don't have permission to edit it.</p>
          <Button asChild>
            <Link to="/developer/projects">Back to Projects</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const statusInfo = getStatusInfo(project.verification_status);
  const StatusIcon = statusInfo.icon;
  const canResubmit = project.verification_status === 'draft' || project.verification_status === 'changes_requested';
  const isDeveloperVerified = developerProfile?.verification_status === 'approved';
  const isSaving = updateProject.isPending;
  const isSubmitting = submitForReview.isPending;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container max-w-4xl py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild className="rounded-xl hover:bg-primary/5">
                  <Link to="/developer/projects">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Link>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">Edit Project</h1>
                  <p className="text-sm text-muted-foreground">{project.name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge className={`${statusInfo.className} gap-1`}>
                  <StatusIcon className="h-3 w-3" />
                  {statusInfo.label}
                </Badge>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save
                </Button>
                
                {canResubmit && (
                  <Button
                    size="sm"
                    onClick={handleResubmit}
                    disabled={isSubmitting || !isDeveloperVerified}
                    title={!isDeveloperVerified ? 'Your developer profile must be approved first' : undefined}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Submit for Review
                  </Button>
                )}
              </div>
            </div>

            {/* Status Alerts */}
            {project.verification_status === 'changes_requested' && project.admin_feedback && (
              <Alert className="border-destructive/20 bg-destructive/5">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-destructive">
                  <span className="font-medium">Changes requested:</span> {project.admin_feedback}
                </AlertDescription>
              </Alert>
            )}

            {project.verification_status === 'approved' && (
              <Alert className="border-primary/20 bg-primary/5">
                <CheckCircle className="h-4 w-4 text-primary" />
                <AlertDescription>
                  This project is live. Changes will be visible immediately after saving.
                </AlertDescription>
              </Alert>
            )}

            {project.verification_status === 'pending_review' && (
              <Alert className="border-primary/20 bg-primary/5">
                <Clock className="h-4 w-4 text-primary" />
                <AlertDescription>
                  This project is currently under review. You can still make changes while waiting.
                </AlertDescription>
              </Alert>
            )}

            {!isDeveloperVerified && canResubmit && (
              <Alert className="border-muted bg-muted/50">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <AlertDescription className="text-muted-foreground">
                  Your developer profile must be approved before you can submit projects for review.
                </AlertDescription>
              </Alert>
            )}

            {/* Progress */}
            <WizardProgress currentStep={currentStep} />

            {/* Step Content */}
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>

            {/* Navigation */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={goBack}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {!isLastStep ? (
                <Button onClick={goNext} disabled={!canGoNext}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}

export default function EditProjectWizard() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return (
      <Layout>
        <div className="container py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Project</h1>
          <Button asChild>
            <Link to="/developer/projects">Back to Projects</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <ProjectWizardProvider>
      <EditWizardContent projectId={id} />
    </ProjectWizardProvider>
  );
}
