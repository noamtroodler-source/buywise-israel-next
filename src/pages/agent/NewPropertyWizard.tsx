import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Save, Send, Loader2, Sparkles, ShieldAlert, Home } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { WizardProgress } from '@/components/agent/wizard/WizardProgress';
import { PropertyWizardProvider, usePropertyWizard } from '@/components/agent/wizard/PropertyWizardContext';
import { 
  StepBasics, 
  StepDetails, 
  StepFeatures, 
  StepPhotos, 
  StepDescription, 
  StepReview 
} from '@/components/agent/wizard/steps';
import { useCreateProperty, useAgentProfile } from '@/hooks/useAgentProperties';
import confetti from 'canvas-confetti';

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

function WizardContent() {
  const navigate = useNavigate();
  const { data, currentStep, setCurrentStep, goNext, goBack, canGoNext, isLastStep } = usePropertyWizard();
  const { data: agentProfile } = useAgentProfile();
  const createProperty = useCreateProperty();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Check if agent is verified (status is 'active')
  const isAgentVerified = agentProfile?.status === 'active';

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
        floor: data.floor,
        total_floors: data.total_floors,
        year_built: data.year_built,
        features: data.features,
        images: data.images,
        entry_date: data.is_immediate_entry ? undefined : data.entry_date,
        ac_type: data.ac_type as any,
        vaad_bayit_monthly: data.vaad_bayit_monthly,
        submitForReview: false,
      });
      navigate('/agent/properties');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForReview = async () => {
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
        floor: data.floor,
        total_floors: data.total_floors,
        year_built: data.year_built,
        features: data.features,
        images: data.images,
        entry_date: data.is_immediate_entry ? undefined : data.entry_date,
        ac_type: data.ac_type as any,
        vaad_bayit_monthly: data.vaad_bayit_monthly,
        submitForReview: true,
      });
      
      // Celebration!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      setTimeout(() => {
        navigate('/agent/properties');
      }, 1500);
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
              <Button variant="ghost" onClick={() => navigate('/agent')} className="rounded-xl hover:bg-primary/5 -ml-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
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
            <motion.div variants={itemVariants} className="sticky bottom-4">
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
                            Submit for Review
                            <Sparkles className="h-4 w-4" />
                          </>
                        )}
                      </Button>
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
