import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { TrendingUp, Percent, DollarSign, PiggyBank } from 'lucide-react';

export function InvestmentReturnCalculator() {
  const [purchasePrice, setPurchasePrice] = useState(2000000);
  const [monthlyRent, setMonthlyRent] = useState(8000);
  const [annualExpenses, setAnnualExpenses] = useState(15000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(30);
  const [appreciation, setAppreciation] = useState(4);

  const calculations = useMemo(() => {
    const annualRent = monthlyRent * 12;
    const netOperatingIncome = annualRent - annualExpenses;
    const downPayment = purchasePrice * (downPaymentPercent / 100);
    const loanAmount = purchasePrice - downPayment;
    
    // Cap Rate = NOI / Purchase Price
    const capRate = (netOperatingIncome / purchasePrice) * 100;
    
    // Gross Yield = Annual Rent / Purchase Price
    const grossYield = (annualRent / purchasePrice) * 100;
    
    // Cash on Cash Return = Annual Cash Flow / Cash Invested
    // Simplified: assumes mortgage payment roughly equals rent minus some profit
    const estimatedMortgagePayment = loanAmount * 0.05; // rough annual mortgage cost
    const annualCashFlow = netOperatingIncome - estimatedMortgagePayment;
    const cashOnCash = (annualCashFlow / downPayment) * 100;
    
    // 5-year projection with appreciation
    const futureValue = purchasePrice * Math.pow(1 + appreciation / 100, 5);
    const equityGain = futureValue - purchasePrice;
    const totalReturn5Years = (annualCashFlow * 5) + equityGain;
    const roi5Years = (totalReturn5Years / downPayment) * 100;

    return {
      annualRent,
      netOperatingIncome,
      downPayment,
      capRate,
      grossYield,
      cashOnCash,
      futureValue,
      equityGain,
      totalReturn5Years,
      roi5Years,
    };
  }, [purchasePrice, monthlyRent, annualExpenses, downPaymentPercent, appreciation]);

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
          <TrendingUp className="h-5 w-5 text-primary" />
          Investment Return Calculator
        </CardTitle>
        <CardDescription>
          Analyze potential returns on your real estate investment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Purchase Price: {formatCurrency(purchasePrice)}</Label>
              <Slider
                value={[purchasePrice]}
                onValueChange={([value]) => setPurchasePrice(value)}
                min={500000}
                max={10000000}
                step={50000}
              />
            </div>

            <div className="space-y-2">
              <Label>Monthly Rent: {formatCurrency(monthlyRent)}</Label>
              <Slider
                value={[monthlyRent]}
                onValueChange={([value]) => setMonthlyRent(value)}
                min={2000}
                max={30000}
                step={500}
              />
            </div>

            <div className="space-y-2">
              <Label>Annual Expenses (maintenance, tax, insurance): {formatCurrency(annualExpenses)}</Label>
              <Slider
                value={[annualExpenses]}
                onValueChange={([value]) => setAnnualExpenses(value)}
                min={0}
                max={100000}
                step={1000}
              />
            </div>

            <div className="space-y-2">
              <Label>Down Payment: {downPaymentPercent}%</Label>
              <Slider
                value={[downPaymentPercent]}
                onValueChange={([value]) => setDownPaymentPercent(value)}
                min={10}
                max={100}
                step={5}
              />
            </div>

            <div className="space-y-2">
              <Label>Expected Annual Appreciation: {appreciation}%</Label>
              <Slider
                value={[appreciation]}
                onValueChange={([value]) => setAppreciation(value)}
                min={0}
                max={10}
                step={0.5}
              />
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-primary/10 text-center">
                <Percent className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold text-primary">{calculations.capRate.toFixed(2)}%</p>
                <p className="text-sm text-muted-foreground">Cap Rate</p>
              </div>
              <div className="p-4 rounded-lg bg-primary/10 text-center">
                <Percent className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold text-primary">{calculations.grossYield.toFixed(2)}%</p>
                <p className="text-sm text-muted-foreground">Gross Yield</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-secondary text-center">
              <DollarSign className="h-6 w-6 mx-auto mb-2 text-secondary-foreground" />
              <p className="text-2xl font-bold">{formatCurrency(calculations.netOperatingIncome)}</p>
              <p className="text-sm text-muted-foreground">Annual Net Operating Income</p>
            </div>

            <div className="p-4 rounded-lg bg-accent text-center">
              <PiggyBank className="h-6 w-6 mx-auto mb-2 text-accent-foreground" />
              <p className="text-2xl font-bold">{calculations.cashOnCash.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Cash on Cash Return</p>
            </div>

            <div className="p-4 rounded-lg border">
              <h4 className="font-semibold mb-2">5-Year Projection</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Future Property Value:</span>
                  <span className="font-medium">{formatCurrency(calculations.futureValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Equity Gain:</span>
                  <span className="font-medium text-green-600">{formatCurrency(calculations.equityGain)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total ROI (5yr):</span>
                  <span className="font-medium text-primary">{calculations.roi5Years.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
