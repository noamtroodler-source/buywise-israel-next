import { useState, useEffect, useRef } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Loader2, Upload, Building2, Save, Globe, Mail, Phone, Calendar, Linkedin, Instagram, Facebook, MapPin, Users, X, Briefcase, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDeveloperProfile } from '@/hooks/useDeveloperProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const SPECIALTY_OPTIONS = [
  'Luxury Developments',
  'Affordable Housing',
  'Commercial Projects',
  'Mixed-Use Developments',
  'High-Rise Apartments',
  'Boutique Residences',
  'Senior Living',
  'Student Housing',
  'Eco-Friendly/Green',
  'Urban Renewal',
];

const COMPANY_SIZE_OPTIONS = [
  { value: 'small', label: '1-10 employees' },
  { value: 'medium', label: '11-50 employees' },
  { value: 'large', label: '51-200 employees' },
  { value: 'enterprise', label: '200+ employees' },
];

const COMPANY_TYPE_OPTIONS = [
  { value: 'private', label: 'Private Company' },
  { value: 'public', label: 'Public Company' },
  { value: 'international', label: 'International Developer' },
  { value: 'family', label: 'Family Business' },
];

export default function DeveloperSettings() {
  const { data: developer, isLoading, refetch } = useDeveloperProfile();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    description: '',
    founded_year: '',
    linkedin_url: '',
    instagram_url: '',
    facebook_url: '',
    office_address: '',
    office_city: '',
    company_size: '',
    company_type: '',
    specialties: [] as string[],
  });

  const [notificationSettings, setNotificationSettings] = useState({
    notify_email: true,
    notify_on_inquiry: true,
    notify_on_approval: true,
  });

  // Initialize form when developer data loads
  useEffect(() => {
    if (developer) {
      setFormData({
        name: developer.name || '',
        email: developer.email || '',
        phone: developer.phone || '',
        website: developer.website || '',
        description: developer.description || '',
        founded_year: developer.founded_year?.toString() || '',
        linkedin_url: developer.linkedin_url || '',
        instagram_url: developer.instagram_url || '',
        facebook_url: developer.facebook_url || '',
        office_address: developer.office_address || '',
        office_city: developer.office_city || '',
        company_size: developer.company_size || '',
        company_type: developer.company_type || '',
        specialties: developer.specialties || [],
      });
      setNotificationSettings({
        notify_email: (developer as any).notify_email ?? true,
        notify_on_inquiry: (developer as any).notify_on_inquiry ?? true,
        notify_on_approval: (developer as any).notify_on_approval ?? true,
      });
    }
  }, [developer]);

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !developer) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `developer-logos/${developer.id}/logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName);

      // Update developer with new logo URL
      const { error: updateError } = await supabase
        .from('developers')
        .update({ logo_url: publicUrl })
        .eq('id', developer.id);

      if (updateError) throw updateError;

      toast.success('Logo uploaded successfully');
      refetch();
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!developer) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('developers')
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          website: formData.website,
          description: formData.description,
          founded_year: formData.founded_year ? parseInt(formData.founded_year) : null,
          linkedin_url: formData.linkedin_url || null,
          instagram_url: formData.instagram_url || null,
          facebook_url: formData.facebook_url || null,
          office_address: formData.office_address || null,
          office_city: formData.office_city || null,
          company_size: formData.company_size || null,
          company_type: formData.company_type || null,
          specialties: formData.specialties.length > 0 ? formData.specialties : null,
          notify_email: notificationSettings.notify_email,
          notify_on_inquiry: notificationSettings.notify_on_inquiry,
          notify_on_approval: notificationSettings.notify_on_approval,
        })
        .eq('id', developer.id);

      if (error) throw error;
      
      toast.success('Settings saved successfully');
      refetch();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleLogoUpload}
          className="hidden"
        />

        {/* Gradient Header Section */}
        <div className="relative">
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
                  <Link to="/developer">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Link>
                </Button>
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">Company Settings</h1>
                    <p className="text-muted-foreground">Manage your developer profile and company information</p>
                  </div>
                </div>
              </motion.div>

              {/* Company Profile Card */}
              <motion.div variants={itemVariants}>
                <Card className="rounded-2xl border-border hover:shadow-lg hover:border-primary/30 transition-all">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      Company Profile
                    </CardTitle>
                    <CardDescription>
                      Update your company information visible to buyers
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Logo Upload Section */}
                    <div className="flex items-center gap-6 p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-muted/50 border border-border">
                      <div className="relative group">
                        <div className="h-24 w-24 rounded-2xl bg-card border-2 border-dashed border-border flex items-center justify-center overflow-hidden group-hover:border-primary/50 transition-colors">
                          {developer?.logo_url ? (
                            <img 
                              src={developer.logo_url} 
                              alt={developer.name} 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Building2 className="h-12 w-12 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      <div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-xl"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                        >
                          {uploading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4 mr-2" />
                          )}
                          {uploading ? 'Uploading...' : 'Change Logo'}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">Recommended: 400x400px, PNG or JPG</p>
                      </div>
                    </div>

                    {/* Company Details Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 pt-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="font-semibold text-foreground">Company Details</h3>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm font-medium">Company Name</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="h-11 rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="founded_year" className="text-sm font-medium flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            Founded Year
                          </Label>
                          <Input
                            id="founded_year"
                            type="number"
                            placeholder="e.g., 2010"
                            value={formData.founded_year}
                            onChange={(e) => setFormData({ ...formData, founded_year: e.target.value })}
                            className="h-11 rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            Company Size
                          </Label>
                          <Select 
                            value={formData.company_size} 
                            onValueChange={(value) => setFormData({ ...formData, company_size: value })}
                          >
                            <SelectTrigger className="h-11 rounded-xl">
                              <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                            <SelectContent>
                              {COMPANY_SIZE_OPTIONS.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                            Company Type
                          </Label>
                          <Select 
                            value={formData.company_type} 
                            onValueChange={(value) => setFormData({ ...formData, company_type: value })}
                          >
                            <SelectTrigger className="h-11 rounded-xl">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {COMPANY_TYPE_OPTIONS.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Office Address Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 pt-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <MapPin className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="font-semibold text-foreground">Office Location</h3>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="office_address" className="text-sm font-medium">Office Address</Label>
                          <Input
                            id="office_address"
                            placeholder="Street address"
                            value={formData.office_address}
                            onChange={(e) => setFormData({ ...formData, office_address: e.target.value })}
                            className="h-11 rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="office_city" className="text-sm font-medium">City</Label>
                          <Input
                            id="office_city"
                            placeholder="e.g., Tel Aviv"
                            value={formData.office_city}
                            onChange={(e) => setFormData({ ...formData, office_city: e.target.value })}
                            className="h-11 rounded-xl"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Contact Information Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 pt-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Mail className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="font-semibold text-foreground">Contact Information</h3>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            Contact Email
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="h-11 rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            Phone Number
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="h-11 rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="website" className="text-sm font-medium flex items-center gap-2">
                          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                          Website
                        </Label>
                        <Input
                          id="website"
                          type="url"
                          placeholder="https://..."
                          value={formData.website}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          className="h-11 rounded-xl"
                        />
                      </div>
                    </div>

                    {/* Social Links Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 pt-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Linkedin className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="font-semibold text-foreground">Social Links</h3>
                      </div>

                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="linkedin" className="text-sm font-medium flex items-center gap-2">
                            <Linkedin className="h-3.5 w-3.5 text-muted-foreground" />
                            LinkedIn
                          </Label>
                          <Input
                            id="linkedin"
                            type="url"
                            placeholder="https://linkedin.com/company/..."
                            value={formData.linkedin_url}
                            onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                            className="h-11 rounded-xl"
                          />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="instagram" className="text-sm font-medium flex items-center gap-2">
                              <Instagram className="h-3.5 w-3.5 text-muted-foreground" />
                              Instagram
                            </Label>
                            <Input
                              id="instagram"
                              type="url"
                              placeholder="https://instagram.com/..."
                              value={formData.instagram_url}
                              onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                              className="h-11 rounded-xl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="facebook" className="text-sm font-medium flex items-center gap-2">
                              <Facebook className="h-3.5 w-3.5 text-muted-foreground" />
                              Facebook
                            </Label>
                            <Input
                              id="facebook"
                              type="url"
                              placeholder="https://facebook.com/..."
                              value={formData.facebook_url}
                              onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                              className="h-11 rounded-xl"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Specialties Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 pt-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="font-semibold text-foreground">Specialties</h3>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {SPECIALTY_OPTIONS.map(specialty => {
                          const isSelected = formData.specialties.includes(specialty);
                          return (
                            <Badge
                              key={specialty}
                              variant={isSelected ? "default" : "outline"}
                              className={`cursor-pointer transition-all px-3 py-1.5 ${
                                isSelected 
                                  ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                                  : 'hover:bg-primary/10'
                              }`}
                              onClick={() => toggleSpecialty(specialty)}
                            >
                              {specialty}
                              {isSelected && <X className="h-3 w-3 ml-1.5" />}
                            </Badge>
                          );
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground">Click to select your company's areas of expertise</p>
                    </div>

                    {/* Description Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 pt-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="font-semibold text-foreground">About Your Company</h3>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-medium">Company Description</Label>
                        <Textarea
                          id="description"
                          rows={5}
                          placeholder="Tell buyers about your company, experience, and projects..."
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="rounded-xl resize-none"
                        />
                        <p className="text-xs text-muted-foreground">This will be displayed on your public profile and project pages.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Notifications Card */}
              <motion.div variants={itemVariants}>
                <Card className="rounded-2xl border-border hover:shadow-lg hover:border-primary/30 transition-all">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Bell className="h-4 w-4 text-primary" />
                      </div>
                      Notifications
                    </CardTitle>
                    <CardDescription>
                      Manage how you receive updates
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
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
                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                      <div className="space-y-0.5">
                        <Label className="text-base font-medium">New Inquiry Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when buyers inquire about your projects
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.notify_on_inquiry}
                        onCheckedChange={(checked) => 
                          setNotificationSettings(prev => ({ ...prev, notify_on_inquiry: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                      <div className="space-y-0.5">
                        <Label className="text-base font-medium">Project Approval Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when your projects are approved
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.notify_on_approval}
                        onCheckedChange={(checked) => 
                          setNotificationSettings(prev => ({ ...prev, notify_on_approval: checked }))
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Sticky Save Button */}
              <motion.div 
                variants={itemVariants}
                className="sticky bottom-4"
              >
                <div className="flex items-center justify-end p-4 rounded-2xl bg-card/95 backdrop-blur-sm border border-border shadow-lg">
                  <Button 
                    onClick={handleSave} 
                    disabled={saving} 
                    size="lg" 
                    className="rounded-xl px-8"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
