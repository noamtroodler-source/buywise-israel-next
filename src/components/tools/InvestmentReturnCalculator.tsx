import { useMemo } from 'react';
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
import { Badge } from "@/components/ui/badge";
import { ToolLayout } from '@/components/tools/shared/ToolLayout';
import { ResultCard } from '@/components/tools/shared/ResultCard';
import { InsightCard } from '@/components/tools/shared/InsightCard';
import { ToolPropertySuggestions } from '@/components/tools/shared/ToolPropertySuggestions';
import { ToolFeedback } from '@/components/tools/shared/ToolFeedback';
import { ToolDisclaimer } from '@/components/tools/shared/ToolDisclaimer';
import { Calculator, Home, TrendingUp, TrendingDown, BarChart3, DollarSign, PiggyBank, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateTaxAmount } from '@/lib/calculations/purchaseTax';
import { estimateAnnualExpenses } from '@/lib/calculations/rentalYield';
import { useFormatPrice, useCurrencySymbol } from '@/contexts/PreferencesContext';

const STOCK_MARKET_BENCHMARK = 0.07; // 7% annual

const formSchema = z.object({
  purchasePrice: z.number().min(1, "Purchase price must be greater than 0."),
  monthlyRent: z.number().min(0, "Monthly rent cannot be negative."),
  downPaymentPercent: z.number().min(25, "Minimum 25% for investment properties.").max(100),
  annualAppreciation: z.number().min(-20).max(30),
  holdingPeriod: z.number().min(1).max(50),
  vacancyRate: z.number().min(0).max(30),
  // Mortgage
  mortgageInterestRate: z.number().min(0).max(15),
  mortgageTerm: z.number().min(5).max(30),
  // Expenses
  arnona: z.number().min(0),
  vaadBayit: z.number().min(0),
  insurance: z.number().min(0),
  maintenancePercent: z.number().min(0).max(20),
  // Costs toggles
  includePurchaseTax: z.boolean(),
  includeBuyingAgentFee: z.boolean(),
  includeLawyerFees: z.boolean(),
  includeRenovation: z.boolean(),
  renovationCosts: z.number().min(0).optional(),
  // Selling
  includeSellingCosts: z.boolean(),
  sellingAgentPercent: z.number().min(0).max(10),
  capitalGainsTaxPercent: z.number().min(0).max(50),
});

type FormValues = z.infer<typeof formSchema>;

