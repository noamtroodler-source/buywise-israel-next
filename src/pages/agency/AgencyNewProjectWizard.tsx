import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Save, Send, Loader2, Sparkles, ShieldAlert } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { WizardProgress } from '@/components/agent/wizard/WizardProgress';
import { ProjectWizardProvider, useProjectWizard, PROJECT_WIZARD_STORAGE_KEY, ProjectWizardData } from '@/components/developer/wizard/ProjectWizardContext';
import { StepBasics, StepDetails, StepAmenities, StepUnitTypes, StepPhotos, StepDescription, StepReview } from '@/components/developer/wizard/steps';
import { StepAssignAgent } from '@/components/agency/wizard/StepAssignAgent';
import { useCreateProjectForAgency } from '@/hooks/useAgencyProjects';
import { useMyAgency, useAgencyTeam } from '@/hooks/useAgencyManagement';
import { useAgencyListingsManagement } from '@/hooks/useAgencyListings';
import { useAutoSave } from '@/hooks/useAutoSave';
import { SaveStatusIndicator } from '@/components/shared/SaveStatusIndicator';
import { ProjectSubmittedDialog } from '@/components/developer/ProjectSubmittedDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const steps = [
  { title: 'Assign Agent', description: 'Choose team member' },
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
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

function AgencyProjectWizardContent() {
  const navigate = useNavigate();
  const { data, currentStep, setCurrentStep, goNext, goBack, canGoNext, isLastStep, setStepOffset } = useProjectWizard();

  // Agency wizard has an extra "Assign Agent" step at index 0, so offset validation by 1
  useEffect(() => {
    setStepOffset(1);
  }, [setStepOffset]);

  const { data: agency } = useMyAgency();
  const { data: team = [] } = useAgencyTeam(agency?.id);
  const { data: listings = [] } = useAgencyListingsManagement(agency?.id);
  const createProject = useCreateProjectForAgency();

  const [assignedAgentId, setAssignedAgentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmittedDialog, setShowSubmittedDialog] = useState(false);

  const isAgencyVerified = agency?.is_verified === true;

  const autoSave = useAutoSave<ProjectWizardData>({
    data,
    storageKey: PROJECT_WIZARD_STORAGE_KEY + '-agency',
    autoSaveInterval: 0,
    useSessionKey: true,
  });

  // Compute listing counts per agent
  const listingCounts: Record<string, number> = {};
  for (const listing of listings) {
    if (listing.agent_id) {
      listingCounts[listing.agent_id] = (listingCounts[listing.agent_id] ?? 0) + 1;
    }
  }

  // Step 0 validation: must have an agent selected
  const canGoNextAgency = currentStep === 0 ? !!assignedAgentId : canGoNext;

  const buildPayload = (submitForReview: boolean) => ({
    name: data.name,
    city: data.city,
    neighborhood: data.neighborhood || undefined,
    address: data.address || undefined,
    latitude: data.latitude,
    longitude: data.longitude,
    description: data.description || undefined,
    status: data.status,
    total_units: data.total_units,
    price_from: data.price_from,
    price_to: data.price_to,
    construction_start: data.construction_start,
    completion_date: data.completion_date,
    construction_progress_percent: data.construction_progress_percent,
    amenities: data.amenities.length > 0 ? data.amenities : undefined,
    images: data.images.length > 0 ? data.images : undefined,
    floor_plans: data.floor_plans.length > 0 ? data.floor_plans : undefined,
    unit_types: data.unit_types.length > 0 ? data.unit_types : undefined,
    featured_highlight: data.featured_highlight || undefined,
    assignedAgentId: assignedAgentId!,
    submitForReview,
  });

  const handleSaveDraft = async () => {
    if (!assignedAgentId) return;
    setIsSubmitting(true);
    try {
      await createProject.mutateAsync(buildPayload(false));
      autoSave.clearSavedData();
      navigate('/agency/listings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!assignedAgentId) return;
    setIsSubmitting(true);
    try {
      await createProject.mutateAsync(buildPayload(true));
      autoSave.clearSavedData();
      setShowSubmittedDialog(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <StepAssignAgent
            team={team}
            selectedAgentId={assignedAgentId}
            onSelect={setAssignedAgentId}
            listingCounts={listingCounts}
          />
        );
      case 1: return <StepBasics />;
      case 2: return <StepDetails />;
      case 3: return <StepAmenities />;
      case 4: return <StepUnitTypes />;
      case 5: return <StepPhotos />;
      case 6: return <StepDescription />;
      case 7: return <StepReview onEditStep={(s) => setCurrentStep(s + 1)} />;
      default: return null;
    }
  };

  return (
    <Layout>
      <div className="min-h-screen relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/[0.02] to-background -z-10" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-primary/3 rounded-full blur-3xl -z-10" />

        <div className="container py-8 max-w-3xl">
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">

            {/* Header */}
            <motion.div variants={itemVariants} className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => navigate('/agency/listings')} className="rounded-xl hover:bg-primary/5 -ml-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Listings
              </Button>
              <div className="flex items-center gap-4">
                <SaveStatusIndicator
                  isSaving={autoSave.isSaving}
                  lastSavedAt={autoSave.lastSavedAt}
                  isDirty={autoSave.isDirty}
                  error={autoSave.error}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting || !data.name || !assignedAgentId}
                  className="rounded-xl"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
              </div>
            </motion.div>

            {/* Progress */}
            <motion.div variants={itemVariants}>
              <WizardProgress currentStep={currentStep} steps={steps} onStepClick={setCurrentStep} />
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
                {isLastStep && !isAgencyVerified && (
                  <Alert variant="default" className="bg-primary/5 border-primary/20">
                    <ShieldAlert className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-foreground">Pending Verification</AlertTitle>
                    <AlertDescription className="text-muted-foreground">
                      Your agency is pending verification. You can save drafts, but submissions are disabled until approved.
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
                        onClick={handleSaveDraft}
                        disabled={isSubmitting || !assignedAgentId}
                        className="rounded-xl h-11"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save as Draft
                      </Button>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                onClick={handleSubmitForReview}
                                disabled={isSubmitting || !canGoNextAgency || !assignedAgentId || !isAgencyVerified}
                                className="gap-2 rounded-xl h-11 px-6"
                              >
                                {isSubmitting ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Send className="h-4 w-4" />
                                    Submit for Review
                                    <Sparkles className="h-4 w-4" />
                                  </>
                                )}
                              </Button>
                            </span>
                          </TooltipTrigger>
                          {!isAgencyVerified && (
                            <TooltipContent>Agency verification required</TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  ) : (
                    <Button
                      onClick={goNext}
                      disabled={!canGoNextAgency}
                      className="rounded-xl h-11 px-6"
                    >
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        <ProjectSubmittedDialog
          open={showSubmittedDialog}
          onClose={() => navigate('/agency/listings')}
          projectName={data.name}
        />
      </div>
    </Layout>
  );
}

export default function AgencyNewProjectWizard() {
  return (
    <ProjectWizardProvider totalSteps={8}>
      <AgencyProjectWizardContent />
    </ProjectWizardProvider>
  );
}
