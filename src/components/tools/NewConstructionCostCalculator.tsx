import { useState, useMemo, useEffect } from 'react';
import { useSavePromptTrigger } from '@/hooks/useSavePromptTrigger';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Building2, Info, Calendar, TrendingUp, 
  AlertTriangle, Receipt, Banknote
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { calculateNewConstructionLinkage, calculateTotalPurchaseCosts } from '@/lib/calculations/purchaseCosts';
import { calculatePurchaseTax, type BuyerType, getBuyerTypeLabel } from '@/lib/calculations/purchaseTax';
import { useFormatPrice, useCurrencySymbol } from '@/contexts/PreferencesContext';
import { useBuyerProfile, getBuyerTaxCategory } from '@/hooks/useBuyerProfile';
import { ToolLayout } from './shared/ToolLayout';
import { BuyerTypeInfoBanner, type BuyerCategory } from './shared/BuyerTypeInfoBanner';
import { ToolDisclaimer } from './shared/ToolDisclaimer';
import { ToolFeedback } from './shared/ToolFeedback';
import { InsightCard } from './shared/InsightCard';
import { SourceAttribution } from './shared/SourceAttribution';
import { SaveResultsPrompt } from './shared/SaveResultsPrompt';

interface PaymentSchedule {
  stage: string;
  percentage: number;
  amount: number;
  cumulativeAmount: number;
  estimatedDate: Date;
  estimatedLinkedAmount: number;
}

const DEFAULT_PAYMENT_SCHEDULE = [
  { stage: 'Contract Signing', percentage: 15, monthsFromStart: 0 },
  { stage: 'Foundation Complete', percentage: 15, monthsFromStart: 6 },
  { stage: 'Structure Complete', percentage: 20, monthsFromStart: 12 },
  { stage: 'Walls & Windows', percentage: 15, monthsFromStart: 18 },
  { stage: 'Interior Work', percentage: 15, monthsFromStart: 24 },
  { stage: 'Final Inspection', percentage: 10, monthsFromStart: 30 },
  { stage: 'Key Handover', percentage: 10, monthsFromStart: 36 },
];

