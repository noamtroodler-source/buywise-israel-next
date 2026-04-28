import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Save, Send, Loader2, Sparkles, ShieldAlert, FileText } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { WizardProgress } from '@/components/agent/wizard/WizardProgress';
import { PropertyWizardProvider, usePropertyWizard, PROPERTY_WIZARD_STORAGE_KEY, PropertyWizardData } from '@/components/agent/wizard/PropertyWizardContext';
import { 
  StepBasics, 
  StepDetails, 
  StepFeatures, 
  StepPhotos, 
  StepDescription, 
  StepReview 
} from '@/components/agent/wizard/steps';
import { useCreateProperty, useAgentProfile } from '@/hooks/useAgentProperties';
import { useAutoSave } from '@/hooks/useAutoSave';
import { SaveStatusIndicator } from '@/components/shared/SaveStatusIndicator';
import { PropertySubmittedDialog } from '@/components/agent/PropertySubmittedDialog';
import { useListingLimitCheck } from '@/hooks/useListingLimitCheck';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  useDuplicateCheck,
  colistAsSecondary,
  upgradePrimaryFromScrape,
  filePrimaryDisputeWithColist,
  type DuplicateCheckResult,
} from '@/hooks/useDuplicateCheck';
import { ConfirmDuplicateDialog } from '@/components/agency/ConfirmDuplicateDialog';
import { useCities } from '@/hooks/useCities';
import { getMarketFitReview } from '@/lib/marketFit';
import { PriceContextSubmissionPreview } from '@/components/agent/wizard/PriceContextSubmissionPreview';

