import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Building2, Loader2, Check, UserPlus } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  { title: 'Basic Info', description: 'Your contact details' },
  { title: 'Agency', description: 'Join or go independent' },
  { title: 'Profile', description: 'Your experience' },
  { title: 'Complete', description: 'Review & submit' },
];

const languages = ['Hebrew', 'English', 'Russian', 'French', 'Spanish', 'Arabic', 'Amharic', 'Yiddish'];
const specializations = ['Residential', 'Luxury', 'Commercial', 'New Construction', 'Rentals', 'Anglo Market', 'Investment Properties'];

export default function AgentRegisterWizard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const agentRegistration = useAgentRegistration();
  const [currentStep, setCurrentStep] = useState(0);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [validatedAgencyId, setValidatedAgencyId] = useState<string | null>(null);
  const [validatedAgencyName, setValidatedAgencyName] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: user?.email || '',
    phone: '',
    license_number: '',
    // Agency
    agency_choice: 'independent' as 'independent' | 'invite_code' | 'request_join',
    invite_code: '',
    agency_id: '',
    // Profile
    years_experience: 0,
    languages: ['Hebrew', 'English'] as string[],
    specializations: [] as string[],
    neighborhoods_covered: '',
    bio: '',
  });

  const updateField = <K extends keyof typeof formData>(field: K, value: typeof formData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: 'languages' | 'specializations', item: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  };

  const validateInviteCode = async () => {
    if (!formData.invite_code.trim()) return;
    
    setIsValidatingCode(true);
    try {
      // Check if invite code exists and is valid
      const { data, error } = await supabase
        .from('agency_invites')
        .select('agency_id, agencies(name)')
        .eq('code', formData.invite_code.trim())
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setValidatedAgencyId(data.agency_id);
        setValidatedAgencyName((data.agencies as any)?.name || 'Agency');
        toast.success(`Valid code for ${(data.agencies as any)?.name || 'Agency'}`);
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
      
      navigate('/agent');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+972-XX-XXX-XXXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="license_number">License Number *</Label>
                <Input
                  id="license_number"
                  value={formData.license_number}
                  onChange={(e) => updateField('license_number', e.target.value)}
                  placeholder="Required for verification"
                />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <RadioGroup
              value={formData.agency_choice}
              onValueChange={(v) => updateField('agency_choice', v as any)}
              className="space-y-4"
            >
              <div className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="independent" id="independent" />
                <div className="flex-1">
                  <Label htmlFor="independent" className="cursor-pointer font-medium">
                    I'm an independent agent
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Work independently without an agency affiliation
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="invite_code" id="invite_code" />
                <div className="flex-1">
                  <Label htmlFor="invite_code" className="cursor-pointer font-medium">
                    I have an agency invite code
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Join an agency using a code from your agency admin
                  </p>
                </div>
              </div>
            </RadioGroup>

            {formData.agency_choice === 'invite_code' && (
              <div className="space-y-3 pl-7">
                <Label htmlFor="invite_code_input">Enter Invite Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="invite_code_input"
                    value={formData.invite_code}
                    onChange={(e) => {
                      updateField('invite_code', e.target.value);
                      setValidatedAgencyId(null);
                      setValidatedAgencyName(null);
                    }}
                    placeholder="e.g., ABC123XYZ"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={validateInviteCode}
                    disabled={isValidatingCode || !formData.invite_code.trim()}
                  >
                    {isValidatingCode ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Validate'
                    )}
                  </Button>
                </div>
                {validatedAgencyName && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Check className="h-4 w-4" />
                    Joining: {validatedAgencyName}
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="years_experience">Years of Experience</Label>
              <Select
                value={String(formData.years_experience)}
                onValueChange={(v) => updateField('years_experience', Number(v))}
              >
                <SelectTrigger className="w-48">
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
            </div>

            <div className="space-y-3">
              <Label>Languages Spoken *</Label>
              <div className="flex flex-wrap gap-2">
                {languages.map((lang) => (
                  <div key={lang} className="flex items-center space-x-2">
                    <Checkbox
                      id={`lang-${lang}`}
                      checked={formData.languages.includes(lang)}
                      onCheckedChange={() => toggleArrayItem('languages', lang)}
                    />
                    <Label htmlFor={`lang-${lang}`} className="text-sm font-normal cursor-pointer">
                      {lang}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Specializations</Label>
              <div className="flex flex-wrap gap-2">
                {specializations.map((spec) => (
                  <div key={spec} className="flex items-center space-x-2">
                    <Checkbox
                      id={`spec-${spec}`}
                      checked={formData.specializations.includes(spec)}
                      onCheckedChange={() => toggleArrayItem('specializations', spec)}
                    />
                    <Label htmlFor={`spec-${spec}`} className="text-sm font-normal cursor-pointer">
                      {spec}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => updateField('bio', e.target.value)}
                placeholder="Tell potential clients about yourself, your experience, and what makes you a great agent..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                {formData.bio.length}/500 characters
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <h3 className="font-medium">Review Your Information</h3>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
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
                  <span className="text-muted-foreground">License:</span>
                  <span className="font-medium">{formData.license_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Agency:</span>
                  <span className="font-medium">
                    {validatedAgencyName || 'Independent'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Languages:</span>
                  <span className="font-medium">{formData.languages.join(', ')}</span>
                </div>
                {formData.specializations.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Specializations:</span>
                    <span className="font-medium">{formData.specializations.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-primary/5 p-4 rounded-lg">
              <h4 className="font-medium mb-2">What happens next?</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Your application will be reviewed within 24-48 hours</li>
                <li>• We'll verify your license number</li>
                <li>• Once approved, you can start adding listings</li>
                <li>• You'll receive an email notification when approved</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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
                <UserPlus className="h-8 w-8 text-primary" />
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
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
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
                disabled={agentRegistration.isPending}
              >
                {agentRegistration.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Submit Application
              </Button>
            ) : (
              <Button onClick={goNext} disabled={!canGoNext()}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
