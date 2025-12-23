import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Receipt, Info, Check, TrendingUp, 
  AlertTriangle, DollarSign 
} from 'lucide-react';
import { 
  calculateRentalIncomeTax, 
  compareRentalTaxMethods,
  calculateGrossYield 
} from '@/lib/calculations/rentalYield';
import { useCities } from '@/hooks/useCities';

const TAX_FREE_THRESHOLD = 5471; // 2024 threshold

export function RentalIncomeCalculator() {
  const [monthlyRent, setMonthlyRent] = useState(7000);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [propertyValue, setPropertyValue] = useState(2000000);
  const [marginalTaxRate, setMarginalTaxRate] = useState(35);
  
  // Deductible expenses (for progressive method)
  const [annualMaintenance, setAnnualMaintenance] = useState(10000);
  const [annualDepreciation, setAnnualDepreciation] = useState(0);
  const [annualInterest, setAnnualInterest] = useState(0);
  const [otherDeductions, setOtherDeductions] = useState(0);

  const { data: cities } = useCities();

  const selectedCityData = useMemo(() => {
    return cities?.find(c => c.slug === selectedCity);
  }, [cities, selectedCity]);

  const calculations = useMemo(() => {
    const annualRent = monthlyRent * 12;
    const totalDeductions = annualMaintenance + annualDepreciation + annualInterest + otherDeductions;
    
    // Calculate tax for all 3 methods
    const exemptionCalc = calculateRentalIncomeTax(monthlyRent, 'exemption', marginalTaxRate / 100);
    const flat10Calc = calculateRentalIncomeTax(monthlyRent, 'flat_10', marginalTaxRate / 100);
    const progressiveCalc = calculateRentalIncomeTax(monthlyRent, 'progressive', marginalTaxRate / 100, totalDeductions);
    
    // Compare all methods
    const comparison = compareRentalTaxMethods(monthlyRent, marginalTaxRate / 100, totalDeductions);
    
    // Find best method
    const methods = [
      { method: 'exemption' as const, tax: exemptionCalc.annualTax, name: 'Tax Exemption', calc: exemptionCalc },
      { method: 'flat_10' as const, tax: flat10Calc.annualTax, name: '10% Flat Tax', calc: flat10Calc },
      { method: 'progressive' as const, tax: progressiveCalc.annualTax, name: 'Progressive', calc: progressiveCalc },
    ];
    const bestMethod = methods.reduce((best, current) => 
      current.tax < best.tax ? current : best
    );
    
    // Calculate break-even rent for exemption
    const breakEvenRent = TAX_FREE_THRESHOLD;
    const aboveExemption = monthlyRent - TAX_FREE_THRESHOLD;
    
    // City yield benchmark
    const grossYieldValue = calculateGrossYield(propertyValue, monthlyRent);
    const cityBenchmarkYield = selectedCityData?.gross_yield_percent || 3.5;
    
    // Net yield after tax (using best method)
    const netAfterTax = annualRent - bestMethod.tax;
    const netYieldAfterTax = (netAfterTax / propertyValue) * 100;

    return {
      annualRent,
      totalDeductions,
      exemption: exemptionCalc,
      flat10: flat10Calc,
      progressive: progressiveCalc,
      bestMethod,
      methods,
      breakEvenRent,
      aboveExemption,
      grossYield: grossYieldValue,
      cityBenchmarkYield,
      netYieldAfterTax,
      comparison,
    };
  }, [monthlyRent, marginalTaxRate, annualMaintenance, annualDepreciation, 
      annualInterest, otherDeductions, propertyValue, selectedCityData]);

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
          <Receipt className="h-5 w-5 text-primary" />
          Rental Income Tax Calculator (מס הכנסה משכירות)
        </CardTitle>
        <CardDescription>
          Compare all 3 tax methods for rental income: Exemption, 10% Flat, and Progressive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Monthly Rent: {formatCurrency(monthlyRent)}</Label>
              <Slider
                value={[monthlyRent]}
                onValueChange={([value]) => setMonthlyRent(value)}
                min={2000}
                max={30000}
                step={500}
              />
              <Input
                type="number"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(Number(e.target.value))}
                min={0}
              />
            </div>

            <div className="space-y-2">
              <Label>Property Value (for yield calculation)</Label>
              <Slider
                value={[propertyValue]}
                onValueChange={([value]) => setPropertyValue(value)}
                min={500000}
                max={10000000}
                step={50000}
              />
              <p className="text-xs text-muted-foreground">{formatCurrency(propertyValue)}</p>
            </div>

            <div className="space-y-2">
              <Label>City (for yield benchmark)</Label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {cities?.map((city) => (
                    <SelectItem key={city.id} value={city.slug}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label>Marginal Tax Rate (for progressive)</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    Your highest income tax bracket. Used for progressive tax calculation.
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center gap-2">
                <Slider
                  value={[marginalTaxRate]}
                  onValueChange={([value]) => setMarginalTaxRate(value)}
                  min={10}
                  max={50}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12">{marginalTaxRate}%</span>
              </div>
            </div>

            {/* Deductions for Progressive */}
            <div className="p-4 rounded-lg bg-muted/50 space-y-4">
              <h4 className="font-semibold">Deductible Expenses (for Progressive)</h4>
              <p className="text-xs text-muted-foreground">
                Only relevant if choosing progressive tax method
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Maintenance/yr</Label>
                  <Input
                    type="number"
                    value={annualMaintenance}
                    onChange={(e) => setAnnualMaintenance(Number(e.target.value))}
                    min={0}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Depreciation/yr</Label>
                  <Input
                    type="number"
                    value={annualDepreciation}
                    onChange={(e) => setAnnualDepreciation(Number(e.target.value))}
                    min={0}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Mortgage Interest/yr</Label>
                  <Input
                    type="number"
                    value={annualInterest}
                    onChange={(e) => setAnnualInterest(Number(e.target.value))}
                    min={0}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Other Deductions/yr</Label>
                  <Input
                    type="number"
                    value={otherDeductions}
                    onChange={(e) => setOtherDeductions(Number(e.target.value))}
                    min={0}
                  />
                </div>
              </div>
              
              <p className="text-sm">
                Total Deductions: <strong>{formatCurrency(calculations.totalDeductions)}</strong>
              </p>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            {/* Best Method Recommendation */}
            <div className="p-4 rounded-lg bg-primary text-primary-foreground">
              <div className="flex items-center gap-2 mb-2">
                <Check className="h-5 w-5" />
                <span className="font-semibold">Recommended: {calculations.bestMethod.name}</span>
              </div>
              <p className="text-3xl font-bold">{formatCurrency(calculations.bestMethod.tax)}/year</p>
              <p className="text-sm opacity-90">
                ({formatCurrency(calculations.bestMethod.tax / 12)}/month in taxes)
              </p>
            </div>

            {/* Break-even Alert */}
            {monthlyRent <= TAX_FREE_THRESHOLD && (
              <Alert className="bg-green-50 border-green-200">
                <Check className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Your rent is below the ₪{TAX_FREE_THRESHOLD.toLocaleString()} exemption threshold. 
                  <strong> You pay ₪0 in tax!</strong>
                </AlertDescription>
              </Alert>
            )}

            {monthlyRent > TAX_FREE_THRESHOLD && (
              <Alert variant="default" className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  You're {formatCurrency(calculations.aboveExemption)} above the tax-free threshold. 
                  Consider the 10% flat tax method.
                </AlertDescription>
              </Alert>
            )}

            {/* Compare All 3 Methods */}
            <div className="p-4 rounded-lg border space-y-3">
              <h4 className="font-semibold">Compare All Tax Methods</h4>
              
              {calculations.methods.map((method) => {
                const isBest = method.method === calculations.bestMethod.method;
                const savings = method.tax - calculations.bestMethod.tax;
                
                return (
                  <div 
                    key={method.method}
                    className={`p-3 rounded-lg ${isBest ? 'bg-primary/10 border border-primary/30' : 'bg-muted/30'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {isBest && <Check className="h-4 w-4 text-primary" />}
                        <span className={isBest ? 'font-semibold' : 'text-muted-foreground'}>
                          {method.name}
                        </span>
                        {isBest && <Badge variant="secondary" className="text-xs">Best</Badge>}
                      </div>
                      <div className="text-right">
                        <span className={`font-semibold ${isBest ? 'text-primary' : ''}`}>
                          {formatCurrency(method.tax)}/yr
                        </span>
                        {!isBest && savings > 0 && (
                          <span className="text-xs text-red-600 ml-2">
                            +{formatCurrency(savings)}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {method.method === 'exemption' && `Tax-free up to ₪${TAX_FREE_THRESHOLD.toLocaleString()}/mo`}
                      {method.method === 'flat_10' && '10% on gross rent, no deductions allowed'}
                      {method.method === 'progressive' && `${marginalTaxRate}% on net income after deductions`}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Yield Analysis */}
            <div className="p-4 rounded-lg border space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Yield Analysis
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gross Yield:</span>
                  <span className="font-medium">{calculations.grossYield.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Net Yield (after tax):</span>
                  <span className="font-medium text-primary">{calculations.netYieldAfterTax.toFixed(2)}%</span>
                </div>
                {selectedCity && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{selectedCityData?.name} Average:</span>
                    <span className="font-medium">{calculations.cityBenchmarkYield.toFixed(2)}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Tax Method Explainer */}
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground">Understanding the 3 Methods</summary>
              <div className="mt-2 p-3 bg-muted/50 rounded space-y-2">
                <p><strong>1. Tax Exemption (פטור):</strong></p>
                <p>Tax-free if rent ≤ ₪{TAX_FREE_THRESHOLD.toLocaleString()}/month. Above this, partial exemption applies with gradual phase-out.</p>
                
                <p className="mt-2"><strong>2. 10% Flat Tax (מס בשיעור 10%):</strong></p>
                <p>Pay 10% on gross rent, no deductions allowed. Simple but may be expensive for high-expense properties.</p>
                
                <p className="mt-2"><strong>3. Progressive Tax (שיעורי מס רגילים):</strong></p>
                <p>Pay your marginal rate on NET income (after deducting expenses like maintenance, depreciation, interest). Best for properties with high expenses.</p>
              </div>
            </details>

            {/* Annual Summary */}
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-semibold mb-2">Annual Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Gross Rental Income:</span>
                  <span className="font-medium">{formatCurrency(calculations.annualRent)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>- Tax ({calculations.bestMethod.name}):</span>
                  <span>-{formatCurrency(calculations.bestMethod.tax)}</span>
                </div>
                <hr className="my-1" />
                <div className="flex justify-between font-semibold">
                  <span>Net After Tax:</span>
                  <span className="text-green-600">{formatCurrency(calculations.annualRent - calculations.bestMethod.tax)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
