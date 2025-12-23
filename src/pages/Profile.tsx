import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Calendar, Settings, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2 } from 'lucide-react';
import { ProfileStatsGrid } from '@/components/profile/ProfileStatsGrid';
import { BuyerProfileCard } from '@/components/profile/BuyerProfileCard';
import { ProfileSearchAlerts } from '@/components/profile/ProfileSearchAlerts';
import { BuyerCostSummary } from '@/components/profile/BuyerCostSummary';

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
      <div className="container py-8 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>

          {/* Stats Grid */}
          <ProfileStatsGrid />

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Profile Info & Buyer Profile */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Info Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Profile Information</CardTitle>
                  {!isEditing && (
                    <Button variant="outline" size="sm" onClick={handleEdit}>
                      <Settings className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
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
                      <div className="flex gap-2">
                        <Button onClick={handleSave} disabled={updateProfile.isPending}>
                          {updateProfile.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Save Changes
                        </Button>
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Full Name</p>
                          <p className="font-medium">{profile?.full_name || 'Not set'}</p>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{user?.email}</p>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-center gap-3">
                        <MessageCircle className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">WhatsApp Number</p>
                          <p className="font-medium">{profile?.phone || 'Not set'}</p>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Member Since</p>
                          <p className="font-medium">
                            {profile?.created_at
                              ? new Date(profile.created_at).toLocaleDateString()
                              : 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Search Alerts */}
              <ProfileSearchAlerts />
            </div>

            {/* Right Column - Buyer Profile & Quick Actions */}
            <div className="space-y-6">
              {/* Buyer Profile Card */}
              <BuyerProfileCard />

              {/* Buyer Cost Summary */}
              <BuyerCostSummary />

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isAgent && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => navigate('/agent')}
                    >
                      Go to Agent Dashboard
                    </Button>
                  )}

                  {isAdmin && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => navigate('/admin')}
                    >
                      Admin Dashboard
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate('/favorites')}
                  >
                    View Saved Properties
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate('/tools')}
                  >
                    Buyer Tools & Calculators
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
