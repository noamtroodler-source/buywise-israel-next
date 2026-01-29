import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight, 
  Building, 
  Loader2, 
  Check, 
  Upload,
  User,
  Mail,
  Phone,
  Globe,
  FileText,
  CheckCircle2,
  Sparkles,
  Clock,
  Briefcase,
  X
} from 'lucide-react';
import { z } from 'zod';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmailVerificationStep } from '@/components/auth/EmailVerificationStep';
import { useAuth } from '@/hooks/useAuth';
import { useDeveloperRegistration } from '@/hooks/useDeveloperRegistration';
import { useDeveloperProfile } from '@/hooks/useDeveloperProfile';
import { useCities } from '@/hooks/useCities';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DeveloperSubmittedDialog } from '@/components/developer/DeveloperSubmittedDialog';
import { cn } from '@/lib/utils';

const steps = [
  { title: 'Company Basics', description: 'Your company details', icon: Building },
  { title: 'Company Profile', description: 'About your business', icon: FileText },
  { title: 'Review', description: 'Confirm & submit', icon: CheckCircle2 },
];

const specializations = ['Residential', 'Commercial', 'Mixed-Use', 'Luxury', 'Affordable Housing', 'Urban Renewal'];
const companySizes = ['1-10 employees', '11-50 employees', '51-200 employees', '200+ employees'];
const companyTypes = ['Private', 'Public', 'Partnership', 'Family Business'];

const benefits = [
  'Your own developer profile page',
  'Showcase all your projects in one place',
  'Receive inquiries directly from buyers',
  'Analytics on project views and leads',
];

// Validation schemas
const step1Schema = z.object({
  name: z.string().trim().min(2, 'Company name must be at least 2 characters').max(100, 'Company name must be less than 100 characters'),
  email: z.string().trim().email('Invalid email address').max(255, 'Email must be less than 255 characters'),
  phone: z.string().optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
});

const step2Schema = z.object({
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
  founded_year: z.number().min(1900).max(new Date().getFullYear()).optional(),
});

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

