import { useState, useMemo } from 'react';
import { Calculator, TrendingUp, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function MortgageCalculator() {
  const [propertyPrice, setPropertyPrice] = useState(2000000);
  const [downPayment, setDownPayment] = useState(25);
  const [interestRate, setInterestRate] = useState(4.5);
  const [loanTerm, setLoanTerm] = useState(25);

  const calculations = useMemo(() => {
    const loanAmount = propertyPrice * (1 - downPayment / 100);
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = loanTerm * 12;
    
    // Monthly payment formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
    const monthlyPayment = monthlyRate > 0
      ? (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) / 
        (Math.pow(1 + monthlyRate, numPayments) - 1)
      : loanAmount / numPayments;
    
    const totalPayment = monthlyPayment * numPayments;
    const totalInterest = totalPayment - loanAmount;

    return {
      loanAmount,
      monthlyPayment,
      totalPayment,
      totalInterest,
      downPaymentAmount: propertyPrice * (downPayment / 100),
    };
  }, [propertyPrice, downPayment, interestRate, loanTerm]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Mortgage Calculator
        </CardTitle>
        <CardDescription>
          Calculate your monthly mortgage payments and total costs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Property Price */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="propertyPrice">Property Price</Label>
            <span className="text-sm font-medium">{formatCurrency(propertyPrice)}</span>
          </div>
          <Input
            id="propertyPrice"
            type="number"
            value={propertyPrice}
            onChange={(e) => setPropertyPrice(Number(e.target.value))}
            min={100000}
            max={50000000}
          />
          <Slider
            value={[propertyPrice]}
            onValueChange={([v]) => setPropertyPrice(v)}
            min={100000}
            max={20000000}
            step={50000}
          />
        </div>

        {/* Down Payment */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Label>Down Payment</Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  In Israel, minimum 25% for first home, 50% for investment
                </TooltipContent>
              </Tooltip>
            </div>
            <span className="text-sm font-medium">{downPayment}% ({formatCurrency(calculations.downPaymentAmount)})</span>
          </div>
          <Slider
            value={[downPayment]}
            onValueChange={([v]) => setDownPayment(v)}
            min={10}
            max={80}
            step={5}
          />
        </div>

        {/* Interest Rate */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Interest Rate</Label>
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

        {/* Loan Term */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Loan Term</Label>
            <span className="text-sm font-medium">{loanTerm} years</span>
          </div>
          <Slider
            value={[loanTerm]}
            onValueChange={([v]) => setLoanTerm(v)}
            min={5}
            max={30}
            step={1}
          />
        </div>

        {/* Results */}
        <div className="pt-4 border-t border-border space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-primary/10">
              <p className="text-sm text-muted-foreground">Monthly Payment</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(calculations.monthlyPayment)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Loan Amount</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(calculations.loanAmount)}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Total Payment</p>
              <p className="text-lg font-semibold">{formatCurrency(calculations.totalPayment)}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Total Interest</p>
              <p className="text-lg font-semibold text-destructive">
                {formatCurrency(calculations.totalInterest)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
