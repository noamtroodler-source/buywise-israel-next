import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Receipt, Calendar, TrendingDown, Check, Calculator, Wallet, BookOpen, RotateCcw, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useSaveCalculatorResult } from '@/hooks/useSavedCalculatorResults';
import { 
  calculatePurchaseTax, 
  compareTaxByBuyerType,
  getOlehBenefitRemaining,
  calculateUpgraderTimeline,
  type BuyerType,
  getBuyerTypeLabel,
} from '@/lib/calculations/purchaseTax';
import { useFormatPrice, useCurrencySymbol } from '@/contexts/PreferencesContext';
import { useBuyerProfile, getBuyerTaxCategory } from '@/hooks/useBuyerProfile';
import { ToolLayout } from './shared/ToolLayout';
import { BuyerTypeInfoBanner, type BuyerCategory } from './shared/BuyerTypeInfoBanner';
import { ToolDisclaimer } from './shared/ToolDisclaimer';
import { InsightCard } from './shared/InsightCard';
import { SourceAttribution } from './shared/SourceAttribution';
import { ToolFeedback } from './shared/ToolFeedback';

const STORAGE_KEY = 'purchase-tax-calculator-inputs';

const DEFAULTS = {
  propertyPrice: 2500000,
  buyerType: 'first_time' as BuyerType,
  aliyahYear: undefined as number | undefined,
  purchaseDate: new Date(),
};

