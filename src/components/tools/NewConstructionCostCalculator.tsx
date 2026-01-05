import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, Info, Calendar, TrendingUp, 
  AlertTriangle, Receipt, Banknote 
} from 'lucide-react';
import { calculateNewConstructionLinkage, calculateTotalPurchaseCosts } from '@/lib/calculations/purchaseCosts';
import { calculatePurchaseTax, type BuyerType, getBuyerTypeLabel } from '@/lib/calculations/purchaseTax';
import { useFormatPrice, useCurrencySymbol } from '@/contexts/PreferencesContext';

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
  
  const [contractPrice, setContractPrice] = useState(2500000);
  const [buyerType, setBuyerType] = useState<BuyerType>('first_time');
  const [constructionMonths, setConstructionMonths] = useState(36);
  const [annualIndexRate, setAnnualIndexRate] = useState(2.5);
  const [includeMortgage, setIncludeMortgage] = useState(true);
  const [loanAmount, setLoanAmount] = useState(contractPrice * 0.5);
  const [contractDate, setContractDate] = useState(new Date());

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

  // Grand total
  const grandTotal = totalWithLinkage + purchaseCosts.totalOneTimeCosts - taxResult.totalTax + taxResult.totalTax;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          New Construction Cost Calculator (מחשבון עלויות דירה מקבלן)
        </CardTitle>
        <CardDescription>
          Calculate building index (מדד תשומות הבנייה), payment schedule, and total costs for buying from a developer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Contract Price: {formatCurrency(contractPrice)}</Label>
              <Slider
                value={[contractPrice]}
                onValueChange={([value]) => {
                  setContractPrice(value);
                  setLoanAmount(Math.min(loanAmount, value * 0.75));
                }}
                min={500000}
                max={15000000}
                step={50000}
              />
              <Input
                type="number"
                value={contractPrice}
                onChange={(e) => setContractPrice(Number(e.target.value))}
                min={0}
              />
            </div>

            <div className="space-y-2">
              <Label>Buyer Type</Label>
              <Select value={buyerType} onValueChange={(v) => setBuyerType(v as BuyerType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first_time">First-Time Buyer</SelectItem>
                  <SelectItem value="oleh">New Immigrant (Oleh)</SelectItem>
                  <SelectItem value="upgrader">Upgrader</SelectItem>
                  <SelectItem value="investor">Investor</SelectItem>
                  <SelectItem value="foreign">Foreign Resident</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Contract Date</Label>
              <Input
                type="date"
                value={contractDate.toISOString().split('T')[0]}
                onChange={(e) => setContractDate(new Date(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label>Construction Period: {constructionMonths} months</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    Typical construction takes 24-48 months. Longer periods mean more index exposure.
                  </TooltipContent>
                </Tooltip>
              </div>
              <Slider
                value={[constructionMonths]}
                onValueChange={([value]) => setConstructionMonths(value)}
                min={12}
                max={60}
                step={3}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label>Expected Annual Index Rate: {annualIndexRate}%</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    מדד תשומות הבנייה (Building Input Index) averages 2-4% annually but can spike during high inflation.
                  </TooltipContent>
                </Tooltip>
              </div>
              <Slider
                value={[annualIndexRate]}
                onValueChange={([value]) => setAnnualIndexRate(value)}
                min={0}
                max={8}
                step={0.5}
              />
            </div>

            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                <Label className="font-semibold">Mortgage Details</Label>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Loan Amount: {formatCurrency(loanAmount)}</Label>
                <Slider
                  value={[loanAmount]}
                  onValueChange={([value]) => setLoanAmount(value)}
                  min={0}
                  max={contractPrice * 0.75}
                  step={50000}
                />
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            {/* Index Warning */}
            <Alert variant="default" className="bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
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
              <div className="p-4 rounded-lg bg-destructive/10 text-center">
                <TrendingUp className="h-5 w-5 mx-auto mb-1 text-destructive" />
                <p className="text-sm text-muted-foreground">Est. Linked Price</p>
                <p className="text-xl font-bold text-destructive">{formatCurrency(totalWithLinkage)}</p>
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
                          <span className="text-amber-600">
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
                Total One-Time Costs
              </h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contract Price:</span>
                  <span className="font-medium">{formatCurrency(contractPrice)}</span>
                </div>
                <div className="flex justify-between text-amber-600">
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
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mortgage Fees:</span>
                      <span className="font-medium">
                        {formatCurrency(purchaseCosts.mortgageOriginationFee + purchaseCosts.appraisalFee)}
                      </span>
                    </div>
                  </>
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
        </div>
      </CardContent>
    </Card>
  );
}
