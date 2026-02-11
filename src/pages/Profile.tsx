import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useUserRole } from '@/hooks/useUserRole';
import { useMyAgency } from '@/hooks/useAgencyManagement';
import { useDeveloperProfile } from '@/hooks/useDeveloperProfile';
import { ProfileWelcomeHeader } from '@/components/profile/ProfileWelcomeHeader';
import { BuyerProfileSection } from '@/components/profile/sections/BuyerProfileSection';
import { MortgageSection } from '@/components/profile/sections/MortgageSection';
import { LocationsSection } from '@/components/profile/sections/LocationsSection';
import { AccountSection } from '@/components/profile/sections/AccountSection';
import { AlertsCompact } from '@/components/profile/AlertsCompact';
import { SavedPropertiesPreview } from '@/components/profile/SavedPropertiesPreview';
import { SavedCalculationsCompact } from '@/components/profile/SavedCalculationsCompact';
import { RecentlyViewedRow } from '@/components/profile/RecentlyViewedRow';
import { SupportFooter } from '@/components/shared/SupportFooter';
import { ResearchJourneyCard } from '@/components/profile/ResearchJourneyCard';
import { ProfileQuickStats } from '@/components/profile/ProfileQuickStats';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { isAgent, isAdmin } = useUserRole();
  const { data: myAgency } = useMyAgency();
  const { data: developerProfile } = useDeveloperProfile();

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
      <div className="container py-4 md:py-6 max-w-4xl">
        {/* Compact Welcome Header */}
        <ProfileWelcomeHeader
          fullName={profile?.full_name || null}
          email={user?.email}
          isAgent={isAgent}
          isAdmin={isAdmin}
          isAgencyAdmin={!!myAgency}
          agencyName={myAgency?.name}
          isDeveloper={!!developerProfile}
          developerName={developerProfile?.name}
          onSignOut={handleSignOut}
        />

        {/* Tab Navigation */}
        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="w-full h-11 bg-muted/60 rounded-xl p-1 grid grid-cols-3">
            <TabsTrigger
              value="overview"
              className="rounded-lg text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="rounded-lg text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              My Profile
            </TabsTrigger>
            <TabsTrigger
              value="saved"
              className="rounded-lg text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Saved & Alerts
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            <ProfileQuickStats />
            <ResearchJourneyCard />
            <RecentlyViewedRow />
            <SupportFooter
              message="Questions about your account? [We're here to help]."
              linkText="We're here to help"
              variant="subtle"
            />
          </TabsContent>

          {/* My Profile Tab */}
          <TabsContent value="profile" className="mt-6 space-y-6">
            <BuyerProfileSection />
            <MortgageSection />
            <LocationsSection />
            <AccountSection />
          </TabsContent>

          {/* Saved & Alerts Tab */}
          <TabsContent value="saved" className="mt-6 space-y-6">
            <AlertsCompact />
            <SavedPropertiesPreview />
            <SavedCalculationsCompact />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
