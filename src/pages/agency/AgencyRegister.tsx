import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Loader2, 
  ArrowLeft, 
  ArrowRight,
  Sparkles, 
  Check, 
  Lightbulb, 
  Upload, 
  X,
  MapPin,
  FileText,
  CheckCircle2,
  Mail,
  Phone,
  Globe,
  Clock
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EmailVerificationStep } from '@/components/auth/EmailVerificationStep';
import { useAuth } from '@/hooks/useAuth';
import { useCities } from '@/hooks/useCities';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AgencySubmittedDialog } from '@/components/agency/AgencySubmittedDialog';

const steps = [
  { title: 'Agency Basics', description: 'Your agency details', icon: Building2 },
  { title: 'Coverage & Focus', description: 'Where and what you specialize in', icon: MapPin },
  { title: 'Review', description: 'Confirm & submit', icon: CheckCircle2 },
];

const specializations = ['Residential', 'Luxury', 'New Construction', 'Rentals', 'Anglo Market', 'Investment Properties'];

const benefits = [
  'Your own agency profile page',
  'Invite codes to add agents to your team',
  'Aggregated stats for all your listings',
  'Team management dashboard',
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { staggerChildren: 0.1 } 
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5 } 
  }
};

export default function AgencyRegister() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: cities = [] } = useCities();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  // Redirect non-authenticated users to auth page with role context
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth?tab=signup&role=agency');
    }
  }, [user, loading, navigate]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    email: user?.email || '',
    phone: '',
    cities_covered: [] as string[],
    specializations: [] as string[],
    logo_url: null as string | null,
  });

  // Update email when user loads
  useEffect(() => {
    if (user?.email && !formData.email) {
      setFormData(prev => ({ ...prev, email: user.email || '' }));
    }
  }, [user?.email]);

  const updateField = <K extends keyof typeof formData>(field: K, value: typeof formData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: 'cities_covered' | 'specializations', item: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  };

  const generateBaseSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const generateUniqueSlug = async (name: string): Promise<string> => {
    const baseSlug = generateBaseSlug(name);
    
    // Check if base slug or similar slugs exist
    const { data: existing } = await supabase
      .from('agencies')
      .select('slug')
      .like('slug', `${baseSlug}%`);
    
    if (!existing || existing.length === 0) {
      return baseSlug;
    }
    
    const slugs = existing.map(a => a.slug);
    if (!slugs.includes(baseSlug)) {
      return baseSlug;
    }
    
    // Find next available number suffix
    let suffix = 2;
    while (slugs.includes(`${baseSlug}-${suffix}`)) {
      suffix++;
    }
    
    return `${baseSlug}-${suffix}`;
  };

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be under 2MB');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG, or WebP files are allowed');
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    updateField('logo_url', null);
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile || !user) return null;

    setIsUploadingLogo(true);
    try {
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `agency-logos/${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(fileName, logoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      toast.error('Failed to upload logo: ' + error.message);
      return null;
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 0:
        return formData.name && formData.email && isEmailVerified;
      case 1:
        return true; // Optional step
      case 2:
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
    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    if (!isEmailVerified) {
      toast.error('Please verify your email first');
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload logo if present
      let logoUrl = formData.logo_url;
      if (logoFile) {
        logoUrl = await uploadLogo();
      }

      const slug = await generateUniqueSlug(formData.name);
      const defaultInviteCode = generateInviteCode();

      // Create the agency
      const { data: agency, error: agencyError } = await supabase
        .from('agencies')
        .insert({
          name: formData.name,
          slug,
          description: formData.description || null,
          website: formData.website || null,
          email: formData.email,
          phone: formData.phone || null,
          cities_covered: formData.cities_covered.length > 0 ? formData.cities_covered : null,
          specializations: formData.specializations.length > 0 ? formData.specializations : null,
          admin_user_id: user.id,
          default_invite_code: defaultInviteCode,
          is_accepting_agents: true,
          logo_url: logoUrl,
        })
        .select()
        .single();

      if (agencyError) throw agencyError;

      // Create the default invite code
      await supabase
        .from('agency_invites')
        .insert({
          agency_id: agency.id,
          code: defaultInviteCode,
          created_by: user.id,
          uses_remaining: null,
          max_uses: null,
          is_active: true,
        });

      setShowSuccessDialog(true);
    } catch (error: any) {
      toast.error('Failed to register agency: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDescriptionFeedback = () => {
    const len = formData.description.length;
    if (len === 0) return { text: '', className: 'text-muted-foreground' };
    if (len < 50) return { text: ' • Too short', className: 'text-destructive' };
    if (len < 150) return { text: ' • Good start', className: 'text-muted-foreground' };
    if (len <= 400) return { text: ' • Great length!', className: 'text-primary font-medium' };
    return { text: ' • Consider trimming', className: 'text-muted-foreground' };
  };

  const feedback = getDescriptionFeedback();

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
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Agency Information</h3>
                <p className="text-sm text-muted-foreground">Basic details about your agency</p>
              </div>
            </motion.div>

            {/* Logo Upload */}
            <motion.div variants={itemVariants} className="space-y-3">
              <Label className="text-sm font-medium">Agency Logo</Label>
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <div className="relative">
                    <img 
                      src={logoPreview} 
                      alt="Logo preview" 
                      className="h-20 w-20 rounded-xl object-cover border border-border"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <label className="h-20 w-20 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center cursor-pointer transition-colors bg-muted/30">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>
                )}
                <div className="text-sm text-muted-foreground">
                  <p>Upload your agency logo</p>
                  <p className="text-xs">Max 2MB, JPG/PNG/WebP</p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Agency Name *</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Your Agency Name"
                  required
                  className="pl-10 h-11 rounded-xl"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="grid gap-5 sm:grid-cols-2">
              <EmailVerificationStep
                email={formData.email}
                onEmailChange={(value) => {
                  updateField('email', value);
                  setIsEmailVerified(false);
                }}
                onVerified={() => setIsEmailVerified(true)}
                isVerified={isEmailVerified}
                type="agency"
                name={formData.name}
              />
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">WhatsApp Number</Label>
                <PhoneInput
                  id="phone"
                  value={formData.phone}
                  onChange={(value) => updateField('phone', value)}
                  showWhatsAppIcon={true}
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="website" className="text-sm font-medium">Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => updateField('website', e.target.value)}
                  placeholder="https://your-agency.com"
                  className="pl-10 h-11 rounded-xl"
                />
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
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Coverage & Focus</h3>
                <p className="text-sm text-muted-foreground">Where you operate and what you specialize in</p>
              </div>
            </motion.div>

            {/* Cities Covered */}
            <motion.div variants={itemVariants} className="space-y-3">
              <Label className="text-sm font-medium">Cities Covered</Label>
              <div className="flex flex-wrap gap-2">
                {cities.map((city) => (
                  <button
                    type="button"
                    key={city.slug}
                    onClick={() => toggleArrayItem('cities_covered', city.name)}
                    className={cn(
                      "px-4 py-2 rounded-xl border text-sm font-medium transition-all",
                      formData.cities_covered.includes(city.name)
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:border-primary/30"
                    )}
                  >
                    {city.name}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Specializations */}
            <motion.div variants={itemVariants} className="space-y-3">
              <Label className="text-sm font-medium">Specializations</Label>
              <div className="flex flex-wrap gap-2">
                {specializations.map((spec) => (
                  <button
                    type="button"
                    key={spec}
                    onClick={() => toggleArrayItem('specializations', spec)}
                    className={cn(
                      "px-4 py-2 rounded-xl border text-sm font-medium transition-all",
                      formData.specializations.includes(spec)
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:border-primary/30"
                    )}
                  >
                    {spec}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Description */}
            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Tell clients about your agency, your history, and what makes you unique..."
                rows={4}
                maxLength={800}
                className="rounded-xl resize-none"
              />
              <div className="flex justify-between items-center text-xs">
                <span className={feedback.className}>
                  {formData.description.length}/800 characters
                  {feedback.text}
                </span>
                <span className="text-muted-foreground">Recommended: 150-400</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p>Include your founding story, expertise, team culture, and what sets you apart.</p>
              </div>
            </motion.div>
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
                  { label: 'Agency Name', value: formData.name, icon: Building2 },
                  { label: 'Email', value: formData.email, icon: Mail },
                  { label: 'Phone', value: formData.phone || 'Not provided', icon: Phone },
                  { label: 'Website', value: formData.website || 'Not provided', icon: Globe },
                  { label: 'Cities', value: formData.cities_covered.length > 0 ? formData.cities_covered.join(', ') : 'Not specified', icon: MapPin },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <span className="text-muted-foreground flex items-center gap-2 text-sm">
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    <span className="font-medium text-sm text-right max-w-[200px] truncate">{item.value}</span>
                  </div>
                ))}
                {formData.specializations.length > 0 && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4" />
                      Specializations
                    </span>
                    <span className="font-medium text-sm">{formData.specializations.join(', ')}</span>
                  </div>
                )}
              </div>
              {formData.description && (
                <div className="pt-4 mt-4 border-t border-border/50">
                  <p className="text-muted-foreground text-sm mb-2">Description:</p>
                  <p className="text-sm break-words">{formData.description}</p>
                </div>
              )}
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
                  "We'll verify your agency information",
                  'Once approved, you can start inviting agents',
                  "You'll receive an email notification when approved"
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Benefits Box */}
            <motion.div 
              variants={itemVariants}
              className="bg-gradient-to-br from-primary/5 to-primary/10 p-5 rounded-2xl border border-primary/10"
            >
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                What you'll get
              </h4>
              <div className="grid gap-3">
                {benefits.map((benefit, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-center gap-3 text-sm"
                  >
                    <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">{benefit}</span>
                  </motion.div>
                ))}
              </div>
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
            {/* Back Navigation */}
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')} 
              className="rounded-xl hover:bg-primary/5 -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>

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
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium transition-all",
                          isCompleted 
                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                            : isCurrent 
                              ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-lg shadow-primary/20' 
                              : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                      </div>
                      <p className={cn(
                        "text-xs mt-2 hidden sm:block font-medium",
                        isCurrent ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                      )}>
                        {step.title}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={cn(
                        "flex-1 h-1 mx-3 rounded-full transition-colors",
                        isCompleted ? 'bg-primary' : 'bg-muted'
                      )} />
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
                  disabled={isSubmitting || isUploadingLogo}
                  className="rounded-xl h-12 px-8 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                >
                  {(isSubmitting || isUploadingLogo) ? (
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

      <AgencySubmittedDialog 
        open={showSuccessDialog} 
        onOpenChange={setShowSuccessDialog} 
      />
    </Layout>
  );
}
