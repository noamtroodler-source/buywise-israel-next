import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Building, Loader2, Check, Upload } from 'lucide-react';
import { z } from 'zod';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useDeveloperRegistration } from '@/hooks/useDeveloperRegistration';
import { useDeveloperProfile } from '@/hooks/useDeveloperProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DeveloperSubmittedDialog } from '@/components/developer/DeveloperSubmittedDialog';

const steps = [
  { title: 'Company Basics', description: 'Your company details' },
  { title: 'Company Profile', description: 'About your business' },
  { title: 'Review', description: 'Confirm & submit' },
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

export default function DeveloperRegister() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const developerRegistration = useDeveloperRegistration();
  const { data: existingProfile, isLoading: profileLoading } = useDeveloperProfile();
  const [currentStep, setCurrentStep] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: user?.email || '',
    phone: '',
    website: '',
    description: '',
    founded_year: undefined as number | undefined,
    logo_url: '',
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
        return formData.name && formData.email;
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `developer-logos/${user?.id}-${Date.now()}.${fileExt}`;

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
      
      setShowSuccessDialog(true);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Your Development Company"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Contact Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <PhoneInput
                  id="phone"
                  value={formData.phone}
                  onChange={(value) => updateField('phone', value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Company Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => updateField('website', e.target.value)}
                placeholder="https://your-company.com"
                className={errors.website ? 'border-destructive' : ''}
              />
              {errors.website && <p className="text-sm text-destructive">{errors.website}</p>}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="founded_year">Year Founded</Label>
              <Select
                value={formData.founded_year?.toString() || ''}
                onValueChange={(v) => updateField('founded_year', v ? Number(v) : undefined)}
              >
                <SelectTrigger className="w-48">
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
              <Label htmlFor="description">Company Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Tell potential buyers about your company, your track record, and what makes your developments unique..."
                rows={5}
                className={errors.description ? 'border-destructive' : ''}
              />
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/2000 characters
              </p>
              {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
            </div>

            <div className="space-y-2">
              <Label>Company Logo</Label>
              <div className="flex items-center gap-4">
                {formData.logo_url ? (
                  <img
                    src={formData.logo_url}
                    alt="Company logo"
                    className="h-16 w-16 rounded-lg object-cover border"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                    <Building className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <label className="cursor-pointer">
                    <Button variant="outline" size="sm" asChild disabled={isUploading}>
                      <span>
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        {formData.logo_url ? 'Change Logo' : 'Upload Logo'}
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Max 2MB, JPG or PNG
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <h3 className="font-medium">Review Your Information</h3>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Company Name:</span>
                  <span className="font-medium">{formData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{formData.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium">{formData.phone || 'Not provided'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Website:</span>
                  <span className="font-medium">{formData.website || 'Not provided'}</span>
                </div>
                {formData.founded_year && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Founded:</span>
                    <span className="font-medium">{formData.founded_year}</span>
                  </div>
                )}
              </div>
              {formData.description && (
                <div className="pt-2 border-t">
                  <p className="text-muted-foreground text-sm mb-1">Description:</p>
                  <p className="text-sm">{formData.description}</p>
                </div>
              )}
            </div>

            <div className="bg-primary/5 p-4 rounded-lg">
              <h4 className="font-medium mb-2">What happens next?</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Your application will be reviewed within 24-48 hours</li>
                <li>• We'll verify your company information</li>
                <li>• Once approved, you can start adding projects</li>
                <li>• You'll receive an email notification when approved</li>
              </ul>
            </div>
          </div>
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

  return (
    <Layout>
      <div className="container py-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Progress */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => {
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              return (
                <div key={step.title} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        isCompleted ? 'bg-primary text-primary-foreground' :
                        isCurrent ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' :
                        'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                    </div>
                    <p className={`text-xs mt-1 hidden sm:block ${isCurrent ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${isCompleted ? 'bg-primary' : 'bg-muted'}`} />
                  )}
                </div>
              );
            })}
          </div>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Building className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">{steps[currentStep].title}</CardTitle>
              <CardDescription>{steps[currentStep].description}</CardDescription>
            </CardHeader>
            <CardContent>
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

              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={goBack}
                  disabled={currentStep === 0}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>

                {currentStep === steps.length - 1 ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={developerRegistration.isPending}
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
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <DeveloperSubmittedDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
      />
    </Layout>
  );
}
