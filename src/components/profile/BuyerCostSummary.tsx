import { useState, useMemo } from 'react';
import { Calculator, TrendingUp, Percent, Home, ChevronRight, Wallet, Landmark, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useBuyerProfile, getBuyerTaxCategory, calculatePurchaseTax, getBuyerCategoryLabel } from '@/hooks/useBuyerProfile';
import { calculateTotalPurchaseCosts, calculateMonthlyCosts } from '@/lib/calculations/purchaseCosts';
import { useNavigate } from 'react-router-dom';

// LTV limits by buyer type
const LTV_LIMITS: Record<string, { max: number; label: string }> = {
  'first_time': { max: 75, label: 'First-Time Buyer' },
  'oleh': { max: 75, label: 'Oleh Hadash' },
  'additional': { max: 50, label: 'Additional Property' },
  'non_resident': { max: 50, label: 'Non-Resident' },
};

export function BuyerCostSummary() {
  const navigate = useNavigate();
  const { data: buyerProfile, isLoading } = useBuyerProfile();
  const [propertyPrice, setPropertyPrice] = useState<number>(2500000);
  const [propertySizeSqm, setPropertySizeSqm] = useState<number>(100);

  const buyerCategory = useMemo(() => {
    return getBuyerTaxCategory(buyerProfile);
  }, [buyerProfile]);

  const ltvLimit = LTV_LIMITS[buyerCategory] || LTV_LIMITS['first_time'];

  const purchaseTax = useMemo(() => {
    return calculatePurchaseTax(propertyPrice, buyerCategory);
  }, [propertyPrice, buyerCategory]);

  const purchaseCosts = useMemo(() => {
    return calculateTotalPurchaseCosts(propertyPrice, {
      buyerType: buyerCategory === 'oleh' ? 'oleh' : 
                 buyerCategory === 'first_time' ? 'first_time' : 
                 buyerCategory === 'non_resident' ? 'foreign' : 'investor',
      isNewConstruction: false,
      includeAgentFee: true,
      loanAmount: propertyPrice * (ltvLimit.max / 100),
    });
  }, [propertyPrice, buyerCategory, ltvLimit.max]);

  const monthlyCosts = useMemo(() => {
    return calculateMonthlyCosts(propertySizeSqm, undefined, 0);
  }, [propertySizeSqm]);

  const maxLoanAmount = propertyPrice * (ltvLimit.max / 100);
  const requiredDownPayment = propertyPrice - maxLoanAmount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-8 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!buyerProfile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Cost Estimate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm mb-4">
            Complete your buyer profile to see personalized cost estimates.
          </p>
          <Button onClick={() => navigate('/profile')} variant="outline" size="sm">
            Complete Profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Your Cost Estimate
        </CardTitle>
        <CardDescription>
          Personalized for {getBuyerCategoryLabel(buyerCategory)}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Property Price Input */}
        <div className="space-y-2">
          <Label htmlFor="property-price">Property Price (₪)</Label>
          <Input
            id="property-price"
            type="number"
            value={propertyPrice}
            onChange={(e) => setPropertyPrice(Number(e.target.value))}
            className="text-lg font-semibold"
          />
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          {/* LTV Limit */}
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Landmark className="h-4 w-4" />
              Max Mortgage (LTV)
            </div>
            <p className="font-semibold">{ltvLimit.max}%</p>
            <p className="text-xs text-muted-foreground">
              Up to {formatCurrency(maxLoanAmount)}
            </p>
          </div>

          {/* Purchase Tax */}
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Percent className="h-4 w-4" />
              Purchase Tax
            </div>
            <p className="font-semibold text-primary">{formatCurrency(purchaseTax)}</p>
            <p className="text-xs text-muted-foreground">
              {((purchaseTax / propertyPrice) * 100).toFixed(2)}% effective rate
            </p>
          </div>
        </div>

        <Separator />

        {/* Total Costs Breakdown */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Cash Needed to Close
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Down Payment ({100 - ltvLimit.max}%)</span>
              <span className="font-medium">{formatCurrency(requiredDownPayment)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Purchase Tax</span>
              <span className="font-medium">{formatCurrency(purchaseTax)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Closing Costs (est.)</span>
              <span className="font-medium">{formatCurrency(purchaseCosts.closingCosts)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between text-base font-semibold">
              <span>Total Cash Required</span>
              <span className="text-primary">
                {formatCurrency(requiredDownPayment + purchaseCosts.totalMin)}
              </span>
            </div>
          </div>
        </div>

        {/* Special Benefits Notice */}
        {(buyerCategory === 'first_time' || buyerCategory === 'oleh') && (
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-primary">
                  {buyerCategory === 'oleh' ? 'Oleh Benefits Active' : 'First-Time Buyer Benefits'}
                </p>
                <p className="text-muted-foreground">
                  {buyerCategory === 'oleh' 
                    ? `You're saving significantly on purchase tax with Oleh rates.`
                    : `You're eligible for reduced purchase tax rates.`
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Non-resident warning */}
        {buyerCategory === 'non_resident' && (
          <div className="p-3 bg-muted border border-border rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground">Non-Resident Buyer</p>
                <p className="text-muted-foreground">
                  LTV is limited to 50% and you'll pay higher purchase tax rates.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Links to calculators */}
        <div className="space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-between text-sm h-auto py-2"
            onClick={() => navigate('/tools')}
          >
            <span className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Full Purchase Tax Calculator
            </span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-between text-sm h-auto py-2"
            onClick={() => navigate('/tools')}
          >
            <span className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Mortgage Calculator
            </span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
