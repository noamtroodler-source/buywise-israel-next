import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useAgentRegistration } from '@/hooks/useAgentRegistration';

export default function AgentRegister() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const agentRegistration = useAgentRegistration();

  // Redirect non-authenticated users to auth page with role context
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth?tab=signup&role=agent');
    }
  }, [user, loading, navigate]);

  const [formData, setFormData] = useState({
    name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: '',
    bio: '',
    license_number: '',
    agency_name: '',
    years_experience: 0,
    languages: 'Hebrew, English',
    specializations: '',
  });

  // Update name when user loads (for Google OAuth)
  useEffect(() => {
    if (user?.user_metadata?.full_name && !formData.name) {
      setFormData(prev => ({ 
        ...prev, 
        name: user.user_metadata?.full_name || prev.name 
      }));
    }
  }, [user?.user_metadata?.full_name]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    agentRegistration.mutate({
      ...formData,
      years_experience: Number(formData.years_experience),
      languages: formData.languages.split(',').map(l => l.trim()),
      specializations: formData.specializations ? formData.specializations.split(',').map(s => s.trim()) : undefined,
    }, {
      onSuccess: () => navigate('/agent'),
    });
  };

  const updateField = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
              <CardTitle className="text-2xl">Become an Agent</CardTitle>
              <CardDescription>
                Join our network of real estate professionals and start listing properties
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="agency_name">Agency Name</Label>
                    <Input
                      id="agency_name"
                      value={formData.agency_name}
                      onChange={(e) => updateField('agency_name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="years_experience">Years of Experience</Label>
                    <Input
                      id="years_experience"
                      type="number"
                      min="0"
                      value={formData.years_experience}
                      onChange={(e) => updateField('years_experience', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="languages">Languages (comma-separated)</Label>
                  <Input
                    id="languages"
                    value={formData.languages}
                    onChange={(e) => updateField('languages', e.target.value)}
                    placeholder="Hebrew, English, Russian"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specializations">Specializations (comma-separated)</Label>
                  <Input
                    id="specializations"
                    value={formData.specializations}
                    onChange={(e) => updateField('specializations', e.target.value)}
                    placeholder="Luxury homes, Commercial, New construction"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => updateField('bio', e.target.value)}
                    placeholder="Tell us about yourself and your experience..."
                    rows={4}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={agentRegistration.isPending}
                >
                  {agentRegistration.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Register as Agent
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
