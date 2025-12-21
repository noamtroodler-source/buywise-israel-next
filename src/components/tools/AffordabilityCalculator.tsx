import { useState, useMemo } from 'react';
import { Wallet, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';

export function AffordabilityCalculator() {
  const [monthlyIncome, setMonthlyIncome] = useState(25000);
  const [monthlyExpenses, setMonthlyExpenses] = useState(8000);
  const [existingDebts, setExistingDebts] = useState(0);
  const [downPaymentSaved, setDownPaymentSaved] = useState(400000);
  const [interestRate, setInterestRate] = useState(4.5);

  const calculations = useMemo(() => {
    // Available monthly payment (30% of income is safe threshold)
    const availableForPayment = (monthlyIncome - monthlyExpenses - existingDebts) * 0.3;
    const safePayment = Math.max(0, availableForPayment);
    
    // Calculate max loan based on safe monthly payment
    const monthlyRate = interestRate / 100 / 12;
    const loanTerm = 25 * 12; // 25 years
    
    // Reverse mortgage formula to find principal
    const maxLoanAmount = safePayment > 0 && monthlyRate > 0
      ? (safePayment * (Math.pow(1 + monthlyRate, loanTerm) - 1)) / 
        (monthlyRate * Math.pow(1 + monthlyRate, loanTerm))
      : 0;
    
    // Assuming 25% down payment requirement
    const maxPropertyPrice = (maxLoanAmount + downPaymentSaved) / 0.75 * 0.75 + downPaymentSaved;
    
    // Debt-to-income ratio
    const dti = monthlyIncome > 0 ? ((existingDebts + safePayment) / monthlyIncome) * 100 : 0;
    
    // Affordability score (0-100)
    const affordabilityScore = Math.min(100, Math.max(0, 
      100 - (dti * 1.5) + (downPaymentSaved / maxPropertyPrice * 20)
    ));

    return {
      safePayment,
      maxLoanAmount,
      maxPropertyPrice: Math.max(downPaymentSaved, maxPropertyPrice),
      dti,
      affordabilityScore,
    };
  }, [monthlyIncome, monthlyExpenses, existingDebts, downPaymentSaved, interestRate]);

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
    return 'Needs Improvement';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          Affordability Calculator
        </CardTitle>
        <CardDescription>
          Find out how much property you can afford based on your finances
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Monthly Income */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Monthly Income (Net)</Label>
            <span className="text-sm font-medium">{formatCurrency(monthlyIncome)}</span>
          </div>
          <Input
            type="number"
            value={monthlyIncome}
            onChange={(e) => setMonthlyIncome(Number(e.target.value))}
            min={0}
            max={500000}
          />
          <Slider
            value={[monthlyIncome]}
            onValueChange={([v]) => setMonthlyIncome(v)}
            min={5000}
            max={100000}
            step={1000}
          />
        </div>

        {/* Monthly Expenses */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Label>Monthly Expenses</Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  Include rent, utilities, groceries, transportation, etc.
                </TooltipContent>
              </Tooltip>
            </div>
            <span className="text-sm font-medium">{formatCurrency(monthlyExpenses)}</span>
          </div>
          <Slider
            value={[monthlyExpenses]}
            onValueChange={([v]) => setMonthlyExpenses(v)}
            min={0}
            max={monthlyIncome}
            step={500}
          />
        </div>

        {/* Existing Debts */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Existing Monthly Debt Payments</Label>
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

        {/* Down Payment Saved */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Down Payment Saved</Label>
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

        {/* Interest Rate */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Expected Interest Rate</Label>
            <span className="text-sm font-medium">{interestRate}%</span>
          </div>
          <Slider
            value={[interestRate]}
            onValueChange={([v]) => setInterestRate(v)}
            min={1}
            max={10}
            step={0.1}
          />
        </div>

        {/* Results */}
        <div className="pt-4 border-t border-border space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Max Loan Amount</p>
              <p className="text-lg font-semibold">{formatCurrency(calculations.maxLoanAmount)}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Debt-to-Income Ratio</p>
              <p className={`text-lg font-semibold ${calculations.dti > 40 ? 'text-destructive' : ''}`}>
                {calculations.dti.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
