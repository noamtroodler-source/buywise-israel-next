import { useState, useMemo } from 'react';
import { Wallet, Info, AlertTriangle, User, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  calculateAffordability, 
  calculateMaxLoanByPTI, 
  getMaxLTV,
  calculateForeignIncomeDiscount 
} from '@/lib/calculations/mortgage';
import type { BuyerType } from '@/lib/calculations/purchaseTax';

type EmploymentType = 'salaried' | 'self_employed' | 'mixed';

export function AffordabilityCalculator() {
  const [buyerType, setBuyerType] = useState<BuyerType>('first_time');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('salaried');
  
  // Income
  const [monthlyIncome, setMonthlyIncome] = useState(25000);
  const [spouseIncome, setSpouseIncome] = useState(0);
  const [selfEmployedIncome, setSelfEmployedIncome] = useState(0);
  const [selfEmployedYears, setSelfEmployedYears] = useState(2);
  
  // Foreign income
  const [hasForeignIncome, setHasForeignIncome] = useState(false);
  const [foreignIncomeAmount, setForeignIncomeAmount] = useState(0);
  const [foreignCurrency, setForeignCurrency] = useState<'USD' | 'EUR' | 'GBP'>('USD');
  
  // Debts & Expenses
  const [existingDebts, setExistingDebts] = useState(0);
  const [downPaymentSaved, setDownPaymentSaved] = useState(400000);
  const [interestRate, setInterestRate] = useState(5.0);
  const [loanTerm, setLoanTerm] = useState(25);

  const maxLTV = getMaxLTV(buyerType);
  const PTI_LIMIT = 0.40; // Bank of Israel 40% limit

  const calculations = useMemo(() => {
    // Calculate effective income
    let effectiveMonthlyIncome = monthlyIncome + spouseIncome;
    
    // Self-employed income (banks typically count 70-80% and require 2+ years of tax returns)
    if (employmentType === 'self_employed' || employmentType === 'mixed') {
      const selfEmployedMultiplier = selfEmployedYears >= 3 ? 0.80 : selfEmployedYears >= 2 ? 0.70 : 0.50;
      effectiveMonthlyIncome += selfEmployedIncome * selfEmployedMultiplier;
    }
    
    // Foreign income discount
    let foreignIncomeContribution = 0;
    let foreignDiscountInfo = null;
    if (hasForeignIncome && foreignIncomeAmount > 0) {
      const exchangeRates: Record<string, number> = { USD: 3.6, EUR: 3.9, GBP: 4.5 };
      const ilsAmount = foreignIncomeAmount * exchangeRates[foreignCurrency];
      foreignDiscountInfo = calculateForeignIncomeDiscount(ilsAmount, foreignCurrency);
      foreignIncomeContribution = foreignDiscountInfo.effectiveIncome;
      effectiveMonthlyIncome += foreignIncomeContribution;
    }

    // Calculate max mortgage payment based on PTI
    const availableForPayment = (effectiveMonthlyIncome - existingDebts) * PTI_LIMIT;
    const safePayment = Math.max(0, availableForPayment);
    
    // Calculate max loan using reverse mortgage formula
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = loanTerm * 12;
    
    const maxLoanByPTI = safePayment > 0 && monthlyRate > 0
      ? (safePayment * (Math.pow(1 + monthlyRate, numPayments) - 1)) / 
        (monthlyRate * Math.pow(1 + monthlyRate, numPayments))
      : 0;
    
    // Calculate max property based on LTV limit
    const maxPropertyByLoan = maxLoanByPTI / (maxLTV / 100);
    const maxPropertyByDownPayment = downPaymentSaved / ((100 - maxLTV) / 100);
    
    // The limiting factor
    const maxPropertyPrice = Math.min(maxPropertyByLoan, maxPropertyByDownPayment);
    const limitingFactor = maxPropertyByLoan < maxPropertyByDownPayment ? 'income' : 'down_payment';
    
    // Actual loan needed for max property
    const requiredLoan = maxPropertyPrice * (maxLTV / 100);
    
    // Current PTI ratio
    const currentPTI = effectiveMonthlyIncome > 0 
      ? ((existingDebts + safePayment) / effectiveMonthlyIncome) * 100 
      : 0;
    
    // Affordability score (0-100)
    const affordabilityScore = Math.min(100, Math.max(0, 
      100 - (currentPTI * 1.5) + (downPaymentSaved / Math.max(maxPropertyPrice, 1) * 20)
    ));
    
    // Calculate how much more down payment would help
    const additionalDownPaymentNeeded = limitingFactor === 'down_payment' 
      ? (maxPropertyByLoan - maxPropertyByDownPayment) * ((100 - maxLTV) / 100)
      : 0;

    return {
      effectiveMonthlyIncome,
      safePayment,
      maxLoanByPTI,
      maxPropertyPrice: Math.max(downPaymentSaved, maxPropertyPrice),
      requiredLoan,
      currentPTI,
      affordabilityScore,
      limitingFactor,
      additionalDownPaymentNeeded,
      foreignDiscountInfo,
      selfEmployedMultiplier: employmentType === 'self_employed' || employmentType === 'mixed'
        ? (selfEmployedYears >= 3 ? 80 : selfEmployedYears >= 2 ? 70 : 50)
        : 100,
    };
  }, [monthlyIncome, spouseIncome, selfEmployedIncome, selfEmployedYears, 
      existingDebts, downPaymentSaved, interestRate, loanTerm, buyerType, maxLTV,
      hasForeignIncome, foreignIncomeAmount, foreignCurrency, employmentType]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return 'Excellent';
    if (score >= 50) return 'Good';
    if (score >= 30) return 'Fair';
    return 'Challenging';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          Affordability Calculator (מחשבון יכולת החזר)
        </CardTitle>
        <CardDescription>
          Calculate your maximum affordable property based on Bank of Israel PTI limits and LTV requirements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - Inputs */}
          <div className="space-y-5">
            {/* Buyer Type */}
            <div className="space-y-2">
              <Label>Buyer Type</Label>
              <Select value={buyerType} onValueChange={(v) => setBuyerType(v as BuyerType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first_time">First-Time Buyer (max 75% LTV)</SelectItem>
                  <SelectItem value="upgrader">Upgrader (max 70% LTV)</SelectItem>
                  <SelectItem value="investor">Investor (max 50% LTV)</SelectItem>
                  <SelectItem value="foreign">Foreign Resident (max 50% LTV)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Employment Type */}
            <div className="space-y-2">
              <Label>Employment Type</Label>
              <Select value={employmentType} onValueChange={(v) => setEmploymentType(v as EmploymentType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="salaried">Salaried Employee (שכיר)</SelectItem>
                  <SelectItem value="self_employed">Self-Employed (עצמאי)</SelectItem>
                  <SelectItem value="mixed">Mixed Income</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Monthly Income */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Label>Monthly Net Income (הכנסה נטו)</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>Your take-home pay after taxes</TooltipContent>
                  </Tooltip>
                </div>
                <span className="text-sm font-medium">{formatCurrency(monthlyIncome)}</span>
              </div>
              <Slider
                value={[monthlyIncome]}
                onValueChange={([v]) => setMonthlyIncome(v)}
                min={5000}
                max={100000}
                step={1000}
              />
            </div>

            {/* Spouse Income */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Spouse/Partner Income</Label>
                <span className="text-sm font-medium">{formatCurrency(spouseIncome)}</span>
              </div>
              <Slider
                value={[spouseIncome]}
                onValueChange={([v]) => setSpouseIncome(v)}
                min={0}
                max={100000}
                step={1000}
              />
            </div>

            {/* Self-Employed Income */}
            {(employmentType === 'self_employed' || employmentType === 'mixed') && (
              <div className="space-y-4 p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <Label className="font-semibold">Self-Employment Details</Label>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Monthly Self-Employed Income</Label>
                    <span className="text-sm font-medium">{formatCurrency(selfEmployedIncome)}</span>
                  </div>
                  <Slider
                    value={[selfEmployedIncome]}
                    onValueChange={([v]) => setSelfEmployedIncome(v)}
                    min={0}
                    max={100000}
                    step={1000}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Years of Tax Returns</Label>
                    <span className="text-sm font-medium">{selfEmployedYears} years</span>
                  </div>
                  <Slider
                    value={[selfEmployedYears]}
                    onValueChange={([v]) => setSelfEmployedYears(v)}
                    min={0}
                    max={5}
                    step={1}
                  />
                </div>

                <Alert variant="default" className="bg-amber-50 border-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 text-xs">
                    Banks count only {calculations.selfEmployedMultiplier}% of self-employed income
                    ({selfEmployedYears < 2 ? 'need 2+ years of tax returns' : 'based on your tax history'})
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Foreign Income */}
            <div className="flex items-center justify-between">
              <Label>Foreign Income (הכנסה מחו"ל)</Label>
              <Switch checked={hasForeignIncome} onCheckedChange={setHasForeignIncome} />
            </div>

            {hasForeignIncome && (
              <div className="space-y-4 p-4 rounded-lg bg-muted/50">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Monthly Amount</Label>
                    <Input
                      type="number"
                      value={foreignIncomeAmount}
                      onChange={(e) => setForeignIncomeAmount(Number(e.target.value))}
                      min={0}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Currency</Label>
                    <Select value={foreignCurrency} onValueChange={(v) => setForeignCurrency(v as typeof foreignCurrency)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {calculations.foreignDiscountInfo && (
                  <p className="text-xs text-muted-foreground">
                    Banks count {calculations.foreignDiscountInfo.discountRate * 100}% of your {foreignCurrency} income = 
                    {formatCurrency(calculations.foreignDiscountInfo.effectiveIncome)}/month effective
                  </p>
                )}
              </div>
            )}

            {/* Existing Debts */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Label>Existing Monthly Debt Payments</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>Car loans, credit cards, student loans, etc.</TooltipContent>
                  </Tooltip>
                </div>
                <span className="text-sm font-medium">{formatCurrency(existingDebts)}</span>
              </div>
              <Slider
                value={[existingDebts]}
                onValueChange={([v]) => setExistingDebts(v)}
                min={0}
                max={20000}
                step={500}
              />
            </div>

            {/* Down Payment */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Down Payment Saved (הון עצמי)</Label>
                <span className="text-sm font-medium">{formatCurrency(downPaymentSaved)}</span>
              </div>
              <Input
                type="number"
                value={downPaymentSaved}
                onChange={(e) => setDownPaymentSaved(Number(e.target.value))}
                min={0}
              />
              <Slider
                value={[downPaymentSaved]}
                onValueChange={([v]) => setDownPaymentSaved(v)}
                min={0}
                max={5000000}
                step={50000}
              />
            </div>

            {/* Interest Rate & Term */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Interest Rate: {interestRate}%</Label>
                <Slider
                  value={[interestRate]}
                  onValueChange={([v]) => setInterestRate(v)}
                  min={2}
                  max={10}
                  step={0.1}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Term: {loanTerm} years</Label>
                <Slider
                  value={[loanTerm]}
                  onValueChange={([v]) => setLoanTerm(v)}
                  min={5}
                  max={30}
                  step={1}
                />
              </div>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-4">
            {/* Affordability Score */}
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Affordability Score</span>
                <span className={`text-lg font-bold ${getScoreColor(calculations.affordabilityScore)}`}>
                  {getScoreLabel(calculations.affordabilityScore)}
                </span>
              </div>
              <Progress 
                value={calculations.affordabilityScore} 
                className="h-2"
              />
            </div>

            {/* Key Results */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-primary/10">
                <p className="text-sm text-muted-foreground">Max Property Price</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(calculations.maxPropertyPrice)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Safe Monthly Payment</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(calculations.safePayment)}
                </p>
              </div>
            </div>

            {/* Effective Income */}
            <div className="p-4 rounded-lg border">
              <h4 className="font-semibold mb-3">Income Analysis</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Effective Monthly Income:</span>
                  <span className="font-medium">{formatCurrency(calculations.effectiveMonthlyIncome)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Payment (40% PTI):</span>
                  <span className="font-medium">{formatCurrency(calculations.safePayment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Loan Amount:</span>
                  <span className="font-medium">{formatCurrency(calculations.maxLoanByPTI)}</span>
                </div>
              </div>
            </div>

            {/* LTV & PTI */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Max LTV for {buyerType.replace('_', ' ')}</p>
                <p className="text-lg font-semibold">{maxLTV}%</p>
                <p className="text-xs text-muted-foreground">Min down payment: {100 - maxLTV}%</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Your PTI Ratio</p>
                <p className={`text-lg font-semibold ${calculations.currentPTI > 40 ? 'text-destructive' : ''}`}>
                  {calculations.currentPTI.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">BOI limit: 40%</p>
              </div>
            </div>

            {/* Limiting Factor Alert */}
            <Alert variant={calculations.limitingFactor === 'income' ? 'default' : 'default'}>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {calculations.limitingFactor === 'income' ? (
                  <>Your <strong>income</strong> is the limiting factor. Increase income or reduce debts to afford more.</>
                ) : (
                  <>Your <strong>down payment</strong> is the limiting factor. Save {formatCurrency(calculations.additionalDownPaymentNeeded)} more to maximize your purchasing power.</>
                )}
              </AlertDescription>
            </Alert>

            {/* Required Down Payment */}
            <div className="p-4 rounded-lg border">
              <h4 className="font-semibold mb-3">For Your Max Property</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Property Price:</span>
                  <span className="font-medium">{formatCurrency(calculations.maxPropertyPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Required Down Payment ({100 - maxLTV}%):</span>
                  <span className="font-medium">{formatCurrency(calculations.maxPropertyPrice * (100 - maxLTV) / 100)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Loan Amount ({maxLTV}%):</span>
                  <span className="font-medium">{formatCurrency(calculations.requiredLoan)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
