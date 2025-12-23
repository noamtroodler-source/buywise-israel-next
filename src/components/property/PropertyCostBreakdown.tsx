import { useState } from 'react';
import { Calculator, DollarSign, Receipt, Calendar, Info, Settings } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useFormatPrice } from '@/contexts/PreferencesContext';
import { useBuyerProfile, getBuyerTaxCategory, calculatePurchaseTax, getBuyerCategoryLabel } from '@/hooks/useBuyerProfile';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

interface PropertyCostBreakdownProps {
  price: number;
  currency: string;
  listingStatus: string;
}

export function PropertyCostBreakdown({ price, currency, listingStatus }: PropertyCostBreakdownProps) {
  const { user } = useAuth();
  const { data: buyerProfile, isLoading } = useBuyerProfile();
  const formatPrice = useFormatPrice();
  
  // Determine buyer category from profile or use fallback
  const buyerCategory = getBuyerTaxCategory(buyerProfile);
  const hasProfile = !!buyerProfile?.onboarding_completed;
  
  // Calculate purchase tax based on profile
  const purchaseTax = listingStatus === 'for_rent' ? 0 : calculatePurchaseTax(price, buyerCategory);
  
  // Other costs
  const lawyerFees = price * 0.005; // ~0.5%
  const agentFees = price * 0.02; // ~2%
  const mortgageFees = price * 0.005; // Estimate
  const totalOneTime = purchaseTax + lawyerFees + agentFees + mortgageFees;

  // Monthly costs (estimates)
  const arnona = 350; // Average monthly arnona
  const vaad = 250; // Building maintenance
  const insurance = 150;
  const totalMonthly = arnona + vaad + insurance;

  // Profile prompt banner
  const ProfilePrompt = () => (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4">
      <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
      <div className="flex-1 space-y-1">
        <p className="text-sm text-foreground">
          {user ? (
            <>Costs shown for <span className="font-medium">{getBuyerCategoryLabel(buyerCategory)}</span> (default)</>
          ) : (
            <>Assuming <span className="font-medium">First-Time Buyer</span> rates</>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {user ? (
            'Set your buyer profile for personalized calculations'
          ) : (
            'Sign up to get personalized tax calculations'
          )}
        </p>
      </div>
      {user ? (
        <Link to="/profile">
          <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-xs">
            <Settings className="h-3.5 w-3.5" />
            Personalize
          </Button>
        </Link>
      ) : (
        <Link to="/auth?tab=signup">
          <Button variant="ghost" size="sm" className="h-8 text-xs">
            Sign Up
          </Button>
        </Link>
      )}
    </div>
  );

  if (listingStatus === 'for_rent') {
    return (
      <CollapsibleSection 
        title="Cost Breakdown" 
        icon={<Calculator className="h-5 w-5" />}
        defaultOpen={true}
      >
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Monthly Costs (Estimates)</h4>
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Rent</span>
              <span className="font-medium">{formatPrice(price, currency)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Arnona (est.)</span>
              <span className="font-medium">{formatPrice(arnona, 'ILS')}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Va'ad Bayit (est.)</span>
              <span className="font-medium">{formatPrice(vaad, 'ILS')}</span>
            </div>
            <div className="flex justify-between py-3 bg-muted/30 px-3 rounded-lg mt-3">
              <span className="font-semibold">Total Monthly</span>
              <span className="font-bold text-primary">{formatPrice(price + arnona + vaad, currency)}</span>
            </div>
          </div>
        </div>
      </CollapsibleSection>
    );
  }

  return (
    <CollapsibleSection 
      title="Cost Breakdown" 
      icon={<Calculator className="h-5 w-5" />}
      defaultOpen={true}
    >
      <div className="space-y-5">
        {/* Show personalization prompt if no profile set */}
        {!hasProfile && !isLoading && <ProfilePrompt />}
        
        {/* Buyer category indicator if profile exists */}
        {hasProfile && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground">
                Calculating for: <span className="font-medium">{getBuyerCategoryLabel(buyerCategory)}</span>
              </span>
            </div>
            <Link to="/profile">
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                Change
              </Button>
            </Link>
          </div>
        )}

        {/* One-Time Costs */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            <h4 className="font-medium text-foreground">One-Time Costs</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">
                Purchase Tax (Mas Rechisha)
                {buyerCategory === 'oleh' && <span className="ml-1 text-xs text-green-600">(Oleh rate)</span>}
              </span>
              <span className="font-medium">{formatPrice(purchaseTax, 'ILS')}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Lawyer Fees (~0.5%)</span>
              <span className="font-medium">{formatPrice(lawyerFees, 'ILS')}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Agent Fees (~2%)</span>
              <span className="font-medium">{formatPrice(agentFees, 'ILS')}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Mortgage Fees (est.)</span>
              <span className="font-medium">{formatPrice(mortgageFees, 'ILS')}</span>
            </div>
            <div className="flex justify-between py-3 bg-muted/30 px-3 rounded-lg mt-2">
              <span className="font-semibold">Total One-Time</span>
              <span className="font-bold text-primary">{formatPrice(totalOneTime, 'ILS')}</span>
            </div>
          </div>
        </div>

        {/* Monthly Costs */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <h4 className="font-medium text-foreground">Estimated Monthly</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Arnona (est.)</span>
              <span className="font-medium">{formatPrice(arnona, 'ILS')}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Va'ad Bayit (est.)</span>
              <span className="font-medium">{formatPrice(vaad, 'ILS')}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Home Insurance (est.)</span>
              <span className="font-medium">{formatPrice(insurance, 'ILS')}</span>
            </div>
            <div className="flex justify-between py-3 bg-muted/30 px-3 rounded-lg mt-2">
              <span className="font-semibold">Total Monthly</span>
              <span className="font-bold text-primary">{formatPrice(totalMonthly, 'ILS')}</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          * Estimates based on 2025 tax brackets. Actual costs may vary.
        </p>
      </div>
    </CollapsibleSection>
  );
}
