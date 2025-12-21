import { useState, useMemo } from 'react';
import { Scale, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

export function RentVsBuyCalculator() {
  const [propertyPrice, setPropertyPrice] = useState(2000000);
  const [monthlyRent, setMonthlyRent] = useState(6000);
  const [downPayment, setDownPayment] = useState(25);
  const [interestRate, setInterestRate] = useState(4.5);
  const [appreciationRate, setAppreciationRate] = useState(3);
  const [rentIncreaseRate, setRentIncreaseRate] = useState(2);
  const [yearsToCompare, setYearsToCompare] = useState(10);

  const calculations = useMemo(() => {
    const loanAmount = propertyPrice * (1 - downPayment / 100);
    const monthlyRate = interestRate / 100 / 12;
    const loanTerm = 25 * 12;
    
    // Monthly mortgage payment
    const monthlyMortgage = monthlyRate > 0
      ? (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, loanTerm))) / 
        (Math.pow(1 + monthlyRate, loanTerm) - 1)
      : loanAmount / loanTerm;
    
    // Additional buying costs (property tax, maintenance, insurance ~1.5% annually)
    const monthlyOwnershipCosts = propertyPrice * 0.015 / 12;
    const totalMonthlyBuying = monthlyMortgage + monthlyOwnershipCosts;
    
    // Calculate totals over years
    let totalRentPaid = 0;
    let currentRent = monthlyRent;
    let totalBuyingCosts = propertyPrice * (downPayment / 100); // Initial down payment
    
    for (let year = 1; year <= yearsToCompare; year++) {
      // Rent for the year
      totalRentPaid += currentRent * 12;
      currentRent *= (1 + rentIncreaseRate / 100);
      
      // Buying costs for the year
      totalBuyingCosts += totalMonthlyBuying * 12;
    }
    
    // Property value after years
    const futurePropertyValue = propertyPrice * Math.pow(1 + appreciationRate / 100, yearsToCompare);
    
    // Calculate equity built (rough estimate)
    const remainingLoan = loanAmount * Math.pow(1 + monthlyRate, yearsToCompare * 12) - 
      monthlyMortgage * ((Math.pow(1 + monthlyRate, yearsToCompare * 12) - 1) / monthlyRate);
    const equityBuilt = futurePropertyValue - Math.max(0, remainingLoan);
    
    // Net cost of buying = total costs - equity gained
    const netBuyingCost = totalBuyingCosts - (equityBuilt - propertyPrice * (downPayment / 100));
    
    // Savings from buying vs renting
    const savings = totalRentPaid - netBuyingCost;
    const buyingIsBetter = savings > 0;
    
    // Break-even point (simplified)
    const breakEvenYears = Math.ceil(
      (propertyPrice * (downPayment / 100)) / 
      ((monthlyRent - monthlyMortgage - monthlyOwnershipCosts + 
        (propertyPrice * appreciationRate / 100 / 12)) * 12)
    );

    return {
      monthlyMortgage,
      monthlyOwnershipCosts,
      totalMonthlyBuying,
      totalRentPaid,
      totalBuyingCosts,
      futurePropertyValue,
      equityBuilt,
      netBuyingCost,
      savings: Math.abs(savings),
      buyingIsBetter,
      breakEvenYears: breakEvenYears > 0 && breakEvenYears < 50 ? breakEvenYears : null,
    };
  }, [propertyPrice, monthlyRent, downPayment, interestRate, appreciationRate, rentIncreaseRate, yearsToCompare]);

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
          <Scale className="h-5 w-5 text-primary" />
          Rent vs Buy Calculator
        </CardTitle>
        <CardDescription>
          Compare the long-term costs of renting vs buying a property
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column - Inputs */}
          <div className="space-y-5">
            {/* Property Price */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Property Price</Label>
                <span className="text-sm font-medium">{formatCurrency(propertyPrice)}</span>
              </div>
              <Slider
                value={[propertyPrice]}
                onValueChange={([v]) => setPropertyPrice(v)}
                min={500000}
                max={10000000}
                step={100000}
              />
            </div>

            {/* Monthly Rent */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Current Monthly Rent</Label>
                <span className="text-sm font-medium">{formatCurrency(monthlyRent)}</span>
              </div>
              <Slider
                value={[monthlyRent]}
                onValueChange={([v]) => setMonthlyRent(v)}
                min={1000}
                max={30000}
                step={500}
              />
            </div>

            {/* Down Payment */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Down Payment</Label>
                <span className="text-sm font-medium">{downPayment}%</span>
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Mortgage Interest Rate</Label>
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
          </div>

          {/* Right Column - More Inputs */}
          <div className="space-y-5">
            {/* Appreciation Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Property Appreciation (Annual)</Label>
                <span className="text-sm font-medium">{appreciationRate}%</span>
              </div>
              <Slider
                value={[appreciationRate]}
                onValueChange={([v]) => setAppreciationRate(v)}
                min={0}
                max={10}
                step={0.5}
              />
            </div>

            {/* Rent Increase Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Rent Increase (Annual)</Label>
                <span className="text-sm font-medium">{rentIncreaseRate}%</span>
              </div>
              <Slider
                value={[rentIncreaseRate]}
                onValueChange={([v]) => setRentIncreaseRate(v)}
                min={0}
                max={10}
                step={0.5}
              />
            </div>

            {/* Years to Compare */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Years to Compare</Label>
                <span className="text-sm font-medium">{yearsToCompare} years</span>
              </div>
              <Slider
                value={[yearsToCompare]}
                onValueChange={([v]) => setYearsToCompare(v)}
                min={1}
                max={30}
                step={1}
              />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="pt-4 border-t border-border space-y-4">
          {/* Main Result */}
          <div className={`p-6 rounded-lg ${calculations.buyingIsBetter ? 'bg-green-50 dark:bg-green-950/20' : 'bg-amber-50 dark:bg-amber-950/20'}`}>
            <div className="flex items-center gap-3 mb-2">
              {calculations.buyingIsBetter ? (
                <TrendingUp className="h-6 w-6 text-green-600" />
              ) : (
                <TrendingDown className="h-6 w-6 text-amber-600" />
              )}
              <span className={`text-lg font-bold ${calculations.buyingIsBetter ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}`}>
                {calculations.buyingIsBetter ? 'Buying is better' : 'Renting may be better'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Over {yearsToCompare} years, {calculations.buyingIsBetter ? 'buying' : 'renting'} saves you approximately{' '}
              <strong className="text-foreground">{formatCurrency(calculations.savings)}</strong>
            </p>
            {calculations.breakEvenYears && (
              <p className="text-sm text-muted-foreground mt-1">
                Break-even point: ~{calculations.breakEvenYears} years
              </p>
            )}
          </div>

          {/* Comparison Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium text-sm text-muted-foreground mb-3">If You Buy</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Monthly payment:</span>
                  <span className="font-medium">{formatCurrency(calculations.totalMonthlyBuying)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total costs ({yearsToCompare}yr):</span>
                  <span className="font-medium">{formatCurrency(calculations.totalBuyingCosts)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Property value:</span>
                  <span className="font-medium text-green-600">{formatCurrency(calculations.futurePropertyValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Equity built:</span>
                  <span className="font-medium text-primary">{formatCurrency(calculations.equityBuilt)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium text-sm text-muted-foreground mb-3">If You Rent</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Current rent:</span>
                  <span className="font-medium">{formatCurrency(monthlyRent)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total rent ({yearsToCompare}yr):</span>
                  <span className="font-medium">{formatCurrency(calculations.totalRentPaid)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Property value:</span>
                  <span className="font-medium text-muted-foreground">₪0</span>
                </div>
                <div className="flex justify-between">
                  <span>Equity built:</span>
                  <span className="font-medium text-muted-foreground">₪0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
