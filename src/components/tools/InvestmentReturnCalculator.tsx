import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ToolLayout } from '@/components/tools/shared/ToolLayout';
import { InsightCard } from '@/components/tools/shared/InsightCard';
import { ToolPropertySuggestions } from '@/components/tools/shared/ToolPropertySuggestions';
import { ToolFeedback } from '@/components/tools/shared/ToolFeedback';
import { ToolGuidanceHint } from '@/components/tools/shared/ToolGuidanceHint';
import { Link } from 'react-router-dom';
import { Calculator, Home, TrendingUp } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

// Define the form schema using Zod
const formSchema = z.object({
  purchasePrice: z.number({
    required_error: "Please enter the purchase price.",
    invalid_type_error: "Purchase price must be a number."
  }).min(1, { message: "Purchase price must be greater than 0." }),
  downPaymentPercent: z.number({
    required_error: "Please enter the down payment percentage.",
    invalid_type_error: "Down payment percentage must be a number."
  }).min(5, { message: "Down payment must be at least 5%." }).max(100, { message: "Down payment cannot exceed 100%." }),
  annualRent: z.number({
    required_error: "Please enter the annual rent.",
    invalid_type_error: "Annual rent must be a number."
  }).min(0, { message: "Annual rent must be greater than or equal to 0." }),
  annualAppreciation: z.number({
    required_error: "Please enter the annual appreciation rate.",
    invalid_type_error: "Annual appreciation rate must be a number."
  }).min(-100, { message: "Appreciation rate cannot be less than -100%." }).max(100, { message: "Appreciation rate cannot exceed 100%." }),
  annualExpensesPercent: z.number({
    required_error: "Please enter the annual expenses percentage.",
    invalid_type_error: "Annual expenses percentage must be a number."
  }).min(0, { message: "Expenses percentage must be greater than or equal to 0." }).max(100, { message: "Expenses percentage cannot exceed 100%." }),
  holdingPeriod: z.number({
    required_error: "Please enter the holding period.",
    invalid_type_error: "Holding period must be a number."
  }).min(1, { message: "Holding period must be at least 1 year." }).max(50, { message: "Holding period cannot exceed 50 years." }),
  taxRate: z.number({
    required_error: "Please enter the tax rate.",
    invalid_type_error: "Tax rate must be a number."
  }).min(0, { message: "Tax rate must be greater than or equal to 0%." }).max(100, { message: "Tax rate cannot exceed 100%." }),
  includePurchaseTax: z.boolean().default(true),
  includeAgentFees: z.boolean().default(true),
  includeLawyerFees: z.boolean().default(true),
  includeRenovationCosts: z.boolean().default(false),
  renovationCosts: z.number().optional(),
});

