import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ToolLayout } from '@/components/tools/shared/ToolLayout';
import { ResultCard } from '@/components/tools/shared/ResultCard';
import { InsightCard } from '@/components/tools/shared/InsightCard';
import { ToolPropertySuggestions } from '@/components/tools/shared/ToolPropertySuggestions';
import { ToolFeedback } from '@/components/tools/shared/ToolFeedback';
import { ToolDisclaimer } from '@/components/tools/shared/ToolDisclaimer';
import { Calculator, TrendingUp, BarChart3, DollarSign, PiggyBank, Building2, ChevronDown, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateTaxAmount } from '@/lib/calculations/purchaseTax';
import { estimateAnnualExpenses } from '@/lib/calculations/rentalYield';
import { useFormatPrice, useCurrencySymbol } from '@/contexts/PreferencesContext';

const STOCK_MARKET_BENCHMARK = 0.07;
const SELLING_AGENT_PERCENT = 2;
const CAPITAL_GAINS_TAX_PERCENT = 25;

type VacancyPreset = 'low' | 'average' | 'high';
const VACANCY_PRESETS: Record<VacancyPreset, { label: string; value: number }> = {
  low: { label: 'Low (3%)', value: 3 },
  average: { label: 'Avg (5%)', value: 5 },
  high: { label: 'High (8%)', value: 8 },
};

