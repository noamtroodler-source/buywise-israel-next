import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Save, Send, Loader2, Sparkles } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { WizardProgress } from '@/components/agent/wizard/WizardProgress';
import { PropertyWizardProvider, usePropertyWizard, PROPERTY_WIZARD_STORAGE_KEY, PropertyWizardData } from '@/components/agent/wizard/PropertyWizardContext';
import {
  StepBasics,
  StepDetails,
  StepFeatures,
  StepPhotos,
  StepDescription,
  StepReview,
} from '@/components/agent/wizard/steps';
import { StepAssignAgent } from '@/components/agency/wizard/StepAssignAgent';
import { useCreatePropertyForAgency } from '@/hooks/useAgentProperties';
import { useMyAgency, useAgencyTeam } from '@/hooks/useAgencyManagement';
import { useAgencyListingsManagement } from '@/hooks/useAgencyListings';
import { useAutoSave } from '@/hooks/useAutoSave';
import { SaveStatusIndicator } from '@/components/shared/SaveStatusIndicator';
import { PropertySubmittedDialog } from '@/components/agent/PropertySubmittedDialog';

const steps = [
  { title: 'Assign Agent', description: 'Choose team member' },
  { title: 'Basics', description: 'Property type, price, location' },
  { title: 'Details', description: 'Rooms, size, building info' },
  { title: 'Features', description: 'Amenities and condition' },
  { title: 'Photos', description: 'Upload property images' },
  { title: 'Description', description: 'Tell the story' },
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

function AgencyWizardContent() {
  const navigate = useNavigate();
  const { data, currentStep, setCurrentStep, goNext, goBack, canGoNext, isLastStep, setStepOffset } = usePropertyWizard();

  // Agency wizard has an extra "Assign Agent" step at index 0, so offset validation by 1
  React.useEffect(() => {
    setStepOffset(1);
  }, [setStepOffset]);
  const { data: agency } = useMyAgency();
  const { data: team = [] } = useAgencyTeam(agency?.id);
  const { data: listings = [] } = useAgencyListingsManagement(agency?.id);
  const createProperty = useCreatePropertyForAgency();

  const [assignedAgentId, setAssignedAgentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [submittedTitle, setSubmittedTitle] = useState('');

  const autoSave = useAutoSave<PropertyWizardData>({
    data,
    storageKey: PROPERTY_WIZARD_STORAGE_KEY + '-agency',
    autoSaveInterval: 0,
    useSessionKey: true,
  });

  // Compute listing counts per agent for StepAssignAgent
  const listingCounts: Record<string, number> = {};
  for (const listing of listings) {
    if (listing.agent_id) {
      listingCounts[listing.agent_id] = (listingCounts[listing.agent_id] ?? 0) + 1;
    }
  }

  // Step 0 validation: must have an agent selected
  const canGoNextAgency = currentStep === 0 ? !!assignedAgentId : canGoNext;

  const buildPropertyPayload = (submitForReview: boolean) => ({
    title: data.title,
    description: data.description,
    property_type: data.property_type,
    listing_status: data.listing_status,
    price: data.price,
    address: data.address,
    city: data.city,
    neighborhood: data.neighborhood,
    latitude: data.latitude,
    longitude: data.longitude,
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    size_sqm: data.size_sqm,
    lot_size_sqm: data.lot_size_sqm,
    floor: data.floor,
    total_floors: data.total_floors,
    year_built: data.year_built,
    parking: data.parking,
    features: data.features,
    images: data.images,
    entry_date: data.is_immediate_entry ? undefined : data.entry_date,
    ac_type: data.ac_type as any,
    vaad_bayit_monthly: data.vaad_bayit_monthly,
    has_balcony: data.has_balcony,
    has_elevator: data.has_elevator,
    has_storage: data.has_storage,
    lease_term: data.lease_term,
    subletting_allowed: data.subletting_allowed,
    furnished_status: data.furnished_status,
    pets_policy: data.pets_policy,
    furniture_items: data.furniture_items,
    featured_highlight: data.featured_highlight || null,
    assignedAgentId: assignedAgentId!,
    submitForReview,
  });

  const handleSaveDraft = async () => {
    if (!assignedAgentId) return;
    setIsSubmitting(true);
    try {
      await createProperty.mutateAsync(buildPropertyPayload(false));
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
      await createProperty.mutateAsync(buildPropertyPayload(true));
      autoSave.clearSavedData();
      setSubmittedTitle(data.title);
      setShowSuccessDialog(true);
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
      case 3: return <StepFeatures />;
      case 4: return <StepPhotos />;
      case 5: return <StepDescription />;
      case 6: return <StepReview onEditStep={(s) => setCurrentStep(s + 1)} />;
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
                  disabled={isSubmitting || !data.title || !assignedAgentId}
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
              <div className="flex justify-between items-center p-4 rounded-2xl bg-card/95 backdrop-blur-sm border border-border shadow-lg">
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
                    <Button
                      onClick={handleSubmitForReview}
                      disabled={isSubmitting || !canGoNextAgency || !assignedAgentId}
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
            </motion.div>
          </motion.div>
        </div>

        <PropertySubmittedDialog
          open={showSuccessDialog}
          onClose={() => navigate('/agency/listings')}
          propertyTitle={submittedTitle}
        />
      </div>
    </Layout>
  );
}

export default function AgencyNewPropertyWizard() {
  return (
    <PropertyWizardProvider>
      <AgencyWizardContent />
    </PropertyWizardProvider>
  );
}