export function NewConstructionCostCalculator() {
  const formatCurrency = useFormatPrice();
  const currencySymbol = useCurrencySymbol();
  const { data: buyerProfile } = useBuyerProfile();
  const { showPrompt: showSavePrompt, dismissPrompt: dismissSavePrompt, trackChange } = useSavePromptTrigger();
  
  const [contractPrice, setContractPrice] = useState(2750000);
  const [buyerType, setBuyerType] = useState<BuyerType>('first_time');
  const [olehIsFirstProperty, setOlehIsFirstProperty] = useState(true);
  const [constructionMonths, setConstructionMonths] = useState(36);
  const [annualIndexRate, setAnnualIndexRate] = useState(2.5);
  const [includeMortgage, setIncludeMortgage] = useState(true);
  const [loanAmount, setLoanAmount] = useState(contractPrice * 0.5);
  const [contractDate, setContractDate] = useState(new Date());

  // Track input changes for save prompt
  useEffect(() => {
    trackChange();
  }, [contractPrice, constructionMonths, annualIndexRate, buyerType, trackChange]);

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

  // Calculate linkage
  const indexLinkage = useMemo(() => {
    return calculateNewConstructionLinkage(contractPrice, constructionMonths, annualIndexRate / 100);
  }, [contractPrice, constructionMonths, annualIndexRate]);

  // Calculate purchase costs
  const purchaseCosts = useMemo(() => {
    return calculateTotalPurchaseCosts(contractPrice, {
      buyerType,
      isNewConstruction: true,
      loanAmount: includeMortgage ? loanAmount : 0,
    });
  }, [contractPrice, buyerType, includeMortgage, loanAmount]);

  // Calculate tax
  const taxResult = useMemo(() => {
    return calculatePurchaseTax(contractPrice, buyerType);
  }, [contractPrice, buyerType]);

  // Generate payment schedule with estimated linked amounts
  const paymentSchedule = useMemo((): PaymentSchedule[] => {
    let cumulativeAmount = 0;
    const adjustedSchedule = DEFAULT_PAYMENT_SCHEDULE.map(item => ({
      ...item,
      monthsFromStart: Math.round(item.monthsFromStart * (constructionMonths / 36))
    }));
    
    return adjustedSchedule.map((stage) => {
      const amount = contractPrice * (stage.percentage / 100);
      cumulativeAmount += amount;
      
      const estimatedDate = new Date(contractDate);
      estimatedDate.setMonth(estimatedDate.getMonth() + stage.monthsFromStart);
      
      // Calculate linkage at this stage
      const yearsElapsed = stage.monthsFromStart / 12;
      const linkageMultiplier = Math.pow(1 + annualIndexRate / 100, yearsElapsed);
      const estimatedLinkedAmount = amount * linkageMultiplier;
      
      return {
        stage: stage.stage,
        percentage: stage.percentage,
        amount,
        cumulativeAmount,
        estimatedDate,
        estimatedLinkedAmount,
      };
    });
  }, [contractPrice, constructionMonths, contractDate, annualIndexRate]);

  // Total with linkage
  const totalWithLinkage = useMemo(() => {
    return paymentSchedule.reduce((sum, stage) => sum + stage.estimatedLinkedAmount, 0);
  }, [paymentSchedule]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('he-IL', { month: 'short', year: 'numeric' });
  };

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

  // Generate insights
  const insights = useMemo(() => {
    const items: string[] = [];
    const linkagePercent = ((totalWithLinkage / contractPrice - 1) * 100);
    
    if (linkagePercent > 5) {
      items.push(`Index linkage could add ${formatCurrency(indexLinkage.linkageAmount)} (${linkagePercent.toFixed(1)}%) to your final price — consider negotiating a cap with the developer.`);
    } else if (linkagePercent < 2 && linkagePercent > 0) {
      items.push(`Low index exposure (${linkagePercent.toFixed(1)}%) — your final price should be close to the contract price.`);
    }
    
    if (constructionMonths > 36) {
      items.push(`Longer construction periods (${constructionMonths} months) increase your exposure to building index fluctuations.`);
    }
    
    if (annualIndexRate > 3) {
      items.push(`At ${annualIndexRate}% annual index rate, your costs may rise significantly — ask about fixed-price contract options.`);
    }

    return items.slice(0, 3);
  }, [totalWithLinkage, contractPrice, indexLinkage, constructionMonths, annualIndexRate, formatCurrency]);

  const leftColumn = (
    <div className="space-y-6">
      {/* Contract Price */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Contract Price</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {currencySymbol}
          </span>
          <Input
            type="number"
            value={contractPrice}
            onChange={(e) => {
              const value = Number(e.target.value);
              setContractPrice(value);
              setLoanAmount(Math.min(loanAmount, value * 0.75));
            }}
            min={0}
            className="pl-8 h-11"
          />
        </div>
      </div>

      {/* Contract Date */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Contract Date</Label>
        <Input
          type="date"
          value={contractDate.toISOString().split('T')[0]}
          onChange={(e) => setContractDate(new Date(e.target.value))}
          className="h-11"
        />
      </div>

      {/* Construction Period */}
      <div className="space-y-3">
        <div className="flex items-center gap-1">
          <Label className="text-sm font-medium">Construction Period (months)</Label>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              Typical construction takes 24-48 months. Longer periods mean more index exposure.
            </TooltipContent>
          </Tooltip>
        </div>
        <Input
          type="number"
          value={constructionMonths}
          onChange={(e) => setConstructionMonths(Number(e.target.value))}
          min={12}
          max={60}
          className="h-11"
        />
      </div>

      {/* Annual Index Rate */}
      <div className="space-y-3">
        <div className="flex items-center gap-1">
          <Label className="text-sm font-medium">Expected Annual Index Rate (%)</Label>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              מדד תשומות הבנייה (Building Input Index) averages 2-4% annually but can spike during high inflation.
            </TooltipContent>
          </Tooltip>
        </div>
        <Input
          type="number"
          value={annualIndexRate}
          onChange={(e) => setAnnualIndexRate(Number(e.target.value))}
          min={0}
          max={10}
          step={0.1}
          className="h-11"
        />
      </div>

      {/* Mortgage Details */}
      <div className="p-4 rounded-lg bg-muted/50 space-y-3">
        <div className="flex items-center gap-2">
          <Banknote className="h-4 w-4" />
          <Label className="font-semibold">Mortgage Details</Label>
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Loan Amount</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {currencySymbol}
            </span>
            <Input
              type="number"
              value={loanAmount}
              onChange={(e) => setLoanAmount(Math.min(Number(e.target.value), contractPrice * 0.75))}
              min={0}
              max={contractPrice * 0.75}
              className="pl-8 h-11"
            />
          </div>
          <p className="text-xs text-muted-foreground">Max 75% LTV for new construction</p>
        </div>
      </div>

      {/* Tips */}
      <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-2">Tips for New Construction Buyers</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Negotiate a cap on index linkage (e.g., max 8% total)</li>
          <li>• Some developers offer "fixed price" contracts for a premium</li>
          <li>• Bank guarantees protect your payments until completion</li>
          <li>• Budget for changes/upgrades (typically 5-10% extra)</li>
          <li>• Completion delays are common - plan financially</li>
        </ul>
      </div>
    </div>
  );

  const rightColumn = (
    <Card className="lg:sticky lg:top-20 lg:self-start">
      <CardContent className="p-6 space-y-4">
        {/* Index Warning */}
        <Alert variant="default" className="bg-semantic-amber border-semantic-amber">
          <AlertTriangle className="h-4 w-4 text-semantic-amber-foreground" />
          <AlertDescription className="text-semantic-amber-foreground">
            <strong>Building Index Linkage:</strong> Your final price may increase by 
            <strong> {formatCurrency(indexLinkage.linkageAmount)} </strong>
            ({((totalWithLinkage / contractPrice - 1) * 100).toFixed(1)}%) over {constructionMonths} months.
          </AlertDescription>
        </Alert>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-primary/10 text-center">
            <p className="text-sm text-muted-foreground">Contract Price</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(contractPrice)}</p>
          </div>
          <div className="p-4 rounded-lg bg-semantic-red text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-semantic-red-foreground" />
            <p className="text-sm text-muted-foreground">Est. Linked Price</p>
            <p className="text-xl font-bold text-semantic-red-foreground">{formatCurrency(totalWithLinkage)}</p>
          </div>
        </div>

        {/* Payment Schedule */}
        <div className="p-4 rounded-lg border space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Payment Schedule (לוח תשלומים)
          </h4>
          
          <div className="space-y-3">
            {paymentSchedule.map((stage, idx) => {
              const progress = ((idx + 1) / paymentSchedule.length) * 100;
              const additionalCost = stage.estimatedLinkedAmount - stage.amount;
              
              return (
                <div key={stage.stage} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {stage.percentage}%
                      </Badge>
                      <span className="font-medium">{stage.stage}</span>
                    </div>
                    <span className="text-muted-foreground">{formatDate(stage.estimatedDate)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Base: {formatCurrency(stage.amount)}
                    </span>
                    {additionalCost > 0 && (
                      <span className="text-semantic-amber-foreground">
                        +{formatCurrency(additionalCost)} linkage
                      </span>
                    )}
                  </div>
                  <Progress value={progress} className="h-1" />
                </div>
              );
            })}
          </div>
        </div>

        {/* All Costs Breakdown */}
        <div className="p-4 rounded-lg border space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Total Upfront Costs
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Contract Price:</span>
              <span className="font-medium">{formatCurrency(contractPrice)}</span>
            </div>
            <div className="flex justify-between text-semantic-amber-foreground">
              <span>+ Index Linkage (estimated):</span>
              <span>{formatCurrency(indexLinkage.linkageAmount)}</span>
            </div>
            <hr />
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Purchase Tax ({getBuyerTypeLabel(buyerType)}):
              </span>
              <span className="font-medium">{formatCurrency(taxResult.totalTax)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Your Lawyer (עו"ד קונה):</span>
              <span className="font-medium">{formatCurrency(purchaseCosts.lawyerFees)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Developer Lawyer (עו"ד יזם):</span>
              <span className="font-medium">{formatCurrency(purchaseCosts.developerLawyerFees)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bank Guarantee (ערבות בנקאית):</span>
              <span className="font-medium">{formatCurrency(purchaseCosts.bankGuarantee)}</span>
            </div>
            {includeMortgage && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mortgage Fees:</span>
                <span className="font-medium">
                  {formatCurrency(purchaseCosts.mortgageOriginationFee + purchaseCosts.appraisalFee)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Registration Fees:</span>
              <span className="font-medium">
                {formatCurrency(purchaseCosts.tabuRegistration + purchaseCosts.caveatRegistration)}
              </span>
            </div>
            <hr />
            <div className="flex justify-between font-semibold text-base">
              <span>Estimated Total Cost:</span>
              <span className="text-primary">
                {formatCurrency(totalWithLinkage + purchaseCosts.totalOneTimeCosts - contractPrice)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {((totalWithLinkage + purchaseCosts.totalOneTimeCosts) / contractPrice * 100 - 100).toFixed(1)}% above contract price
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const bottomSection = (
    <div className="space-y-6">
      {/* 1. Interpret */}
      <InsightCard insights={insights} />
      
      {/* 3. Explore - Navigation Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Link
          to="/tools?tool=totalcost"
          className="group p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Receipt className="h-5 w-5" />
            </div>
            <p className="font-semibold">True Cost Calculator</p>
          </div>
          <p className="text-sm text-muted-foreground">See all purchase costs together</p>
        </Link>
        <Link
          to="/tools?tool=mortgage"
          className="group p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Banknote className="h-5 w-5" />
            </div>
            <p className="font-semibold">Mortgage Calculator</p>
          </div>
          <p className="text-sm text-muted-foreground">Calculate monthly payments</p>
        </Link>
        <Link
          to="/guides/new-construction"
          className="group p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Info className="h-5 w-5" />
            </div>
            <p className="font-semibold">New Construction Guide</p>
          </div>
          <p className="text-sm text-muted-foreground">Understand index linkage & timelines</p>
        </Link>
      </div>


      {/* 6. Engage */}
      <ToolFeedback toolName="new-construction-calculator" variant="inline" />
    </div>
  );

  return (
    <ToolLayout
      title="New Construction Cost Calculator"
      subtitle="Calculate building index (מדד תשומות הבנייה), payment schedule, and total costs for buying from a developer"
      icon={<Building2 className="h-6 w-6" />}
      infoBanner={
        <BuyerTypeInfoBanner
           selectedType={buyerType as BuyerCategory}
           onTypeChange={handleBuyerTypeChange}
           profileType={buyerProfile ? (getBuyerTaxCategory(buyerProfile) as BuyerCategory) : undefined}
           extended
           onOlehFirstPropertyChange={setOlehIsFirstProperty}
           olehIsFirstProperty={olehIsFirstProperty}
         />
      }
      leftColumn={leftColumn}
      rightColumn={rightColumn}
      bottomSection={bottomSection}
      sourceAttribution={<SourceAttribution toolType="newConstruction" />}
      disclaimer={<ToolDisclaimer />}
    />
  );
}
