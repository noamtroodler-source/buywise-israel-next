import { useState } from 'react';
import { User, Pencil, Loader2, Compass, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBuyerProfile, getBuyerTaxCategory, getBuyerCategoryLabel, ReadinessSnapshot } from '@/hooks/useBuyerProfile';
import { BuyerOnboarding } from '@/components/onboarding/BuyerOnboarding';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

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

  const getStageLabel = (stage: ReadinessSnapshot['stage']) => {
    switch (stage) {
      case 'curious': return 'Just curious';
      case 'learning': return 'Starting to get serious';
      case 'searching': return 'Actively searching';
      case 'ready': return 'Ready to act';
      default: return 'Unknown';
    }
  };

  const getStageEmoji = (stage: ReadinessSnapshot['stage']) => {
    switch (stage) {
      case 'curious': return '🌱';
      case 'learning': return '📚';
      case 'searching': return '🔍';
      case 'ready': return '✅';
      default: return '📍';
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Section Header - always visible */}
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Buyer Profile</h3>
              <p className="text-xs text-muted-foreground">
                {isComplete ? categoryLabel : 'Not set up yet'}
              </p>
            </div>
          </div>
          <div className="h-6 w-6 rounded-full flex items-center justify-center">
            {isComplete ? (
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="h-3.5 w-3.5 text-primary" />
              </div>
            ) : (
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Content - always visible */}
        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !profile ? (
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

              {/* Journey Status */}
              {profile.readiness_snapshot && (
                <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Compass className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Your Journey Status</span>
                  </div>
                  <p className="text-sm text-foreground">
                    {getStageEmoji(profile.readiness_snapshot.stage)} {getStageLabel(profile.readiness_snapshot.stage)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last checked: {formatDistanceToNow(new Date(profile.readiness_snapshot.completed_at), { addSuffix: true })}
                  </p>
                  {profile.readiness_snapshot.gaps_identified.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {profile.readiness_snapshot.gaps_identified.length} area{profile.readiness_snapshot.gaps_identified.length !== 1 ? 's' : ''} to explore
                    </p>
                  )}
                  <Button variant="ghost" size="sm" className="w-full mt-2 text-xs" asChild>
                    <Link to="/tools?tool=readiness">
                      Retake Readiness Check
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              )}

              {!profile.readiness_snapshot && (
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Compass className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">Not sure where you are?</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Take a quick readiness check to understand your journey stage.
                  </p>
                  <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                    <Link to="/tools?tool=readiness">
                      Take Readiness Check
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <BuyerOnboarding
        open={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
        onClose={() => setShowOnboarding(false)}
        existingProfile={profile || null}
      />
    </>
  );
}
