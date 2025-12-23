import { useState } from 'react';
import { motion } from 'framer-motion';
import { User2, Home, Building2, Plane, Edit3, CheckCircle2 } from 'lucide-react';
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
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              <User2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Complete Your Buyer Profile</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get personalized tax estimates and recommendations based on your situation.
            </p>
            <Button onClick={() => setShowOnboarding(true)}>
              Set Up Profile
            </Button>
          </CardContent>
        </Card>
        
        <BuyerOnboarding 
          open={showOnboarding} 
          onComplete={() => setShowOnboarding(false)}
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
          <CardHeader className="flex flex-row items-center justify-between pb-2">
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
            <div className="flex items-center gap-2">
              <Badge 
                variant="secondary" 
                className="bg-primary/10 text-primary border-0 font-medium"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {taxCategoryLabel}
              </Badge>
            </div>

            {/* Profile Details */}
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground flex items-center gap-2">
                  {getResidencyIcon(buyerProfile.residency_status)}
                  Residency
                </span>
                <span className="font-medium text-foreground">
                  {getResidencyLabel(buyerProfile.residency_status)}
                </span>
              </div>

              {buyerProfile.residency_status === 'oleh_hadash' && buyerProfile.aliyah_year && (
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Aliyah Year</span>
                  <span className="font-medium text-foreground">{buyerProfile.aliyah_year}</span>
                </div>
              )}

              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">First Property</span>
                <span className="font-medium text-foreground">
                  {buyerProfile.is_first_property ? 'Yes' : 'No'}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Purpose</span>
                <span className="font-medium text-foreground">
                  {getPurposeLabel(buyerProfile.purchase_purpose)}
                </span>
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
      />
    </>
  );
}
