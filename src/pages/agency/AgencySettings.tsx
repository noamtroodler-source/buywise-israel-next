import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Save, Upload, Building2, Trash2, X } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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

export default function AgencySettings() {
  const navigate = useNavigate();
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
    is_accepting_agents: true,
  });

  const [cities, setCities] = useState<string[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [newCity, setNewCity] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (agency) {
      setFormData({
        name: agency.name || '',
        description: agency.description || '',
        email: agency.email || '',
        phone: agency.phone || '',
        website: agency.website || '',
        is_accepting_agents: agency.is_accepting_agents ?? true,
      });
      setCities(agency.cities_covered || []);
      setSpecializations(agency.specializations || []);
      setLogoUrl(agency.logo_url);
    }
  }, [agency]);

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

  if (!agency) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">No Agency Found</h1>
          <p className="text-muted-foreground mb-6">
            You need to register an agency first.
          </p>
          <Button onClick={() => navigate('/agency/register')}>
            Register Agency
          </Button>
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
          <Button variant="ghost" onClick={() => navigate('/agency')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Agency Settings</CardTitle>
              <CardDescription>
                Update your agency profile and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Logo */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className={cn(
                      "h-24 w-24 rounded-lg bg-muted flex items-center justify-center overflow-hidden",
                      "border-2 border-dashed border-border"
                    )}>
                      {logoUrl ? (
                        <img 
                          src={logoUrl} 
                          alt="Agency logo" 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Building2 className="h-10 w-10 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Agency Logo</Label>
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

                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Basic Information
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Agency Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      required
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
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                      />
                    </div>
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => updateField('website', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <Separator />

                {/* Cities Covered */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Service Areas
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                        placeholder="Add a city..."
                        list="city-suggestions"
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
                      <Button type="button" variant="secondary" onClick={addCity}>
                        Add
                      </Button>
                    </div>
                    
                    {cities.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {cities.map((city) => (
                          <Badge 
                            key={city} 
                            variant="secondary"
                            className="pl-3 pr-1 py-1.5 gap-1"
                          >
                            {city}
                            <button
                              type="button"
                              onClick={() => removeCity(city)}
                              className="ml-1 rounded-full hover:bg-muted p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Specializations */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Specializations
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {allSpecializations.map((spec) => (
                      <label
                        key={spec.id}
                        className={cn(
                          "flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-colors text-sm text-center",
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
                </div>

                <Separator />

                {/* Agent Recruitment */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Agent Recruitment
                  </h3>
                  
                  <div className="flex items-center justify-between">
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
                </div>

                <Separator />

                {/* Invite Codes Management */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Invite Codes
                  </h3>
                  
                  {invites.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No invite codes created yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {invites.map((invite) => (
                        <div 
                          key={invite.id} 
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg",
                            invite.is_active ? "bg-muted/50" : "bg-muted/30 opacity-60"
                          )}
                        >
                          <div>
                            <p className="font-mono font-medium">
                              {invite.code}
                              {invite.code === agency.default_invite_code && (
                                <Badge variant="outline" className="ml-2 text-xs">Default</Badge>
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
                                <Button variant="ghost" size="sm" className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Deactivate Invite Code?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will prevent anyone from using this code to join your agency.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deactivateInvite.mutate(invite.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Deactivate
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Create new invite codes from the Agency Dashboard
                  </p>
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => navigate('/agency')}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateAgency.isPending}>
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
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