export default function DeveloperRegister() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const developerRegistration = useDeveloperRegistration();
  const { data: existingProfile, isLoading: profileLoading } = useDeveloperProfile();
  const { data: cities = [] } = useCities();
  const [currentStep, setCurrentStep] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: user?.email || '',
    phone: '',
    website: '',
    description: '',
    founded_year: undefined as number | undefined,
    logo_url: '',
    company_size: '',
    company_type: '',
    office_city: '',
    specialties: [] as string[],
  });

  // Redirect if already registered
  useEffect(() => {
    if (existingProfile) {
      toast.info('You already have a developer profile');
      navigate('/developer');
    }
  }, [existingProfile, navigate]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?tab=signup&role=developer');
    }
  }, [user, authLoading, navigate]);

  const updateField = <K extends keyof typeof formData>(field: K, value: typeof formData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const toggleSpecialty = (specialty: string) => {
    setFormData(prev => {
      const isSelected = prev.specialties.includes(specialty);
      if (!isSelected && prev.specialties.length >= 3) {
        toast.info('You can select up to 3 specializations');
        return prev;
      }
      return {
        ...prev,
        specialties: isSelected
          ? prev.specialties.filter(s => s !== specialty)
          : [...prev.specialties, specialty]
      };
    });
  };

  const validateStep = (step: number): boolean => {
    try {
      if (step === 0) {
        step1Schema.parse({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          website: formData.website || undefined,
        });
      } else if (step === 1) {
        step2Schema.parse({
          description: formData.description,
          founded_year: formData.founded_year,
        });
      }
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach(e => {
          if (e.path[0]) {
            newErrors[e.path[0] as string] = e.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
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
    if (validateStep(currentStep) && currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
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

    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload immediately
    handleLogoUpload(file);
  };

  const removeLogo = () => {
    setLogoPreview(null);
    updateField('logo_url', '');
  };

  const handleLogoUpload = async (file: File) => {
    if (!user) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `developer-logos/${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName);

      updateField('logo_url', publicUrl);
      toast.success('Logo uploaded successfully');
    } catch (error: any) {
      toast.error('Failed to upload logo: ' + error.message);
      setLogoPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    try {
      await developerRegistration.mutateAsync({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        website: formData.website || undefined,
        description: formData.description || undefined,
        founded_year: formData.founded_year,
        logo_url: formData.logo_url || undefined,
      });
      
      // Send welcome email
      try {
        await supabase.functions.invoke('send-welcome-email', {
          body: { email: formData.email, name: formData.name, userType: 'developer' }
        });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }
      
      setShowSuccessDialog(true);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const getDescriptionFeedback = () => {
    const len = formData.description.length;
    if (len === 0) return { text: '', className: 'text-muted-foreground' };
    if (len < 50) return { text: ' • Too short', className: 'text-destructive' };
    if (len < 150) return { text: ' • Good start', className: 'text-muted-foreground' };
    if (len <= 500) return { text: ' • Great length!', className: 'text-primary font-medium' };
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
                <Building className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Company Details</h3>
                <p className="text-sm text-muted-foreground">Basic information about your development company</p>
              </div>
            </motion.div>

            {/* Logo Upload */}
            <motion.div variants={itemVariants} className="space-y-3">
              <Label className="text-sm font-medium">Company Logo</Label>
              <div className="flex items-center gap-4">
                {logoPreview || formData.logo_url ? (
                  <div className="relative">
                    <img 
                      src={logoPreview || formData.logo_url} 
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
                    {isUploading && (
                      <div className="absolute inset-0 bg-background/80 rounded-xl flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    )}
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
                  <p>Upload your company logo</p>
                  <p className="text-xs">Max 2MB, JPG/PNG/WebP</p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Company Name *</Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Your Development Company"
                  className={cn("pl-10 h-11 rounded-xl", errors.name && 'border-destructive')}
                />
              </div>
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
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
                type="developer"
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
              <Label htmlFor="website" className="text-sm font-medium">Company Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => updateField('website', e.target.value)}
                  placeholder="https://your-company.com"
                  className={cn("pl-10 h-11 rounded-xl", errors.website && 'border-destructive')}
                />
              </div>
              {errors.website && <p className="text-sm text-destructive">{errors.website}</p>}
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
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Company Profile</h3>
                <p className="text-sm text-muted-foreground">Tell potential buyers about your company</p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="founded_year" className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Year Founded
                </Label>
                <Select
                  value={formData.founded_year?.toString() || ''}
                  onValueChange={(v) => updateField('founded_year', v ? Number(v) : undefined)}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 75 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_size" className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Company Size
                </Label>
                <Select
                  value={formData.company_size}
                  onValueChange={(v) => updateField('company_size', v)}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {companySizes.map(size => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company_type" className="text-sm font-medium flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  Company Type
                </Label>
                <Select
                  value={formData.company_type}
                  onValueChange={(v) => updateField('company_type', v)}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {companyTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="office_city" className="text-sm font-medium flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  Office Location
                </Label>
                <Select
                  value={formData.office_city}
                  onValueChange={(v) => updateField('office_city', v)}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map(city => (
                      <SelectItem key={city.slug} value={city.name}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                Specializations
                <span className="text-xs text-muted-foreground ml-1">
                  ({formData.specialties.length}/3)
                </span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {specializations.map((spec) => {
                  const isSelected = formData.specialties.includes(spec);
                  const isDisabled = !isSelected && formData.specialties.length >= 3;
                  return (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => toggleSpecialty(spec)}
                      disabled={isDisabled}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all",
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-md"
                          : isDisabled
                            ? "bg-muted/30 text-muted-foreground/50 border border-border/50 cursor-not-allowed"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted border border-border"
                      )}
                    >
                      {spec}
                    </button>
                  );
                })}
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Company Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Tell potential buyers about your company, your track record, and what makes your developments unique..."
                rows={5}
                maxLength={2000}
                className={cn("rounded-xl resize-none", errors.description && 'border-destructive')}
              />
              <div className="flex justify-between items-center text-xs">
                <span className={feedback.className}>
                  {formData.description.length}/2000 characters
                  {feedback.text}
                </span>
                <span className="text-muted-foreground">Recommended: 150-500</span>
              </div>
              {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
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
                  { label: 'Company Name', value: formData.name, icon: Building },
                  { label: 'Email', value: formData.email, icon: Mail },
                  { label: 'Phone', value: formData.phone || 'Not provided', icon: Phone },
                  { label: 'Website', value: formData.website || 'Not provided', icon: Globe },
                  { label: 'Founded', value: formData.founded_year?.toString() || 'Not provided', icon: Clock },
                  { label: 'Company Size', value: formData.company_size || 'Not provided', icon: User },
                  { label: 'Company Type', value: formData.company_type || 'Not provided', icon: Briefcase },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <span className="text-muted-foreground flex items-center gap-2 text-sm">
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    <span className="font-medium text-sm">{item.value}</span>
                  </div>
                ))}
                {formData.specialties.length > 0 && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground flex items-center gap-2 text-sm">
                      <Briefcase className="h-4 w-4" />
                      Specializations
                    </span>
                    <span className="font-medium text-sm">{formData.specialties.join(', ')}</span>
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
                  "We'll verify your company information",
                  'Once approved, you can start adding projects',
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

  if (authLoading || profileLoading) {
    return (
      <Layout>
        <div className="container py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

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
                  disabled={developerRegistration.isPending}
                  className="rounded-xl h-12 px-8 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                >
                  {developerRegistration.isPending ? (
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

      <DeveloperSubmittedDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
      />
    </Layout>
  );
}
