import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Save, Send, Loader2, AlertCircle, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
import { useProperty } from '@/hooks/useProperties';
import { useUpdatePropertyForAgency, useSubmitForReview, VerificationStatus } from '@/hooks/useAgentProperties';
import { PropertySubmittedDialog } from '@/components/agent/PropertySubmittedDialog';
import { useAutoSave } from '@/hooks/useAutoSave';
import { SaveStatusIndicator } from '@/components/shared/SaveStatusIndicator';

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
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const statusConfig: Record<VerificationStatus, {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  icon: typeof Clock;
  className: string;
}> = {
  draft: { label: 'Draft', variant: 'secondary', icon: Clock, className: '' },
  pending_review: { label: 'Pending Review', variant: 'outline', icon: Clock, className: 'border-primary/30 bg-primary/5 text-primary' },
  approved: { label: 'Published', variant: 'default', icon: CheckCircle2, className: '' },
  changes_requested: { label: 'Changes Requested', variant: 'outline', icon: AlertCircle, className: 'border-primary/30 bg-primary/5 text-primary' },
  rejected: { label: 'Rejected', variant: 'outline', icon: XCircle, className: 'border-primary/30 bg-primary/5 text-primary' },
};

function AgencyEditWizardContent({ propertyId }: { propertyId: string }) {
  const navigate = useNavigate();
  const { data: property, isLoading } = useProperty(propertyId);
  const { data, currentStep, setCurrentStep, goNext, goBack, canGoNext, isLastStep, loadFromSaved } = usePropertyWizard();
  const updateProperty = useUpdatePropertyForAgency();
  const submitForReview = useSubmitForReview();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Auto-save for dirty tracking + beforeunload warning
  const autoSaveMetadata = useMemo(() => ({ currentStep }), [currentStep]);
  const { isDirty, isSaving, lastSavedAt, error: saveError, clearSavedData } = useAutoSave({
    data: hasLoaded ? data : {},
    storageKey: `agency-edit-property-draft-${propertyId}`,
    debounceMs: 1000,
    autoSaveInterval: 0,
    metadata: autoSaveMetadata,
  });

  useEffect(() => {
    if (property && !hasLoaded) {
      const wizardData: PropertyWizardData = {
        title: property.title || '',
        property_type: property.property_type || 'apartment',
        listing_status: property.listing_status || 'for_sale',
        price: property.price || 0,
        city: property.city || '',
        neighborhood: property.neighborhood || '',
        address: property.address || '',
        latitude: property.latitude || null,
        longitude: property.longitude || null,
        place_id: '',
        bedrooms: property.bedrooms || 0,
        additional_rooms: (property as any).additional_rooms || 0,
        bathrooms: property.bathrooms || 0,
        size_sqm: property.size_sqm || undefined,
        lot_size_sqm: property.lot_size_sqm || undefined,
        floor: property.floor || undefined,
        total_floors: property.total_floors || undefined,
        year_built: property.year_built || undefined,
        parking: property.parking || 0,
        condition: property.condition || 'good',
        ac_type: property.ac_type || 'split',
        entry_date: property.entry_date || undefined,
        is_immediate_entry: !property.entry_date,
        vaad_bayit_monthly: property.vaad_bayit_monthly || undefined,
        features: property.features || [],
        has_balcony: (property as any).has_balcony ?? (property.features || []).includes('balcony'),
        has_elevator: (property as any).has_elevator ?? (property.features || []).includes('elevator'),
        has_storage: (property as any).has_storage ?? (property.features || []).includes('storage'),
        lease_term: (property as any).lease_term || undefined,
        subletting_allowed: (property as any).subletting_allowed || undefined,
        furnished_status: (property as any).furnished_status || undefined,
        pets_policy: (property as any).pets_policy || undefined,
        agent_fee_required: (property as any).agent_fee_required ?? undefined,
        images: property.images || [],
        description: property.description || '',
        highlights: [],
        furniture_items: (property as any).furniture_items || [],
        featured_highlight: (property as any).featured_highlight || '',
        savedPrice: property.price || undefined,
      };
      loadFromSaved(wizardData);
      setHasLoaded(true);
    }
  }, [property, hasLoaded, loadFromSaved]);

  const verificationStatus = ((property as any)?.verification_status || 'draft') as VerificationStatus;
  const rejectionReason = (property as any)?.rejection_reason;
  const statusInfo = statusConfig[verificationStatus];
  const StatusIcon = statusInfo?.icon || Clock;
  const canResubmit = verificationStatus === 'draft' || verificationStatus === 'changes_requested' || verificationStatus === 'rejected';

  const buildPayload = () => ({
    id: propertyId,
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
    condition: data.condition as any,
    lease_term: data.lease_term,
    subletting_allowed: data.subletting_allowed,
    furnished_status: data.furnished_status,
    pets_policy: data.pets_policy,
    furniture_items: data.furniture_items,
    featured_highlight: data.featured_highlight || null,
  });

  const handleSaveChanges = async () => {
    setIsSubmitting(true);
    try {
      await updateProperty.mutateAsync(buildPayload() as any);
      clearSavedData();
      navigate('/agency/listings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForReview = async () => {
    setIsSubmitting(true);
    try {
      await updateProperty.mutateAsync(buildPayload() as any);
      await submitForReview.mutateAsync(propertyId);
      clearSavedData();
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

  if (isLoading || !hasLoaded) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!property) {
    return (
      <Layout>
        <div className="container py-8 text-center">
          <p className="text-muted-foreground">Property not found</p>
          <Button onClick={() => navigate('/agency/listings')} className="mt-4">Back to Listings</Button>
        </div>
      </Layout>
    );
  }

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
              <div className="flex items-center gap-3">
                <SaveStatusIndicator isSaving={isSaving} lastSavedAt={lastSavedAt} isDirty={isDirty} error={saveError} />
                <Badge variant={statusInfo.variant} className={`flex items-center gap-1.5 ${statusInfo.className}`}>
                  <StatusIcon className="h-3 w-3" />
                  {statusInfo.label}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveChanges}
                  disabled={isSubmitting}
                  className="rounded-xl"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </motion.div>

            {/* Status Alerts */}
            {(verificationStatus === 'changes_requested' || verificationStatus === 'rejected') && rejectionReason && (
              <motion.div variants={itemVariants}>
                <Alert className="border-primary/30 bg-primary/5">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  <AlertTitle className="text-primary font-semibold">Admin Feedback</AlertTitle>
                  <AlertDescription className="mt-2 whitespace-pre-wrap text-primary/80">{rejectionReason}</AlertDescription>
                </Alert>
              </motion.div>
            )}

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
                    <Button variant="outline" onClick={handleSaveChanges} disabled={isSubmitting} className="rounded-xl h-11">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                    {canResubmit && (
                      <Button onClick={handleSubmitForReview} disabled={isSubmitting || !canGoNext} className="gap-2 rounded-xl h-11 px-6">
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                          <>
                            <Send className="h-4 w-4" />
                            Submit for Review
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button onClick={goNext} disabled={!canGoNext} className="rounded-xl h-11 px-6">
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
          propertyTitle={data.title}
        />
      </div>
    </Layout>
  );
}

export default function AgencyEditPropertyWizard() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  return (
    <PropertyWizardProvider>
      <AgencyEditWizardContent propertyId={id} />
    </PropertyWizardProvider>
  );
}