export function PurchaseTaxCalculator() {
  const { user } = useAuth();
  const formatCurrency = useFormatPrice();
  const currencySymbol = useCurrencySymbol();
  const { data: buyerProfile } = useBuyerProfile();
  const saveResult = useSaveCalculatorResult();
  
  const [propertyPrice, setPropertyPrice] = useState(DEFAULTS.propertyPrice);
  const [buyerType, setBuyerType] = useState<BuyerType>(DEFAULTS.buyerType);
  const [aliyahYear, setAliyahYear] = useState<number | undefined>(DEFAULTS.aliyahYear);
  const [purchaseDate, setPurchaseDate] = useState<Date>(DEFAULTS.purchaseDate);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.propertyPrice) setPropertyPrice(parsed.propertyPrice);
        if (parsed.buyerType) setBuyerType(parsed.buyerType);
        if (parsed.aliyahYear) setAliyahYear(parsed.aliyahYear);
        if (parsed.purchaseDate) setPurchaseDate(new Date(parsed.purchaseDate));
      } catch (e) {
        console.error('Failed to parse saved inputs', e);
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      propertyPrice,
      buyerType,
      aliyahYear,
      purchaseDate: purchaseDate.toISOString(),
    }));
  }, [propertyPrice, buyerType, aliyahYear, purchaseDate]);

  // Set buyer type from profile on load
  useEffect(() => {
    if (buyerProfile) {
      const profileType = getBuyerTaxCategory(buyerProfile);
      const mapping: Record<string, BuyerType> = {
        'first_time': 'first_time',
        'oleh': 'oleh',
        'additional': 'investor',
        'non_resident': 'foreign',
      };
      setBuyerType(mapping[profileType] || 'first_time');
    }
  }, [buyerProfile]);

  const taxResult = useMemo(() => {
    return calculatePurchaseTax(propertyPrice, buyerType, buyerType === 'oleh', aliyahYear);
  }, [propertyPrice, buyerType, aliyahYear]);

  const allBuyerTypeTaxes = useMemo(() => {
    return compareTaxByBuyerType(propertyPrice);
  }, [propertyPrice]);

  const olehBenefitInfo = useMemo(() => {
    if (buyerType === 'oleh' && aliyahYear) {
      return getOlehBenefitRemaining(aliyahYear);
    }
    return null;
  }, [buyerType, aliyahYear]);

  const upgraderTimeline = useMemo(() => {
    if (buyerType === 'upgrader') {
      return calculateUpgraderTimeline(purchaseDate);
    }
    return null;
  }, [buyerType, purchaseDate]);

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Visual bracket breakdown
  const bracketVisualization = useMemo(() => {
    return taxResult.breakdown.map((item, index) => {
      const percentage = (item.taxableAmount / propertyPrice) * 100;
      return {
        ...item,
        percentage,
        color: index === 0 ? 'bg-primary/30' : 
               index === 1 ? 'bg-primary/50' : 
               index === 2 ? 'bg-primary/70' : 
               index === 3 ? 'bg-primary/85' : 'bg-primary'
      };
    });
  }, [taxResult, propertyPrice]);

  // Generate insights
  const insights = useMemo(() => {
    const items: string[] = [];
    
    if (buyerType === 'first_time' && taxResult.savings?.vsInvestor) {
      items.push(`As a first-time buyer, you save ${formatCurrency(taxResult.savings.vsInvestor)} compared to investor rates.`);
    }
    
    if (buyerType === 'oleh' && olehBenefitInfo?.eligible) {
      items.push(`Your Oleh benefits are valid for ${olehBenefitInfo.yearsRemaining} more years — consider timing your purchase to maximize savings.`);
    }
    
    if (buyerType === 'upgrader' && upgraderTimeline?.isEligible) {
      items.push(`You have ${upgraderTimeline.daysRemaining} days to sell your existing property to qualify for reduced rates.`);
    }
    
    if (taxResult.effectiveRate > 6) {
      items.push(`Your effective rate of ${formatPercent(taxResult.effectiveRate)} is high — explore if you qualify for any exemptions.`);
    } else if (taxResult.effectiveRate < 2) {
      items.push(`Your effective tax rate of ${formatPercent(taxResult.effectiveRate)} is quite favorable compared to investors.`);
    }

    return items;
  }, [buyerType, taxResult, olehBenefitInfo, upgraderTimeline, formatCurrency]);

  // Map BuyerCategory to BuyerType
  const handleBuyerTypeChange = (category: BuyerCategory) => {
    const mapping: Partial<Record<BuyerCategory, BuyerType>> = {
      'first_time': 'first_time',
      'oleh': 'oleh',
      'upgrader': 'upgrader',
      'investor': 'investor',
      'foreign': 'foreign',
      'company': 'company',
      'additional': 'investor',
      'non_resident': 'foreign',
    };
    setBuyerType(mapping[category] || 'first_time');
  };

  // Reset handler
  const handleReset = () => {
    setPropertyPrice(DEFAULTS.propertyPrice);
    setBuyerType(DEFAULTS.buyerType);
    setAliyahYear(DEFAULTS.aliyahYear);
    setPurchaseDate(DEFAULTS.purchaseDate);
    localStorage.removeItem(STORAGE_KEY);
    toast.success('Calculator reset');
  };

  // Save handler
  const handleSave = async () => {
    if (!user) {
      toast.info('Sign in to save your calculations');
      return;
    }
    saveResult.mutate({
      calculatorType: 'purchase_tax',
      inputs: {
        propertyPrice,
        buyerType,
        aliyahYear,
        purchaseDate: purchaseDate.toISOString(),
      },
      results: {
        tax_amount: taxResult.totalTax,
        effective_rate: taxResult.effectiveRate,
        savings_vs_investor: taxResult.savings?.vsInvestor || 0,
      },
    });
  };

  // Header actions
  const headerActions = (
    <>
      <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2">
        <RotateCcw className="h-4 w-4" />
        <span className="hidden sm:inline">Reset</span>
      </Button>
      <Button variant="ghost" size="sm" onClick={handleSave} disabled={saveResult.isPending} className="gap-2">
        <Save className="h-4 w-4" />
        <span className="hidden sm:inline">Save</span>
      </Button>
    </>
  );

  const leftColumn = (
    <div className="space-y-6">
      {/* Property Price */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Property Price</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {currencySymbol}
          </span>
          <Input
            type="number"
            value={propertyPrice}
            onChange={(e) => setPropertyPrice(Number(e.target.value))}
            min={0}
            className="pl-8 h-11"
          />
        </div>
      </div>

      {/* Oleh-specific fields */}
      {buyerType === 'oleh' && (
        <div className="space-y-3 p-4 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <Label className="font-semibold text-blue-800">Oleh Benefits</Label>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Year of Aliyah</Label>
            <Input
              type="number"
              value={aliyahYear || ''}
              onChange={(e) => setAliyahYear(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="e.g., 2020"
              min={2000}
              max={new Date().getFullYear()}
              className="h-11"
            />
          </div>
          {olehBenefitInfo && (
            <div className="text-sm">
              {olehBenefitInfo.eligible ? (
                <Badge variant="secondary" className="text-primary bg-primary/10">
                  <Check className="h-3 w-3 mr-1" />
                  Eligible: {olehBenefitInfo.yearsRemaining} years remaining (until {olehBenefitInfo.expiryYear})
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-muted-foreground bg-muted">
                  7-year benefit period expired
                </Badge>
              )}
            </div>
          )}
          <p className="text-xs text-blue-700">
            Olim get 0% up to ₪1.98M, then only 0.5% up to ₪6M (vs 3.5-5% for regular buyers)
          </p>
        </div>
      )}

      {/* Upgrader-specific fields */}
      {buyerType === 'upgrader' && (
        <div className="space-y-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-amber-600" />
            <Label className="font-semibold text-amber-800">Upgrader Timeline</Label>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">New Property Purchase Date</Label>
            <Input
              type="date"
              value={purchaseDate.toISOString().split('T')[0]}
              onChange={(e) => setPurchaseDate(new Date(e.target.value))}
              className="h-11"
            />
          </div>
          {upgraderTimeline && (
            <div className="text-sm space-y-1">
              <p>
                <strong>Deadline to sell old property:</strong>{' '}
                {upgraderTimeline.deadline.toLocaleDateString('he-IL')}
              </p>
              {upgraderTimeline.isEligible ? (
                <Badge variant="secondary" className="text-primary bg-primary/10">
                  {upgraderTimeline.daysRemaining} days remaining
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-muted-foreground bg-muted">
                  Deadline passed
                </Badge>
              )}
            </div>
          )}
          <p className="text-xs text-amber-700">
            Sell your existing property within 18 months to get first-time buyer rates
          </p>
        </div>
      )}

      {/* 2024 Brackets Reference */}
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer hover:text-foreground">View 2024 Tax Brackets</summary>
        <div className="mt-2 p-3 bg-muted/50 rounded space-y-1">
          <p><strong>First-Time Buyer:</strong></p>
          <p>0% up to ₪1,978,745 → 3.5% to ₪2,347,040 → 5% to ₪6,055,070 → 8% to ₪20,183,560 → 10%</p>
          <p className="mt-2"><strong>Oleh (7 years):</strong></p>
          <p>0% up to ₪1,978,745 → 0.5% to ₪6,055,070 → 8% to ₪20,183,560 → 10%</p>
          <p className="mt-2"><strong>Investor/Foreign/Company:</strong></p>
          <p>8% up to ₪6,055,070 → 10% above</p>
        </div>
      </details>
    </div>
  );

  const rightColumn = (
    <Card className="lg:sticky lg:top-6 lg:self-start">
      <CardContent className="p-6 space-y-4">
        {/* Main Result */}
        <div className="p-6 rounded-lg bg-primary text-primary-foreground text-center">
          <p className="text-sm opacity-90">Total Purchase Tax</p>
          <p className="text-4xl font-bold">{formatCurrency(taxResult.totalTax)}</p>
          <p className="text-sm opacity-90">
            Effective rate: {formatPercent(taxResult.effectiveRate)}
          </p>
        </div>

        {/* Savings Alert */}
        {taxResult.savings && taxResult.savings.vsInvestor > 0 && 
         buyerType !== 'investor' && buyerType !== 'foreign' && buyerType !== 'company' && (
          <Alert className="bg-green-50 border-green-200">
            <TrendingDown className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>You save {formatCurrency(taxResult.savings.vsInvestor)}</strong> compared to investor rates!
            </AlertDescription>
          </Alert>
        )}

        {/* Visual Bracket Breakdown */}
        <div className="p-4 rounded-lg border space-y-3">
          <h4 className="font-semibold">Tax Bracket Breakdown</h4>
          
          {/* Visual bar */}
          <div className="h-6 rounded-full overflow-hidden flex">
            {bracketVisualization.map((item, idx) => (
              <div
                key={idx}
                className={`${item.color} transition-all`}
                style={{ width: `${item.percentage}%` }}
                title={`${formatPercent(item.bracket.rate * 100)} on ${formatCurrency(item.taxableAmount)}`}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="space-y-2 text-sm">
            {bracketVisualization.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded ${item.color}`} />
                  <span className="text-muted-foreground">
                    {item.bracket.rate === 0 ? 'Tax-free' : formatPercent(item.bracket.rate * 100)}
                    {' '}up to {item.bracket.max ? formatCurrency(item.bracket.max) : '∞'}
                  </span>
                </div>
                <span className="font-medium">{formatCurrency(item.taxAmount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Buyer Type Comparison */}
        <div className="p-4 rounded-lg border space-y-3">
          <h4 className="font-semibold">Compare All Buyer Types</h4>
          <div className="space-y-2">
            {Object.entries(allBuyerTypeTaxes).map(([type, data]) => {
              const isSelected = type === buyerType;
              const savings = data.tax - taxResult.totalTax;
              return (
                <div 
                  key={type}
                  className={`flex items-center justify-between p-2 rounded ${isSelected ? 'bg-primary/10 border border-primary/30' : 'bg-muted/30'}`}
                >
                  <div className="flex items-center gap-2">
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                    <span className={isSelected ? 'font-medium' : 'text-muted-foreground'}>
                      {getBuyerTypeLabel(type as BuyerType)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`font-medium ${isSelected ? 'text-primary' : ''}`}>
                      {formatCurrency(data.tax)}
                    </span>
                    {!isSelected && savings !== 0 && (
                      <span className={`text-xs ml-2 ${savings > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                        {savings > 0 ? `+${formatCurrency(savings)}` : formatCurrency(savings)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const bottomSection = (
    <div className="space-y-6">
      {insights.length > 0 && <InsightCard insights={insights} />}
      
      {/* Next Steps Grid */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Link 
          to="/tools?tool=totalcost"
          className="group p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Calculator className="h-5 w-5" />
            </div>
            <p className="font-semibold">True Cost Calculator</p>
          </div>
          <p className="text-sm text-muted-foreground">
            See all purchase costs together
          </p>
        </Link>

        <Link 
          to="/tools?tool=mortgage"
          className="group p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Wallet className="h-5 w-5" />
            </div>
            <p className="font-semibold">Mortgage Calculator</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Calculate monthly payments
          </p>
        </Link>

        <Link 
          to="/guides/purchase-tax"
          className="group p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <p className="font-semibold">Purchase Tax Guide</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Buyer types, brackets, exemptions
          </p>
        </Link>
      </div>
      
      {/* Feedback */}
      <ToolFeedback toolName="purchase-tax-calculator" variant="inline" />
    </div>
  );

  return (
    <ToolLayout
      title="Purchase Tax Calculator"
      subtitle="Calculate your מס רכישה based on 2024 rates with visual bracket breakdown"
      icon={<Receipt className="h-6 w-6" />}
      headerActions={headerActions}
      infoBanner={
        <BuyerTypeInfoBanner
          selectedType={buyerType as BuyerCategory}
          onTypeChange={handleBuyerTypeChange}
          profileType={buyerProfile ? (getBuyerTaxCategory(buyerProfile) as BuyerCategory) : undefined}
          extended
        />
      }
      leftColumn={leftColumn}
      rightColumn={rightColumn}
      bottomSection={bottomSection}
      sourceAttribution={<SourceAttribution toolType="purchaseTax" />}
      disclaimer={<ToolDisclaimer />}
    />
  );
}