const steps = [
  { title: 'Basics', description: 'Property type, price, location' },
  { title: 'Details', description: 'Rooms, size, building info' },
  { title: 'Features', description: 'Amenities and condition' },
  { title: 'Photos', description: 'Upload property images' },
  { title: 'Description', description: 'Tell the story' },
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

interface WizardMetadata {
  currentStep: number;
}

function WizardContent() {
  const navigate = useNavigate();
  const { data, currentStep, setCurrentStep, goNext, goBack, canGoNext, isLastStep, loadFromSaved, getStepErrors, getAllErrors } = usePropertyWizard();

  // Compute step errors for progress bar
  const stepErrors: Record<number, number> = {};
  for (let i = 0; i < 5; i++) {
    const errs = getStepErrors(i);
    if (errs.length > 0) stepErrors[i] = errs.length;
  }
  const { data: agentProfile } = useAgentProfile();
  const { data: cities = [] } = useCities();
  const createProperty = useCreateProperty();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [submittedTitle, setSubmittedTitle] = useState('');
  const [overageAccepted, setOverageAccepted] = useState(true);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState<DuplicateCheckResult | null>(null);
  const [isActingOnDuplicate, setIsActingOnDuplicate] = useState(false);
  const [marketFitConfirmed, setMarketFitConfirmed] = useState(false);
  const hasCheckedDraft = useRef(false);

  const isAgentVerified = agentProfile?.status === 'active';
  const { canCreate: canCreateListing, isOverLimit } = useListingLimitCheck('agency');
  const duplicateCheck = useDuplicateCheck();

  const marketFitReview = useMemo(() => {
    const city = cities.find((item) => item.name === data.city);
    return getMarketFitReview({
      price: data.price,
      size_sqm: data.size_sqm,
      listing_status: data.listing_status,
      cityAveragePriceSqm: city?.average_price_sqm,
      premium_drivers: data.premium_drivers,
      premium_explanation: data.premium_explanation,
      property: data,
    });
  }, [cities, data]);
  const selectedCityAveragePriceSqm = cities.find((item) => item.name === data.city)?.average_price_sqm ?? null;

  useEffect(() => {
    setMarketFitConfirmed(false);
  }, [marketFitReview.reviewReason]);

  const autoSave = useAutoSave<PropertyWizardData, WizardMetadata>({
    data,
    storageKey: PROPERTY_WIZARD_STORAGE_KEY,
    autoSaveInterval: 0,
    useSessionKey: false,
    metadata: { currentStep },
  });

  // Check for saved draft on mount
  useEffect(() => {
    if (hasCheckedDraft.current) return;
    hasCheckedDraft.current = true;
    const saved = autoSave.getSavedData();
    if (saved?.data && saved.data.title) {
      setShowRecoveryDialog(true);
    }
  }, []);

  const handleResumeDraft = () => {
    const saved = autoSave.getSavedData();
    if (saved?.data) {
      loadFromSaved(saved.data);
      if (saved.metadata?.currentStep !== undefined) {
        setCurrentStep(saved.metadata.currentStep);
      }
    }
    setShowRecoveryDialog(false);
  };

  const handleStartFresh = () => {
    autoSave.clearSavedData();
    setShowRecoveryDialog(false);
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      await createProperty.mutateAsync({
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
        sqm_source: data.sqm_source,
        ownership_type: data.ownership_type,
        floor: data.floor,
        total_floors: data.total_floors,
        apartment_number: data.apartment_number,
        year_built: data.year_built,
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
        premium_drivers: data.premium_drivers,
        premium_explanation: data.premium_explanation || null,
        benchmark_review_status: data.benchmark_review_status,
        market_fit_status: marketFitReview.level,
        market_fit_review_reason: marketFitReview.reviewReason,
        submitForReview: false,
      });
      autoSave.clearSavedData();
      navigate('/agent/properties');
    } finally {
      setIsSubmitting(false);
    }
  };

  const runDuplicateCheck = async (): Promise<boolean> => {
    if (!agentProfile?.agency_id) return true; // independent agent → no agency-level dedupe
    try {
      const result = await duplicateCheck.mutateAsync({
        agencyId: agentProfile.agency_id,
        agentId: agentProfile.id,
        address: data.address,
        city: data.city,
        neighborhood: data.neighborhood,
        size_sqm: data.size_sqm,
        bedrooms: data.bedrooms,
        price: data.price,
        latitude: data.latitude,
        longitude: data.longitude,
        floor: data.floor,
        apartment_number: data.apartment_number,
      });
      if (result.kind === 'clear') return true;
      setDuplicateResult(result);
      return false;
    } catch {
      // Don't hard-block on check failure — let submission proceed
      return true;
    }
  };

  /**
   * Choice handler for the ConfirmDuplicateDialog. Interprets the agent's
   * pick and routes to the right side effect (promote primary, co-list,
   * dispute, or cancel).
   */
  const handleDuplicateChoice = async (
    action: 'same_unit' | 'different_unit' | 'dispute' | 'cancel',
    disputeReason?: string,
  ) => {
    if (!duplicateResult || duplicateResult.kind === 'clear') return;
    if (!agentProfile?.agency_id || !agentProfile.id) {
      toast.error('Missing agent profile');
      return;
    }

    if (action === 'cancel') {
      setDuplicateResult(null);
      return;
    }

    if (action === 'different_unit') {
      toast.info('Add the floor or apartment # to tell the units apart.');
      setDuplicateResult(null);
      setCurrentStep(1);
      return;
    }

    setIsActingOnDuplicate(true);
    try {
      if (duplicateResult.kind === 'intra_block') {
        // Hard block — no side effect, just close
        setDuplicateResult(null);
        return;
      }

      const match = duplicateResult.match;
      if (action === 'same_unit' && duplicateResult.kind === 'confirm_scrape') {
        await upgradePrimaryFromScrape(match.property_id, agentProfile.agency_id, agentProfile.id);
        toast.success('You are now the primary agent on this listing. Edit it from your dashboard.');
        autoSave.clearSavedData();
        setDuplicateResult(null);
        navigate('/agent/properties');
      } else if (action === 'same_unit' && duplicateResult.kind === 'confirm_manual') {
        await colistAsSecondary(match.property_id, agentProfile.agency_id, agentProfile.id);
        toast.success('Added as a co-listing agent. You\'ll receive inquiries when buyers pick your agency.');
        autoSave.clearSavedData();
        setDuplicateResult(null);
        navigate('/agent/properties');
      } else if (action === 'dispute' && duplicateResult.kind === 'confirm_manual') {
        await filePrimaryDisputeWithColist(
          match.property_id,
          agentProfile.agency_id,
          agentProfile.id,
          disputeReason ?? null,
        );
        toast.success('Dispute filed. Your listing is published as co-listed while our team reviews.');
        autoSave.clearSavedData();
        setDuplicateResult(null);
        navigate('/agent/properties');
      }
    } catch (e) {
      toast.error(`Action failed: ${(e as Error).message}`);
    } finally {
      setIsActingOnDuplicate(false);
    }
  };

  const handleSubmitForReview = async () => {
    if ((marketFitReview.requiresContext || marketFitReview.requiresConfirmation) && !marketFitConfirmed) {
      toast.info('Add premium context or confirm the price review note before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const allowed = await runDuplicateCheck();
      if (!allowed) {
        setIsSubmitting(false);
        return;
      }
      await createProperty.mutateAsync({
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
        sqm_source: data.sqm_source,
        ownership_type: data.ownership_type,
        floor: data.floor,
        total_floors: data.total_floors,
        apartment_number: data.apartment_number,
        year_built: data.year_built,
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
        premium_drivers: data.premium_drivers,
        premium_explanation: data.premium_explanation || null,
        benchmark_review_status: data.benchmark_review_status,
        market_fit_status: marketFitReview.level,
        market_fit_review_reason: marketFitReview.reviewReason,
        market_fit_confirmed_at: marketFitReview.requiresConfirmation ? new Date().toISOString() : null,
        submitForReview: true,
      });

      autoSave.clearSavedData();
      setSubmittedTitle(data.title);
      setShowSuccessDialog(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <StepBasics />;
      case 1: return <StepDetails />;
      case 2: return <StepFeatures />;
      case 3: return <StepPhotos />;
      case 4: return <StepDescription />;
      case 5: return <StepReview onEditStep={setCurrentStep} />;
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
              <Button variant="ghost" onClick={() => navigate('/agent')} className="rounded-xl hover:bg-primary/5 -ml-2">
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
                  disabled={isSubmitting || !data.title}
                  className="rounded-xl"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
              </div>
            </motion.div>

            {/* Progress */}
            <motion.div variants={itemVariants}>
              <WizardProgress currentStep={currentStep} steps={steps} onStepClick={setCurrentStep} stepErrors={stepErrors} />
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
                {isLastStep && !isAgentVerified && (
                  <Alert variant="default" className="bg-primary/5 border-primary/20">
                    <ShieldAlert className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-foreground">Pending Verification</AlertTitle>
                    <AlertDescription className="text-muted-foreground">
                      Your agent license is pending verification. You can save drafts, but submissions for review are disabled until your account is approved.
                    </AlertDescription>
                  </Alert>
                )}

                {isLastStep && data.listing_status === 'for_sale' && (
                  <PriceContextSubmissionPreview
                    data={data}
                    cityAveragePriceSqm={selectedCityAveragePriceSqm}
                    review={marketFitReview}
                    confirmed={marketFitConfirmed}
                    onConfirmedChange={setMarketFitConfirmed}
                    onEditDetails={() => setCurrentStep(1)}
                    onEditPremiumContext={() => setCurrentStep(2)}
                  />
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
                                 disabled={isSubmitting || getAllErrors().length > 0 || !isAgentVerified || !canCreateListing || (isOverLimit && !overageAccepted)}
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
                           {(!isAgentVerified || !canCreateListing || (isOverLimit && !overageAccepted)) && (
                             <TooltipContent>
                               {!isAgentVerified ? 'Agent verification required' : !canCreateListing ? 'Subscription required' : 'Accept overage charge to continue'}
                             </TooltipContent>
                           )}
                         </Tooltip>
                       </TooltipProvider>
                    </div>
                  ) : (
                    <Button
                      onClick={goNext}
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

        {/* Draft Recovery Dialog */}
        <Dialog open={showRecoveryDialog} onOpenChange={setShowRecoveryDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-2">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <DialogTitle className="text-center">Resume Previous Draft?</DialogTitle>
              <DialogDescription className="text-center">
                You have an unfinished listing draft. Would you like to continue where you left off or start fresh?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleStartFresh} className="rounded-xl">
                Start Fresh
              </Button>
              <Button onClick={handleResumeDraft} className="rounded-xl">
                <FileText className="h-4 w-4 mr-2" />
                Resume Draft
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <PropertySubmittedDialog
          open={showSuccessDialog}
          onClose={() => setShowSuccessDialog(false)}
          propertyTitle={submittedTitle}
        />

        <ConfirmDuplicateDialog
          open={!!duplicateResult}
          onOpenChange={(o) => !o && setDuplicateResult(null)}
          result={duplicateResult}
          attemptedAddress={data.address || ''}
          attemptedCity={data.city || null}
          onChoice={handleDuplicateChoice}
          isActing={isActingOnDuplicate}
        />
      </div>
    </Layout>
  );
}

export default function NewPropertyWizard() {
  return (
    <PropertyWizardProvider>
      <WizardContent />
    </PropertyWizardProvider>
  );
}
