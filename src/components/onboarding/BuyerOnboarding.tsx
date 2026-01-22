import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Plane, Building2, User, ArrowRight, ArrowLeft, Check, ArrowUpDown, TrendingUp, Percent, Calendar, DollarSign, Banknote, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { useCreateBuyerProfile, useUpdateBuyerProfile, BuyerProfileInsert, BuyerProfile } from '@/hooks/useBuyerProfile';
import { AddressAutocomplete, ParsedAddress } from '@/components/agent/wizard/AddressAutocomplete';
import { 
  LocationIcon, 
  LOCATION_ICONS, 
  MAX_SAVED_LOCATIONS,
  suggestIconFromLabel,
  getIconEmoji 
} from '@/types/savedLocation';

interface BuyerOnboardingProps {
  open: boolean;
  onComplete: () => void;
  onClose?: () => void;
  existingProfile?: BuyerProfile | null;
}

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface OnboardingLocation {
  label: string;
  address: string;
  latitude: number;
  longitude: number;
  icon: LocationIcon;
}

const LOAN_TERMS = [15, 20, 25, 30];

const currentYear = new Date().getFullYear();
const aliyahYears = Array.from({ length: 10 }, (_, i) => currentYear - i);

export function BuyerOnboarding({ open, onComplete, onClose, existingProfile }: BuyerOnboardingProps) {
  const [step, setStep] = useState<Step>(1);
  const [answers, setAnswers] = useState<Partial<BuyerProfileInsert>>(() => getInitialAnswers(existingProfile));
  const [mortgagePrefs, setMortgagePrefs] = useState({
    down_payment_percent: 25,
    term_years: 25,
    monthly_income: null as number | null,
    income_type: 'net' as 'net' | 'gross',
  });
  const [downPaymentMode, setDownPaymentMode] = useState<'percent' | 'amount'>('percent');
  const [downPaymentAmount, setDownPaymentAmount] = useState<number | null>(null);
  
  // Step 7: Core Locations state
  const [onboardingLocations, setOnboardingLocations] = useState<OnboardingLocation[]>([]);
  const [locationLabel, setLocationLabel] = useState('');
  const [locationIcon, setLocationIcon] = useState<LocationIcon>('home');
  const [locationAddress, setLocationAddress] = useState('');
  const [parsedAddress, setParsedAddress] = useState<ParsedAddress | null>(null);
  
  const createProfile = useCreateBuyerProfile();
  const updateProfile = useUpdateBuyerProfile();

  // Reset answers when dialog opens with different profile
  useEffect(() => {
    if (open) {
      setAnswers(getInitialAnswers(existingProfile));
      setStep(1);
    }
  }, [open, existingProfile]);

function getInitialAnswers(profile?: BuyerProfile | null): Partial<BuyerProfileInsert> {
  if (profile) {
    return {
      residency_status: profile.residency_status,
      aliyah_year: profile.aliyah_year,
      is_first_property: profile.is_first_property,
      is_upgrading: profile.is_upgrading ?? false,
      purchase_purpose: profile.purchase_purpose,
      buyer_entity: profile.buyer_entity,
    };
  }
  return {
    residency_status: undefined,
    aliyah_year: undefined,
    is_first_property: undefined,
    is_upgrading: false,
    purchase_purpose: undefined,
    buyer_entity: 'individual',
  };
}

  // Calculate which steps to show based on answers
  const getNextStep = (currentStep: Step): Step => {
    if (currentStep === 1) {
      // Skip Aliyah year if not Oleh
      return answers.residency_status === 'oleh_hadash' ? 2 : 3;
    }
    if (currentStep === 6) {
      return 7; // Go to optional core locations step
    }
    return (currentStep + 1) as Step;
  };

  const getPrevStep = (currentStep: Step): Step => {
    if (currentStep === 3 && answers.residency_status !== 'oleh_hadash') {
      return 1;
    }
    if (currentStep === 7) {
      return 6;
    }
    return (currentStep - 1) as Step;
  };

  const handleNext = () => {
    const nextStep = getNextStep(step);
    if (nextStep <= 7) {
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

  const handleSkipStep = () => {
    if (step === 6) {
      setStep(7); // Skip mortgage, go to locations
    } else {
      handleComplete(); // Skip locations, complete onboarding
    }
  };

  const handleComplete = async () => {
    // Build mortgage preferences if user filled them in on step 6
    const mortgagePreferences = {
      down_payment_percent: downPaymentMode === 'percent' ? mortgagePrefs.down_payment_percent : null,
      down_payment_amount: downPaymentMode === 'amount' ? downPaymentAmount : null,
      term_years: mortgagePrefs.term_years,
      assumed_rate: 5.25,
      monthly_income: mortgagePrefs.monthly_income,
      income_type: mortgagePrefs.income_type,
    };

    // Build saved locations array
    const savedLocations = onboardingLocations.map(loc => ({
      ...loc,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    }));

    const profileData = {
      ...answers,
      onboarding_completed: true,
      mortgage_preferences: mortgagePreferences,
      ...(savedLocations.length > 0 && { saved_locations: savedLocations }),
    };

    if (existingProfile) {
      await updateProfile.mutateAsync(profileData);
    } else {
      await createProfile.mutateAsync(profileData);
    }
    onComplete();
  };

  const isPending = createProfile.isPending || updateProfile.isPending;

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
      case 6:
        return true; // Optional step, always can proceed
      case 7:
        return true; // Optional step, always can proceed
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
    if (step === 6) return 5;
    if (step === 7) return 6;
    return step;
  };

  const getTotalSteps = () => {
    return answers.residency_status === 'oleh_hadash' ? 7 : 6;
  };

  // Step 7: Add location handlers
  const handleAddLocation = () => {
    if (!locationLabel.trim() || !parsedAddress) return;
    
    const newLocation: OnboardingLocation = {
      label: locationLabel.trim(),
      icon: locationIcon,
      address: parsedAddress.fullAddress,
      latitude: parsedAddress.latitude,
      longitude: parsedAddress.longitude,
    };
    
    setOnboardingLocations([...onboardingLocations, newLocation]);
    // Reset form
    setLocationLabel('');
    setLocationIcon('home');
    setLocationAddress('');
    setParsedAddress(null);
  };

  const handleRemoveLocation = (index: number) => {
    setOnboardingLocations(onboardingLocations.filter((_, i) => i !== index));
  };

  const handleAddressSelect = (address: ParsedAddress) => {
    setParsedAddress(address);
    setLocationAddress(address.fullAddress);
  };

  // Auto-suggest icon based on label
  useEffect(() => {
    if (locationLabel) {
      setLocationIcon(suggestIconFromLabel(locationLabel));
    }
  }, [locationLabel]);

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
                          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">Tax Benefit</span>
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

            {/* Step 6: Mortgage Preferences (Optional) */}
            {step === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="font-medium text-foreground">Set your mortgage preferences</h3>
                  <p className="text-sm text-muted-foreground">
                    Optional — see personalized estimates on all properties
                  </p>
                </div>

                {/* Down Payment */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Preferred Down Payment</Label>
                    <div className="flex gap-1">
                      <Toggle
                        size="sm"
                        pressed={downPaymentMode === 'percent'}
                        onPressedChange={() => setDownPaymentMode('percent')}
                        className="h-7 px-2 text-xs"
                      >
                        <Percent className="h-3 w-3 mr-1" />
                        %
                      </Toggle>
                      <Toggle
                        size="sm"
                        pressed={downPaymentMode === 'amount'}
                        onPressedChange={() => setDownPaymentMode('amount')}
                        className="h-7 px-2 text-xs"
                      >
                        <Banknote className="h-3 w-3 mr-1" />
                        ₪
                      </Toggle>
                    </div>
                  </div>
                  {downPaymentMode === 'percent' ? (
                    <div className="relative">
                      <Input
                        type="number"
                        value={mortgagePrefs.down_payment_percent}
                        onChange={(e) => setMortgagePrefs({ ...mortgagePrefs, down_payment_percent: Number(e.target.value) })}
                        min={25}
                        max={100}
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                    </div>
                  ) : (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₪</span>
                      <Input
                        type="number"
                        value={downPaymentAmount ?? ''}
                        onChange={(e) => setDownPaymentAmount(e.target.value ? Number(e.target.value) : null)}
                        className="pl-8"
                        placeholder="1,500,000"
                      />
                    </div>
                  )}
                </div>

                {/* Loan Term */}
                <div className="space-y-2">
                  <Label className="text-sm">Loan Term</Label>
                  <Select
                    value={String(mortgagePrefs.term_years)}
                    onValueChange={(value) => setMortgagePrefs({ ...mortgagePrefs, term_years: Number(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LOAN_TERMS.map((term) => (
                        <SelectItem key={term} value={String(term)}>
                          {term} years
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Monthly Income */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Monthly Income (optional)</Label>
                    <Select
                      value={mortgagePrefs.income_type}
                      onValueChange={(value: 'net' | 'gross') => setMortgagePrefs({ ...mortgagePrefs, income_type: value })}
                    >
                      <SelectTrigger className="w-20 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="net">Net</SelectItem>
                        <SelectItem value="gross">Gross</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₪</span>
                    <Input
                      type="number"
                      value={mortgagePrefs.monthly_income ?? ''}
                      onChange={(e) => setMortgagePrefs({ ...mortgagePrefs, monthly_income: e.target.value ? Number(e.target.value) : null })}
                      className="pl-8"
                      placeholder="35,000"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Helps calculate your max budget</p>
                </div>
              </motion.div>
            )}

            {/* Step 7: Core Locations (Optional) */}
            {step === 7 && (
              <motion.div
                key="step7"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="font-medium text-foreground flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Add places that matter to you
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    See travel times to these locations on every property
                  </p>
                </div>

                {/* Add location form */}
                {onboardingLocations.length < MAX_SAVED_LOCATIONS && (
                  <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
                    {/* Label input */}
                    <div className="space-y-1.5">
                      <Label className="text-sm">Location Name</Label>
                      <Input
                        value={locationLabel}
                        onChange={(e) => setLocationLabel(e.target.value)}
                        placeholder="e.g., Mom's House, Office, Gym"
                        maxLength={30}
                      />
                    </div>

                    {/* Icon picker */}
                    <div className="space-y-1.5">
                      <Label className="text-sm">Icon</Label>
                      <div className="flex gap-2">
                        {LOCATION_ICONS.map((iconOption) => (
                          <button
                            key={iconOption.value}
                            type="button"
                            onClick={() => setLocationIcon(iconOption.value)}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-colors ${
                              locationIcon === iconOption.value
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-background border border-border hover:border-primary/50'
                            }`}
                          >
                            {iconOption.emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Address input */}
                    <div className="space-y-1.5">
                      <Label className="text-sm">Address</Label>
                      <AddressAutocomplete
                        value={locationAddress}
                        onAddressSelect={handleAddressSelect}
                        onInputChange={setLocationAddress}
                        placeholder="Search for an address..."
                      />
                    </div>

                    {/* Add button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddLocation}
                      disabled={!locationLabel.trim() || !parsedAddress}
                      className="w-full"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Add Location
                    </Button>
                  </div>
                )}

                {/* Added locations list */}
                {onboardingLocations.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">
                      Added locations ({onboardingLocations.length}/{MAX_SAVED_LOCATIONS})
                    </Label>
                    {onboardingLocations.map((loc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg border border-border bg-background"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-lg">{getIconEmoji(loc.icon)}</span>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{loc.label}</p>
                            <p className="text-xs text-muted-foreground truncate">{loc.address}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveLocation(index)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Helper text */}
                <p className="text-xs text-muted-foreground text-center">
                  💡 You can always add more locations later in your profile settings
                </p>
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
          <div className="flex gap-2">
            {(step === 6 || step === 7) && (
              <Button
                variant="outline"
                onClick={handleSkipStep}
                disabled={isPending}
              >
                Skip for now
              </Button>
            )}
            <Button
              onClick={step === 7 ? handleComplete : handleNext}
              disabled={!canProceed() || isPending}
              className="gap-2"
            >
              {step === 7 ? (
                <>
                  {isPending ? 'Saving...' : 'Complete'}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
