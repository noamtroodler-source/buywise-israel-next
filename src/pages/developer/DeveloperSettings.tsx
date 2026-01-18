import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, Upload, Building2, Save, Globe, Mail, Phone, Calendar } from 'lucide-react';
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

export default function DeveloperSettings() {
  const { data: developer, isLoading, refetch } = useDeveloperProfile();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    description: '',
    founded_year: '',
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

  return (
    <Layout>
      <div className="min-h-screen">
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
                        <Button variant="outline" size="sm" className="rounded-xl">
                          <Upload className="h-4 w-4 mr-2" />
                          Change Logo
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
