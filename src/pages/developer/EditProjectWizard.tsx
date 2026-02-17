import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Save, Send, Loader2, CheckCircle, Clock, AlertCircle, XCircle, FileText, ShieldAlert } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { ProjectWizardProvider, useProjectWizard, UnitTypeData, OutdoorSpaceType } from '@/components/developer/wizard/ProjectWizardContext';
import { StepBasics, StepDetails, StepAmenities, StepUnitTypes, StepPhotos, StepDescription, StepReview } from '@/components/developer/wizard/steps';
import { useDeveloperProject, useDeveloperProjectUnits, useUpdateProjectWithUnits, useSubmitProjectForReview, ProjectUnit } from '@/hooks/useDeveloperProjects';
import { useDeveloperProfile } from '@/hooks/useDeveloperProfile';
import { WizardProgress } from '@/components/agent/wizard/WizardProgress';
import { useListingLimitCheck } from '@/hooks/useListingLimitCheck';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const steps = [
  { title: 'Basics', description: 'Name, location, status' },
  { title: 'Details', description: 'Units, pricing, timeline' },
  { title: 'Amenities', description: 'Building features' },
  { title: 'Unit Types', description: 'Units & floor plans' },
  { title: 'Gallery', description: 'Project images' },
  { title: 'Description', description: 'Project story' },
  { title: 'Review', description: 'Check and submit' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
};

const getStatusInfo = (status: string | null | undefined) => {
  switch (status) {
    case 'draft':
      return { label: 'Draft', icon: FileText, variant: 'secondary' as const };
    case 'pending_review':
      return { label: 'Pending Review', icon: Clock, variant: 'default' as const };
    case 'approved':
      return { label: 'Live', icon: CheckCircle, variant: 'default' as const };
    case 'changes_requested':
      return { label: 'Changes Requested', icon: AlertCircle, variant: 'outline' as const };
    case 'rejected':
      return { label: 'Rejected', icon: XCircle, variant: 'destructive' as const };
    default:
      return { label: 'Unknown', icon: FileText, variant: 'secondary' as const };
  }
};

// Convert database project_units to UnitTypeData format
function convertUnitsToUnitTypes(units: ProjectUnit[]): UnitTypeData[] {
  // Group units by unit_type name
  const unitTypesMap = new Map<string, UnitTypeData>();
  
  units.forEach((unit, index) => {
    const existing = unitTypesMap.get(unit.unit_type);
    if (existing) {
      // Update min/max values
      if (unit.size_sqm) {
        existing.sizeMin = Math.min(existing.sizeMin ?? Infinity, unit.size_sqm);
        existing.sizeMax = Math.max(existing.sizeMax ?? 0, unit.size_sqm);
      }
      if (unit.price) {
        existing.priceMin = Math.min(existing.priceMin ?? Infinity, unit.price);
        existing.priceMax = Math.max(existing.priceMax ?? 0, unit.price);
      }
      if (unit.floor) {
        existing.floorMin = Math.min(existing.floorMin ?? Infinity, unit.floor);
        existing.floorMax = Math.max(existing.floorMax ?? 0, unit.floor);
      }
      // Update floor plan if not set
      if (!existing.floorPlanUrl && unit.floor_plan_url) {
        existing.floorPlanUrl = unit.floor_plan_url;
      }
      // Increment quantity
      existing.quantity = (existing.quantity ?? 0) + 1;
    } else {
      unitTypesMap.set(unit.unit_type, {
        id: crypto.randomUUID(),
        name: unit.unit_type,
        bedrooms: unit.bedrooms || 0,
        additionalRooms: (unit as any).additional_rooms || 1,
        bathrooms: unit.bathrooms || 0,
        sizeMin: unit.size_sqm ?? undefined,
        sizeMax: unit.size_sqm ?? undefined,
        floorMin: unit.floor ?? undefined,
        floorMax: unit.floor ?? undefined,
        priceMin: unit.price ?? undefined,
        priceMax: unit.price ?? undefined,
        outdoorSpace: 'balcony' as OutdoorSpaceType,
        floorPlanUrl: unit.floor_plan_url ?? undefined,
        quantity: 1,
        displayOrder: unit.display_order ?? index,
      });
    }
  });

  // Convert map to array and sort by displayOrder
  return Array.from(unitTypesMap.values())
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
}

function EditWizardContent({ projectId }: { projectId: string }) {
  const navigate = useNavigate();
  const { data: project, isLoading, error } = useDeveloperProject(projectId);
  const { data: projectUnits, isLoading: isLoadingUnits } = useDeveloperProjectUnits(projectId);
  const { data: developerProfile } = useDeveloperProfile();
  const updateProjectWithUnits = useUpdateProjectWithUnits();
  const submitForReview = useSubmitProjectForReview();
  
  const { data, currentStep, setCurrentStep, goNext, goBack, canGoNext, isLastStep, loadFromSaved } = useProjectWizard();
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load project data and units into wizard context
  useEffect(() => {
    if (project && projectUnits !== undefined && !hasLoaded) {
      // Convert project_units to UnitTypeData format
      const unitTypes = convertUnitsToUnitTypes(projectUnits);
      
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
        unit_types: unitTypes,
        images: project.images || [],
        floor_plans: project.floor_plans || [],
        description: project.description || '',
        featured_highlight: project.featured_highlight || '',
      });
      setHasLoaded(true);
    }
  }, [project, projectUnits, hasLoaded, loadFromSaved]);

  const handleSaveChanges = async () => {
    if (!project) return;
    
    await updateProjectWithUnits.mutateAsync({
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
      featured_highlight: data.featured_highlight || null,
      unit_types: data.unit_types, // Include unit types for sync
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
      case 3: return <StepUnitTypes />;
      case 4: return <StepPhotos />;
      case 5: return <StepDescription />;
      case 6: return <StepReview onEditStep={handleEditStep} />;
      default: return null;
    }
  };

  if (isLoading || isLoadingUnits) {
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
  const { canCreate: canCreateListing } = useListingLimitCheck('developer');
  const isSaving = updateProjectWithUnits.isPending;
  const isSubmitting = submitForReview.isPending;

  return (
    <Layout>
      <div className="min-h-screen relative">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/[0.02] to-background -z-10" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-primary/3 rounded-full blur-3xl -z-10" />

        <motion.div
          className="container max-w-3xl py-8 space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
            
            <Badge variant={statusInfo.variant} className="gap-1.5 w-fit">
              <StatusIcon className="h-3.5 w-3.5" />
              {statusInfo.label}
            </Badge>
          </motion.div>

          {/* Status Alerts */}
          {project.verification_status === 'changes_requested' && project.admin_feedback && (
            <motion.div variants={itemVariants}>
              <Alert className="border-primary/20 bg-primary/5">
                <AlertCircle className="h-4 w-4 text-primary" />
                <AlertDescription>
                  <span className="font-medium">Changes requested:</span> {project.admin_feedback}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {project.verification_status === 'approved' && (
            <motion.div variants={itemVariants}>
              <Alert className="border-primary/20 bg-primary/5">
                <CheckCircle className="h-4 w-4 text-primary" />
                <AlertDescription>
                  This project is live. Changes will be visible immediately after saving.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {project.verification_status === 'pending_review' && (
            <motion.div variants={itemVariants}>
              <Alert className="border-primary/20 bg-primary/5">
                <Clock className="h-4 w-4 text-primary" />
                <AlertDescription>
                  This project is currently under review. You can still make changes while waiting.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Progress */}
          <motion.div variants={itemVariants}>
            <WizardProgress currentStep={currentStep} steps={steps} />
          </motion.div>

          {/* Step Content */}
          <motion.div variants={itemVariants}>
            <Card className="rounded-2xl border-primary/20 hover:shadow-lg transition-all overflow-hidden">
              <CardContent className="p-6 sm:p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {renderStep()}
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          {/* Navigation */}
          <motion.div variants={itemVariants}>
            <div className="flex flex-col gap-4 p-4 rounded-2xl bg-card/95 backdrop-blur-sm border border-border shadow-lg">
              {/* Developer verification alert */}
              {!isDeveloperVerified && canResubmit && (
                <Alert className="border-primary/20 bg-primary/5 py-2">
                  <ShieldAlert className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-sm">
                    Your developer profile must be approved before you can submit projects for review.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={goBack}
                  disabled={currentStep === 0}
                  className="rounded-xl h-11"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                {isLastStep ? (
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleSaveChanges}
                      disabled={isSaving}
                      className="rounded-xl h-11"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Changes
                    </Button>
                    
                    {canResubmit && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                onClick={handleResubmit}
                                disabled={isSubmitting || !isDeveloperVerified || !canCreateListing}
                                className="rounded-xl h-11 px-6"
                              >
                                {isSubmitting ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Send className="h-4 w-4 mr-2" />
                                )}
                                Submit for Review
                              </Button>
                            </span>
                          </TooltipTrigger>
                          {(!isDeveloperVerified || !canCreateListing) && (
                            <TooltipContent>
                              {!isDeveloperVerified ? 'Developer verification required' : 'Project limit reached — upgrade your plan'}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                ) : (
                  <Button onClick={goNext} disabled={!canGoNext} className="rounded-xl h-11 px-6">
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
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
