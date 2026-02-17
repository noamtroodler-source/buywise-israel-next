import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { BillingSection } from '@/components/billing/BillingSection';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Save, Upload, Building2, Trash2, X, Mail, Phone, Globe, MapPin, Briefcase, Users, Bell, Linkedin, Instagram, Facebook } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useMyAgency, useAgencyInvites, useUpdateAgency, useDeactivateInvite } from '@/hooks/useAgencyManagement';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AddressAutocomplete } from '@/components/agent/wizard/AddressAutocomplete';
import { GoogleMapsProvider } from '@/components/maps/GoogleMapsProvider';

const allCities = [
  'Tel Aviv', 'Jerusalem', 'Haifa', 'Ra\'anana', 'Herzliya', 
  'Netanya', 'Modi\'in', 'Beit Shemesh', 'Ashdod', 'Beer Sheva',
  'Eilat', 'Ashkelon', 'Petah Tikva', 'Holon', 'Ramat Gan',
];

const allSpecializations = [
  { id: 'residential', label: 'Residential' },
  { id: 'commercial', label: 'Commercial' },
  { id: 'luxury', label: 'Luxury Properties' },
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

export default function AgencySettings() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { data: agency, isLoading } = useMyAgency();
  const { data: invites = [] } = useAgencyInvites(agency?.id);
  const updateAgency = useUpdateAgency();
  const deactivateInvite = useDeactivateInvite();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    email: '',
    phone: '',
    website: '',
    office_address: '',
    is_accepting_agents: true,
    social_links: {
      linkedin: '',
      instagram: '',
      facebook: '',
    },
  });

  const [notificationSettings, setNotificationSettings] = useState({
    notify_email: true,
    notify_on_join_request: true,
  });

  const [cities, setCities] = useState<string[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [newCity, setNewCity] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    if (agency) {
      const socialLinks = (agency as any).social_links || {};
      setFormData({
        name: agency.name || '',
        description: agency.description || '',
        email: agency.email || '',
        phone: agency.phone || '',
        website: agency.website || '',
        office_address: (agency as any).office_address || '',
        is_accepting_agents: agency.is_accepting_agents ?? true,
        social_links: {
          linkedin: socialLinks.linkedin || '',
          instagram: socialLinks.instagram || '',
          facebook: socialLinks.facebook || '',
        },
      });
      setNotificationSettings({
        notify_email: (agency as any).notify_email ?? true,
        notify_on_join_request: (agency as any).notify_on_join_request ?? true,
      });
      setCities(agency.cities_covered || []);
      setSpecializations(agency.specializations || []);
      setLogoUrl(agency.logo_url);
    }
  }, [agency]);

  // Scroll to hash target (e.g. #social-links)
  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
      }
    }
  }, [location.hash, isLoading]);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSpecialization = (specId: string) => {
    setSpecializations(prev => 
      prev.includes(specId) 
        ? prev.filter(s => s !== specId) 
        : [...prev, specId]
    );
  };

  const addCity = () => {
    const trimmed = newCity.trim();
    if (trimmed && !cities.includes(trimmed)) {
      setCities(prev => [...prev, trimmed]);
      setNewCity('');
    }
  };

  const removeCity = (city: string) => {
    setCities(prev => prev.filter(c => c !== city));
  };

  const handleLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !agency) return;

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
      const fileName = `agencies/${agency.id}/logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName);

      setLogoUrl(publicUrl);
      setLogoError(false);
      toast.success('Logo uploaded');
    } catch (error) {
      console.error('Logo upload error:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  }, [user, agency]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agency) return;

    // Clean social links - only include non-empty values
    const cleanedSocialLinks = Object.fromEntries(
      Object.entries(formData.social_links).filter(([_, value]) => value.trim() !== '')
    );

    updateAgency.mutate({
      id: agency.id,
      name: formData.name,
      description: formData.description || null,
      email: formData.email || null,
      phone: formData.phone || null,
      website: formData.website || null,
      logo_url: logoUrl,
      cities_covered: cities.length > 0 ? cities : null,
      specializations: specializations.length > 0 ? specializations : null,
      is_accepting_agents: formData.is_accepting_agents,
      social_links: Object.keys(cleanedSocialLinks).length > 0 ? cleanedSocialLinks : null,
      notify_email: notificationSettings.notify_email,
      notify_on_join_request: notificationSettings.notify_on_join_request,
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

  if (!agency) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">No Agency Found</h1>
          <p className="text-muted-foreground mb-6">
            You need to register an agency first.
          </p>
          <Button onClick={() => navigate('/agency/register')} className="rounded-xl">
            Register Agency
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <GoogleMapsProvider>
      <Layout>
        <div className="min-h-screen relative">
        {/* Background Effects */}
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
            {/* Header */}
            <motion.div variants={itemVariants}>
              <Button variant="ghost" asChild className="mb-4 rounded-xl hover:bg-primary/5">
                <Link to="/agency">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Agency Settings</h1>
                  <p className="text-muted-foreground">Update your agency profile and preferences</p>
                </div>
              </div>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Logo Upload Card */}
              <motion.div variants={itemVariants}>
                <Card className="rounded-2xl border-border hover:shadow-lg hover:border-primary/30 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-6 p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-muted/50 border border-border">
                      <div className="relative group">
                        <div className={cn(
                          "h-24 w-24 rounded-2xl bg-card flex items-center justify-center overflow-hidden",
                          "border-2 border-dashed border-border group-hover:border-primary/50 transition-colors"
                        )}>
                          {logoUrl && !logoError ? (
                            <img 
                              src={logoUrl} 
                              alt="Agency logo" 
                              className="h-full w-full object-cover"
                              onError={() => setLogoError(true)}
                            />
                          ) : (
                            <Building2 className="h-12 w-12 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-base font-semibold">Agency Logo</Label>
                        <label className={cn(
                          "inline-flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer",
                          "bg-primary/10 text-primary hover:bg-primary/20 transition-colors",
                          uploading && "opacity-50 pointer-events-none"
                        )}>
                          {uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                          <span className="text-sm font-medium">
                            {uploading ? 'Uploading...' : 'Upload Logo'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleLogoUpload}
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

              {/* Basic Info Card */}
              <motion.div variants={itemVariants}>
                <Card className="rounded-2xl border-border hover:shadow-lg hover:border-primary/30 transition-all">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <CardTitle>Basic Information</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Agency Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => updateField('name', e.target.value)}
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
                        placeholder="Tell clients about your agency..."
                        rows={4}
                        className="rounded-xl resize-none"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Contact Info Card */}
              <motion.div variants={itemVariants}>
                <Card className="rounded-2xl border-border hover:shadow-lg hover:border-primary/30 transition-all">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Mail className="h-4 w-4 text-primary" />
                      </div>
                      <CardTitle>Contact Information</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => updateField('email', e.target.value)}
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          Phone
                        </Label>
                        <PhoneInput
                          id="phone"
                          value={formData.phone}
                          onChange={(value) => updateField('phone', value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="office_address" className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        Office Address
                      </Label>
                      <AddressAutocomplete
                        value={formData.office_address}
                        onAddressSelect={(address) => {
                          updateField('office_address', address.fullAddress);
                        }}
                        placeholder="Start typing your office address..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website" className="flex items-center gap-2">
                        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                        Website
                      </Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => updateField('website', e.target.value)}
                        placeholder="https://..."
                        className="h-11 rounded-xl"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Social Links Card */}
              <motion.div variants={itemVariants}>
                <Card id="social-links" className="rounded-2xl border-border hover:shadow-lg hover:border-primary/30 transition-all">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Globe className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle>Social Links</CardTitle>
                        <CardDescription>Connect your professional profiles</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                        placeholder="https://linkedin.com/company/youragency"
                        className="h-11 rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instagram" className="flex items-center gap-2">
                        <Instagram className="h-4 w-4 text-primary" />
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
                        placeholder="https://instagram.com/youragency"
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
                        placeholder="https://facebook.com/youragency"
                        className="h-11 rounded-xl"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Service Areas Card */}
              <motion.div variants={itemVariants}>
                <Card className="rounded-2xl border-border hover:shadow-lg hover:border-primary/30 transition-all">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <CardTitle>Service Areas</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                        placeholder="Add a city..."
                        list="city-suggestions"
                        className="h-11 rounded-xl"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCity();
                          }
                        }}
                      />
                      <datalist id="city-suggestions">
                        {allCities.filter(c => !cities.includes(c)).map(city => (
                          <option key={city} value={city} />
                        ))}
                      </datalist>
                      <Button type="button" variant="outline" onClick={addCity} className="rounded-xl border-primary/20 hover:bg-primary/5">
                        Add
                      </Button>
                    </div>
                    
                    {cities.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {cities.map((city) => (
                          <Badge 
                            key={city} 
                            variant="secondary"
                            className="pl-3 pr-1 py-1.5 gap-1 bg-primary/10 text-primary border-0 rounded-lg"
                          >
                            {city}
                            <button
                              type="button"
                              onClick={() => removeCity(city)}
                              className="ml-1 rounded-full hover:bg-primary/20 p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Specializations Card */}
              <motion.div variants={itemVariants}>
                <Card className="rounded-2xl border-border hover:shadow-lg hover:border-primary/30 transition-all">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Briefcase className="h-4 w-4 text-primary" />
                      </div>
                      <CardTitle>Specializations</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {allSpecializations.map((spec) => (
                        <label
                          key={spec.id}
                          className={cn(
                            "flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-colors text-sm text-center",
                            specializations.includes(spec.id)
                              ? "bg-primary/10 border-primary text-primary"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={specializations.includes(spec.id)}
                            onChange={() => toggleSpecialization(spec.id)}
                          />
                          {spec.label}
                        </label>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Notifications Card */}
              <motion.div variants={itemVariants}>
                <Card className="rounded-2xl border-border hover:shadow-lg hover:border-primary/30 transition-all">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Bell className="h-4 w-4 text-primary" />
                      </div>
                      <CardTitle>Notifications</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
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
                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                      <div className="space-y-0.5">
                        <Label className="text-base">Join Request Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when agents request to join
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.notify_on_join_request}
                        onCheckedChange={(checked) => 
                          setNotificationSettings(prev => ({ ...prev, notify_on_join_request: checked }))
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Agent Recruitment Card */}
              <motion.div variants={itemVariants}>
                <Card className="rounded-2xl border-border hover:shadow-lg hover:border-primary/30 transition-all">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <CardTitle>Agent Recruitment</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                      <div className="space-y-0.5">
                        <Label className="text-base">Accept New Agents</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow agents to request to join your agency
                        </p>
                      </div>
                      <Switch
                        checked={formData.is_accepting_agents}
                        onCheckedChange={(checked) => updateField('is_accepting_agents', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Invite Codes Card */}
              <motion.div variants={itemVariants}>
                <Card className="rounded-2xl border-border hover:shadow-lg hover:border-primary/30 transition-all">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Mail className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle>Invite Codes</CardTitle>
                        <CardDescription>Manage invite codes for your agency</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {invites.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-4 rounded-xl bg-muted/30 text-center">
                        No invite codes created yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {invites.map((invite, index) => (
                          <motion.div 
                            key={invite.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                              "flex items-center justify-between p-4 rounded-xl",
                              invite.is_active ? "bg-muted/30" : "bg-muted/20 opacity-60"
                            )}
                          >
                            <div>
                              <p className="font-mono font-medium flex items-center gap-2">
                                {invite.code}
                                {invite.code === agency.default_invite_code && (
                                  <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                                    Default
                                  </Badge>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {invite.uses_remaining !== null
                                  ? `${invite.uses_remaining} uses remaining`
                                  : 'Unlimited uses'}
                                {!invite.is_active && ' • Deactivated'}
                              </p>
                            </div>
                            {invite.is_active && invite.code !== agency.default_invite_code && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-2xl">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Deactivate Invite Code?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will prevent anyone from using this code to join your agency.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deactivateInvite.mutate(invite.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                                    >
                                      Deactivate
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Create new invite codes from the Agency Dashboard
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Billing Section */}
              <motion.div variants={itemVariants}>
                <BillingSection />
              </motion.div>

              {/* Sticky Save Button */}
              <motion.div 
                variants={itemVariants}
                
              >
                <div className="flex items-center justify-end gap-3 p-4 rounded-2xl bg-card/95 backdrop-blur-sm border border-border shadow-lg">
                  <Button type="button" variant="outline" onClick={() => navigate('/agency')} className="rounded-xl">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateAgency.isPending} className="rounded-xl px-8">
                    {updateAgency.isPending ? (
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
    </GoogleMapsProvider>
  );
}
