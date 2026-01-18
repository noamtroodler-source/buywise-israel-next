import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Save, Upload, User, Bell } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
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
    neighborhoods_covered: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    notify_email: true,
    notify_on_inquiry: true,
    notify_on_approval: true,
  });

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (agentProfile) {
      setFormData({
        name: agentProfile.name || '',
        email: agentProfile.email || '',
        phone: agentProfile.phone || '',
        bio: agentProfile.bio || '',
        license_number: agentProfile.license_number || '',
        years_experience: agentProfile.years_experience || undefined,
        languages: agentProfile.languages || [],
        specializations: agentProfile.specializations || [],
        neighborhoods_covered: agentProfile.neighborhoods_covered?.join(', ') || '',
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

    const neighborhoods = formData.neighborhoods_covered
      .split(',')
      .map(n => n.trim())
      .filter(Boolean);

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
      neighborhoods_covered: neighborhoods.length > 0 ? neighborhoods : null,
      avatar_url: avatarUrl,
      notify_email: notificationSettings.notify_email,
      notify_on_inquiry: notificationSettings.notify_on_inquiry,
      notify_on_approval: notificationSettings.notify_on_approval,
    });
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
      <div className="container py-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Button variant="ghost" onClick={() => navigate('/agent')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Update your professional profile information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Avatar */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className={cn(
                      "h-24 w-24 rounded-full bg-muted flex items-center justify-center overflow-hidden",
                      "border-2 border-dashed border-border"
                    )}>
                      {avatarUrl ? (
                        <img 
                          src={avatarUrl} 
                          alt="Avatar" 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-10 w-10 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Profile Photo</Label>
                    <label className={cn(
                      "inline-flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer",
                      "bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors",
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

                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Basic Information
                  </h3>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        required
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
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        placeholder="+972..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="license_number">License Number</Label>
                      <Input
                        id="license_number"
                        value={formData.license_number}
                        onChange={(e) => updateField('license_number', e.target.value)}
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
                      className="w-32"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    About You
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => updateField('bio', e.target.value)}
                      placeholder="Tell buyers about your experience and approach..."
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      This will be displayed on your public profile
                    </p>
                  </div>
                </div>

                {/* Languages */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Languages
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {languages.map((lang) => (
                      <label
                        key={lang.id}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={formData.languages.includes(lang.id)}
                          onCheckedChange={() => toggleArrayItem('languages', lang.id)}
                        />
                        <span className="text-sm">{lang.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Specializations */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Specializations
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {specializations.map((spec) => (
                      <label
                        key={spec.id}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={formData.specializations.includes(spec.id)}
                          onCheckedChange={() => toggleArrayItem('specializations', spec.id)}
                        />
                        <span className="text-sm">{spec.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Neighborhoods */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Coverage Area
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="neighborhoods">Neighborhoods Covered</Label>
                    <Input
                      id="neighborhoods"
                      value={formData.neighborhoods_covered}
                      onChange={(e) => updateField('neighborhoods_covered', e.target.value)}
                      placeholder="e.g., Rechavia, Baka, German Colony"
                    />
                    <p className="text-xs text-muted-foreground">
                      Separate multiple neighborhoods with commas
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Notification Settings */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      Email Notifications
                    </h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Email Notifications</Label>
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
                      "space-y-4 pl-4 border-l-2 border-muted",
                      !notificationSettings.notify_email && "opacity-50 pointer-events-none"
                    )}>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>New Lead Notifications</Label>
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

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Listing Approval Notifications</Label>
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
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => navigate('/agent')}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateProfile.isPending}>
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
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
