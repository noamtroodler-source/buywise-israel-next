import { useState } from 'react';
import { motion } from 'framer-motion';
import { User2, Home, Building2, Plane, Edit3, CheckCircle2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBuyerProfile, getBuyerTaxCategory, getBuyerCategoryLabel } from '@/hooks/useBuyerProfile';
import { BuyerOnboarding } from '@/components/onboarding/BuyerOnboarding';

export function BuyerProfileCard() {
  const { data: buyerProfile, isLoading } = useBuyerProfile();
  const [showOnboarding, setShowOnboarding] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const taxCategory = getBuyerTaxCategory(buyerProfile);
  const taxCategoryLabel = getBuyerCategoryLabel(taxCategory);

  // Check if user has active tax benefits (Oleh within 7 years)
  const currentYear = new Date().getFullYear();
  const isOlehWithBenefit = buyerProfile?.residency_status === 'oleh_hadash' && 
    buyerProfile?.aliyah_year && 
    (currentYear - buyerProfile.aliyah_year) <= 7;

  const getResidencyLabel = (status: string) => {
    switch (status) {
      case 'israeli_resident': return 'Israeli Resident';
      case 'oleh_hadash': return 'Oleh Hadash';
      case 'non_resident': return 'Non-Resident';
      default: return status;
    }
  };

  const getPurposeLabel = (purpose: string) => {
    switch (purpose) {
      case 'primary_residence': return 'Primary Residence';
      case 'vacation_home': return 'Vacation Home';
      case 'investment': return 'Investment';
      case 'undecided': return 'Undecided';
      default: return purpose;
    }
  };

  const getResidencyIcon = (status: string) => {
    switch (status) {
      case 'oleh_hadash': return <Plane className="h-4 w-4" />;
      case 'non_resident': return <Building2 className="h-4 w-4" />;
      default: return <Home className="h-4 w-4" />;
    }
  };

  if (!buyerProfile) {
    return (
      <>
        <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
            </div>
            <h3 className="font-semibold text-foreground mb-2">Let's Personalize Your Experience</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Get accurate tax estimates and recommendations tailored to your situation.
            </p>
            <Button onClick={() => setShowOnboarding(true)} className="w-full">
              Set Up Buyer Profile
            </Button>
            <p className="text-xs text-muted-foreground mt-3">Takes less than 2 minutes</p>
          </CardContent>
        </Card>
        
        <BuyerOnboarding 
          open={showOnboarding} 
          onComplete={() => setShowOnboarding(false)}
          onClose={() => setShowOnboarding(false)}
          existingProfile={null}
        />
      </>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-medium">Buyer Profile</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowOnboarding(true)}
              className="h-8"
            >
              <Edit3 className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tax Category Badge */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge 
                variant="secondary" 
                className="bg-primary/10 text-primary border-0 font-medium"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {taxCategoryLabel}
              </Badge>
              {isOlehWithBenefit && (
                <Badge className="bg-primary text-primary-foreground border-0 font-medium">
                  Tax Benefit Active
                </Badge>
              )}
            </div>

            {/* Profile Details - 2 Column Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/40">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  {getResidencyIcon(buyerProfile.residency_status)}
                  <span className="text-xs">Residency</span>
                </div>
                <p className="font-medium text-sm text-foreground">
                  {getResidencyLabel(buyerProfile.residency_status)}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-muted/40">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <Home className="h-4 w-4" />
                  <span className="text-xs">First Property</span>
                </div>
                <p className="font-medium text-sm text-foreground">
                  {buyerProfile.is_first_property ? 'Yes' : 'No'}
                </p>
              </div>

              {buyerProfile.residency_status === 'oleh_hadash' && buyerProfile.aliyah_year && (
                <div className="p-3 rounded-lg bg-muted/40">
                  <p className="text-xs text-muted-foreground mb-1">Aliyah Year</p>
                  <p className="font-medium text-sm text-foreground">{buyerProfile.aliyah_year}</p>
                </div>
              )}

              <div className="p-3 rounded-lg bg-muted/40">
                <p className="text-xs text-muted-foreground mb-1">Purpose</p>
                <p className="font-medium text-sm text-foreground">
                  {getPurposeLabel(buyerProfile.purchase_purpose)}
                </p>
              </div>
            </div>

            {/* Tax Info Note */}
            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
              Your tax category affects purchase tax (מס רכישה) calculations shown on property pages.
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <BuyerOnboarding 
        open={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
        onClose={() => setShowOnboarding(false)}
        existingProfile={buyerProfile}
      />
    </>
  );
}
