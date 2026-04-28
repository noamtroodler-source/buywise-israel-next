import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Save, Send, Loader2, Sparkles, FileText } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WizardProgress } from '@/components/agent/wizard/WizardProgress';
import { PropertyWizardProvider, usePropertyWizard, PropertyWizardData } from '@/components/agent/wizard/PropertyWizardContext';
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
import {
  useDuplicateCheck,
  colistAsSecondary,
  upgradePrimaryFromScrape,
  filePrimaryDisputeWithColist,
  type DuplicateCheckResult,
} from '@/hooks/useDuplicateCheck';
import { ConfirmDuplicateDialog } from '@/components/agency/ConfirmDuplicateDialog';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { useCities } from '@/hooks/useCities';
import { getMarketFitReview } from '@/lib/marketFit';

const AGENCY_WIZARD_STORAGE_KEY = 'agency-property-wizard-draft';

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

interface AgencyWizardMetadata {
  currentStep: number;
  assignedAgentId: string | null;
}

function AgencyWizardContent() {
  const navigate = useNavigate();
  const { data, currentStep, setCurrentStep, goNext, goBack, canGoNext, isLastStep, setStepOffset, loadFromSaved, getStepErrors, getAllErrors } = usePropertyWizard();

  // Compute step errors for progress bar (step 0 = Assign Agent has no validation here)
  const stepErrors: Record<number, number> = {};
  for (let i = 0; i < 5; i++) {
    const errs = getStepErrors(i);
    if (errs.length > 0) stepErrors[i + 1] = errs.length; // offset by 1 for Assign Agent step
  }

  useEffect(() => {
    setStepOffset(1);
  }, [setStepOffset]);

  const { data: agency } = useMyAgency();
  const { data: team = [] } = useAgencyTeam(agency?.id);
  const { data: listings = [] } = useAgencyListingsManagement(agency?.id);
  const { data: cities = [] } = useCities();
  const createProperty = useCreatePropertyForAgency();

  const [assignedAgentId, setAssignedAgentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [submittedTitle, setSubmittedTitle] = useState('');
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState<DuplicateCheckResult | null>(null);
  const [isActingOnDuplicate, setIsActingOnDuplicate] = useState(false);
  const [marketFitConfirmed, setMarketFitConfirmed] = useState(false);
  const hasCheckedDraft = useRef(false);
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

  useEffect(() => {
    setMarketFitConfirmed(false);
  }, [marketFitReview.reviewReason]);

  const autoSave = useAutoSave<PropertyWizardData, AgencyWizardMetadata>({
    data,
    storageKey: AGENCY_WIZARD_STORAGE_KEY,
    autoSaveInterval: 0,
    useSessionKey: false,
    metadata: { currentStep, assignedAgentId },
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
      if (saved.metadata?.assignedAgentId) {
        setAssignedAgentId(saved.metadata.assignedAgentId);
      }
    }
    setShowRecoveryDialog(false);
  };

  const handleStartFresh = () => {
    autoSave.clearSavedData();
    setShowRecoveryDialog(false);
  };

  const listingCounts: Record<string, number> = {};
  for (const listing of listings) {
    if (listing.agent_id) {
      listingCounts[listing.agent_id] = (listingCounts[listing.agent_id] ?? 0) + 1;
    }
  }

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
    apartment_number: data.apartment_number,
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
    premium_drivers: data.premium_drivers,
    premium_explanation: data.premium_explanation || null,
    market_fit_status: marketFitReview.level,
    market_fit_review_reason: marketFitReview.reviewReason,
    market_fit_confirmed_at: submitForReview && marketFitReview.requiresConfirmation ? new Date().toISOString() : null,
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

  /**
   * Choice handler for the ConfirmDuplicateDialog. See NewPropertyWizard for
   * mirror implementation — agency version routes to /agency/listings on
   * success.
   */
  const handleDuplicateChoice = async (
    action: 'same_unit' | 'different_unit' | 'dispute' | 'cancel',
    disputeReason?: string,
  ) => {
    if (!duplicateResult || duplicateResult.kind === 'clear') return;
    if (!agency?.id || !assignedAgentId) {
      toast.error('Missing agency / agent context');
      return;
    }
    if (action === 'cancel') {
      setDuplicateResult(null);
      return;
    }
    if (action === 'different_unit') {
      toast.info('Add the floor or apartment # to tell the units apart.');
      setDuplicateResult(null);
      setCurrentStep(2); // agency wizard: step 2 is Details (floor/apt)
      return;
    }

    setIsActingOnDuplicate(true);
    try {
      if (duplicateResult.kind === 'intra_block') {
        setDuplicateResult(null);
        return;
      }

      const match = duplicateResult.match;
      if (action === 'same_unit' && duplicateResult.kind === 'confirm_scrape') {
        await upgradePrimaryFromScrape(match.property_id, agency.id, assignedAgentId);
        toast.success('Your agency is now the primary on this listing. Edit it from your dashboard.');
        autoSave.clearSavedData();
        setDuplicateResult(null);
        navigate('/agency/listings');
      } else if (action === 'same_unit' && duplicateResult.kind === 'confirm_manual') {
        await colistAsSecondary(match.property_id, agency.id, assignedAgentId);
        toast.success('Added as a co-listing agency. You\'ll receive inquiries when buyers pick your agency.');
        autoSave.clearSavedData();
        setDuplicateResult(null);
        navigate('/agency/listings');
      } else if (action === 'dispute' && duplicateResult.kind === 'confirm_manual') {
        await filePrimaryDisputeWithColist(
          match.property_id,
          agency.id,
          assignedAgentId,
          disputeReason ?? null,
        );
        toast.success('Dispute filed. Your listing is published as co-listed while our team reviews.');
        autoSave.clearSavedData();
        setDuplicateResult(null);
        navigate('/agency/listings');
      }
    } catch (e) {
      toast.error(`Action failed: ${(e as Error).message}`);
    } finally {
      setIsActingOnDuplicate(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!assignedAgentId) return;
    if (marketFitReview.requiresContext) {
      toast.info('Add premium context so buyers understand the price difference.');
      setCurrentStep(3);
      return;
    }

    if (marketFitReview.requiresConfirmation && !marketFitConfirmed) {
      toast.info('Confirm the price review note before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (agency?.id && data.address && data.city) {
        const result = await duplicateCheck.mutateAsync({
          agencyId: agency.id,
          agentId: assignedAgentId,
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
        if (result.kind !== 'clear') {
          setDuplicateResult(result);
          setIsSubmitting(false);
          return;
        }
      }
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
      case 6: return <StepReview onEditStep={(s) => setCurrentStep(s)} stepOffset={1} />;
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
              <div className="space-y-4 p-4 rounded-2xl bg-card/95 backdrop-blur-sm border border-border shadow-lg">
                {isLastStep && marketFitReview.level !== 'none' && (
                  <Alert variant="default" className="bg-primary/5 border-primary/20">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-foreground">{marketFitReview.title}</AlertTitle>
                    <AlertDescription className="space-y-3 text-muted-foreground">
                      <p>{marketFitReview.message}</p>
                      {marketFitReview.gapPercent !== null && (
                        <p className="text-xs">Current benchmark gap: about {marketFitReview.gapPercent}% above city price/sqm.</p>
                      )}
                      {marketFitReview.requiresContext && (
                        <Button variant="outline" size="sm" onClick={() => setCurrentStep(3)} className="rounded-xl">
                          Add Premium Context
                        </Button>
                      )}
                      {marketFitReview.requiresConfirmation && !marketFitReview.requiresContext && (
                        <label className="flex items-start gap-2 text-sm text-foreground">
                          <Checkbox checked={marketFitConfirmed} onCheckedChange={(checked) => setMarketFitConfirmed(Boolean(checked))} />
                          <span>I confirm the asking price and understand this listing may receive closer market-fit review.</span>
                        </label>
                      )}
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
                    <Button
                      onClick={handleSubmitForReview}
                      disabled={isSubmitting || getAllErrors().length > 0 || !assignedAgentId}
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
                      disabled={currentStep === 0 && !assignedAgentId}
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
          onClose={() => navigate('/agency/listings')}
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
          existingDraftHref="/agency/listings"
        />
      </div>
    </Layout>
  );
}

export default function AgencyNewPropertyWizard() {
  return (
    <PropertyWizardProvider totalSteps={7}>
      <AgencyWizardContent />
    </PropertyWizardProvider>
  );
}
