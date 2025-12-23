import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Plane, Building2, User, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateBuyerProfile, BuyerProfileInsert } from '@/hooks/useBuyerProfile';

interface BuyerOnboardingProps {
  open: boolean;
  onComplete: () => void;
}

type Step = 1 | 2 | 3 | 4;

const currentYear = new Date().getFullYear();
const aliyahYears = Array.from({ length: 10 }, (_, i) => currentYear - i);

export function BuyerOnboarding({ open, onComplete }: BuyerOnboardingProps) {
  const [step, setStep] = useState<Step>(1);
  const [answers, setAnswers] = useState<Partial<BuyerProfileInsert>>({
    residency_status: undefined,
    aliyah_year: undefined,
    is_first_property: undefined,
    purchase_purpose: undefined,
    buyer_entity: 'individual',
  });
  
  const createProfile = useCreateBuyerProfile();

  const handleNext = () => {
    if (step < 4) {
      // Skip Aliyah year question if not Oleh
      if (step === 1 && answers.residency_status !== 'oleh_hadash') {
        setStep(3);
      } else {
        setStep((s) => (s + 1) as Step);
      }
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      // Skip back over Aliyah year if not Oleh
      if (step === 3 && answers.residency_status !== 'oleh_hadash') {
        setStep(1);
      } else {
        setStep((s) => (s - 1) as Step);
      }
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
        return answers.is_first_property !== undefined;
      case 4:
        return !!answers.purchase_purpose;
      default:
        return false;
    }
  };

  const getStepNumber = () => {
    if (answers.residency_status === 'oleh_hadash') {
      return step;
    }
    // Non-Oleh flow: 1, 3, 4 (3 steps total)
    if (step === 1) return 1;
    if (step === 3) return 2;
    if (step === 4) return 3;
    return step;
  };

  const getTotalSteps = () => {
    return answers.residency_status === 'oleh_hadash' ? 4 : 3;
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-xl">Let's personalize your experience</DialogTitle>
          <DialogDescription>
            Step {getStepNumber()} of {getTotalSteps()} — This helps us show you accurate cost estimates
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="font-medium text-foreground">What's your residency status?</h3>
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
                        <p className="font-medium">Israeli Resident</p>
                        <p className="text-sm text-muted-foreground">I'm an Israeli citizen or permanent resident</p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer">
                    <RadioGroupItem value="oleh_hadash" id="oleh" />
                    <Label htmlFor="oleh" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Plane className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Oleh Hadash</p>
                        <p className="text-sm text-muted-foreground">I made Aliyah in the last 7 years</p>
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

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="font-medium text-foreground">Is this your first property in Israel?</h3>
                <p className="text-sm text-muted-foreground">
                  First-time buyers receive significant tax benefits
                </p>
                <RadioGroup
                  value={answers.is_first_property === undefined ? undefined : answers.is_first_property ? 'yes' : 'no'}
                  onValueChange={(v) => setAnswers({ ...answers, is_first_property: v === 'yes' })}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer">
                    <RadioGroupItem value="yes" id="first-yes" />
                    <Label htmlFor="first-yes" className="cursor-pointer flex-1">
                      <p className="font-medium">Yes, this is my first property</p>
                      <p className="text-sm text-muted-foreground">Or I'm selling my only property to upgrade</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer">
                    <RadioGroupItem value="no" id="first-no" />
                    <Label htmlFor="first-no" className="cursor-pointer flex-1">
                      <p className="font-medium">No, I already own property</p>
                      <p className="text-sm text-muted-foreground">I'm buying an additional property</p>
                    </Label>
                  </div>
                </RadioGroup>
              </motion.div>
            )}

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
            {step === 4 ? (
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
