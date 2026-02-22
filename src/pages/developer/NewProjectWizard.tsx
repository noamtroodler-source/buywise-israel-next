import { useState } from 'react';
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
import { useCreateProject } from '@/hooks/useDeveloperProjects';
import { useDeveloperProfile } from '@/hooks/useDeveloperProfile';
import { useAutoSave } from '@/hooks/useAutoSave';
import { SaveStatusIndicator } from '@/components/shared/SaveStatusIndicator';
import { ProjectSubmittedDialog } from '@/components/developer/ProjectSubmittedDialog';
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
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

function WizardContent() {
  const navigate = useNavigate();
  const { data, currentStep, setCurrentStep, goNext, goBack, canGoNext, isLastStep } = useProjectWizard();
  const { data: developerProfile } = useDeveloperProfile();
  const createProject = useCreateProject();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmittedDialog, setShowSubmittedDialog] = useState(false);
  const [overageAccepted, setOverageAccepted] = useState(false);

  const isDeveloperVerified = developerProfile?.verification_status === 'approved';
  const { canCreate: canCreateListing, isOverLimit } = useListingLimitCheck('developer');

  // Auto-save functionality with session-unique key (always starts fresh)
  const autoSave = useAutoSave<ProjectWizardData>({
    data,
    storageKey: PROJECT_WIZARD_STORAGE_KEY,
    autoSaveInterval: 0, // Disable auto-save to DB for now, just localStorage
    useSessionKey: true, // Each wizard session gets unique storage key
  });

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      await createProject.mutateAsync({
        name: data.name,
        city: data.city,
        neighborhood: data.neighborhood || undefined,
        address: data.address || undefined,
        latitude: data.latitude,
        longitude: data.longitude,
        description: data.description || undefined,
        status: data.status,
        total_units: data.total_units,
        available_units: data.available_units,
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
        submitForReview: false,
      });
      autoSave.clearSavedData();
      navigate('/developer/projects');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForReview = async () => {
    setIsSubmitting(true);
    try {
      await createProject.mutateAsync({
        name: data.name,
        city: data.city,
        neighborhood: data.neighborhood || undefined,
        address: data.address || undefined,
        latitude: data.latitude,
        longitude: data.longitude,
        description: data.description || undefined,
        status: data.status,
        total_units: data.total_units,
        available_units: data.available_units,
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
        submitForReview: true,
      });
      
      autoSave.clearSavedData();
      setShowSubmittedDialog(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <StepBasics />;
      case 1: return <StepDetails />;
      case 2: return <StepAmenities />;
      case 3: return <StepUnitTypes />;
      case 4: return <StepPhotos />;
      case 5: return <StepDescription />;
      case 6: return <StepReview onEditStep={setCurrentStep} />;
      default: return null;
    }
  };

  return (
    <Layout>
      <div className="min-h-screen relative">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/[0.02] to-background -z-10" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-primary/3 rounded-full blur-3xl -z-10" />

        <div className="container py-8 max-w-3xl">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => navigate('/developer')} className="rounded-xl hover:bg-primary/5 -ml-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
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
                  disabled={isSubmitting || !data.name}
                  className="rounded-xl"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
              </div>
            </motion.div>

            {/* Listing Limit / Overage Consent */}
            <motion.div variants={itemVariants}>
              <OverageConsentBanner entityType="developer" onConsentChange={setOverageAccepted} />
            </motion.div>

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
                {isLastStep && !isDeveloperVerified && (
                  <Alert variant="default" className="bg-primary/5 border-primary/20">
                    <ShieldAlert className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-foreground">Pending Verification</AlertTitle>
                    <AlertDescription className="text-muted-foreground">
                      Your company is pending verification. You can save drafts, but submissions are disabled until approved.
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
                        disabled={isSubmitting}
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
                                 disabled={isSubmitting || !canGoNext || !isDeveloperVerified || !canCreateListing || (isOverLimit && !overageAccepted)}
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
                           {(!isDeveloperVerified || !canCreateListing || (isOverLimit && !overageAccepted)) && (
                             <TooltipContent>
                               {!isDeveloperVerified ? 'Developer verification required' : !canCreateListing ? 'Subscription required' : 'Accept overage charge to continue'}
                             </TooltipContent>
                           )}
                         </Tooltip>
                       </TooltipProvider>
                    </div>
                  ) : (
                    <Button
                      onClick={goNext}
                      disabled={!canGoNext}
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
      </div>

      <ProjectSubmittedDialog
        open={showSubmittedDialog}
        onClose={() => setShowSubmittedDialog(false)}
        projectName={data.name}
      />
    </Layout>
  );
}

export default function NewProjectWizard() {
  return (
    <ProjectWizardProvider>
      <WizardContent />
    </ProjectWizardProvider>
  );
}
