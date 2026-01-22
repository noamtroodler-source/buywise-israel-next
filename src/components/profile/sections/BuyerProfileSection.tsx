import { useState } from 'react';
import { User, Pencil, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProfileSection } from '../ProfileSection';
import { useBuyerProfile, getBuyerTaxCategory, getBuyerCategoryLabel } from '@/hooks/useBuyerProfile';
import { BuyerOnboarding } from '@/components/onboarding/BuyerOnboarding';

export function BuyerProfileSection() {
  const { data: profile, isLoading } = useBuyerProfile();
  const [showOnboarding, setShowOnboarding] = useState(false);

  const isComplete = profile?.onboarding_completed ?? false;
  const taxCategory = getBuyerTaxCategory(profile);
  const categoryLabel = getBuyerCategoryLabel(taxCategory);

  const getResidencyLabel = (status: string | undefined) => {
    switch (status) {
      case 'israeli_resident': return 'Israeli Resident (7+ years)';
      case 'oleh_hadash': return 'Oleh Hadash';
      case 'non_resident': return 'Non-Resident / Foreign';
      default: return 'Not set';
    }
  };

  if (isLoading) {
    return (
      <ProfileSection
        title="Buyer Profile"
        icon={<User className="h-5 w-5" />}
        status="neutral"
        defaultOpen={false}
      >
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </ProfileSection>
    );
  }

  return (
    <>
      <ProfileSection
        title="Buyer Profile"
        icon={<User className="h-5 w-5" />}
        status={isComplete ? 'complete' : 'incomplete'}
        statusText={isComplete ? categoryLabel : 'Not set up yet'}
        defaultOpen={!isComplete}
      >
        {!profile ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Set up your buyer profile to get personalized tax calculations and property recommendations.
            </p>
            <Button onClick={() => setShowOnboarding(true)}>
              Set Up Buyer Profile
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Tax Category</p>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {categoryLabel}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Residency</p>
                <p className="text-sm font-medium">{getResidencyLabel(profile.residency_status)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">First Property</p>
                <p className="text-sm font-medium">{profile.is_first_property ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Purchase Purpose</p>
                <p className="text-sm font-medium capitalize">{profile.purchase_purpose || 'Living'}</p>
              </div>
              {profile.residency_status === 'oleh_hadash' && profile.aliyah_year && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Aliyah Year</p>
                  <p className="text-sm font-medium">{profile.aliyah_year}</p>
                </div>
              )}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowOnboarding(true)}
              className="w-full"
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit Profile
            </Button>
          </div>
        )}
      </ProfileSection>

      <BuyerOnboarding
        open={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
        onClose={() => setShowOnboarding(false)}
        existingProfile={profile || null}
      />
    </>
  );
}
