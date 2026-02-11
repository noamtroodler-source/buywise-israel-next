import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, Percent, PiggyBank, Info, Building2, AlertTriangle } from 'lucide-react';
import { 
  calculateGrossYield, 
  calculateNetYield, 
  calculateCashOnCash,
  projectMultiYearROI,
  calculateRentalIncomeTax 
} from '@/lib/calculations/rentalYield';
import { calculateMortgagePayment } from '@/lib/calculations/mortgage';
import { useCities } from '@/hooks/useCities';

export function InvestmentROICalculator() {
  const [purchasePrice, setPurchasePrice] = useState(2000000);
  const [monthlyRent, setMonthlyRent] = useState(7000);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [downPaymentPercent, setDownPaymentPercent] = useState(50); // Investors need 50%
  const [appreciation, setAppreciation] = useState(4);
  const [holdingYears, setHoldingYears] = useState(10);
  
  // Vacancy & Maintenance
  const [vacancyRate, setVacancyRate] = useState(5);
  const [maintenancePercent, setMaintenancePercent] = useState(1);
  
  // Monthly costs
  const [monthlyArnona, setMonthlyArnona] = useState(500);
  const [monthlyVaadBayit, setMonthlyVaadBayit] = useState(350);
  const [monthlyInsurance, setMonthlyInsurance] = useState(150);
  
  // Tax method
  const [taxMethod, setTaxMethod] = useState<'exemption' | 'flat_10' | 'progressive'>('flat_10');
  const [marginalTaxRate, setMarginalTaxRate] = useState(35);
  
  // Mortgage
  const [useLeverage, setUseLeverage] = useState(true);
  const [mortgageRate, setMortgageRate] = useState(5.5);
  const [mortgageTerm, setMortgageTerm] = useState(20);

  const { data: cities } = useCities();

  const selectedCityData = useMemo(() => {
    return cities?.find(c => c.slug === selectedCity);
  }, [cities, selectedCity]);

  const calculations = useMemo(() => {
    const annualRent = monthlyRent * 12;
    const downPayment = purchasePrice * (downPaymentPercent / 100);
    const loanAmount = purchasePrice - downPayment;
    
    // Calculate mortgage payment if using leverage
    const mortgagePayment = useLeverage && loanAmount > 0
      ? calculateMortgagePayment(loanAmount, mortgageRate, mortgageTerm)
      : { monthlyPayment: 0, totalPayment: 0, totalInterest: 0 };
    
    // Calculate vacancy loss
    const vacancyLoss = annualRent * (vacancyRate / 100);
    const effectiveRent = annualRent - vacancyLoss;
    
    // Operating expenses
    const monthlyOperatingCosts = monthlyArnona + monthlyVaadBayit + monthlyInsurance;
    const annualOperatingCosts = monthlyOperatingCosts * 12;
    const maintenanceCost = purchasePrice * (maintenancePercent / 100);
    
    // Net Operating Income (before mortgage and taxes)
    const netOperatingIncome = effectiveRent - annualOperatingCosts - maintenanceCost;
    
    // Calculate tax based on method
    const taxCalc = calculateRentalIncomeTax(monthlyRent, taxMethod);
    const annualTax = taxCalc.annualTax;
    
    // Annual cash flow after all expenses and mortgage
    const annualMortgagePayments = mortgagePayment.monthlyPayment * 12;
    const annualCashFlow = netOperatingIncome - annualMortgagePayments - annualTax;
    
    // Yields
    const grossYieldValue = calculateGrossYield(purchasePrice, monthlyRent);
    const totalExpenses = annualOperatingCosts + maintenanceCost + vacancyLoss;
    const netYieldResult = calculateNetYield(purchasePrice, monthlyRent, totalExpenses);
    
    // Cash-on-Cash Return (needs 3 args: downPayment, closingCosts, annualCashFlow)
    const closingCostsEstimate = purchasePrice * 0.05; // ~5% estimate
    const cashOnCash = calculateCashOnCash(downPayment, closingCostsEstimate, annualCashFlow);
    
    // Multi-year projection
    const projection = projectMultiYearROI({
      purchasePrice,
      monthlyRent,
      appreciationRate: appreciation / 100,
      years: holdingYears,
      expenses: {
        arnona: monthlyArnona * 12,
        vaadBayit: monthlyVaadBayit * 12,
        insurance: monthlyInsurance * 12,
        maintenance: maintenanceCost,
        vacancy: vacancyLoss,
        tax: annualTax,
      },
      mortgagePayment: annualMortgagePayments,
      downPayment,
    });
    
    // Cap Rate (based on purchase price, not cash invested)
    const capRate = (netOperatingIncome / purchasePrice) * 100;
    
    // Calculate summary from projection
    const lastYear = projection[projection.length - 1];
    const futureValue = lastYear?.propertyValue || purchasePrice;
    const totalRentalIncome = projection.reduce((sum, p) => sum + p.netCashFlow, 0);
    const equityGain = futureValue - purchasePrice;
    const totalROI = lastYear?.roi || 0;
    const annualizedReturn = holdingYears > 0 ? (Math.pow(1 + totalROI / 100, 1 / holdingYears) - 1) * 100 : 0;
    
    // Compare to city benchmark
    const cityBenchmarkYield = selectedCityData?.gross_yield_percent || 3.5;
    const yieldVsBenchmark = grossYieldValue - cityBenchmarkYield;

    return {
      grossYield: grossYieldValue,
      netYield: netYieldResult.netYield,
      capRate,
      cashOnCash,
      annualRent,
      effectiveRent,
      netOperatingIncome,
      annualCashFlow,
      annualTax,
      taxMethod: taxCalc.method,
      taxDetails: taxCalc,
      mortgagePayment: mortgagePayment.monthlyPayment,
      downPayment,
      loanAmount,
      projection: {
        years: projection,
        futureValue,
        totalRentalIncome,
        equityGain,
        totalROI,
        annualizedReturn,
      },
      cityBenchmarkYield,
      yieldVsBenchmark,
    };
  }, [purchasePrice, monthlyRent, downPaymentPercent, appreciation, holdingYears,
      vacancyRate, maintenancePercent, monthlyArnona, monthlyVaadBayit, monthlyInsurance,
      taxMethod, marginalTaxRate, useLeverage, mortgageRate, mortgageTerm, selectedCityData]);

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
          Investment ROI Calculator (מחשבון תשואה להשקעה)
        </CardTitle>
        <CardDescription>
          Comprehensive investment analysis with vacancy, taxes, leverage, and multi-year projections
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="space-y-5">
            {/* Basic Inputs */}
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
              <Label>Expected Monthly Rent: {formatCurrency(monthlyRent)}</Label>
              <Slider
                value={[monthlyRent]}
                onValueChange={([value]) => setMonthlyRent(value)}
                min={2000}
                max={30000}
                step={500}
              />
            </div>

            <div className="space-y-2">
              <Label>City (for benchmark comparison)</Label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {cities?.map((city) => (
                    <SelectItem key={city.id} value={city.slug}>
                      {city.name} {city.gross_yield_percent && `(avg ${city.gross_yield_percent}%)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vacancy & Maintenance */}
            <div className="p-4 rounded-lg bg-muted/50 space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Vacancy & Maintenance
              </h4>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">Vacancy Rate</Label>
                  <span className="text-sm font-medium">{vacancyRate}%</span>
                </div>
                <Slider
                  value={[vacancyRate]}
                  onValueChange={([value]) => setVacancyRate(value)}
                  min={0}
                  max={15}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">Annual Maintenance (% of value)</Label>
                  <span className="text-sm font-medium">{maintenancePercent}%</span>
                </div>
                <Slider
                  value={[maintenancePercent]}
                  onValueChange={([value]) => setMaintenancePercent(value)}
                  min={0}
                  max={3}
                  step={0.25}
                />
              </div>
            </div>

            {/* Monthly Costs */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Arnona/mo</Label>
                <Slider
                  value={[monthlyArnona]}
                  onValueChange={([value]) => setMonthlyArnona(value)}
                  min={0}
                  max={2000}
                  step={50}
                />
                <span className="text-xs text-muted-foreground">{formatCurrency(monthlyArnona)}</span>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Vaad/mo</Label>
                <Slider
                  value={[monthlyVaadBayit]}
                  onValueChange={([value]) => setMonthlyVaadBayit(value)}
                  min={0}
                  max={1000}
                  step={50}
                />
                <span className="text-xs text-muted-foreground">{formatCurrency(monthlyVaadBayit)}</span>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Insurance/mo</Label>
                <Slider
                  value={[monthlyInsurance]}
                  onValueChange={([value]) => setMonthlyInsurance(value)}
                  min={0}
                  max={500}
                  step={25}
                />
                <span className="text-xs text-muted-foreground">{formatCurrency(monthlyInsurance)}</span>
              </div>
            </div>

            {/* Rental Income Tax */}
            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
              <h4 className="font-semibold">Rental Income Tax Method</h4>
              <Select value={taxMethod} onValueChange={(v) => setTaxMethod(v as typeof taxMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exemption">
                    Tax-Free (up to ₪5,471/mo)
                  </SelectItem>
                  <SelectItem value="flat_10">
                    10% Flat Tax (no deductions)
                  </SelectItem>
                  <SelectItem value="progressive">
                    Progressive (with deductions)
                  </SelectItem>
                </SelectContent>
              </Select>
              
              {taxMethod === 'progressive' && (
                <div className="space-y-2">
                  <Label className="text-sm">Marginal Tax Rate: {marginalTaxRate}%</Label>
                  <Slider
                    value={[marginalTaxRate]}
                    onValueChange={([value]) => setMarginalTaxRate(value)}
                    min={10}
                    max={50}
                    step={1}
                  />
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                Annual tax: {formatCurrency(calculations.annualTax)} ({calculations.taxMethod})
              </p>
            </div>

            {/* Leverage */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label>Use Mortgage (Leverage)</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Investors limited to 50% LTV by Bank of Israel
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Switch checked={useLeverage} onCheckedChange={setUseLeverage} />
              </div>

              {useLeverage && (
                <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-sm">Down Payment</Label>
                      <span className="text-sm font-medium">{downPaymentPercent}%</span>
                    </div>
                    <Slider
                      value={[downPaymentPercent]}
                      onValueChange={([value]) => setDownPaymentPercent(Math.max(50, value))}
                      min={50}
                      max={100}
                      step={5}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Rate: {mortgageRate}%</Label>
                      <Slider
                        value={[mortgageRate]}
                        onValueChange={([value]) => setMortgageRate(value)}
                        min={3}
                        max={10}
                        step={0.1}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Term: {mortgageTerm} yrs</Label>
                      <Slider
                        value={[mortgageTerm]}
                        onValueChange={([value]) => setMortgageTerm(value)}
                        min={5}
                        max={25}
                        step={1}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Appreciation & Holding Period */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Appreciation: {appreciation}%/yr</Label>
                <Slider
                  value={[appreciation]}
                  onValueChange={([value]) => setAppreciation(value)}
                  min={0}
                  max={10}
                  step={0.5}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Hold: {holdingYears} years</Label>
                <Slider
                  value={[holdingYears]}
                  onValueChange={([value]) => setHoldingYears(value)}
                  min={1}
                  max={20}
                  step={1}
                />
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-primary/10 text-center">
                <Percent className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold text-primary">{calculations.grossYield.toFixed(2)}%</p>
                <p className="text-sm text-muted-foreground">Gross Yield</p>
              </div>
              <div className="p-4 rounded-lg bg-primary/10 text-center">
                <Percent className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold text-primary">{calculations.netYield.toFixed(2)}%</p>
                <p className="text-sm text-muted-foreground">Net Yield</p>
              </div>
            </div>

            {/* City Benchmark Comparison */}
            {selectedCity && (
              <Alert variant={calculations.yieldVsBenchmark >= 0 ? 'default' : 'default'} 
                     className={calculations.yieldVsBenchmark >= 0 ? 'bg-semantic-green border-semantic-green text-semantic-green-foreground' : 'bg-semantic-red border-semantic-red text-semantic-red-foreground'}>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {calculations.yieldVsBenchmark >= 0 ? (
                    <span>
                      {calculations.yieldVsBenchmark.toFixed(2)}% above {selectedCityData?.name} average yield
                    </span>
                  ) : (
                    <span>
                      {Math.abs(calculations.yieldVsBenchmark).toFixed(2)}% below {selectedCityData?.name} average yield
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Cap Rate & Cash-on-Cash */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted text-center">
                <p className="text-2xl font-bold">{calculations.capRate.toFixed(2)}%</p>
                <p className="text-sm text-muted-foreground">Cap Rate</p>
              </div>
              <div className="p-4 rounded-lg bg-accent text-center">
                <PiggyBank className="h-6 w-6 mx-auto mb-2 text-accent-foreground" />
                <p className="text-2xl font-bold">{calculations.cashOnCash.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Cash-on-Cash</p>
              </div>
            </div>

            {/* Annual Cash Flow */}
            <div className="p-4 rounded-lg border">
              <h4 className="font-semibold mb-3">Annual Cash Flow</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gross Rent:</span>
                  <span className="font-medium">{formatCurrency(calculations.annualRent)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>- Vacancy ({vacancyRate}%):</span>
                  <span>-{formatCurrency(calculations.annualRent - calculations.effectiveRent)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Net Operating Income:</span>
                  <span className="font-medium">{formatCurrency(calculations.netOperatingIncome)}</span>
                </div>
                {useLeverage && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>- Mortgage Payments:</span>
                    <span>-{formatCurrency(calculations.mortgagePayment * 12)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>- Tax ({calculations.taxMethod}):</span>
                  <span>-{formatCurrency(calculations.annualTax)}</span>
                </div>
                <hr />
                <div className="flex justify-between font-semibold">
                  <span>Annual Cash Flow:</span>
                  <span className={calculations.annualCashFlow >= 0 ? 'text-semantic-green' : 'text-semantic-red'}>
                    {formatCurrency(calculations.annualCashFlow)}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Monthly Cash Flow:</span>
                  <span>{formatCurrency(calculations.annualCashFlow / 12)}</span>
                </div>
              </div>
            </div>

            {/* Multi-Year Projection */}
            <div className="p-4 rounded-lg border">
              <h4 className="font-semibold mb-3">{holdingYears}-Year Projection</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Future Property Value:</span>
                  <span className="font-medium">{formatCurrency(calculations.projection.futureValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Rental Income:</span>
                  <span className="font-medium text-semantic-green">{formatCurrency(calculations.projection.totalRentalIncome)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Appreciation:</span>
                  <span className="font-medium text-semantic-green">{formatCurrency(calculations.projection.equityGain)}</span>
                </div>
                <hr />
                <div className="flex justify-between font-semibold">
                  <span>Total Return on Investment:</span>
                  <span className="text-primary">{calculations.projection.totalROI.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Annualized Return:</span>
                  <span>{calculations.projection.annualizedReturn.toFixed(2)}%</span>
                </div>
              </div>
            </div>

            {/* Investment Summary */}
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-semibold mb-2">Investment Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Cash Invested:</span>
                  <p className="font-medium">{formatCurrency(calculations.downPayment)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Loan Amount:</span>
                  <p className="font-medium">{formatCurrency(calculations.loanAmount)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
