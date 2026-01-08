import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Plane, Building2, User, ArrowRight, ArrowLeft, Check, ArrowUpDown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateBuyerProfile, BuyerProfileInsert } from '@/hooks/useBuyerProfile';

interface BuyerOnboardingProps {
  open: boolean;
  onComplete: () => void;
  onClose?: () => void;
}

type Step = 1 | 2 | 3 | 4 | 5;

const currentYear = new Date().getFullYear();
const aliyahYears = Array.from({ length: 10 }, (_, i) => currentYear - i);

export function BuyerOnboarding({ open, onComplete, onClose }: BuyerOnboardingProps) {
  const [step, setStep] = useState<Step>(1);
  const [answers, setAnswers] = useState<Partial<BuyerProfileInsert>>({
    residency_status: undefined,
    aliyah_year: undefined,
    is_first_property: undefined,
    is_upgrading: false,
    purchase_purpose: undefined,
    buyer_entity: 'individual',
  });
  
  const createProfile = useCreateBuyerProfile();

  // Calculate which steps to show based on answers
  const getNextStep = (currentStep: Step): Step => {
    if (currentStep === 1) {
      // Skip Aliyah year if not Oleh
      return answers.residency_status === 'oleh_hadash' ? 2 : 3;
    }
    return (currentStep + 1) as Step;
  };

  const getPrevStep = (currentStep: Step): Step => {
    if (currentStep === 3 && answers.residency_status !== 'oleh_hadash') {
      return 1;
    }
    return (currentStep - 1) as Step;
  };

  const handleNext = () => {
    const nextStep = getNextStep(step);
    if (nextStep <= 5) {
      setStep(nextStep);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(getPrevStep(step));
    }
  };

  const handleComplete = async () => {
    await createProfile.mutateAsync({
      ...answers,
      onboarding_completed: true,
    });
    onComplete();
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return !!answers.residency_status;
      case 2:
        return !!answers.aliyah_year;
      case 3:
        return answers.is_first_property !== undefined || answers.is_upgrading;
      case 4:
        return !!answers.purchase_purpose;
      case 5:
        return !!answers.buyer_entity;
      default:
        return false;
    }
  };

  // Calculate visible step number (skipping hidden steps)
  const getStepNumber = () => {
    if (answers.residency_status === 'oleh_hadash') {
      return step;
    }
    // Non-Oleh flow skips step 2
    if (step === 1) return 1;
    if (step === 3) return 2;
    if (step === 4) return 3;
    if (step === 5) return 4;
    return step;
  };

  const getTotalSteps = () => {
    return answers.residency_status === 'oleh_hadash' ? 5 : 4;
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  // Handle property ownership selection with upgrader support
  const handlePropertyOwnership = (value: string) => {
    if (value === 'first') {
      setAnswers({ ...answers, is_first_property: true, is_upgrading: false });
    } else if (value === 'upgrading') {
      setAnswers({ ...answers, is_first_property: false, is_upgrading: true });
    } else {
      setAnswers({ ...answers, is_first_property: false, is_upgrading: false });
    }
  };

  const getPropertyOwnershipValue = () => {
    if (answers.is_upgrading) return 'upgrading';
    if (answers.is_first_property) return 'first';
    if (answers.is_first_property === false) return 'additional';
    return undefined;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-xl">Let's personalize your experience</DialogTitle>
          <DialogDescription>
            Step {getStepNumber()} of {getTotalSteps()} — This helps us show you accurate cost estimates
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <AnimatePresence mode="wait">
            {/* Step 1: Residency Status */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="font-medium text-foreground">What's your tax status in Israel?</h3>
                <RadioGroup
                  value={answers.residency_status}
                  onValueChange={(v) => setAnswers({ ...answers, residency_status: v as BuyerProfileInsert['residency_status'] })}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer">
                    <RadioGroupItem value="israeli_resident" id="israeli" />
                    <Label htmlFor="israeli" className="flex items-center gap-3 cursor-pointer flex-1">
                      <User className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Israeli Resident (7+ Years)</p>
                        <p className="text-sm text-muted-foreground">I've been a resident for over 7 years — standard tax rates apply</p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer">
                    <RadioGroupItem value="oleh_hadash" id="oleh" />
                    <Label htmlFor="oleh" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Plane className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">New Oleh (Within 7 Years)</p>
                          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Tax Benefit</span>
                        </div>
                        <p className="text-sm text-muted-foreground">I made Aliyah recently — eligible for reduced purchase tax rates</p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer">
                    <RadioGroupItem value="non_resident" id="foreign" />
                    <Label htmlFor="foreign" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Building2 className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Non-Resident / Foreign Buyer</p>
                        <p className="text-sm text-muted-foreground">I don't have Israeli residency</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </motion.div>
            )}

            {/* Step 2: Aliyah Year (Oleh only) */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="font-medium text-foreground">When did you make Aliyah?</h3>
                <p className="text-sm text-muted-foreground">
                  Olim receive special tax benefits for 7 years after Aliyah
                </p>
                <Select
                  value={answers.aliyah_year?.toString()}
                  onValueChange={(v) => setAnswers({ ...answers, aliyah_year: parseInt(v) })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select year of Aliyah" />
                  </SelectTrigger>
                  <SelectContent>
                    {aliyahYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                    <SelectItem value={(currentYear - 10).toString()}>Before {currentYear - 9}</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>
            )}

            {/* Step 3: Property Ownership (with Upgrader option) */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="font-medium text-foreground">What's your property situation?</h3>
                <p className="text-sm text-muted-foreground">
                  This affects your tax rates and mortgage eligibility
                </p>
                <RadioGroup
                  value={getPropertyOwnershipValue()}
                  onValueChange={handlePropertyOwnership}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer">
                    <RadioGroupItem value="first" id="first-yes" />
                    <Label htmlFor="first-yes" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Home className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">First Property</p>
                        <p className="text-sm text-muted-foreground">I don't own any property in Israel</p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer">
                    <RadioGroupItem value="upgrading" id="upgrading" />
                    <Label htmlFor="upgrading" className="flex items-center gap-3 cursor-pointer flex-1">
                      <ArrowUpDown className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Upgrading</p>
                        <p className="text-sm text-muted-foreground">I'm selling my current home within 18 months</p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer">
                    <RadioGroupItem value="additional" id="additional" />
                    <Label htmlFor="additional" className="flex items-center gap-3 cursor-pointer flex-1">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Additional Property</p>
                        <p className="text-sm text-muted-foreground">I already own property and will keep it</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </motion.div>
            )}

            {/* Step 4: Purchase Purpose */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="font-medium text-foreground">What's your primary purpose?</h3>
                <RadioGroup
                  value={answers.purchase_purpose}
                  onValueChange={(v) => setAnswers({ ...answers, purchase_purpose: v as BuyerProfileInsert['purchase_purpose'] })}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer">
                    <RadioGroupItem value="primary_residence" id="purpose-primary" />
                    <Label htmlFor="purpose-primary" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Home className="h-5 w-5 text-primary" />
                      <p className="font-medium">Primary Residence</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer">
                    <RadioGroupItem value="vacation_home" id="purpose-vacation" />
                    <Label htmlFor="purpose-vacation" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Plane className="h-5 w-5 text-primary" />
                      <p className="font-medium">Vacation Home</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer">
                    <RadioGroupItem value="investment" id="purpose-investment" />
                    <Label htmlFor="purpose-investment" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Building2 className="h-5 w-5 text-primary" />
                      <p className="font-medium">Investment Property</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer">
                    <RadioGroupItem value="undecided" id="purpose-undecided" />
                    <Label htmlFor="purpose-undecided" className="cursor-pointer flex-1">
                      <p className="font-medium">Still Exploring</p>
                    </Label>
                  </div>
                </RadioGroup>
              </motion.div>
            )}

            {/* Step 5: Buyer Entity */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="font-medium text-foreground">How will you be purchasing?</h3>
                <p className="text-sm text-muted-foreground">
                  Corporate purchases have different tax implications
                </p>
                <RadioGroup
                  value={answers.buyer_entity}
                  onValueChange={(v) => setAnswers({ ...answers, buyer_entity: v as 'individual' | 'company' })}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer">
                    <RadioGroupItem value="individual" id="entity-individual" />
                    <Label htmlFor="entity-individual" className="flex items-center gap-3 cursor-pointer flex-1">
                      <User className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">As an Individual</p>
                        <p className="text-sm text-muted-foreground">Personal purchase in my own name</p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer">
                    <RadioGroupItem value="company" id="entity-company" />
                    <Label htmlFor="entity-company" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Building2 className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Through a Company</p>
                        <p className="text-sm text-muted-foreground">Purchase via a corporate entity</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex justify-between mt-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={step === 1}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed() || createProfile.isPending}
            className="gap-2"
          >
            {step === 5 || (step === 4 && answers.residency_status !== 'oleh_hadash') ? (
              <>
                {createProfile.isPending ? 'Saving...' : 'Complete'}
                <Check className="h-4 w-4" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
