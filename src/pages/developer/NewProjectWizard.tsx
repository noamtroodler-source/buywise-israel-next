import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Save, Send, Loader2, Sparkles, ShieldAlert } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { WizardProgress } from '@/components/agent/wizard/WizardProgress';
import { ProjectWizardProvider, useProjectWizard } from '@/components/developer/wizard/ProjectWizardContext';
import { StepBasics, StepDetails, StepAmenities, StepPhotos, StepDescription, StepReview } from '@/components/developer/wizard/steps';
import { useCreateProject } from '@/hooks/useDeveloperProjects';
import { useDeveloperProfile } from '@/hooks/useDeveloperProfile';
import confetti from 'canvas-confetti';

const steps = [
  { title: 'Basics', description: 'Name, location, status' },
  { title: 'Details', description: 'Units, pricing, timeline' },
  { title: 'Amenities', description: 'Building features' },
  { title: 'Photos', description: 'Images and floor plans' },
  { title: 'Description', description: 'Project story' },
  { title: 'Review', description: 'Check and submit' },
];

function WizardContent() {
  const navigate = useNavigate();
  const { data, currentStep, setCurrentStep, goNext, goBack, canGoNext, isLastStep } = useProjectWizard();
  const { data: developerProfile } = useDeveloperProfile();
  const createProject = useCreateProject();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDeveloperVerified = developerProfile?.verification_status === 'approved';

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      await createProject.mutateAsync({
        name: data.name,
        city: data.city,
        neighborhood: data.neighborhood || undefined,
        address: data.address || undefined,
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
        submitForReview: false,
      });
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
        submitForReview: true,
      });
      
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setTimeout(() => navigate('/developer/projects'), 1500);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <StepBasics />;
      case 1: return <StepDetails />;
      case 2: return <StepAmenities />;
      case 3: return <StepPhotos />;
      case 4: return <StepDescription />;
      case 5: return <StepReview onEditStep={setCurrentStep} />;
      default: return null;
    }
  };

  return (
    <Layout>
      <div className="container py-8 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/developer')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={isSubmitting || !data.name}>
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
          </div>

          <WizardProgress currentStep={currentStep} steps={steps} />

          <Card>
            <CardContent className="p-6">
              <AnimatePresence mode="wait">
                <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                  {renderStep()}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={goBack} disabled={currentStep === 0}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {isLastStep ? (
              <div className="flex flex-col gap-3">
                {!isDeveloperVerified && (
                  <Alert variant="default" className="bg-amber-50 border-amber-200">
                    <ShieldAlert className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-800">Pending Verification</AlertTitle>
                    <AlertDescription className="text-amber-700">
                      Your company is pending verification. You can save drafts, but submissions are disabled until approved.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={handleSaveDraft} disabled={isSubmitting}>Save as Draft</Button>
                  <Button onClick={handleSubmitForReview} disabled={isSubmitting || !canGoNext || !isDeveloperVerified} className="gap-2">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" />Submit for Review<Sparkles className="h-4 w-4" /></>}
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={goNext} disabled={!canGoNext}>Next<ArrowRight className="h-4 w-4 ml-2" /></Button>
            )}
          </div>
        </motion.div>
      </div>
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
