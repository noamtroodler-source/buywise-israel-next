import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Loader2, Upload } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const cities = ['Tel Aviv', 'Jerusalem', 'Haifa', 'Ra\'anana', 'Herzliya', 'Netanya', 'Be\'er Sheva', 'Ashdod', 'Modiin', 'Petah Tikva'];
const specializations = ['Residential', 'Luxury', 'Commercial', 'New Construction', 'Rentals', 'Anglo Market', 'Investment Properties'];

export default function AgencyRegister() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    email: user?.email || '',
    phone: '',
    cities_covered: [] as string[],
    specializations: [] as string[],
  });

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

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    setIsSubmitting(true);
    try {
      const slug = generateSlug(formData.name);
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
          uses_remaining: null, // Unlimited uses
          max_uses: null,
          is_active: true,
        });

      toast.success('Agency registered successfully!');
      navigate(`/agency/${slug}`);
    } catch (error: any) {
      toast.error('Failed to register agency: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container py-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Register Your Agency</CardTitle>
              <CardDescription>
                Create your agency profile and start inviting agents to your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-medium">Agency Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Agency Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder="Your Agency Name"
                      required
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
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">Contact Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        placeholder="+972-XX-XXX-XXXX"
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
                    />
                  </div>
                </div>

                {/* Cities */}
                <div className="space-y-3">
                  <Label>Cities Covered</Label>
                  <div className="flex flex-wrap gap-2">
                    {cities.map((city) => (
                      <div key={city} className="flex items-center space-x-2">
                        <Checkbox
                          id={`city-${city}`}
                          checked={formData.cities_covered.includes(city)}
                          onCheckedChange={() => toggleArrayItem('cities_covered', city)}
                        />
                        <Label htmlFor={`city-${city}`} className="text-sm font-normal cursor-pointer">
                          {city}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Specializations */}
                <div className="space-y-3">
                  <Label>Specializations</Label>
                  <div className="flex flex-wrap gap-2">
                    {specializations.map((spec) => (
                      <div key={spec} className="flex items-center space-x-2">
                        <Checkbox
                          id={`agency-spec-${spec}`}
                          checked={formData.specializations.includes(spec)}
                          onCheckedChange={() => toggleArrayItem('specializations', spec)}
                        />
                        <Label htmlFor={`agency-spec-${spec}`} className="text-sm font-normal cursor-pointer">
                          {spec}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-primary/5 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">What you'll get:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Your own agency profile page</li>
                    <li>• Invite codes to add agents to your team</li>
                    <li>• Aggregated stats for all your listings</li>
                    <li>• Team management dashboard</li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || !formData.name || !formData.email}
                >
                  {isSubmitting && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Register Agency
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