interface CalculationResults {
  // Day-one
  downPayment: number;
  purchaseTax: number;
  buyingAgentFee: number;
  lawyerFees: number;
  renovationCosts: number;
  totalDayOneCash: number;
  // Mortgage
  mortgageAmount: number;
  monthlyMortgagePayment: number;
  totalMortgageInterest: number;
  totalMortgagePayments: number;
  // Revenue
  totalRentIncome: number;
  totalAppreciation: number;
  futurePropertyValue: number;
  // Expenses
  totalExpenses: number;
  annualExpenses: number;
  // Selling
  sellingAgentFee: number;
  capitalGainsTax: number;
  totalSellingCosts: number;
  // Bottom line
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

function computeResults(v: FormValues): CalculationResults {
  const purchasePrice = v.purchasePrice;
  const downPayment = purchasePrice * (v.downPaymentPercent / 100);
  const mortgageAmount = purchasePrice - downPayment;

  // Purchase costs
  const purchaseTax = v.includePurchaseTax ? calculateTaxAmount(purchasePrice, 'investor') : 0;
  const buyingAgentFee = v.includeBuyingAgentFee ? Math.round(purchasePrice * 0.02 * 1.17) : 0; // 2% + VAT
  const lawyerFees = v.includeLawyerFees ? Math.round(10000 * 1.17) : 0; // ~₪10k + VAT
  const renovationCosts = v.includeRenovation && v.renovationCosts ? v.renovationCosts : 0;
  const totalDayOneCash = downPayment + purchaseTax + buyingAgentFee + lawyerFees + renovationCosts;

  // Mortgage
  const monthlyMortgagePayment = calculateMonthlyMortgagePayment(mortgageAmount, v.mortgageInterestRate, v.mortgageTerm);
  const effectiveMortgageMonths = Math.min(v.holdingPeriod * 12, v.mortgageTerm * 12);
  const totalMortgagePayments = monthlyMortgagePayment * effectiveMortgageMonths;
  const totalMortgageInterest = totalMortgagePayments - (mortgageAmount > 0 ? calculatePrincipalPaid(mortgageAmount, v.mortgageInterestRate, v.mortgageTerm, v.holdingPeriod) : 0);

  // Revenue - rent with 3% annual escalation, adjusted for vacancy
  let totalRentIncome = 0;
  const annualRentBase = v.monthlyRent * 12;
  for (let yr = 0; yr < v.holdingPeriod; yr++) {
    const yearRent = annualRentBase * Math.pow(1.03, yr);
    totalRentIncome += yearRent * (1 - v.vacancyRate / 100);
  }
  totalRentIncome = Math.round(totalRentIncome);

  // Appreciation
  const futurePropertyValue = purchasePrice * Math.pow(1 + v.annualAppreciation / 100, v.holdingPeriod);
  const totalAppreciation = futurePropertyValue - purchasePrice;

  // Annual expenses (with 2% annual escalation)
  const annualExpensesBase = v.arnona + v.vaadBayit + v.insurance + (annualRentBase * v.maintenancePercent / 100);
  let totalExpenses = 0;
  for (let yr = 0; yr < v.holdingPeriod; yr++) {
    totalExpenses += annualExpensesBase * Math.pow(1.02, yr);
  }
  totalExpenses = Math.round(totalExpenses);

  // Selling costs
  const sellingAgentFee = v.includeSellingCosts ? Math.round(futurePropertyValue * (v.sellingAgentPercent / 100) * 1.17) : 0;
  const capitalGainsTax = v.includeSellingCosts && totalAppreciation > 0 ? Math.round(totalAppreciation * (v.capitalGainsTaxPercent / 100)) : 0;
  const totalSellingCosts = sellingAgentFee + capitalGainsTax;

  // Remaining mortgage balance at exit
  const remainingMortgage = mortgageAmount > 0 ? mortgageAmount - calculatePrincipalPaid(mortgageAmount, v.mortgageInterestRate, v.mortgageTerm, v.holdingPeriod) : 0;

  // Net profit: sale proceeds - remaining mortgage - total expenses - selling costs + total rent - total mortgage payments paid - day one cash + day one cash (return of investment)
  // Simpler: net proceeds from sale + total rent - total expenses - total mortgage payments - total selling costs - day one cash
  const saleProceeds = futurePropertyValue - remainingMortgage;
  const netProfit = Math.round(saleProceeds + totalRentIncome - totalExpenses - totalMortgagePayments - totalSellingCosts - totalDayOneCash);

  const totalReturn = totalDayOneCash > 0 ? netProfit / totalDayOneCash : 0;
  const cagr = totalDayOneCash > 0 && v.holdingPeriod > 0
    ? (Math.pow((totalDayOneCash + netProfit) / totalDayOneCash, 1 / v.holdingPeriod) - 1)
    : 0;

  // Year-1 metrics
  const year1Rent = annualRentBase * (1 - v.vacancyRate / 100);
  const year1Expenses = annualExpensesBase;
  const year1MortgagePayments = monthlyMortgagePayment * 12;
  const annualCashFlow = year1Rent - year1Expenses - year1MortgagePayments;
  const cashOnCash = totalDayOneCash > 0 ? annualCashFlow / totalDayOneCash : 0;

  const grossYield = purchasePrice > 0 ? (annualRentBase / purchasePrice) : 0;
  const netYield = purchasePrice > 0 ? ((year1Rent - year1Expenses) / purchasePrice) : 0;

  return {
    downPayment, purchaseTax, buyingAgentFee, lawyerFees, renovationCosts, totalDayOneCash,
    mortgageAmount, monthlyMortgagePayment, totalMortgageInterest, totalMortgagePayments,
    totalRentIncome, totalAppreciation, futurePropertyValue,
    totalExpenses, annualExpenses: annualExpensesBase,
    sellingAgentFee, capitalGainsTax, totalSellingCosts,
    netProfit, totalReturn, cagr, cashOnCash, grossYield, netYield, annualCashFlow,
  };
}

function calculatePrincipalPaid(principal: number, annualRate: number, termYears: number, holdingYears: number): number {
  if (principal <= 0 || annualRate <= 0) return Math.min(principal, principal * holdingYears / termYears);
  const r = annualRate / 100 / 12;
  const n = termYears * 12;
  const payments = Math.min(holdingYears * 12, n);
  const monthlyPayment = principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  // Remaining balance after `payments` months
  const remainingBalance = principal * Math.pow(1 + r, payments) - monthlyPayment * ((Math.pow(1 + r, payments) - 1) / r);
  return principal - Math.max(0, remainingBalance);
}

function generateInsights(v: FormValues, r: CalculationResults, formatCurrency: (n: number) => string): string[] {
  const insights: string[] = [];

  // CAGR vs benchmark
  if (r.cagr > STOCK_MARKET_BENCHMARK + 0.02) {
    insights.push(`Your projected ${(r.cagr * 100).toFixed(1)}% CAGR beats the 7% stock market benchmark — real estate leverage is working in your favor.`);
  } else if (r.cagr >= STOCK_MARKET_BENCHMARK - 0.01) {
    insights.push(`Your projected ${(r.cagr * 100).toFixed(1)}% CAGR is roughly in line with stock market returns (~7%). The advantage here is the tangible asset and rental income.`);
  } else if (r.cagr > 0) {
    insights.push(`At ${(r.cagr * 100).toFixed(1)}% CAGR, this underperforms the ~7% stock market benchmark. Consider negotiating a lower price or finding higher-yielding rent.`);
  } else {
    insights.push(`This investment shows a negative return. Re-evaluate the purchase price, expected rent, or holding period.`);
  }

  // Vacancy impact
  if (v.vacancyRate > 0) {
    const annualVacancyCost = v.monthlyRent * 12 * (v.vacancyRate / 100);
    insights.push(`Vacancy at ${v.vacancyRate}% costs you ~${formatCurrency(Math.round(annualVacancyCost))}/year. Each 1% vacancy ≈ ${formatCurrency(Math.round(v.monthlyRent * 12 * 0.01))}/year lost.`);
  }

  // Leverage effect
  if (v.downPaymentPercent < 100 && r.mortgageAmount > 0) {
    const leverageRatio = v.purchasePrice / r.totalDayOneCash;
    insights.push(`You're leveraged ${leverageRatio.toFixed(1)}x — a ${v.annualAppreciation}% appreciation on the full property value amplifies your equity return.`);
  }

  // Cash-on-cash
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

  // Defaults from estimateAnnualExpenses
  const defaultExpenses = estimateAnnualExpenses(6500, 80);

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
      sellingAgentPercent: 2,
      capitalGainsTaxPercent: 25,
    },
    mode: "onChange",
  });

  const watchedValues = form.watch();

  const results = useMemo(() => {
    try {
      // Only compute if we have valid essential values
      if (!watchedValues.purchasePrice || watchedValues.purchasePrice <= 0) return null;
      return computeResults(watchedValues);
    } catch {
      return null;
    }
  }, [watchedValues]);

  const insights = useMemo(() => {
    if (!results) return [];
    return generateInsights(watchedValues, results, formatCurrency);
  }, [results, watchedValues, formatCurrency]);

  const formatPercent = (val: number) => `${(val * 100).toFixed(1)}%`;

  const isLeveraged = watchedValues.downPaymentPercent < 100;

  const cagrBadge = results ? (
    results.cagr > STOCK_MARKET_BENCHMARK + 0.02
      ? { text: 'Beats Market', variant: 'success' as const }
      : results.cagr >= STOCK_MARKET_BENCHMARK - 0.01
        ? { text: 'Market-Level', variant: 'warning' as const }
        : { text: 'Below Market', variant: 'danger' as const }
  ) : undefined;

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
      subtitle="Model a complete buy-hold-sell investment scenario with accurate Israeli costs and tax brackets."
      icon={<BarChart3 className="h-6 w-6" />}
      leftColumn={
        <Form {...form}>
          <form className="space-y-6">
            {/* Property & Income */}
            <Card>
              <CardContent className="space-y-5 pt-6">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Property & Income</h3>
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
                      <FormLabel>Annual Appreciation (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.5" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="holdingPeriod" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Holding Period (Years)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="vacancyRate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vacancy Rate (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.5" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormDescription>Typical: 3-5% in high-demand areas, 6-8% in periphery</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            {/* Financing */}
            <Card>
              <CardContent className="space-y-5 pt-6">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Financing</h3>
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
                        <FormLabel>Mortgage Term (Years)</FormLabel>
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

            {/* Annual Expenses */}
            <Card>
              <CardContent className="space-y-5 pt-6">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Annual Expenses</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="arnona" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arnona (₪/year)</FormLabel>
                      <FormControl>
                        <FormattedNumberInput value={field.value} onChange={(v) => field.onChange(v ?? 0)} placeholder="1,600" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="vaadBayit" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vaad Bayit (₪/year)</FormLabel>
                      <FormControl>
                        <FormattedNumberInput value={field.value} onChange={(v) => field.onChange(v ?? 0)} placeholder="4,200" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="insurance" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insurance (₪/year)</FormLabel>
                      <FormControl>
                        <FormattedNumberInput value={field.value} onChange={(v) => field.onChange(v ?? 0)} placeholder="1,800" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="maintenancePercent" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maintenance (% of rent)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.5" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <p className="text-xs text-muted-foreground">Expenses escalate 2%/year. Defaults based on ~80m² apartment.</p>
              </CardContent>
            </Card>

            {/* Purchase & Selling Costs */}
            <Card>
              <CardContent className="space-y-4 pt-6">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Transaction Costs</h3>

                <FormField control={form.control} name="includePurchaseTax" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel className="text-sm">Purchase Tax (Mas Rechisha)</FormLabel>
                      <FormDescription className="text-xs">8% investor rate on first ₪6.05M</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />

                <FormField control={form.control} name="includeBuyingAgentFee" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel className="text-sm">Buying Agent Fee (2% + VAT)</FormLabel>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />

                <FormField control={form.control} name="includeLawyerFees" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel className="text-sm">Lawyer Fees (~₪10,000 + VAT)</FormLabel>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />

                <FormField control={form.control} name="includeRenovation" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel className="text-sm">Renovation Costs</FormLabel>
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
                      <FormLabel className="text-sm">Include Selling Costs at Exit</FormLabel>
                      <FormDescription className="text-xs">Agent fee + Capital gains tax</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />

                {watchedValues.includeSellingCosts && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="sellingAgentPercent" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Selling Agent (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.5" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="capitalGainsTaxPercent" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capital Gains Tax (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="1" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                )}
              </CardContent>
            </Card>
          </form>
        </Form>
      }
      rightColumn={
        results ? (
          <div className="space-y-5">
            {/* Hero CAGR */}
            <ResultCard
              label="Compound Annual Growth Rate (CAGR)"
              value={formatPercent(results.cagr)}
              badge={cagrBadge}
              variant="primary"
              size="lg"
              sublabel={`vs. 7% stock market benchmark`}
              icon={<TrendingUp className="h-5 w-5" />}
            />

            {/* Key metrics row */}
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Gross Yield" value={formatPercent(results.grossYield)} size="sm" icon={<PiggyBank className="h-4 w-4" />} />
              <ResultCard label="Net Yield" value={formatPercent(results.netYield)} size="sm" icon={<BarChart3 className="h-4 w-4" />} />
              <ResultCard label="Cash-on-Cash (Year 1)" value={formatPercent(results.cashOnCash)} size="sm"
                badge={results.annualCashFlow < 0 ? { text: 'Negative', variant: 'danger' as const } : undefined}
                icon={<DollarSign className="h-4 w-4" />} />
              <ResultCard label="Total Net Profit" value={formatCurrency(results.netProfit)} size="sm"
                badge={results.netProfit > 0 ? { text: 'Profit', variant: 'success' as const } : { text: 'Loss', variant: 'danger' as const }}
                icon={<TrendingUp className="h-4 w-4" />} />
            </div>

            {/* Day-One Cash Required */}
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

            {/* Annual Cash Flow */}
            <Card>
              <CardContent className="pt-5 space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" /> Year-1 Annual Cash Flow
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Rental Income (after vacancy)</span><span className="font-medium text-semantic-green-foreground">+{formatCurrency(Math.round(watchedValues.monthlyRent * 12 * (1 - watchedValues.vacancyRate / 100)))}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Expenses</span><span className="font-medium text-semantic-red-foreground">−{formatCurrency(Math.round(results.annualExpenses))}</span></div>
                  {isLeveraged && results.monthlyMortgagePayment > 0 && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Mortgage Payments</span><span className="font-medium text-semantic-red-foreground">−{formatCurrency(Math.round(results.monthlyMortgagePayment * 12))}</span></div>
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
                  <TrendingUp className="h-4 w-4 text-primary" /> Exit Summary ({watchedValues.holdingPeriod} Years)
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Future Property Value</span><span className="font-medium">{formatCurrency(Math.round(results.futurePropertyValue))}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Total Appreciation</span><span className="font-medium text-semantic-green-foreground">+{formatCurrency(Math.round(results.totalAppreciation))}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Total Rent Collected</span><span className="font-medium text-semantic-green-foreground">+{formatCurrency(results.totalRentIncome)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Total Expenses</span><span className="font-medium text-semantic-red-foreground">−{formatCurrency(results.totalExpenses)}</span></div>
                  {isLeveraged && <div className="flex justify-between"><span className="text-muted-foreground">Total Mortgage Interest</span><span className="font-medium text-semantic-red-foreground">−{formatCurrency(Math.round(results.totalMortgageInterest))}</span></div>}
                  {results.totalSellingCosts > 0 && (
                    <>
                      <div className="flex justify-between"><span className="text-muted-foreground">Selling Agent Fee</span><span className="font-medium text-semantic-red-foreground">−{formatCurrency(results.sellingAgentFee)}</span></div>
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