export function InvestmentReturnCalculator() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Initialize form with useForm hook
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      purchasePrice: 2000000,
      downPaymentPercent: 25,
      annualRent: 80000,
      annualAppreciation: 3,
      annualExpensesPercent: 1,
      holdingPeriod: 10,
      taxRate: 25,
      includePurchaseTax: true,
      includeAgentFees: true,
      includeLawyerFees: true,
      includeRenovationCosts: false,
      renovationCosts: 100000,
    },
    mode: "onBlur"
  });

  // State for calculated results
  const [results, setResults] = useState<{
    totalInvestment: number;
    totalRevenue: number;
    netProfit: number;
    annualReturn: number;
    totalAppreciation: number;
    purchaseTax: number;
    agentFees: number;
    lawyerFees: number;
    totalExpenses: number;
  } | null>(null);

  // useRef for the results section to scroll into view
  const resultsSectionRef = useRef<HTMLDivElement>(null);

  // Function to calculate investment return
  const calculateInvestmentReturn = (data: z.infer<typeof formSchema>) => {
    try {
      // Extract form values
      const {
        purchasePrice,
        downPaymentPercent,
        annualRent,
        annualAppreciation,
        annualExpensesPercent,
        holdingPeriod,
        taxRate,
        includePurchaseTax,
        includeAgentFees,
        includeLawyerFees,
        includeRenovationCosts,
        renovationCosts,
      } = data;

      // Helper function to calculate percentage
      const calculatePercentage = (amount: number, percentage: number): number => {
        return (amount * percentage) / 100;
      };

      // Initial Investment
      const downPayment = calculatePercentage(purchasePrice, downPaymentPercent);

      // Purchase Costs
      const purchaseTax = includePurchaseTax ? calculatePurchaseTax(purchasePrice) : 0;
      const agentFees = includeAgentFees ? calculatePercentage(purchasePrice, 2) + calculatePercentage(purchasePrice, 0.17) : 0; // Agent fees + VAT
      const lawyerFees = includeLawyerFees ? 10000 + calculatePercentage(10000, 0.17) : 0; // Fixed lawyer fees + VAT
      const renovationCostsValue = includeRenovationCosts && renovationCosts ? renovationCosts : 0;

      const totalInvestment = downPayment + purchaseTax + agentFees + lawyerFees + renovationCostsValue;

      // Revenue
      const totalRent = annualRent * holdingPeriod;
      const totalAppreciation = purchasePrice * (Math.pow(1 + (annualAppreciation / 100), holdingPeriod) - 1);
      const totalRevenue = totalRent + totalAppreciation;

      // Expenses
      const annualExpenses = purchasePrice * (annualExpensesPercent / 100);
      const totalExpenses = annualExpenses * holdingPeriod;

      // Profit
      const grossProfit = totalRevenue - totalExpenses;
      const taxPayable = calculatePercentage(grossProfit, taxRate);
      const netProfit = grossProfit - taxPayable;

      // Return
      const annualReturn = netProfit / totalInvestment;

      // Update results state
      setResults({
        totalInvestment,
        totalRevenue,
        netProfit,
        annualReturn,
        totalAppreciation,
        purchaseTax,
        agentFees,
        lawyerFees,
        totalExpenses,
      });

      // Scroll to results section
      setTimeout(() => {
        resultsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (error) {
      console.error("Calculation error:", error);
      toast({
        title: "Error",
        description: "An error occurred during calculation. Please check your inputs.",
        variant: "destructive",
      });
    }
  };

  // Purchase Tax Calculation (simplified)
  const calculatePurchaseTax = (purchasePrice: number): number => {
    // Example calculation - replace with actual tax brackets
    if (purchasePrice <= 1000000) {
      return purchasePrice * 0.035;
    } else {
      return 1000000 * 0.035 + (purchasePrice - 1000000) * 0.05;
    }
  };

  // Submit handler
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    calculateInvestmentReturn(data);
  };

  const insightCardContent = [
    "Understanding the potential return on investment is crucial for making informed decisions.",
    "This calculator helps you estimate the profitability of a real estate investment, considering various factors such as purchase price, rental income, and appreciation.",
    "By adjusting the inputs, you can simulate different scenarios and assess the impact of each factor on your investment's overall performance.",
  ];

  const bottomSection = (
    <>
      <InsightCard insights={insightCardContent} />

      <ToolPropertySuggestions
        title="Properties That Fit This Scenario"
        subtitle="Explore listings that match your investment criteria."
        minPrice={form.getValues("purchasePrice") * 0.8}
        maxPrice={form.getValues("purchasePrice") * 1.2}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/tools?tool=mortgage" className="group p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-1"><Calculator className="h-4 w-4 text-primary" /><p className="font-semibold group-hover:text-primary transition-colors">Mortgage Calculator</p></div>
          <p className="text-sm text-muted-foreground">Estimate your monthly mortgage payments.</p>
        </Link>
        <Link to="/tools?tool=affordability" className="group p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-1"><Home className="h-4 w-4 text-primary" /><p className="font-semibold group-hover:text-primary transition-colors">Affordability Calculator</p></div>
          <p className="text-sm text-muted-foreground">Find out what property price you can afford.</p>
        </Link>
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="how-it-works">
          <AccordionTrigger>How the Investment Return Calculator Works</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This calculator estimates the potential return on investment (ROI) for a property,
              considering factors like purchase price, rental income, appreciation, and expenses.
              It provides insights into the profitability of a real estate investment over a specified
              holding period.
            </p>
            <ul className="list-disc pl-5 mt-2 text-sm text-muted-foreground leading-relaxed">
              <li><b>Initial Investment:</b> Calculates the total upfront costs, including down payment, purchase tax, agent fees, and lawyer fees.</li>
              <li><b>Revenue:</b> Estimates the total income generated from rental income and property appreciation over the holding period.</li>
              <li><b>Expenses:</b> Calculates the total expenses incurred during the holding period, such as property taxes, insurance, and maintenance.</li>
              <li><b>Profit:</b> Determines the net profit by subtracting expenses and taxes from the total revenue.</li>
              <li><b>Return:</b> Calculates the annual return on investment (ROI) based on the net profit and initial investment.</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="disclaimer">
          <AccordionTrigger>Disclaimer</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This calculator provides estimates for informational purposes only and should not be
              considered financial advice. Actual investment returns may vary based on market
              conditions, property-specific factors, and individual circumstances. Consult with a
              qualified financial advisor before making any investment decisions.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <ToolGuidanceHint variant="expert-tip" message="Adjust the holding period to see long-term potential." />

      <ToolFeedback toolName="Investment Return Calculator" variant="inline" />
    </>
  );

  return (
    <ToolLayout
      title="Investment Return Calculator"
      subtitle="Estimate the potential return on investment for a property."
      icon={
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up"><path d="M3 6h5l6 6-3 6h-5m9-12v5l4 4"/></svg>
      }
      intro={
        <p>
          Use this calculator to estimate the potential return on investment (ROI) for a property.
          Enter the property details, rental income, appreciation rate, and expenses to calculate
          the estimated annual return.
        </p>
      }
      leftColumn={
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardContent className="grid gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="purchasePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purchase Price</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="2000000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="downPaymentPercent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Down Payment (%)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="25" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="annualRent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Annual Rent</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="80000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="annualAppreciation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Annual Appreciation (%)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="3" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="annualExpensesPercent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Annual Expenses (%)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="holdingPeriod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Holding Period (Years)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="taxRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Rate (%)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="25" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="grid gap-6">
                <div>
                  <h3 className="text-lg font-semibold">Additional Costs</h3>
                  <p className="text-sm text-muted-foreground">Include or exclude additional costs in the calculation.</p>
                </div>

                <FormField
                  control={form.control}
                  name="includePurchaseTax"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Include Purchase Tax</FormLabel>
                        <FormDescription>Omit if you are exempt from purchase tax.</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="includeAgentFees"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Include Agent Fees</FormLabel>
                        <FormDescription>Include estate agent fees in the calculation.</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="includeLawyerFees"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Include Lawyer Fees</FormLabel>
                        <FormDescription>Include lawyer fees in the calculation.</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="includeRenovationCosts"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Include Renovation Costs</FormLabel>
                        <FormDescription>Include renovation costs in the calculation.</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.getValues("includeRenovationCosts") && (
                  <FormField
                    control={form.control}
                    name="renovationCosts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Renovation Costs</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="100000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            <Button type="submit">Calculate Investment Return</Button>
          </form>
        </Form>
      }
      rightColumn={
        results ? (
          <div ref={resultsSectionRef} className="space-y-6">
            <Card>
              <CardContent className="space-y-4">
                <h2 className="text-lg font-semibold">Investment Summary</h2>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Total Investment</Label>
                    <p className="font-semibold">₪{results.totalInvestment.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label>Total Revenue</Label>
                    <p className="font-semibold">₪{results.totalRevenue.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label>Net Profit</Label>
                    <p className="font-semibold">₪{results.netProfit.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label>Annual Return</Label>
                    <p className="font-semibold">{(results.annualReturn * 100).toFixed(2)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4">
                <h2 className="text-lg font-semibold">Detailed Breakdown</h2>
                <Separator />
                <div className="space-y-2">
                  <h3 className="text-md font-semibold">Purchase Costs</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Purchase Tax</Label>
                      <p className="font-semibold">₪{results.purchaseTax.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label>Agent Fees</Label>
                      <p className="font-semibold">₪{results.agentFees.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label>Lawyer Fees</Label>
                      <p className="font-semibold">₪{results.lawyerFees.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-md font-semibold">Revenue Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Total Appreciation</Label>
                      <p className="font-semibold">₪{results.totalAppreciation.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-md font-semibold">Expense Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Total Expenses</Label>
                      <p className="font-semibold">₪{results.totalExpenses.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="text-center p-10">
              <p className="text-muted-foreground">Enter property details to calculate investment return.</p>
            </CardContent>
          </Card>
        )
      }
      bottomSection={bottomSection}
      disclaimer="This calculator provides estimates for informational purposes only. Consult with a financial advisor for personalized advice."
    />
  );
}
