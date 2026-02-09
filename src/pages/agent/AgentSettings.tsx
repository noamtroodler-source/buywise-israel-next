import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Save, Upload, User, Bell, FileText, Globe, Briefcase, Linkedin, Instagram, Facebook } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useAgentProfile } from '@/hooks/useAgentProperties';
import { useUpdateAgentProfile } from '@/hooks/useAgentProfile';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const languages = [
  { id: 'english', label: 'English' },
  { id: 'hebrew', label: 'Hebrew' },
  { id: 'french', label: 'French' },
  { id: 'russian', label: 'Russian' },
  { id: 'spanish', label: 'Spanish' },
  { id: 'arabic', label: 'Arabic' },
];

const specializations = [
  { id: 'residential', label: 'Residential' },
  { id: 'commercial', label: 'Commercial' },
  { id: 'luxury', label: 'Luxury' },
  { id: 'new_construction', label: 'New Construction' },
  { id: 'investment', label: 'Investment Properties' },
  { id: 'rentals', label: 'Rentals' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function AgentSettings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: agentProfile, isLoading } = useAgentProfile();
  const updateProfile = useUpdateAgentProfile();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    license_number: '',
    years_experience: undefined as number | undefined,
    languages: [] as string[],
    specializations: [] as string[],
    social_links: {
      linkedin: '',
      instagram: '',
      facebook: '',
    },
  });

  const [notificationSettings, setNotificationSettings] = useState({
    notify_email: true,
    notify_on_inquiry: true,
    notify_on_approval: true,
  });

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    if (agentProfile) {
      const socialLinks = (agentProfile as any).social_links || {};
      setFormData({
        name: agentProfile.name || '',
        email: agentProfile.email || '',
        phone: agentProfile.phone || '',
        bio: agentProfile.bio || '',
        license_number: agentProfile.license_number || '',
        years_experience: agentProfile.years_experience || undefined,
        languages: agentProfile.languages || [],
        specializations: agentProfile.specializations || [],
        social_links: {
          linkedin: socialLinks.linkedin || '',
          instagram: socialLinks.instagram || '',
          facebook: socialLinks.facebook || '',
        },
      });
      setNotificationSettings({
        notify_email: agentProfile.notify_email ?? true,
        notify_on_inquiry: agentProfile.notify_on_inquiry ?? true,
        notify_on_approval: agentProfile.notify_on_approval ?? true,
      });
      setAvatarUrl(agentProfile.avatar_url);
    }
  }, [agentProfile]);

  const updateField = (field: string, value: any) => {
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

  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate the image is actually loadable
    const isValidImage = await new Promise<boolean>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = URL.createObjectURL(file);
    });

    if (!isValidImage) {
      toast.error('Invalid image file. Please select a valid PNG or JPG.');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName);

      setAvatarUrl(publicUrl);
      setAvatarError(false);
      toast.success('Avatar uploaded');
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentProfile) return;

    // Clean social links - only include non-empty values
    const cleanedSocialLinks = Object.fromEntries(
      Object.entries(formData.social_links).filter(([_, value]) => value.trim() !== '')
    );

    updateProfile.mutate({
      id: agentProfile.id,
      name: formData.name,
      email: formData.email,
      phone: formData.phone || null,
      bio: formData.bio || null,
      license_number: formData.license_number || null,
      years_experience: formData.years_experience || null,
      languages: formData.languages.length > 0 ? formData.languages : null,
      specializations: formData.specializations.length > 0 ? formData.specializations : null,
      avatar_url: avatarUrl,
      social_links: Object.keys(cleanedSocialLinks).length > 0 ? cleanedSocialLinks : null,
      notify_email: notificationSettings.notify_email,
      notify_on_inquiry: notificationSettings.notify_on_inquiry,
      notify_on_approval: notificationSettings.notify_on_approval,
    } as any);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Gradient Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/[0.02] to-background -z-10" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-primary/3 rounded-full blur-3xl -z-10" />

        <div className="container py-8 max-w-3xl">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Back Button */}
            <motion.div variants={itemVariants}>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/agent')}
                className="rounded-xl hover:bg-primary/5 -ml-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </motion.div>

            {/* Premium Header */}
            <motion.div variants={itemVariants} className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <User className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Profile Settings</h1>
                <p className="text-muted-foreground">Update your professional profile information</p>
              </div>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar Upload Section */}
              <motion.div variants={itemVariants}>
                <Card className="rounded-2xl border-border overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-6 p-6 bg-gradient-to-br from-primary/5 to-muted/50">
                      <div className="relative">
                        <div className={cn(
                          "h-24 w-24 rounded-2xl bg-card flex items-center justify-center overflow-hidden",
                          "border-2 border-dashed border-border"
                        )}>
                          {avatarUrl && !avatarError ? (
                            <img 
                              src={avatarUrl} 
                              alt="Avatar" 
                              className="h-full w-full object-cover"
                              onError={() => setAvatarError(true)}
                            />
                          ) : (
                            <User className="h-10 w-10 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-semibold">Profile Photo</Label>
                        <label className={cn(
                          "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer",
                          "bg-card border border-border hover:border-primary/50 transition-colors",
                          uploading && "opacity-50 pointer-events-none"
                        )}>
                          {uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                          <span className="text-sm font-medium">
                            {uploading ? 'Uploading...' : 'Upload Photo'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarUpload}
                            disabled={uploading}
                          />
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Recommended: Square image, at least 200x200px
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Basic Information */}
              <motion.div variants={itemVariants}>
                <Card className="rounded-2xl border-border hover:shadow-lg hover:border-primary/30 transition-all">
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground">Basic Information</h3>
                    </div>
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => updateField('name', e.target.value)}
                          required
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => updateField('email', e.target.value)}
                          required
                          className="h-11 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="phone">WhatsApp Number</Label>
                        <PhoneInput
                          id="phone"
                          value={formData.phone}
                          onChange={(value) => updateField('phone', value)}
                          showWhatsAppIcon={true}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="license_number">License Number</Label>
                        <Input
                          id="license_number"
                          value={formData.license_number}
                          onChange={(e) => updateField('license_number', e.target.value)}
                          className="h-11 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="years_experience">Years of Experience</Label>
                      <Input
                        id="years_experience"
                        type="number"
                        min="0"
                        max="50"
                        value={formData.years_experience || ''}
                        onChange={(e) => updateField('years_experience', e.target.value ? Number(e.target.value) : undefined)}
                        className="h-11 rounded-xl w-32"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Bio */}
              <motion.div variants={itemVariants}>
                <Card className="rounded-2xl border-border hover:shadow-lg hover:border-primary/30 transition-all">
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground">About You</h3>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => updateField('bio', e.target.value)}
                        placeholder="Tell buyers about your experience and approach..."
                        rows={4}
                        className="rounded-xl resize-none"
                      />
                      <p className="text-xs text-muted-foreground">
                        This will be displayed on your public profile
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Languages */}
              <motion.div variants={itemVariants}>
                <Card className="rounded-2xl border-border hover:shadow-lg hover:border-primary/30 transition-all">
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Globe className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground">Languages</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {languages.map((lang) => (
                        <button
                          key={lang.id}
                          type="button"
                          onClick={() => toggleArrayItem('languages', lang.id)}
                          className={cn(
                            "flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-all text-sm font-medium",
                            formData.languages.includes(lang.id)
                              ? "bg-primary/10 border-primary text-primary"
                              : "border-border hover:border-primary/50 hover:bg-muted/50"
                          )}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Specializations */}
              <motion.div variants={itemVariants}>
                <Card className="rounded-2xl border-border hover:shadow-lg hover:border-primary/30 transition-all">
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Briefcase className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground">Specializations</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {specializations.map((spec) => (
                        <button
                          key={spec.id}
                          type="button"
                          onClick={() => toggleArrayItem('specializations', spec.id)}
                          className={cn(
                            "flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-all text-sm font-medium",
                            formData.specializations.includes(spec.id)
                              ? "bg-primary/10 border-primary text-primary"
                              : "border-border hover:border-primary/50 hover:bg-muted/50"
                          )}
                        >
                          {spec.label}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Social Links */}
              <motion.div variants={itemVariants}>
                <Card className="rounded-2xl border-border hover:shadow-lg hover:border-primary/30 transition-all">
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Globe className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Social Links</h3>
                        <p className="text-xs text-muted-foreground">Connect your professional profiles</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="linkedin" className="flex items-center gap-2">
                          <Linkedin className="h-4 w-4 text-[#0A66C2]" />
                          LinkedIn
                        </Label>
                        <Input
                          id="linkedin"
                          type="url"
                          value={formData.social_links.linkedin}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            social_links: { ...prev.social_links, linkedin: e.target.value }
                          }))}
                          placeholder="https://linkedin.com/in/yourprofile"
                          className="h-11 rounded-xl"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="instagram" className="flex items-center gap-2">
                          <Instagram className="h-4 w-4 text-[#E4405F]" />
                          Instagram
                        </Label>
                        <Input
                          id="instagram"
                          type="url"
                          value={formData.social_links.instagram}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            social_links: { ...prev.social_links, instagram: e.target.value }
                          }))}
                          placeholder="https://instagram.com/yourhandle"
                          className="h-11 rounded-xl"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="facebook" className="flex items-center gap-2">
                          <Facebook className="h-4 w-4 text-[#1877F2]" />
                          Facebook
                        </Label>
                        <Input
                          id="facebook"
                          type="url"
                          value={formData.social_links.facebook}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            social_links: { ...prev.social_links, facebook: e.target.value }
                          }))}
                          placeholder="https://facebook.com/yourpage"
                          className="h-11 rounded-xl"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Notification Settings */}
              <motion.div variants={itemVariants}>
                <Card className="rounded-2xl border-border hover:shadow-lg hover:border-primary/30 transition-all">
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Bell className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground">Email Notifications</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                        <div className="space-y-0.5">
                          <Label className="text-base font-medium">Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive notifications via email
                          </p>
                        </div>
                        <Switch
                          checked={notificationSettings.notify_email}
                          onCheckedChange={(checked) => 
                            setNotificationSettings(prev => ({ ...prev, notify_email: checked }))
                          }
                        />
                      </div>

                      <div className={cn(
                        "space-y-3 pl-4 border-l-2 border-primary/20",
                        !notificationSettings.notify_email && "opacity-50 pointer-events-none"
                      )}>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20">
                          <div className="space-y-0.5">
                            <Label className="font-medium">New Lead Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                              Get notified when someone inquires about your listings
                            </p>
                          </div>
                          <Switch
                            checked={notificationSettings.notify_on_inquiry}
                            onCheckedChange={(checked) => 
                              setNotificationSettings(prev => ({ ...prev, notify_on_inquiry: checked }))
                            }
                            disabled={!notificationSettings.notify_email}
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20">
                          <div className="space-y-0.5">
                            <Label className="font-medium">Listing Approval Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                              Get notified when your listings are approved or need changes
                            </p>
                          </div>
                          <Switch
                            checked={notificationSettings.notify_on_approval}
                            onCheckedChange={(checked) => 
                              setNotificationSettings(prev => ({ ...prev, notify_on_approval: checked }))
                            }
                            disabled={!notificationSettings.notify_email}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Sticky Save Bar */}
              <motion.div variants={itemVariants} className="z-10">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-card/95 backdrop-blur-sm border border-border shadow-lg">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => navigate('/agent')}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateProfile.isPending}
                    size="lg"
                    className="rounded-xl px-8"
                  >
                    {updateProfile.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            </form>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
