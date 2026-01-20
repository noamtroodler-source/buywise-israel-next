import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight, 
  Building2, 
  Loader2, 
  Check, 
  UserPlus,
  User,
  Mail,
  Phone,
  BadgeCheck,
  Globe,
  Briefcase,
  FileText,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { ApplicationSubmittedDialog } from '@/components/agent/ApplicationSubmittedDialog';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useAgentRegistration } from '@/hooks/useAgentRegistration';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const steps = [
  { title: 'Basic Info', description: 'Your contact details', icon: User },
  { title: 'Agency', description: 'Join or go independent', icon: Building2 },
  { title: 'Profile', description: 'Your experience', icon: Briefcase },
  { title: 'Complete', description: 'Review & submit', icon: CheckCircle2 },
];

const languages = ['Hebrew', 'English', 'Russian', 'French', 'Spanish', 'Arabic', 'Amharic', 'Yiddish'];
const specializations = ['Residential', 'Luxury', 'New Construction', 'Rentals', 'Anglo Market', 'Investment Properties'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function AgentRegisterWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const agentRegistration = useAgentRegistration();
  const [currentStep, setCurrentStep] = useState(0);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [validatedAgencyId, setValidatedAgencyId] = useState<string | null>(null);
  const [validatedAgencyName, setValidatedAgencyName] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  
  // Get invite code from URL params
  const urlInviteCode = searchParams.get('code');

  const [formData, setFormData] = useState({
    name: '',
    email: user?.email || '',
    phone: '',
    license_number: '',
    // Agency
    agency_choice: (urlInviteCode ? 'invite_code' : 'independent') as 'independent' | 'invite_code' | 'request_join',
    invite_code: urlInviteCode || '',
    agency_id: '',
    // Profile
    years_experience: 0,
    languages: ['Hebrew', 'English'] as string[],
    specializations: [] as string[],
    neighborhoods_covered: '',
    bio: '',
  });
  
  // Auto-validate invite code from URL on mount
  useEffect(() => {
    if (urlInviteCode && !validatedAgencyId) {
      validateInviteCodeFromUrl(urlInviteCode);
    }
  }, [urlInviteCode]);
  
  const validateInviteCodeFromUrl = async (code: string) => {
    setIsValidatingCode(true);
    try {
      // Use secure RPC function to validate invite code
      const { data: inviteData, error: inviteError } = await supabase
        .rpc('validate_agency_invite_code', { invite_code: code.trim() });

      if (inviteError) throw inviteError;

      if (inviteData && inviteData.length > 0) {
        setValidatedAgencyId(inviteData[0].agency_id);
        setValidatedAgencyName(inviteData[0].agency_name || 'Agency');
        toast.success(`Invite code validated for ${inviteData[0].agency_name || 'Agency'}`);
        return;
      }

      // Fallback: check default invite code via secure RPC
      const { data: defaultData, error: defaultError } = await supabase
        .rpc('validate_default_invite_code', { invite_code: code.trim() });

      if (defaultError) throw defaultError;

      if (defaultData && defaultData.length > 0) {
        setValidatedAgencyId(defaultData[0].agency_id);
        setValidatedAgencyName(defaultData[0].agency_name || 'Agency');
        toast.success(`Invite code validated for ${defaultData[0].agency_name || 'Agency'}`);
      } else {
        toast.error('Invalid or expired invite code');
      }
    } catch (error) {
      console.error('Failed to validate invite code:', error);
    } finally {
      setIsValidatingCode(false);
    }
  };

  const updateField = <K extends keyof typeof formData>(field: K, value: typeof formData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: 'languages' | 'specializations', item: string) => {
    setFormData(prev => {
      const isSelected = prev[field].includes(item);
      
      // Limit specializations to max 3
      if (field === 'specializations' && !isSelected && prev[field].length >= 3) {
        toast.info('You can select up to 3 specializations');
        return prev;
      }
      
      return {
        ...prev,
        [field]: isSelected
          ? prev[field].filter(i => i !== item)
          : [...prev[field], item]
      };
    });
  };

  const validateInviteCode = async () => {
    if (!formData.invite_code.trim()) return;
    
    setIsValidatingCode(true);
    try {
      // Use secure RPC function to validate invite code
      const { data: inviteData, error: inviteError } = await supabase
        .rpc('validate_agency_invite_code', { invite_code: formData.invite_code.trim() });

      if (inviteError) throw inviteError;

      if (inviteData && inviteData.length > 0) {
        setValidatedAgencyId(inviteData[0].agency_id);
        setValidatedAgencyName(inviteData[0].agency_name || 'Agency');
        toast.success(`Valid code for ${inviteData[0].agency_name || 'Agency'}`);
        return;
      }

      // Fallback: check default invite code via secure RPC
      const { data: defaultData, error: defaultError } = await supabase
        .rpc('validate_default_invite_code', { invite_code: formData.invite_code.trim() });

      if (defaultError) throw defaultError;

      if (defaultData && defaultData.length > 0) {
        setValidatedAgencyId(defaultData[0].agency_id);
        setValidatedAgencyName(defaultData[0].agency_name || 'Agency');
        toast.success(`Valid code for ${defaultData[0].agency_name || 'Agency'}`);
      } else {
        toast.error('Invalid or expired invite code');
        setValidatedAgencyId(null);
        setValidatedAgencyName(null);
      }
    } catch (error) {
      toast.error('Failed to validate code');
    } finally {
      setIsValidatingCode(false);
    }
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 0:
        return formData.name && formData.email && formData.license_number;
      case 1:
        if (formData.agency_choice === 'invite_code') {
          return validatedAgencyId !== null;
        }
        return true;
      case 2:
        return formData.languages.length > 0;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const goNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      await agentRegistration.mutateAsync({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        license_number: formData.license_number || undefined,
        agency_id: validatedAgencyId || undefined,
        agency_name: validatedAgencyName || undefined,
        years_experience: formData.years_experience,
        languages: formData.languages,
        specializations: formData.specializations.length > 0 ? formData.specializations : undefined,
        bio: formData.bio || undefined,
      });
      
      setShowSuccessDialog(true);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Section Header */}
            <motion.div variants={itemVariants} className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Contact Details</h3>
                <p className="text-sm text-muted-foreground">How buyers and agencies can reach you</p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Your full name"
                    className="pl-10 h-11 rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="pl-10 h-11 rounded-xl"
                  />
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">WhatsApp Number</Label>
                <PhoneInput
                  id="phone"
                  value={formData.phone}
                  onChange={(value) => updateField('phone', value)}
                  showWhatsAppIcon={true}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="license_number" className="text-sm font-medium">Real Estate License Number *</Label>
                <div className="relative">
                  <BadgeCheck className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${
                    formData.license_number && /^\d{5,6}$/.test(formData.license_number) 
                      ? 'text-primary' 
                      : 'text-muted-foreground'
                  }`} />
                  <Input
                    id="license_number"
                    value={formData.license_number}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 6) {
                        updateField('license_number', value);
                      }
                    }}
                    placeholder="123456"
                    maxLength={6}
                    inputMode="numeric"
                    className="pl-10 h-11 rounded-xl"
                  />
                </div>
                <p className="text-xs text-muted-foreground">5-6 digit license number</p>
              </div>
            </motion.div>
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Section Header */}
            <motion.div variants={itemVariants} className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Agency Affiliation</h3>
                <p className="text-sm text-muted-foreground">Work independently or join an agency</p>
              </div>
            </motion.div>

            <RadioGroup
              value={formData.agency_choice}
              onValueChange={(v) => updateField('agency_choice', v as any)}
              className="space-y-4"
            >
              <motion.div variants={itemVariants}>
                <label 
                  htmlFor="independent"
                  className={`flex items-start gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.agency_choice === 'independent' 
                      ? 'border-primary bg-primary/5 shadow-sm' 
                      : 'border-border hover:border-primary/30 hover:bg-muted/50'
                  }`}
                >
                  <RadioGroupItem value="independent" id="independent" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-semibold">I'm an independent agent</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 ml-10">
                      Work independently without an agency affiliation. Full control over your listings and client relationships.
                    </p>
                  </div>
                </label>
              </motion.div>

              <motion.div variants={itemVariants}>
                <label 
                  htmlFor="invite_code"
                  className={`flex items-start gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.agency_choice === 'invite_code' 
                      ? 'border-primary bg-primary/5 shadow-sm' 
                      : 'border-border hover:border-primary/30 hover:bg-muted/50'
                  }`}
                >
                  <RadioGroupItem value="invite_code" id="invite_code" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-semibold">I have an agency invite code</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 ml-10">
                      Join an agency using a code from your agency admin
                    </p>
                  </div>
                </label>
              </motion.div>
            </RadioGroup>

            {formData.agency_choice === 'invite_code' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 pt-2"
              >
                <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                  <Label htmlFor="invite_code_input" className="text-sm font-medium">Enter Invite Code</Label>
                  <div className="flex gap-3 mt-2">
                    <Input
                      id="invite_code_input"
                      value={formData.invite_code}
                      onChange={(e) => {
                        updateField('invite_code', e.target.value);
                        setValidatedAgencyId(null);
                        setValidatedAgencyName(null);
                      }}
                      placeholder="e.g., ABC123XYZ"
                      className="flex-1 h-11 rounded-xl"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={validateInviteCode}
                      disabled={isValidatingCode || !formData.invite_code.trim()}
                      className="rounded-xl h-11 px-5"
                    >
                      {isValidatingCode ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Validate'
                      )}
                    </Button>
                  </div>
                  {validatedAgencyName && (
                    <div className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-primary/10 text-primary">
                      <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-sm font-medium">Joining: {validatedAgencyName}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Section Header */}
            <motion.div variants={itemVariants} className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Professional Profile</h3>
                <p className="text-sm text-muted-foreground">Help buyers learn more about you</p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="years_experience" className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Years of Experience
              </Label>
              <Select
                value={String(formData.years_experience)}
                onValueChange={(v) => updateField('years_experience', Number(v))}
              >
                <SelectTrigger className="w-full sm:w-64 h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">New to real estate</SelectItem>
                  <SelectItem value="1">1-2 years</SelectItem>
                  <SelectItem value="3">3-5 years</SelectItem>
                  <SelectItem value="6">6-10 years</SelectItem>
                  <SelectItem value="10">10+ years</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                Languages Spoken *
              </Label>
              <div className="flex flex-wrap gap-2">
                {languages.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleArrayItem('languages', lang)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      formData.languages.includes(lang)
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                Specializations
                <span className="text-xs text-muted-foreground ml-1">
                  ({formData.specializations.length}/3)
                </span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {specializations.map((spec) => {
                  const isSelected = formData.specializations.includes(spec);
                  const isDisabled = !isSelected && formData.specializations.length >= 3;
                  return (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => toggleArrayItem('specializations', spec)}
                      disabled={isDisabled}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : isDisabled
                            ? 'bg-muted/30 text-muted-foreground/50 border border-border/50 cursor-not-allowed'
                            : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border'
                      }`}
                    >
                      {spec}
                    </button>
                  );
                })}
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Bio
              </Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => updateField('bio', e.target.value)}
                placeholder="Brief intro about yourself and your expertise..."
                rows={3}
                className="rounded-xl resize-none"
                maxLength={160}
              />
              <div className="flex justify-end">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  formData.bio.length > 140 ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                }`}>
                  {formData.bio.length}/160
                </span>
              </div>
            </motion.div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Section Header */}
            <motion.div variants={itemVariants} className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Review Your Application</h3>
                <p className="text-sm text-muted-foreground">Make sure everything looks correct</p>
              </div>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              className="bg-gradient-to-br from-primary/5 via-background to-primary/5 p-6 rounded-2xl border border-border/50"
            >
              <div className="grid gap-4">
                {[
                  { label: 'Name', value: formData.name, icon: User },
                  { label: 'Email', value: formData.email, icon: Mail },
                  { label: 'Phone', value: formData.phone || 'Not provided', icon: Phone },
                  { label: 'License', value: formData.license_number, icon: BadgeCheck },
                  { label: 'Agency', value: validatedAgencyName || 'Independent', icon: Building2 },
                  { label: 'Languages', value: formData.languages.join(', '), icon: Globe },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <span className="text-muted-foreground flex items-center gap-2 text-sm">
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    <span className="font-medium text-sm">{item.value}</span>
                  </div>
                ))}
                {formData.specializations.length > 0 && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground flex items-center gap-2 text-sm">
                      <Briefcase className="h-4 w-4" />
                      Specializations
                    </span>
                    <span className="font-medium text-sm">{formData.specializations.join(', ')}</span>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              className="bg-primary/5 p-5 rounded-xl border border-primary/10"
            >
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                What happens next?
              </h4>
              <ul className="space-y-2">
                {[
                  'Your application will be reviewed within 24-48 hours',
                  "We'll verify your license number",
                  'Once approved, you can start adding listings',
                  "You'll receive an email notification when approved"
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  const StepIcon = steps[currentStep].icon;

  return (
    <Layout>
      {/* Gradient Background */}
      <div className="relative bg-gradient-to-b from-primary/5 via-primary/[0.02] to-background overflow-hidden">
        {/* Decorative blur elements */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl translate-y-1/2" />
        
        <div className="container py-8 md:py-12 max-w-2xl relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Premium Progress Indicator */}
            <div className="flex items-center justify-between mb-8">
              {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;
                const Icon = step.icon;
                return (
                  <div key={step.title} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium transition-all ${
                          isCompleted 
                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                            : isCurrent 
                              ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-lg shadow-primary/20' 
                              : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                      </div>
                      <p className={`text-xs mt-2 hidden sm:block font-medium ${
                        isCurrent ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {step.title}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-1 mx-3 rounded-full transition-colors ${
                        isCompleted ? 'bg-primary' : 'bg-muted'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Premium Main Card */}
            <Card className="rounded-2xl border-border/50 shadow-xl overflow-hidden">
              <CardHeader className="text-center pb-2 pt-8">
                <motion.div 
                  key={currentStep}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mx-auto mb-4 h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg shadow-primary/10"
                >
                  <StepIcon className="h-10 w-10 text-primary" />
                </motion.div>
                <CardTitle className="text-2xl md:text-3xl font-bold">{steps[currentStep].title}</CardTitle>
                <CardDescription className="text-base">{steps[currentStep].description}</CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-8">
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

            {/* Premium Navigation Buttons */}
            <div className="flex justify-between gap-4">
              <Button
                variant="outline"
                onClick={goBack}
                disabled={currentStep === 0}
                className="rounded-xl h-12 px-6"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              {currentStep === steps.length - 1 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={agentRegistration.isPending}
                  className="rounded-xl h-12 px-8 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                >
                  {agentRegistration.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Submit Application
                </Button>
              ) : (
                <Button 
                  onClick={goNext} 
                  disabled={!canGoNext()}
                  className="rounded-xl h-12 px-8 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <ApplicationSubmittedDialog 
        open={showSuccessDialog} 
        onClose={() => setShowSuccessDialog(false)} 
      />
    </Layout>
  );
}
