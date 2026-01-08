import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Calendar, MessageCircle, Heart, Bell, Calculator, ArrowRight, Edit3, LogOut, Shield, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2 } from 'lucide-react';
import { ProfileStatsGrid } from '@/components/profile/ProfileStatsGrid';
import { BuyerProfileCard } from '@/components/profile/BuyerProfileCard';
import { ProfileSearchAlerts } from '@/components/profile/ProfileSearchAlerts';
import { SavedCalculatorResults } from '@/components/profile/SavedCalculatorResults';

interface QuickActionItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

function QuickActionItem({ icon, title, description, onClick }: QuickActionItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200 text-left group"
    >
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </button>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { isAgent, isAdmin } = useUserRole();
  const updateProfile = useUpdateProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
  });

  const handleEdit = () => {
    setFormData({
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateProfile.mutate(formData, {
      onSuccess: () => setIsEditing(false),
    });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Extract first name for personalized greeting
  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  if (profileLoading) {
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
      {/* Gradient Hero Header */}
      <div className="bg-gradient-to-b from-muted/60 via-background to-background border-b border-border/50">
        <div className="container py-8 md:py-12 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Welcome back, {firstName}
              </h1>
              <p className="text-muted-foreground mt-1">
                Your personalized dashboard for buying in Israel.
              </p>
            </div>
            <Button variant="outline" onClick={handleSignOut} className="self-start sm:self-center">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </motion.div>
        </div>
      </div>

      <div className="container py-8 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-8"
        >
          {/* Agent/Admin Dashboard Banner */}
          {(isAgent || isAdmin) && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  {isAdmin ? (
                    <Shield className="h-5 w-5 text-primary" />
                  ) : (
                    <Briefcase className="h-5 w-5 text-primary" />
                  )}
                  <div>
                    <p className="font-medium text-foreground">
                      You're logged in as {isAdmin ? 'an Admin' : 'an Agent'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isAdmin ? 'Manage the platform and users' : 'Access your listings and inquiries'}
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => navigate(isAdmin ? '/admin' : '/agent')}
                  className="self-start sm:self-center"
                >
                  {isAdmin ? 'Admin Dashboard' : 'Agent Dashboard'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Stats Grid */}
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">Activity Summary</h2>
            <ProfileStatsGrid />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Profile Info & Other Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Info Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-lg">Profile Information</CardTitle>
                  {!isEditing && (
                    <Button variant="ghost" size="sm" onClick={handleEdit} className="h-8">
                      <Edit3 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="full_name">Full Name</Label>
                          <Input
                            id="full_name"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">WhatsApp Number</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button onClick={handleSave} disabled={updateProfile.isPending}>
                          {updateProfile.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Save Changes
                        </Button>
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                        <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Full Name</p>
                          <p className="font-medium text-foreground truncate">{profile?.full_name || 'Not set'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                        <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="font-medium text-foreground truncate">{user?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                        <MessageCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">WhatsApp</p>
                          <p className="font-medium text-foreground truncate">{profile?.phone || 'Not set'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                        <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Member Since</p>
                          <p className="font-medium text-foreground">
                            {profile?.created_at
                              ? new Date(profile.created_at).toLocaleDateString()
                              : 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Search Alerts */}
              <div id="search-alerts-section">
                <ProfileSearchAlerts />
              </div>

              {/* Saved Calculator Results */}
              <div id="saved-calculator-results">
                <SavedCalculatorResults />
              </div>
            </div>

            {/* Right Column - Buyer Profile & Quick Actions */}
            <div className="space-y-6">
              {/* Buyer Profile Card */}
              <BuyerProfileCard />

              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <QuickActionItem
                    icon={<Heart className="h-4 w-4" />}
                    title="View Saved Properties"
                    description="See your favorited listings"
                    onClick={() => navigate('/favorites')}
                  />
                  <QuickActionItem
                    icon={<Bell className="h-4 w-4" />}
                    title="Manage Search Alerts"
                    description="Control your notifications"
                    onClick={() => {
                      const element = document.getElementById('search-alerts-section');
                      element?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  />
                  <QuickActionItem
                    icon={<Calculator className="h-4 w-4" />}
                    title="Saved Calculations"
                    description="Review your estimates"
                    onClick={() => {
                      const element = document.getElementById('saved-calculator-results');
                      element?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
