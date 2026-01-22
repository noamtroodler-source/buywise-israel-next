import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useUserRole } from '@/hooks/useUserRole';
import { ProfileWelcomeHeader } from '@/components/profile/ProfileWelcomeHeader';
import { BuyerProfileSection } from '@/components/profile/sections/BuyerProfileSection';
import { MortgageSection } from '@/components/profile/sections/MortgageSection';
import { LocationsSection } from '@/components/profile/sections/LocationsSection';
import { AccountSection } from '@/components/profile/sections/AccountSection';
import { AlertsCompact } from '@/components/profile/AlertsCompact';
import { SavedPropertiesPreview } from '@/components/profile/SavedPropertiesPreview';
import { SavedCalculationsCompact } from '@/components/profile/SavedCalculationsCompact';
import { RecentlyViewedRow } from '@/components/profile/RecentlyViewedRow';

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { isAgent, isAdmin } = useUserRole();

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
      <div className="container py-6 max-w-6xl">
        {/* Welcome Header with Completion Ring */}
        <ProfileWelcomeHeader
          fullName={profile?.full_name || null}
          email={user?.email}
          isAgent={isAgent}
          isAdmin={isAdmin}
          onSignOut={handleSignOut}
        />

        {/* Two-Column Layout */}
        <div className="grid lg:grid-cols-[1fr,380px] gap-6 mt-6">
          {/* Left Column - Profile Setup */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Profile Setup</h2>
            <BuyerProfileSection />
            <MortgageSection />
            <LocationsSection />
            <AccountSection />
          </div>

          {/* Right Column - Activity & Saved */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Activity</h2>
            <AlertsCompact />
            <SavedPropertiesPreview />
            <SavedCalculationsCompact />
            <RecentlyViewedRow />
          </div>
        </div>
      </div>
    </Layout>
  );
}
