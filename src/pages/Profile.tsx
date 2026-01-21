import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useUserRole } from '@/hooks/useUserRole';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileTabOverview } from '@/components/profile/ProfileTabOverview';
import { ProfileTabSettings } from '@/components/profile/ProfileTabSettings';
import { ProfileTabAlerts } from '@/components/profile/ProfileTabAlerts';
import { ProfileTabSaved } from '@/components/profile/ProfileTabSaved';

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { isAgent, isAdmin } = useUserRole();
  const [activeTab, setActiveTab] = useState('overview');

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
      <div className="container py-6 max-w-3xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Compact Header */}
          <ProfileHeader
            fullName={profile?.full_name || null}
            email={user?.email}
            isAgent={isAgent}
            isAdmin={isAdmin}
            onSignOut={handleSignOut}
            onTabChange={setActiveTab}
          />

          {/* Tab Navigation */}
          <TabsList className="grid w-full grid-cols-4 h-10">
            <TabsTrigger value="overview" className="text-sm">Overview</TabsTrigger>
            <TabsTrigger value="settings" className="text-sm">Settings</TabsTrigger>
            <TabsTrigger value="alerts" className="text-sm">Alerts</TabsTrigger>
            <TabsTrigger value="saved" className="text-sm">Saved</TabsTrigger>
          </TabsList>

          {/* Tab Contents */}
          <TabsContent value="overview" className="mt-6">
            <ProfileTabOverview onTabChange={setActiveTab} />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <ProfileTabSettings />
          </TabsContent>

          <TabsContent value="alerts" className="mt-6">
            <ProfileTabAlerts />
          </TabsContent>

          <TabsContent value="saved" className="mt-6">
            <ProfileTabSaved />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
