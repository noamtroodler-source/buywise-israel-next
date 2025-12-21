import { motion } from 'framer-motion';
import { Calculator, Wallet, Scale } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MortgageCalculator } from '@/components/tools/MortgageCalculator';
import { AffordabilityCalculator } from '@/components/tools/AffordabilityCalculator';
import { RentVsBuyCalculator } from '@/components/tools/RentVsBuyCalculator';

export default function Tools() {
  return (
    <Layout>
      <div className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Calculator className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold text-foreground">Property Tools</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Make informed decisions with our suite of real estate calculators designed for the Israeli market.
            </p>
          </div>

          {/* Calculator Tabs */}
          <Tabs defaultValue="mortgage" className="max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="mortgage" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                <span className="hidden sm:inline">Mortgage</span>
              </TabsTrigger>
              <TabsTrigger value="affordability" className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline">Affordability</span>
              </TabsTrigger>
              <TabsTrigger value="rentvsbuy" className="flex items-center gap-2">
                <Scale className="h-4 w-4" />
                <span className="hidden sm:inline">Rent vs Buy</span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="mortgage">
                <MortgageCalculator />
              </TabsContent>

              <TabsContent value="affordability">
                <AffordabilityCalculator />
              </TabsContent>

              <TabsContent value="rentvsbuy">
                <RentVsBuyCalculator />
              </TabsContent>
            </div>
          </Tabs>

          {/* Info Section */}
          <div className="max-w-4xl mx-auto">
            <div className="p-6 rounded-lg bg-muted/50 text-center">
              <h3 className="font-semibold text-foreground mb-2">Disclaimer</h3>
              <p className="text-sm text-muted-foreground">
                These calculators provide estimates for informational purposes only. 
                Actual costs may vary based on individual circumstances, market conditions, 
                and lender requirements. Consult with a financial advisor or mortgage 
                professional for personalized advice.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