const formSchema = z.object({
  purchasePrice: z.number().min(1),
  monthlyRent: z.number().min(0),
  downPaymentPercent: z.number().min(25).max(100),
  annualAppreciation: z.number().min(-20).max(30),
  holdingPeriod: z.number().min(1).max(50),
  vacancyRate: z.number().min(0).max(30),
  // Mortgage
  mortgageInterestRate: z.number().min(0).max(15),
  mortgageTerm: z.number().min(5).max(30),
  // Expenses (single number, expandable to itemized)
  annualExpenses: z.number().min(0),
  arnona: z.number().min(0),
  vaadBayit: z.number().min(0),
  insurance: z.number().min(0),
  maintenancePercent: z.number().min(0).max(20),
  // Transaction costs
  includePurchaseTax: z.boolean(),
  includeBuyingAgentFee: z.boolean(),
  includeLawyerFees: z.boolean(),
  includeRenovation: z.boolean(),
  renovationCosts: z.number().min(0).optional(),
  includeSellingCosts: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface CalculationResults {
  downPayment: number;
  purchaseTax: number;
  buyingAgentFee: number;
  lawyerFees: number;
  renovationCosts: number;
  totalDayOneCash: number;
  mortgageAmount: number;
  monthlyMortgagePayment: number;
  totalMortgageInterest: number;
  totalMortgagePayments: number;
  totalRentIncome: number;
  totalAppreciation: number;
  futurePropertyValue: number;
  totalExpenses: number;
  annualExpensesUsed: number;
  sellingAgentFee: number;
  capitalGainsTax: number;
  totalSellingCosts: number;
  totalTransactionCosts: number;
  netProfit: number;
  totalReturn: number;
  cagr: number;
  cashOnCash: number;
  grossYield: number;
  netYield: number;
  annualCashFlow: number;
}

function calculateMonthlyMortgagePayment(principal: number, annualRate: number, termYears: number): number {
  if (principal <= 0 || annualRate <= 0 || termYears <= 0) return 0;
  const r = annualRate / 100 / 12;
  const n = termYears * 12;
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function calculatePrincipalPaid(principal: number, annualRate: number, termYears: number, holdingYears: number): number {
  if (principal <= 0 || annualRate <= 0) return Math.min(principal, principal * holdingYears / termYears);
  const r = annualRate / 100 / 12;
  const n = termYears * 12;
  const payments = Math.min(holdingYears * 12, n);
  const monthlyPayment = principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const remainingBalance = principal * Math.pow(1 + r, payments) - monthlyPayment * ((Math.pow(1 + r, payments) - 1) / r);
  return principal - Math.max(0, remainingBalance);
}

function computeResults(v: FormValues, useItemized: boolean): CalculationResults {
  const purchasePrice = v.purchasePrice;
  const downPayment = purchasePrice * (v.downPaymentPercent / 100);
  const mortgageAmount = purchasePrice - downPayment;

  const purchaseTax = v.includePurchaseTax ? calculateTaxAmount(purchasePrice, 'investor') : 0;
  const buyingAgentFee = v.includeBuyingAgentFee ? Math.round(purchasePrice * 0.02 * 1.17) : 0;
  const lawyerFees = v.includeLawyerFees ? Math.round(10000 * 1.17) : 0;
  const renovationCosts = v.includeRenovation && v.renovationCosts ? v.renovationCosts : 0;
  const totalTransactionCosts = purchaseTax + buyingAgentFee + lawyerFees;
  const totalDayOneCash = downPayment + totalTransactionCosts + renovationCosts;

  const monthlyMortgagePayment = calculateMonthlyMortgagePayment(mortgageAmount, v.mortgageInterestRate, v.mortgageTerm);
  const effectiveMortgageMonths = Math.min(v.holdingPeriod * 12, v.mortgageTerm * 12);
  const totalMortgagePayments = monthlyMortgagePayment * effectiveMortgageMonths;
  const totalMortgageInterest = totalMortgagePayments - (mortgageAmount > 0 ? calculatePrincipalPaid(mortgageAmount, v.mortgageInterestRate, v.mortgageTerm, v.holdingPeriod) : 0);

  const annualRentBase = v.monthlyRent * 12;
  let totalRentIncome = 0;
  for (let yr = 0; yr < v.holdingPeriod; yr++) {
    totalRentIncome += annualRentBase * Math.pow(1.03, yr) * (1 - v.vacancyRate / 100);
  }
  totalRentIncome = Math.round(totalRentIncome);

  const futurePropertyValue = purchasePrice * Math.pow(1 + v.annualAppreciation / 100, v.holdingPeriod);
  const totalAppreciation = futurePropertyValue - purchasePrice;

  // Use either the single number or itemized total
  const annualExpensesUsed = useItemized
    ? v.arnona + v.vaadBayit + v.insurance + (annualRentBase * v.maintenancePercent / 100)
    : v.annualExpenses;

  let totalExpenses = 0;
  for (let yr = 0; yr < v.holdingPeriod; yr++) {
    totalExpenses += annualExpensesUsed * Math.pow(1.02, yr);
  }
  totalExpenses = Math.round(totalExpenses);

  const sellingAgentFee = v.includeSellingCosts ? Math.round(futurePropertyValue * (SELLING_AGENT_PERCENT / 100) * 1.17) : 0;
  const capitalGainsTax = v.includeSellingCosts && totalAppreciation > 0 ? Math.round(totalAppreciation * (CAPITAL_GAINS_TAX_PERCENT / 100)) : 0;
  const totalSellingCosts = sellingAgentFee + capitalGainsTax;

  const remainingMortgage = mortgageAmount > 0 ? mortgageAmount - calculatePrincipalPaid(mortgageAmount, v.mortgageInterestRate, v.mortgageTerm, v.holdingPeriod) : 0;
  const saleProceeds = futurePropertyValue - remainingMortgage;
  const netProfit = Math.round(saleProceeds + totalRentIncome - totalExpenses - totalMortgagePayments - totalSellingCosts - totalDayOneCash);

  const totalReturn = totalDayOneCash > 0 ? netProfit / totalDayOneCash : 0;
  const cagr = totalDayOneCash > 0 && v.holdingPeriod > 0
    ? (Math.pow((totalDayOneCash + netProfit) / totalDayOneCash, 1 / v.holdingPeriod) - 1)
    : 0;

  const year1Rent = annualRentBase * (1 - v.vacancyRate / 100);
  const year1MortgagePayments = monthlyMortgagePayment * 12;
  const annualCashFlow = year1Rent - annualExpensesUsed - year1MortgagePayments;
  const cashOnCash = totalDayOneCash > 0 ? annualCashFlow / totalDayOneCash : 0;
  const grossYield = purchasePrice > 0 ? (annualRentBase / purchasePrice) : 0;
  const netYield = purchasePrice > 0 ? ((year1Rent - annualExpensesUsed) / purchasePrice) : 0;

  return {
    downPayment, purchaseTax, buyingAgentFee, lawyerFees, renovationCosts, totalDayOneCash,
    mortgageAmount, monthlyMortgagePayment, totalMortgageInterest, totalMortgagePayments,
    totalRentIncome, totalAppreciation, futurePropertyValue,
    totalExpenses, annualExpensesUsed,
    sellingAgentFee, capitalGainsTax, totalSellingCosts, totalTransactionCosts,
    netProfit, totalReturn, cagr, cashOnCash, grossYield, netYield, annualCashFlow,
  };
}

function generateInsights(v: FormValues, r: CalculationResults, formatCurrency: (n: number) => string): string[] {
  const insights: string[] = [];

  if (r.cagr > STOCK_MARKET_BENCHMARK + 0.02) {
    insights.push(`Your projected ${(r.cagr * 100).toFixed(1)}% CAGR beats the 7% stock market benchmark — real estate leverage is working in your favor.`);
  } else if (r.cagr >= STOCK_MARKET_BENCHMARK - 0.01) {
    insights.push(`Your projected ${(r.cagr * 100).toFixed(1)}% CAGR is roughly in line with stock market returns (~7%). The advantage here is the tangible asset and rental income.`);
  } else if (r.cagr > 0) {
    insights.push(`At ${(r.cagr * 100).toFixed(1)}% CAGR, this underperforms the ~7% stock market benchmark. Consider negotiating a lower price or finding higher-yielding rent.`);
  } else {
    insights.push(`This investment shows a negative return. Re-evaluate the purchase price, expected rent, or holding period.`);
  }

  if (v.vacancyRate > 0) {
    const annualVacancyCost = v.monthlyRent * 12 * (v.vacancyRate / 100);
    insights.push(`Vacancy at ${v.vacancyRate}% costs you ~${formatCurrency(Math.round(annualVacancyCost))}/year. Each 1% vacancy ≈ ${formatCurrency(Math.round(v.monthlyRent * 12 * 0.01))}/year lost.`);
  }

  if (v.downPaymentPercent < 100 && r.mortgageAmount > 0) {
    const leverageRatio = v.purchasePrice / r.totalDayOneCash;
    insights.push(`You're leveraged ${leverageRatio.toFixed(1)}x — a ${v.annualAppreciation}% appreciation on the full property value amplifies your equity return.`);
  }

  if (r.annualCashFlow < 0) {
    insights.push(`Negative year-1 cash flow of ${formatCurrency(Math.round(r.annualCashFlow))}/year — you'll need to cover ${formatCurrency(Math.abs(Math.round(r.annualCashFlow / 12)))}/month from pocket.`);
  } else if (r.cashOnCash > 0) {
    insights.push(`Year-1 cash-on-cash return of ${(r.cashOnCash * 100).toFixed(1)}% — you earn ${formatCurrency(Math.round(r.annualCashFlow))}/year on your ${formatCurrency(Math.round(r.totalDayOneCash))} invested.`);
  }

  return insights.slice(0, 4);
}

export function InvestmentReturnCalculator() {
  const formatCurrency = useFormatPrice();
  const currencySymbol = useCurrencySymbol();
  const [showExpenseDetails, setShowExpenseDetails] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [vacancyPreset, setVacancyPreset] = useState<VacancyPreset>('average');

  const defaultExpenses = estimateAnnualExpenses(6500, 80);
  const defaultAnnualTotal = defaultExpenses.arnona + defaultExpenses.vaadBayit + defaultExpenses.insurance + (6500 * 12 * 0.05);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      purchasePrice: 2000000,
      monthlyRent: 6500,
      downPaymentPercent: 50,
      annualAppreciation: 3,
      holdingPeriod: 10,
      vacancyRate: 5,
      mortgageInterestRate: 4.5,
      mortgageTerm: 25,
      annualExpenses: Math.round(defaultAnnualTotal),
      arnona: defaultExpenses.arnona,
      vaadBayit: defaultExpenses.vaadBayit,
      insurance: defaultExpenses.insurance,
      maintenancePercent: 5,
      includePurchaseTax: true,
      includeBuyingAgentFee: true,
      includeLawyerFees: true,
      includeRenovation: false,
      renovationCosts: 100000,
      includeSellingCosts: true,
    },
    mode: "onChange",
  });

  const watchedValues = form.watch();
  const isLeveraged = watchedValues.downPaymentPercent < 100;

  const results = useMemo(() => {
    try {
      if (!watchedValues.purchasePrice || watchedValues.purchasePrice <= 0) return null;
      return computeResults(watchedValues, showExpenseDetails);
    } catch {
      return null;
    }
  }, [watchedValues, showExpenseDetails]);

  const insights = useMemo(() => {
    if (!results) return [];
    return generateInsights(watchedValues, results, formatCurrency);
  }, [results, watchedValues, formatCurrency]);

  const formatPercent = (val: number) => `${(val * 100).toFixed(1)}%`;

  const cagrBadge = results ? (
    results.cagr > STOCK_MARKET_BENCHMARK + 0.02
      ? { text: 'Beats Market', variant: 'success' as const }
      : results.cagr >= STOCK_MARKET_BENCHMARK - 0.01
        ? { text: 'Market-Level', variant: 'warning' as const }
        : { text: 'Below Market', variant: 'danger' as const }
  ) : undefined;

  const handleVacancyPreset = (preset: VacancyPreset) => {
    setVacancyPreset(preset);
    form.setValue('vacancyRate', VACANCY_PRESETS[preset].value);
  };

  const bottomSection = (
    <div className="space-y-6">
      <InsightCard insights={insights} />

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="how-it-works">
          <AccordionTrigger>How This Calculator Works</AccordionTrigger>
          <AccordionContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>This calculator models a complete buy-hold-sell investment scenario with accurate Israeli tax brackets and real-world costs.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><b>Purchase Tax:</b> Uses official 2024 Israeli investor brackets (8% up to ₪6.05M, 10% above).</li>
              <li><b>Mortgage:</b> Standard amortization formula with principal and interest separation.</li>
              <li><b>Rent Escalation:</b> 3% annual increase, adjusted for your vacancy rate.</li>
              <li><b>Expenses:</b> 2% annual cost escalation on itemized expenses.</li>
              <li><b>CAGR:</b> Compound Annual Growth Rate — your true annualized return on invested cash.</li>
              <li><b>Capital Gains:</b> 25% tax on property appreciation at sale (Israeli standard).</li>
              <li><b>Selling Agent:</b> 2% + VAT at exit.</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="glossary">
          <AccordionTrigger>Key Terms</AccordionTrigger>
          <AccordionContent className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p><b>CAGR</b> — Compound Annual Growth Rate. Your annualized return accounting for compounding.</p>
            <p><b>Gross Yield</b> — Annual rent ÷ purchase price. A quick comparison metric.</p>
            <p><b>Net Yield</b> — (Annual rent − expenses) ÷ purchase price. More realistic than gross yield.</p>
            <p><b>Cash-on-Cash</b> — Year-1 net cash flow ÷ total cash invested. Measures immediate income return.</p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <ToolPropertySuggestions
        title="Properties That Fit This Scenario"
        subtitle="Explore listings that match your investment criteria."
        minPrice={watchedValues.purchasePrice * 0.8}
        maxPrice={watchedValues.purchasePrice * 1.2}
      />

      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border/60" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Continue exploring</span>
          <div className="h-px flex-1 bg-border/60" />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <Link to="/tools?tool=mortgage"><Card className="p-4 cursor-pointer hover:border-primary/50 transition-colors group h-full"><Calculator className="h-4 w-4 text-primary mb-2" /><h4 className="font-medium text-sm group-hover:text-primary transition-colors">Mortgage Calculator</h4><p className="text-xs text-muted-foreground mt-1">Estimate your monthly mortgage payments</p></Card></Link>
          <Link to="/tools?tool=purchase-tax"><Card className="p-4 cursor-pointer hover:border-primary/50 transition-colors group h-full"><DollarSign className="h-4 w-4 text-primary mb-2" /><h4 className="font-medium text-sm group-hover:text-primary transition-colors">Purchase Tax Calculator</h4><p className="text-xs text-muted-foreground mt-1">Detailed purchase tax breakdown</p></Card></Link>
          <Link to="/listings"><Card className="p-4 cursor-pointer hover:border-primary/50 transition-colors group h-full"><TrendingUp className="h-4 w-4 text-primary mb-2" /><h4 className="font-medium text-sm group-hover:text-primary transition-colors">Browse Properties</h4><p className="text-xs text-muted-foreground mt-1">Find investment opportunities</p></Card></Link>
        </div>
      </div>

      <ToolDisclaimer text="This calculator provides estimates for informational purposes only. Actual investment returns depend on market conditions, specific property factors, tax changes, and individual circumstances. Purchase tax uses 2024 investor brackets. Consult a qualified financial advisor and tax professional before making investment decisions." />

      <div className="text-center">
        <ToolFeedback toolName="Investment Return Calculator" variant="inline" />
      </div>
    </div>
  );

  return (
    <ToolLayout
      title="Investment Return Calculator"
      subtitle="Model a complete buy-hold-sell scenario with accurate Israeli costs and tax brackets."
      icon={<BarChart3 className="h-6 w-6" />}
      leftColumn={
        <Form {...form}>
          <form className="space-y-5">
            {/* Property, Income & Financing — merged into one card */}
            <Card>
              <CardContent className="space-y-5 pt-6">
                <FormField control={form.control} name="purchasePrice" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Price</FormLabel>
                    <FormControl>
                      <FormattedNumberInput prefix={currencySymbol} placeholder="2,000,000" value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="monthlyRent" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Rent</FormLabel>
                    <FormControl>
                      <FormattedNumberInput prefix={currencySymbol} placeholder="6,500" value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormDescription>Expected monthly rental income (escalates 3%/year)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="annualAppreciation" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Appreciation (%/yr)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.5" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="holdingPeriod" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hold Period (yrs)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Vacancy presets */}
                <div className="space-y-2">
                  <FormLabel className="text-sm font-medium">Vacancy Rate</FormLabel>
                  <div className="flex gap-2">
                    {(Object.entries(VACANCY_PRESETS) as [VacancyPreset, { label: string; value: number }][]).map(([key, preset]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleVacancyPreset(key)}
                        className={cn(
                          "flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors",
                          vacancyPreset === key
                            ? "bg-primary/10 border-primary/30 text-primary"
                            : "bg-muted/50 border-border text-muted-foreground hover:border-primary/20"
                        )}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Financing inline */}
                <FormField control={form.control} name="downPaymentPercent" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Down Payment (%)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormDescription>
                      {isLeveraged
                        ? `Mortgage: ${formatCurrency(Math.round(watchedValues.purchasePrice * (1 - watchedValues.downPaymentPercent / 100)))}`
                        : 'Cash purchase — no mortgage'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />

                {isLeveraged && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="mortgageInterestRate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interest Rate (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="mortgageTerm" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Term (yrs)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Annual Expenses — smart default with expand */}
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Annual Expenses</h3>
                  <button
                    type="button"
                    onClick={() => {
                      if (!showExpenseDetails) {
                        // Sync itemized → total when collapsing
                        const rent = watchedValues.monthlyRent * 12;
                        const itemizedTotal = watchedValues.arnona + watchedValues.vaadBayit + watchedValues.insurance + (rent * watchedValues.maintenancePercent / 100);
                        form.setValue('annualExpenses', Math.round(itemizedTotal));
                      }
                      setShowExpenseDetails(!showExpenseDetails);
                    }}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    <Settings2 className="h-3 w-3" />
                    {showExpenseDetails ? 'Use single total' : 'Customize'}
                  </button>
                </div>

                {!showExpenseDetails ? (
                  <FormField control={form.control} name="annualExpenses" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Annual Expenses (₪/yr)</FormLabel>
                      <FormControl>
                        <FormattedNumberInput value={field.value} onChange={(v) => field.onChange(v ?? 0)} placeholder="11,500" />
                      </FormControl>
                      <FormDescription>Arnona, Vaad Bayit, insurance, maintenance combined. Escalates 2%/yr.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="arnona" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Arnona (₪/yr)</FormLabel>
                        <FormControl>
                          <FormattedNumberInput value={field.value} onChange={(v) => field.onChange(v ?? 0)} placeholder="1,600" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="vaadBayit" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vaad Bayit (₪/yr)</FormLabel>
                        <FormControl>
                          <FormattedNumberInput value={field.value} onChange={(v) => field.onChange(v ?? 0)} placeholder="4,200" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="insurance" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Insurance (₪/yr)</FormLabel>
                        <FormControl>
                          <FormattedNumberInput value={field.value} onChange={(v) => field.onChange(v ?? 0)} placeholder="1,800" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="maintenancePercent" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maintenance (% rent)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.5" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transaction Costs — collapsed by default, shows total */}
            <Collapsible>
              <Card>
                <CardContent className="pt-6 pb-4">
                  <CollapsibleTrigger className="flex items-center justify-between w-full group">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Transaction Costs</h3>
                    <div className="flex items-center gap-2">
                      {results && (
                        <span className="text-sm font-medium text-foreground">
                          {formatCurrency(results.totalTransactionCosts + results.renovationCosts)}
                        </span>
                      )}
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 pt-4">
                    <FormField control={form.control} name="includePurchaseTax" render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <FormLabel className="text-sm">Purchase Tax (8% investor rate)</FormLabel>
                          {results && field.value && <p className="text-xs text-muted-foreground">{formatCurrency(results.purchaseTax)}</p>}
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="includeBuyingAgentFee" render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <FormLabel className="text-sm">Buying Agent (2% + VAT)</FormLabel>
                          {results && field.value && <p className="text-xs text-muted-foreground">{formatCurrency(results.buyingAgentFee)}</p>}
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="includeLawyerFees" render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <FormLabel className="text-sm">Lawyer (~₪10k + VAT)</FormLabel>
                          {results && field.value && <p className="text-xs text-muted-foreground">{formatCurrency(results.lawyerFees)}</p>}
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="includeRenovation" render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <FormLabel className="text-sm">Renovation</FormLabel>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )} />

                    {watchedValues.includeRenovation && (
                      <FormField control={form.control} name="renovationCosts" render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <FormattedNumberInput prefix={currencySymbol} placeholder="100,000" value={field.value} onChange={field.onChange} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    )}

                    <Separator />

                    <FormField control={form.control} name="includeSellingCosts" render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <FormLabel className="text-sm">Selling Costs at Exit</FormLabel>
                          <p className="text-xs text-muted-foreground">Agent 2%+VAT + 25% capital gains tax</p>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )} />
                  </CollapsibleContent>
                </CardContent>
              </Card>
            </Collapsible>
          </form>
        </Form>
      }
      rightColumn={
        results ? (
          <div className="space-y-4">
            {/* Hero CAGR */}
            <ResultCard
              label="Compound Annual Growth Rate"
              value={formatPercent(results.cagr)}
              badge={cagrBadge}
              variant="primary"
              size="lg"
              sublabel="vs. 7% stock market benchmark"
              icon={<TrendingUp className="h-5 w-5" />}
            />

            {/* Key metrics */}
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Gross Yield" value={formatPercent(results.grossYield)} size="sm" icon={<PiggyBank className="h-4 w-4" />} />
              <ResultCard label="Net Yield" value={formatPercent(results.netYield)} size="sm" icon={<BarChart3 className="h-4 w-4" />} />
              <ResultCard label="Cash-on-Cash (Yr 1)" value={formatPercent(results.cashOnCash)} size="sm"
                badge={results.annualCashFlow < 0 ? { text: 'Negative', variant: 'danger' as const } : undefined}
                icon={<DollarSign className="h-4 w-4" />} />
              <ResultCard label="Total Net Profit" value={formatCurrency(results.netProfit)} size="sm"
                badge={results.netProfit > 0 ? { text: 'Profit', variant: 'success' as const } : { text: 'Loss', variant: 'danger' as const }}
                icon={<TrendingUp className="h-4 w-4" />} />
            </div>

            {/* Day-One — always visible */}
            <Card>
              <CardContent className="pt-5 space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" /> Day-One Cash Required
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Down Payment ({watchedValues.downPaymentPercent}%)</span><span className="font-medium">{formatCurrency(results.downPayment)}</span></div>
                  {results.purchaseTax > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Purchase Tax</span><span className="font-medium">{formatCurrency(results.purchaseTax)}</span></div>}
                  {results.buyingAgentFee > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Agent Fee</span><span className="font-medium">{formatCurrency(results.buyingAgentFee)}</span></div>}
                  {results.lawyerFees > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Lawyer Fees</span><span className="font-medium">{formatCurrency(results.lawyerFees)}</span></div>}
                  {results.renovationCosts > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Renovation</span><span className="font-medium">{formatCurrency(results.renovationCosts)}</span></div>}
                  <Separator />
                  <div className="flex justify-between font-semibold"><span>Total Cash Needed</span><span className="text-primary">{formatCurrency(results.totalDayOneCash)}</span></div>
                </div>
              </CardContent>
            </Card>

            {/* Collapsible detailed breakdown */}
            <Collapsible open={showBreakdown} onOpenChange={setShowBreakdown}>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-2 group">
                <span className="text-sm font-medium text-muted-foreground">Full Breakdown</span>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", showBreakdown && "rotate-180")} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-1">
                {/* Annual Cash Flow */}
                <Card>
                  <CardContent className="pt-5 space-y-3">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" /> Year-1 Cash Flow
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Rent (after vacancy)</span><span className="font-medium text-semantic-green-foreground">+{formatCurrency(Math.round(watchedValues.monthlyRent * 12 * (1 - watchedValues.vacancyRate / 100)))}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Expenses</span><span className="font-medium text-semantic-red-foreground">−{formatCurrency(Math.round(results.annualExpensesUsed))}</span></div>
                      {isLeveraged && results.monthlyMortgagePayment > 0 && (
                        <div className="flex justify-between"><span className="text-muted-foreground">Mortgage</span><span className="font-medium text-semantic-red-foreground">−{formatCurrency(Math.round(results.monthlyMortgagePayment * 12))}</span></div>
                      )}
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Net Cash Flow</span>
                        <span className={results.annualCashFlow >= 0 ? 'text-semantic-green-foreground' : 'text-semantic-red-foreground'}>
                          {results.annualCashFlow >= 0 ? '+' : ''}{formatCurrency(Math.round(results.annualCashFlow))}/yr
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        = {results.annualCashFlow >= 0 ? '+' : ''}{formatCurrency(Math.round(results.annualCashFlow / 12))}/month
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Exit Summary */}
                <Card>
                  <CardContent className="pt-5 space-y-3">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" /> Exit ({watchedValues.holdingPeriod} yrs)
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Future Value</span><span className="font-medium">{formatCurrency(Math.round(results.futurePropertyValue))}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Appreciation</span><span className="font-medium text-semantic-green-foreground">+{formatCurrency(Math.round(results.totalAppreciation))}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Total Rent</span><span className="font-medium text-semantic-green-foreground">+{formatCurrency(results.totalRentIncome)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Total Expenses</span><span className="font-medium text-semantic-red-foreground">−{formatCurrency(results.totalExpenses)}</span></div>
                      {isLeveraged && <div className="flex justify-between"><span className="text-muted-foreground">Mortgage Interest</span><span className="font-medium text-semantic-red-foreground">−{formatCurrency(Math.round(results.totalMortgageInterest))}</span></div>}
                      {results.totalSellingCosts > 0 && (
                        <>
                          <div className="flex justify-between"><span className="text-muted-foreground">Selling Agent</span><span className="font-medium text-semantic-red-foreground">−{formatCurrency(results.sellingAgentFee)}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Capital Gains Tax</span><span className="font-medium text-semantic-red-foreground">−{formatCurrency(results.capitalGainsTax)}</span></div>
                        </>
                      )}
                      <Separator />
                      <div className="flex justify-between font-bold text-base">
                        <span>Net Profit</span>
                        <span className={results.netProfit >= 0 ? 'text-primary' : 'text-semantic-red-foreground'}>
                          {formatCurrency(results.netProfit)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Total return: {(results.totalReturn * 100).toFixed(0)}% on {formatCurrency(Math.round(results.totalDayOneCash))} invested
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>

            {/* Stock Market Comparison */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-5 space-y-2">
                <h3 className="font-semibold text-sm">📊 vs. Stock Market (7% CAGR)</h3>
                <div className="text-sm">
                  {(() => {
                    const stockReturn = results.totalDayOneCash * (Math.pow(1 + STOCK_MARKET_BENCHMARK, watchedValues.holdingPeriod) - 1);
                    const difference = results.netProfit - stockReturn;
                    return (
                      <div className="space-y-1">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Same cash in stocks</span>
                          <span>{formatCurrency(Math.round(stockReturn))} profit</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span>Property advantage</span>
                          <span className={difference >= 0 ? 'text-semantic-green-foreground' : 'text-semantic-red-foreground'}>
                            {difference >= 0 ? '+' : ''}{formatCurrency(Math.round(difference))}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="text-center p-10">
              <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Enter property details to see your investment analysis.</p>
            </CardContent>
          </Card>
        )
      }
      bottomSection={bottomSection}
    />
  );
}
