import { useState, useMemo, useEffect } from 'react';
import { TrendingUp, Info, Building2, DollarSign, PiggyBank, Scale, Calendar, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ToolLayout } from './shared/ToolLayout';
import { ToolDisclaimer } from './shared/ToolDisclaimer';
import { ToolFeedback } from './shared/ToolFeedback';
import { useAllCanonicalMetrics, getRentalRange } from '@/hooks/useCanonicalMetrics';
import { useCities } from '@/hooks/useCities';
import { usePreferences } from '@/contexts/PreferencesContext';
import { 
  calculateGrossYield, 
  calculateRentalIncomeTax,
  findOptimalTaxMethod,
  projectMultiYearROI,
  getVacancyRate,
} from '@/lib/calculations/rentalYield';
import { calculateMortgagePayment } from '@/lib/calculations/mortgage';
import { cn } from '@/lib/utils';

function InfoTooltip({ content }: { content: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-help inline ml-1" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-sm"><p>{content}</p></TooltipContent>
    </Tooltip>
  );
}

function calculateInvestmentGrade(netYield: number, cashOnCash: number, appreciation: number): { grade: string; label: string; color: string } {
  const score = (netYield * 0.4) + (cashOnCash * 0.15) + (appreciation * 0.45);
  if (score >= 8) return { grade: 'A+', label: 'Excellent Investment', color: 'text-green-600 bg-green-50 border-green-200' };
  if (score >= 6.5) return { grade: 'A', label: 'Strong Investment', color: 'text-green-600 bg-green-50 border-green-200' };
  if (score >= 5) return { grade: 'B+', label: 'Good Investment', color: 'text-blue-600 bg-blue-50 border-blue-200' };
  if (score >= 4) return { grade: 'B', label: 'Solid Investment', color: 'text-blue-600 bg-blue-50 border-blue-200' };
  if (score >= 3) return { grade: 'C+', label: 'Moderate Investment', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
  if (score >= 2) return { grade: 'C', label: 'Fair Investment', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
  return { grade: 'D', label: 'Weak Investment', color: 'text-red-600 bg-red-50 border-red-200' };
}

export function InvestmentReturnCalculator() {
  const { currency, exchangeRate } = usePreferences();
  const { data: canonicalMetrics } = useAllCanonicalMetrics();
  const { data: cities } = useCities();
  
  const [purchasePrice, setPurchasePrice] = useState(2500000);
  const [selectedCity, setSelectedCity] = useState('tel-aviv');
  const [propertySizeSqm, setPropertySizeSqm] = useState(85);
  const [rooms, setRooms] = useState(3);
  const [monthlyRent, setMonthlyRent] = useState(8000);
  const [vacancyRate, setVacancyRate] = useState(5);
  const [expensesOpen, setExpensesOpen] = useState(false);
  const [monthlyArnona, setMonthlyArnona] = useState(450);
  const [monthlyVaadBayit, setMonthlyVaadBayit] = useState(350);
  const [monthlyInsurance, setMonthlyInsurance] = useState(150);
  const [maintenancePercent, setMaintenancePercent] = useState(1);
  const [usePropertyManagement, setUsePropertyManagement] = useState(false);
  const [managementFeePercent, setManagementFeePercent] = useState(8);
  const [useLeverage, setUseLeverage] = useState(true);
  const [buyerType, setBuyerType] = useState<'investor' | 'foreign' | 'oleh'>('investor');
  const [downPaymentPercent, setDownPaymentPercent] = useState(50);
  const [interestRate, setInterestRate] = useState(4.5);
  const [loanTermYears, setLoanTermYears] = useState(20);
  const [taxOpen, setTaxOpen] = useState(false);
  const [taxMethod, setTaxMethod] = useState<'exemption' | 'flat_10' | 'progressive'>('flat_10');
  const [holdingPeriod, setHoldingPeriod] = useState(10);
  const [appreciationRate, setAppreciationRate] = useState(4);
  const [projectionOpen, setProjectionOpen] = useState(false);
  
  const cityMetrics = useMemo(() => canonicalMetrics?.find(m => m.city_slug === selectedCity), [canonicalMetrics, selectedCity]);
  const cityData = useMemo(() => cities?.find(c => c.slug === selectedCity), [cities, selectedCity]);
  
  useEffect(() => {
    if (cityMetrics?.arnona_rate_sqm) {
      setMonthlyArnona(Math.round((cityMetrics.arnona_rate_sqm * propertySizeSqm) / 12));
    }
  }, [cityMetrics, propertySizeSqm]);
  
  const suggestedRent = useMemo(() => {
    if (!cityMetrics) return null;
    const range = getRentalRange(cityMetrics, rooms);
    return range.min && range.max ? Math.round((range.min + range.max) / 2) : null;
  }, [cityMetrics, rooms]);
  
  useEffect(() => { setVacancyRate(getVacancyRate(selectedCity) * 100); }, [selectedCity]);
  
  const maxLTV = useMemo(() => buyerType === 'oleh' ? 75 : 50, [buyerType]);
  useEffect(() => { if (downPaymentPercent < (100 - maxLTV)) setDownPaymentPercent(100 - maxLTV); }, [maxLTV, downPaymentPercent]);
  
  const calculations = useMemo(() => {
    const annualRent = monthlyRent * 12;
    const vacancyLoss = annualRent * (vacancyRate / 100);
    const effectiveGrossIncome = annualRent - vacancyLoss;
    const annualArnona = monthlyArnona * 12;
    const annualVaadBayit = monthlyVaadBayit * 12;
    const annualInsurance = monthlyInsurance * 12;
    const annualMaintenance = purchasePrice * (maintenancePercent / 100);
    const annualManagement = usePropertyManagement ? (effectiveGrossIncome * (managementFeePercent / 100)) : 0;
    const totalOperatingExpenses = annualArnona + annualVaadBayit + annualInsurance + annualMaintenance + annualManagement;
    const noi = effectiveGrossIncome - totalOperatingExpenses;
    const taxResult = calculateRentalIncomeTax(monthlyRent, taxMethod);
    const annualTax = taxResult.annualTax;
    const netIncomeAfterTax = noi - annualTax;
    const downPayment = purchasePrice * (downPaymentPercent / 100);
    const loanAmount = useLeverage ? purchasePrice - downPayment : 0;
    const mortgageResult = useLeverage ? calculateMortgagePayment(loanAmount, interestRate, loanTermYears) : null;
    const monthlyMortgage = mortgageResult?.monthlyPayment ?? 0;
    const annualMortgage = monthlyMortgage * 12;
    const annualCashFlow = netIncomeAfterTax - annualMortgage;
    const monthlyCashFlow = annualCashFlow / 12;
    const grossYield = calculateGrossYield(purchasePrice, monthlyRent);
    const netYield = (noi / purchasePrice) * 100;
    const capRate = (noi / purchasePrice) * 100;
    const closingCosts = purchasePrice * 0.08;
    const totalCashInvested = useLeverage ? downPayment + closingCosts : purchasePrice + closingCosts;
    const cashOnCash = useLeverage ? (annualCashFlow / totalCashInvested) * 100 : (netIncomeAfterTax / totalCashInvested) * 100;
    const taxComparison = findOptimalTaxMethod(monthlyRent);
    const projection = projectMultiYearROI({
      purchasePrice, monthlyRent, appreciationRate: appreciationRate / 100, years: holdingPeriod,
      expenses: { arnona: annualArnona, vaadBayit: annualVaadBayit, insurance: annualInsurance, maintenance: annualMaintenance, vacancy: vacancyLoss, tax: annualTax },
      mortgagePayment: annualMortgage, downPayment: totalCashInvested,
    });
    const finalYear = projection[projection.length - 1];
    const totalReturn = finalYear.totalReturn;
    const annualizedROI = Math.pow((finalYear.propertyValue + finalYear.cumulativeCashFlow) / totalCashInvested, 1 / holdingPeriod) - 1;
    const grade = calculateInvestmentGrade(netYield, cashOnCash, appreciationRate);
    
    return { vacancyLoss, totalOperatingExpenses, noi, annualTax, annualMaintenance, annualManagement, monthlyMortgage, monthlyCashFlow, downPayment, loanAmount, closingCosts, totalCashInvested, grossYield, netYield, capRate, cashOnCash, taxComparison, projection, finalYear, totalReturn, annualizedROI: annualizedROI * 100, grade };
  }, [purchasePrice, monthlyRent, vacancyRate, monthlyArnona, monthlyVaadBayit, monthlyInsurance, maintenancePercent, usePropertyManagement, managementFeePercent, useLeverage, downPaymentPercent, interestRate, loanTermYears, taxMethod, holdingPeriod, appreciationRate]);
  
  const formatCurrency = (value: number) => currency === 'USD' ? `$${Math.round(value / exchangeRate).toLocaleString()}` : `₪${Math.round(value).toLocaleString()}`;
  const parseNumericInput = (value: string): number => parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
  const availableCities = useMemo(() => canonicalMetrics?.filter(m => m.median_apartment_price).map(m => ({ slug: m.city_slug, name: m.city_slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), grossYield: m.gross_yield_percent })).sort((a, b) => a.name.localeCompare(b.name)) || [], [canonicalMetrics]);

  const leftColumn = (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4"><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" />Property Basics</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center">Purchase Price<InfoTooltip content="The total purchase price of the investment property." /></Label>
            <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₪</span><Input type="text" value={purchasePrice.toLocaleString()} onChange={(e) => setPurchasePrice(parseNumericInput(e.target.value))} className="pl-8 h-11 tabular-nums" /></div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center">City<InfoTooltip content="Select a city to auto-populate local market data." /></Label>
            <Select value={selectedCity} onValueChange={setSelectedCity}><SelectTrigger className="h-11"><SelectValue placeholder="Select city" /></SelectTrigger><SelectContent>{availableCities.map(city => (<SelectItem key={city.slug} value={city.slug}>{city.name}{city.grossYield && <span className="text-xs text-muted-foreground ml-2">{city.grossYield.toFixed(1)}% yield</span>}</SelectItem>))}</SelectContent></Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label className="text-sm font-medium">Size (sqm)</Label><Input type="number" value={propertySizeSqm} onChange={(e) => setPropertySizeSqm(parseInt(e.target.value) || 0)} className="h-11 tabular-nums" /></div>
            <div className="space-y-2"><Label className="text-sm font-medium">Rooms</Label><Select value={rooms.toString()} onValueChange={(v) => setRooms(parseInt(v))}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent>{[2, 3, 4, 5].map(r => (<SelectItem key={r} value={r.toString()}>{r} rooms</SelectItem>))}</SelectContent></Select></div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-4"><CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" />Rental Income</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between"><Label className="text-sm font-medium">Expected Monthly Rent</Label>{suggestedRent && <Badge variant="secondary" className="text-xs cursor-pointer" onClick={() => setMonthlyRent(suggestedRent)}>Market: ₪{suggestedRent.toLocaleString()}</Badge>}</div>
            <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₪</span><Input type="text" value={monthlyRent.toLocaleString()} onChange={(e) => setMonthlyRent(parseNumericInput(e.target.value))} className="pl-8 h-11 tabular-nums" /></div>
          </div>
          <div className="space-y-2"><Label className="text-sm font-medium">Vacancy Rate</Label><div className="relative"><Input type="number" value={vacancyRate} onChange={(e) => setVacancyRate(Math.min(15, Math.max(0, parseFloat(e.target.value) || 0)))} className="h-11 tabular-nums pr-8" min={0} max={15} step={1} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span></div></div>
        </CardContent>
      </Card>
      
      <Collapsible open={expensesOpen} onOpenChange={setExpensesOpen}>
        <Card>
          <CollapsibleTrigger asChild><CardHeader className="pb-4 cursor-pointer hover:bg-muted/30 transition-colors"><CardTitle className="text-base flex items-center justify-between"><span className="flex items-center gap-2"><PiggyBank className="h-4 w-4 text-primary" />Operating Expenses</span><div className="flex items-center gap-2"><span className="text-sm font-normal text-muted-foreground">{formatCurrency(calculations.totalOperatingExpenses)}/yr</span>{expensesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</div></CardTitle></CardHeader></CollapsibleTrigger>
          <CollapsibleContent><CardContent className="space-y-4 pt-0">
            <div className="space-y-2"><Label className="text-sm font-medium">Monthly Arnona<InfoTooltip content="Municipal property tax. Auto-calculated from city data." /></Label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₪</span><Input type="text" value={monthlyArnona.toLocaleString()} onChange={(e) => setMonthlyArnona(parseNumericInput(e.target.value))} className="pl-8 h-11 tabular-nums" /></div></div>
            <div className="space-y-2"><Label className="text-sm font-medium">Monthly Va'ad Bayit<InfoTooltip content="Building maintenance fee covering shared spaces." /></Label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₪</span><Input type="text" value={monthlyVaadBayit.toLocaleString()} onChange={(e) => setMonthlyVaadBayit(parseNumericInput(e.target.value))} className="pl-8 h-11 tabular-nums" /></div></div>
            <div className="space-y-2"><Label className="text-sm font-medium">Monthly Insurance</Label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₪</span><Input type="text" value={monthlyInsurance.toLocaleString()} onChange={(e) => setMonthlyInsurance(parseNumericInput(e.target.value))} className="pl-8 h-11 tabular-nums" /></div></div>
            <div className="space-y-2"><Label className="text-sm font-medium">Maintenance Reserve</Label><div className="relative"><Input type="number" value={maintenancePercent} onChange={(e) => setMaintenancePercent(Math.min(5, Math.max(0, parseFloat(e.target.value) || 0)))} className="h-11 tabular-nums pr-8" min={0} max={5} step={0.5} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span></div><p className="text-xs text-muted-foreground">= {formatCurrency(calculations.annualMaintenance)}/year</p></div>
            <div className="space-y-3"><div className="flex items-center justify-between"><Label className="text-sm font-medium">Property Management</Label><Switch checked={usePropertyManagement} onCheckedChange={setUsePropertyManagement} /></div>{usePropertyManagement && <div className="space-y-2 pl-4 border-l-2 border-primary/20"><Label className="text-sm text-muted-foreground">Management Fee</Label><div className="relative"><Input type="number" value={managementFeePercent} onChange={(e) => setManagementFeePercent(Math.min(15, Math.max(0, parseFloat(e.target.value) || 0)))} className="h-11 tabular-nums pr-8" min={0} max={15} step={1} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span></div></div>}</div>
          </CardContent></CollapsibleContent>
        </Card>
      </Collapsible>
      
      <Card>
        <CardHeader className="pb-4"><CardTitle className="text-base flex items-center gap-2"><Scale className="h-4 w-4 text-primary" />Financing</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between"><Label className="text-sm font-medium">Use Mortgage<InfoTooltip content="Leverage your investment with a mortgage." /></Label><Switch checked={useLeverage} onCheckedChange={setUseLeverage} /></div>
          {useLeverage && <div className="space-y-4 pt-2">
            <div className="space-y-2"><Label className="text-sm font-medium">Buyer Type<InfoTooltip content="Investors limited to 50% LTV. Olim can borrow up to 75%." /></Label><Select value={buyerType} onValueChange={(v) => setBuyerType(v as typeof buyerType)}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="investor">Israeli Investor (max 50% LTV)</SelectItem><SelectItem value="foreign">Foreign Buyer (max 50% LTV)</SelectItem><SelectItem value="oleh">Oleh Hadash (max 75% LTV)</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label className="text-sm font-medium">Down Payment</Label><div className="relative"><Input type="number" value={downPaymentPercent} onChange={(e) => setDownPaymentPercent(Math.min(100, Math.max(100 - maxLTV, parseFloat(e.target.value) || 0)))} className="h-11 tabular-nums pr-8" min={100 - maxLTV} max={100} step={5} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span></div><p className="text-xs text-muted-foreground">= {formatCurrency(calculations.downPayment)}</p></div>
            <div className="space-y-2"><Label className="text-sm font-medium">Interest Rate</Label><div className="relative"><Input type="number" value={interestRate} onChange={(e) => setInterestRate(Math.min(15, Math.max(0, parseFloat(e.target.value) || 0)))} className="h-11 tabular-nums pr-8" min={0} max={15} step={0.25} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span></div></div>
            <div className="space-y-2"><Label className="text-sm font-medium">Loan Term</Label><div className="relative"><Input type="number" value={loanTermYears} onChange={(e) => setLoanTermYears(Math.min(30, Math.max(1, parseInt(e.target.value) || 1)))} className="h-11 tabular-nums pr-16" min={1} max={30} step={1} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">years</span></div></div>
          </div>}
        </CardContent>
      </Card>
      
      <Collapsible open={taxOpen} onOpenChange={setTaxOpen}>
        <Card>
          <CollapsibleTrigger asChild><CardHeader className="pb-4 cursor-pointer hover:bg-muted/30 transition-colors"><CardTitle className="text-base flex items-center justify-between"><span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" />Tax Strategy</span>{taxOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</CardTitle></CardHeader></CollapsibleTrigger>
          <CollapsibleContent><CardContent className="space-y-4 pt-0">
            <div className="space-y-2"><Label className="text-sm font-medium">Tax Method<InfoTooltip content="Israel offers three rental income tax methods." /></Label><Select value={taxMethod} onValueChange={(v) => setTaxMethod(v as typeof taxMethod)}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="exemption">Tax-Free Exemption (up to ₪5,471/mo)</SelectItem><SelectItem value="flat_10">10% Flat Tax (simple)</SelectItem><SelectItem value="progressive">Progressive Tax (with deductions)</SelectItem></SelectContent></Select></div>
            <div className="rounded-lg bg-muted/30 p-3 space-y-2"><p className="text-xs font-medium text-muted-foreground">Annual Tax by Method</p><div className="space-y-1.5">{(['exemption', 'flat_10', 'progressive'] as const).map(method => { const result = calculations.taxComparison.comparison[method]; const isRecommended = method === calculations.taxComparison.recommended; return (<div key={method} className={cn("flex items-center justify-between text-sm py-1.5 px-2 rounded", method === taxMethod && "bg-primary/10", isRecommended && method !== taxMethod && "bg-green-50 dark:bg-green-950/20")}><span className="flex items-center gap-2">{method === 'exemption' && 'Exemption'}{method === 'flat_10' && '10% Flat'}{method === 'progressive' && 'Progressive'}{isRecommended && <Badge className="text-[10px] bg-green-100 text-green-700 hover:bg-green-100">Best</Badge>}</span><span className="tabular-nums font-medium">{formatCurrency(result.annualTax)}/yr</span></div>); })}</div></div>
          </CardContent></CollapsibleContent>
        </Card>
      </Collapsible>
      
      <Card>
        <CardHeader className="pb-4"><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />Projection Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label className="text-sm font-medium">Holding Period</Label><div className="relative"><Input type="number" value={holdingPeriod} onChange={(e) => setHoldingPeriod(Math.min(30, Math.max(1, parseInt(e.target.value) || 1)))} className="h-11 tabular-nums pr-16" min={1} max={30} step={1} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">years</span></div></div>
          <div className="space-y-2"><Label className="text-sm font-medium">Annual Appreciation</Label><div className="relative"><Input type="number" value={appreciationRate} onChange={(e) => setAppreciationRate(Math.min(20, Math.max(0, parseFloat(e.target.value) || 0)))} className="h-11 tabular-nums pr-8" min={0} max={20} step={0.5} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span></div>{cityData?.yoy_price_change && <p className="text-xs text-muted-foreground">Recent YoY change: {cityData.yoy_price_change > 0 ? '+' : ''}{cityData.yoy_price_change}%</p>}</div>
        </CardContent>
      </Card>
    </div>
  );
  
  const rightColumn = (
    <Card className="lg:sticky lg:top-4">
      <CardContent className="p-6 space-y-6">
        <div className="text-center pb-4 border-b"><div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full border text-lg font-bold mb-2", calculations.grade.color)}>{calculations.grade.grade}</div><p className="text-sm text-muted-foreground">{calculations.grade.label}</p></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1"><div className="flex items-center gap-1"><span className="text-xs text-muted-foreground">Gross Yield</span><InfoTooltip content="Annual rent divided by purchase price." /></div><p className="text-xl font-bold tabular-nums">{calculations.grossYield.toFixed(2)}%</p>{cityMetrics?.gross_yield_percent && <p className="text-xs text-muted-foreground">City avg: {cityMetrics.gross_yield_percent.toFixed(1)}%</p>}</div>
          <div className="space-y-1"><div className="flex items-center gap-1"><span className="text-xs text-muted-foreground">Net Yield</span><InfoTooltip content="Net operating income divided by purchase price." /></div><p className="text-xl font-bold tabular-nums">{calculations.netYield.toFixed(2)}%</p></div>
          <div className="space-y-1"><div className="flex items-center gap-1"><span className="text-xs text-muted-foreground">Cap Rate</span><InfoTooltip content="NOI / purchase price. Standard real estate metric." /></div><p className="text-xl font-bold tabular-nums">{calculations.capRate.toFixed(2)}%</p></div>
          <div className="space-y-1"><div className="flex items-center gap-1"><span className="text-xs text-muted-foreground">{useLeverage ? 'Cash-on-Cash' : 'ROI'}</span><InfoTooltip content="Annual cash flow divided by total cash invested." /></div><p className={cn("text-xl font-bold tabular-nums", calculations.cashOnCash >= 0 ? "text-green-600" : "text-red-600")}>{calculations.cashOnCash.toFixed(2)}%</p></div>
        </div>
        <Separator />
        <div><h4 className="text-sm font-semibold mb-3">Monthly Cash Flow</h4><div className="space-y-2 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Rental Income</span><span className="tabular-nums text-green-600">+{formatCurrency(monthlyRent)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Vacancy ({vacancyRate}%)</span><span className="tabular-nums text-red-600">-{formatCurrency(calculations.vacancyLoss / 12)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Expenses</span><span className="tabular-nums text-red-600">-{formatCurrency(calculations.totalOperatingExpenses / 12)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Tax ({taxMethod === 'flat_10' ? '10%' : taxMethod})</span><span className="tabular-nums text-red-600">-{formatCurrency(calculations.annualTax / 12)}</span></div>{useLeverage && <div className="flex justify-between"><span className="text-muted-foreground">Mortgage</span><span className="tabular-nums text-red-600">-{formatCurrency(calculations.monthlyMortgage)}</span></div>}<Separator className="my-2" /><div className="flex justify-between font-semibold"><span>Net Cash Flow</span><span className={cn("tabular-nums", calculations.monthlyCashFlow >= 0 ? "text-green-600" : "text-red-600")}>{calculations.monthlyCashFlow >= 0 ? '+' : ''}{formatCurrency(calculations.monthlyCashFlow)}</span></div></div></div>
        <Separator />
        <div><h4 className="text-sm font-semibold mb-3">After {holdingPeriod} Years</h4><div className="space-y-3"><div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Property Value</span><div className="text-right"><span className="font-semibold tabular-nums">{formatCurrency(calculations.finalYear.propertyValue)}</span><span className="text-xs text-green-600 ml-1">(+{((calculations.finalYear.propertyValue / purchasePrice - 1) * 100).toFixed(0)}%)</span></div></div><div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Total Cash Flow</span><span className={cn("font-semibold tabular-nums", calculations.finalYear.cumulativeCashFlow >= 0 ? "text-green-600" : "text-red-600")}>{calculations.finalYear.cumulativeCashFlow >= 0 ? '+' : ''}{formatCurrency(calculations.finalYear.cumulativeCashFlow)}</span></div><div className="bg-primary/10 rounded-lg p-3 text-center"><p className="text-xs text-muted-foreground mb-1">Annualized ROI</p><p className="text-2xl font-bold tabular-nums text-primary">{calculations.annualizedROI.toFixed(1)}%</p></div></div></div>
        <Separator />
        <div className="rounded-lg bg-muted/30 p-4 space-y-2"><h4 className="text-sm font-semibold">Cash to Close</h4><div className="space-y-1.5 text-sm">{useLeverage ? <><div className="flex justify-between"><span className="text-muted-foreground">Down Payment</span><span className="tabular-nums">{formatCurrency(calculations.downPayment)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Closing Costs (~8%)</span><span className="tabular-nums">{formatCurrency(calculations.closingCosts)}</span></div></> : <div className="flex justify-between"><span className="text-muted-foreground">Purchase + Costs</span><span className="tabular-nums">{formatCurrency(calculations.totalCashInvested)}</span></div>}<Separator className="my-1" /><div className="flex justify-between font-semibold"><span>Total</span><span className="tabular-nums">{formatCurrency(calculations.totalCashInvested)}</span></div></div></div>
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4"><div className="flex gap-3"><Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" /><div className="space-y-1"><p className="text-sm font-medium">Investment Insight</p><p className="text-sm text-muted-foreground">{calculations.grossYield > (cityMetrics?.gross_yield_percent || 3.5) ? `This property's ${calculations.grossYield.toFixed(1)}% yield beats the city average.` : `At ${calculations.grossYield.toFixed(1)}% yield, consider negotiating price.`}{calculations.monthlyCashFlow < 0 && useLeverage && ` You'll cover ${formatCurrency(Math.abs(calculations.monthlyCashFlow))}/mo from other income.`}{calculations.monthlyCashFlow > 0 && ` Positive cash flow of ${formatCurrency(calculations.monthlyCashFlow)}/mo.`}</p></div></div></div>
      </CardContent>
    </Card>
  );
  
  const bottomSection = (
    <div className="space-y-6">
      <Collapsible open={projectionOpen} onOpenChange={setProjectionOpen}><Card><CollapsibleTrigger asChild><CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors"><CardTitle className="text-base flex items-center justify-between"><span className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />Year-by-Year Projection</span>{projectionOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</CardTitle></CardHeader></CollapsibleTrigger><CollapsibleContent><CardContent className="pt-0"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="pb-2 font-medium">Year</th><th className="pb-2 font-medium text-right">Property Value</th><th className="pb-2 font-medium text-right">Net Cash Flow</th><th className="pb-2 font-medium text-right">Cumulative</th><th className="pb-2 font-medium text-right">ROI</th></tr></thead><tbody>{calculations.projection.map((year) => (<tr key={year.year} className="border-b last:border-0"><td className="py-2 tabular-nums">{year.year}</td><td className="py-2 text-right tabular-nums">{formatCurrency(year.propertyValue)}</td><td className={cn("py-2 text-right tabular-nums", year.netCashFlow >= 0 ? "text-green-600" : "text-red-600")}>{year.netCashFlow >= 0 ? '+' : ''}{formatCurrency(year.netCashFlow)}</td><td className={cn("py-2 text-right tabular-nums", year.cumulativeCashFlow >= 0 ? "text-green-600" : "text-red-600")}>{year.cumulativeCashFlow >= 0 ? '+' : ''}{formatCurrency(year.cumulativeCashFlow)}</td><td className="py-2 text-right tabular-nums font-medium text-primary">{year.roi.toFixed(1)}%</td></tr>))}</tbody></table></div></CardContent></CollapsibleContent></Card></Collapsible>
      <div className="flex flex-wrap gap-3 justify-center pt-4"><a href="/tools?tool=mortgage" className="text-sm text-primary hover:underline">Mortgage Calculator →</a><span className="text-muted-foreground">•</span><a href="/tools?tool=totalcost" className="text-sm text-primary hover:underline">True Cost Calculator →</a><span className="text-muted-foreground">•</span><a href="/tools?tool=rentvsbuy" className="text-sm text-primary hover:underline">Rent vs Buy →</a></div>
      <ToolFeedback toolName="investment-return-calculator" variant="inline" />
    </div>
  );

  return (<ToolLayout title="Investment Return Calculator" subtitle="Analyze potential returns on Israeli investment properties" icon={<TrendingUp className="h-6 w-6" />} leftColumn={leftColumn} rightColumn={rightColumn} bottomSection={bottomSection} disclaimer={<ToolDisclaimer text="This calculator provides estimates for informational purposes only. Consult with a financial advisor before making investment decisions." />} />);
}
