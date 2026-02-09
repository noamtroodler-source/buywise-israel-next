import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Save, Send, Loader2, ShieldAlert, AlertCircle, Clock, CheckCircle2, XCircle } from 'lucide-react';
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
  StepReview 
} from '@/components/agent/wizard/steps';
import { useProperty } from '@/hooks/useProperties';
import { useUpdateProperty, useSubmitForReview, VerificationStatus, useAgentProfile } from '@/hooks/useAgentProperties';
import { PropertySubmittedDialog } from '@/components/agent/PropertySubmittedDialog';

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

const statusConfig: Record<VerificationStatus, { 
  label: string; 
  variant: 'default' | 'secondary' | 'destructive' | 'outline'; 
  icon: typeof Clock;
  description: string;
  className: string;
}> = {
  draft: { 
    label: 'Draft', 
    variant: 'secondary', 
    icon: Clock,
    description: 'This listing is a draft. Submit for review to get it published.',
    className: ''
  },
  pending_review: { 
    label: 'Pending Review', 
    variant: 'outline', 
    icon: Clock,
    description: 'This listing is awaiting admin review.',
    className: 'border-primary/30 bg-primary/5 text-primary'
  },
  approved: { 
    label: 'Published', 
    variant: 'default', 
    icon: CheckCircle2,
    description: 'This listing is live. Major changes may require re-review.',
    className: ''
  },
  changes_requested: { 
    label: 'Changes Requested', 
    variant: 'outline', 
    icon: AlertCircle,
    description: 'Admin has requested changes. Please review feedback.',
    className: 'border-primary/30 bg-primary/5 text-primary'
  },
  rejected: { 
    label: 'Rejected', 
    variant: 'outline', 
    icon: XCircle,
    description: 'This listing was rejected. Please review the feedback.',
    className: 'border-primary/30 bg-primary/5 text-primary'
  },
};

interface EditWizardContentProps {
  propertyId: string;
}

function EditWizardContent({ propertyId }: EditWizardContentProps) {
  const navigate = useNavigate();
  const { data: property, isLoading } = useProperty(propertyId);
  const { data, currentStep, setCurrentStep, goNext, goBack, canGoNext, isLastStep, loadFromSaved, updateData } = usePropertyWizard();
  const { data: agentProfile } = useAgentProfile();
  const updateProperty = useUpdateProperty();
  const submitForReview = useSubmitForReview();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  
  const isAgentVerified = agentProfile?.status === 'active';

  // Load property data into wizard context
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
        // Explicit amenity booleans - derive from features array or db columns
        has_balcony: (property as any).has_balcony ?? (property.features || []).includes('balcony'),
        has_elevator: (property as any).has_elevator ?? (property.features || []).includes('elevator'),
        has_storage: (property as any).has_storage ?? (property.features || []).includes('storage'),
        // Lease reality fields
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
  const isLive = verificationStatus === 'approved';
  const isPending = verificationStatus === 'pending_review';

  const handleSaveChanges = async () => {
    setIsSubmitting(true);
    try {
      await updateProperty.mutateAsync({
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
        // Lease reality fields
        lease_term: data.lease_term,
        subletting_allowed: data.subletting_allowed,
        furnished_status: data.furnished_status,
        pets_policy: data.pets_policy,
         furniture_items: data.furniture_items,
         featured_highlight: data.featured_highlight || null,
      } as any);
      navigate('/agent/properties');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForReview = async () => {
    setIsSubmitting(true);
    try {
      // First save changes
      await updateProperty.mutateAsync({
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
        // Lease reality fields
        lease_term: data.lease_term,
        subletting_allowed: data.subletting_allowed,
        furnished_status: data.furnished_status,
        pets_policy: data.pets_policy,
         furniture_items: data.furniture_items,
         featured_highlight: data.featured_highlight || null,
      } as any);
      
      // Then submit for review
      await submitForReview.mutateAsync(propertyId);
      
      setShowSuccessDialog(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StepBasics />;
      case 1:
        return <StepDetails />;
      case 2:
        return <StepFeatures />;
      case 3:
        return <StepPhotos />;
      case 4:
        return <StepDescription />;
      case 5:
        return <StepReview onEditStep={setCurrentStep} />;
      default:
        return null;
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
          <Button onClick={() => navigate('/agent/properties')} className="mt-4">
            Back to Properties
          </Button>
        </div>
      </Layout>
    );
  }

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
              <Button variant="ghost" onClick={() => navigate('/agent/properties')} className="rounded-xl hover:bg-primary/5 -ml-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Properties
              </Button>
              <div className="flex items-center gap-3">
                <Badge variant={statusInfo.variant} className="flex items-center gap-1.5">
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
                  <AlertDescription className="mt-2 whitespace-pre-wrap text-primary/80">
                    {rejectionReason}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            {isLive && (
              <motion.div variants={itemVariants}>
                <Alert className="border-primary/20 bg-primary/5">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  <AlertTitle>Live Listing</AlertTitle>
                  <AlertDescription>
                    This listing is published. Changes will update the live listing immediately.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            {isPending && (
              <motion.div variants={itemVariants}>
                <Alert className="border-primary/20 bg-primary/5">
                  <Clock className="h-4 w-4 text-primary" />
                  <AlertTitle className="text-primary">Under Review</AlertTitle>
                  <AlertDescription className="text-primary/70">
                    This listing is currently being reviewed by our team.
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
                {isLastStep && !isAgentVerified && (
                  <Alert variant="default" className="bg-primary/5 border-primary/20">
                    <ShieldAlert className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-foreground">Pending Verification</AlertTitle>
                    <AlertDescription className="text-muted-foreground">
                      Your agent license is pending verification. You can save changes, but submissions are disabled until approved.
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
                        disabled={isSubmitting}
                        className="rounded-xl h-11"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                      {canResubmit && (
                        <Button
                          onClick={handleSubmitForReview}
                          disabled={isSubmitting || !canGoNext || !isAgentVerified}
                          className="gap-2 rounded-xl h-11 px-6"
                          title={!isAgentVerified ? 'Agent verification required' : undefined}
                        >
                          {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              {verificationStatus === 'draft' ? 'Submit for Review' : 'Resubmit for Review'}
                            </>
                          )}
                        </Button>
                      )}
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

        <PropertySubmittedDialog
          open={showSuccessDialog}
          onClose={() => setShowSuccessDialog(false)}
          propertyTitle={data.title}
          isResubmission={verificationStatus !== 'draft'}
        />
      </div>
    </Layout>
  );
}

export default function EditPropertyWizard() {
  const { id } = useParams<{ id: string }>();
  
  if (!id) {
    return (
      <Layout>
        <div className="container py-8 text-center">
          <p className="text-muted-foreground">Property ID not provided</p>
        </div>
      </Layout>
    );
  }

  return (
    <PropertyWizardProvider>
      <EditWizardContent propertyId={id} />
    </PropertyWizardProvider>
  );
}
