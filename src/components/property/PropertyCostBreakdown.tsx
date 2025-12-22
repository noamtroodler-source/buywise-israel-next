import { useState } from 'react';
import { Calculator, DollarSign, Receipt, Calendar } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFormatPrice } from '@/contexts/PreferencesContext';

interface PropertyCostBreakdownProps {
  price: number;
  currency: string;
  listingStatus: string;
}

export function PropertyCostBreakdown({ price, currency, listingStatus }: PropertyCostBreakdownProps) {
  const [buyerType, setBuyerType] = useState<'first' | 'second'>('first');
  const formatPrice = useFormatPrice();

  // Calculate costs based on buyer type (Israel tax brackets simplified)
  const calculatePurchaseTax = () => {
    if (listingStatus === 'for_rent') return 0;
    
    if (buyerType === 'first') {
      // First-time buyer exemptions
      if (price <= 1978745) return 0;
      if (price <= 2347040) return (price - 1978745) * 0.035;
      if (price <= 6055070) return (2347040 - 1978745) * 0.035 + (price - 2347040) * 0.05;
      return (2347040 - 1978745) * 0.035 + (6055070 - 2347040) * 0.05 + (price - 6055070) * 0.08;
    } else {
      // Additional property buyer
      if (price <= 6055070) return price * 0.08;
      return 6055070 * 0.08 + (price - 6055070) * 0.10;
    }
  };

  const purchaseTax = calculatePurchaseTax();
  const lawyerFees = price * 0.005; // ~0.5%
  const agentFees = price * 0.02; // ~2%
  const mortgageFees = price * 0.005; // Estimate
  const totalOneTime = purchaseTax + lawyerFees + agentFees + mortgageFees;

  // Monthly costs (estimates)
  const arnona = 350; // Average monthly arnona
  const vaad = 250; // Building maintenance
  const insurance = 150;
  const totalMonthly = arnona + vaad + insurance;

  if (listingStatus === 'for_rent') {
    return (
      <CollapsibleSection 
        title="Cost Breakdown" 
        icon={<Calculator className="h-5 w-5" />}
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
    >
      <div className="space-y-5">
        {/* Buyer Type Selector */}
        <Tabs value={buyerType} onValueChange={(v) => setBuyerType(v as 'first' | 'second')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="first">First-Time Buyer</TabsTrigger>
            <TabsTrigger value="second">Additional Property</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* One-Time Costs */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            <h4 className="font-medium text-foreground">One-Time Costs</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Purchase Tax (Mas Rechisha)</span>
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
          * These are estimates only. Actual costs may vary based on specific circumstances.
        </p>
      </div>
    </CollapsibleSection>
  );
}
