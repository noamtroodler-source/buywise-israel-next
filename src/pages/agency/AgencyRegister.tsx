import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Loader2, ArrowLeft, Sparkles, Check, Lightbulb, Upload, X } from 'lucide-react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <Layout>
      <div className="min-h-screen relative">
        {/* Premium Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/[0.02] to-background -z-10" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-primary/3 rounded-full blur-3xl -z-10" />

        <motion.div
          className="container py-8 max-w-2xl"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Back Navigation */}
          <motion.div variants={itemVariants} className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')} 
              className="rounded-xl hover:bg-primary/5 -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="rounded-2xl border-primary/20 hover:shadow-lg transition-all overflow-hidden">
              <CardHeader className="text-center pb-6">
                <motion.div 
                  className="mx-auto mb-4 h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Building2 className="h-10 w-10 text-primary" />
                </motion.div>
                <CardTitle className="text-2xl">Register Your Agency</CardTitle>
                <CardDescription className="text-base">
                  Create your agency profile and start inviting agents to your team
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 sm:p-8 pt-0">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Agency Logo Upload */}
                  <motion.div variants={itemVariants} className="space-y-3">
                    <Label className="text-base font-medium">Agency Logo</Label>
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

                  {/* Basic Info */}
                  <motion.div variants={itemVariants} className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      Agency Information
                    </h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="name">Agency Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        placeholder="Your Agency Name"
                        required
                        className="h-11 rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
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
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
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
                        <Label htmlFor="phone">WhatsApp Number</Label>
                        <PhoneInput
                          id="phone"
                          value={formData.phone}
                          onChange={(value) => updateField('phone', value)}
                          showWhatsAppIcon={true}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => updateField('website', e.target.value)}
                        placeholder="https://your-agency.com"
                        className="h-11 rounded-xl"
                      />
                    </div>
                  </motion.div>

                  {/* Cities - Premium Badge Style */}
                  <motion.div variants={itemVariants} className="space-y-3">
                    <Label className="text-base font-medium">Cities Covered</Label>
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

                  {/* Specializations - Premium Badge Style */}
                  <motion.div variants={itemVariants} className="space-y-3">
                    <Label className="text-base font-medium">Specializations</Label>
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

                  {/* Premium Benefits Box */}
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
                          transition={{ delay: 0.5 + i * 0.1 }}
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

                  <motion.div variants={itemVariants}>
                    <Button
                      type="submit"
                      className="w-full h-11 rounded-xl"
                      disabled={isSubmitting || isUploadingLogo || !formData.name || !formData.email}
                    >
                      {(isSubmitting || isUploadingLogo) ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Building2 className="h-4 w-4 mr-2" />
                      )}
                      Register Agency
                    </Button>
                  </motion.div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
      <AgencySubmittedDialog 
        open={showSuccessDialog} 
        onOpenChange={setShowSuccessDialog} 
      />
    </Layout>
  );
}
