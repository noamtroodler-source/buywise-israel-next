import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Wallet, Scale, TrendingUp, Receipt, Compass, MapPinned, Clock, Hammer, ClipboardList, ArrowLeft } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MortgageCalculator } from '@/components/tools/MortgageCalculator';
import { AffordabilityCalculator } from '@/components/tools/AffordabilityCalculator';
import { RentVsBuyCalculator } from '@/components/tools/RentVsBuyCalculator';
import { InvestmentReturnCalculator } from '@/components/tools/InvestmentReturnCalculator';
import { TotalCostCalculator } from '@/components/tools/TotalCostCalculator';
import { FindYourPlaceWorkshop } from '@/components/tools/FindYourPlaceWorkshop';
import { NeighborhoodMatch } from '@/components/tools/NeighborhoodMatch';
import { RealEstateTimeMachine } from '@/components/tools/RealEstateTimeMachine';
import { RenovationCostEstimator } from '@/components/tools/RenovationCostEstimator';
import { DocumentChecklist } from '@/components/tools/DocumentChecklist';

const tools = [
  { id: 'workshop', label: 'Find Your Place Workshop', description: 'Answer questions to discover your ideal property and area', icon: Compass, category: 'Discovery' },
  { id: 'neighborhood', label: 'Neighborhood Match', description: 'Rate your priorities and find matching neighborhoods', icon: MapPinned, category: 'Discovery' },
  { id: 'affordability', label: 'Affordability Calculator', description: 'Calculate how much property you can afford', icon: Wallet, category: 'Financial' },
  { id: 'investment', label: 'Investment Return Calculator', description: 'Analyze ROI, cap rate, and cash-on-cash returns', icon: TrendingUp, category: 'Financial' },
  { id: 'mortgage', label: 'Mortgage Calculator', description: 'Calculate monthly payments and total costs', icon: Calculator, category: 'Financial' },
  { id: 'totalcost', label: 'Total Cost Calculator', description: 'See all costs: taxes, fees, moving, furniture', icon: Receipt, category: 'Financial' },
  { id: 'rentvsbuy', label: 'Rent vs Buy Calculator', description: 'Compare long-term costs of renting vs buying', icon: Scale, category: 'Financial' },
  { id: 'timemachine', label: 'Real Estate Time Machine', description: 'Explore historical price trends by city', icon: Clock, category: 'Analysis' },
  { id: 'renovation', label: 'Renovation Cost Estimator', description: 'Estimate costs for your renovation project', icon: Hammer, category: 'Analysis' },
  { id: 'documents', label: 'Document Checklist & Tracker', description: 'Track all required documents for purchase', icon: ClipboardList, category: 'Planning' },
];

const toolComponents: Record<string, React.ComponentType> = {
  mortgage: MortgageCalculator,
  affordability: AffordabilityCalculator,
  rentvsbuy: RentVsBuyCalculator,
  investment: InvestmentReturnCalculator,
  totalcost: TotalCostCalculator,
  workshop: FindYourPlaceWorkshop,
  neighborhood: NeighborhoodMatch,
  timemachine: RealEstateTimeMachine,
  renovation: RenovationCostEstimator,
  documents: DocumentChecklist,
};

export default function Tools() {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const ActiveComponent = activeTool ? toolComponents[activeTool] : null;
  const categories = [...new Set(tools.map(t => t.category))];

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

          {activeTool ? (
            <div className="max-w-4xl mx-auto space-y-4">
              <Button variant="ghost" onClick={() => setActiveTool(null)} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to all tools
              </Button>
              {ActiveComponent && <ActiveComponent />}
            </div>
          ) : (
            <div className="space-y-8">
              {categories.map((category) => (
                <div key={category} className="space-y-4">
                  <h2 className="text-xl font-semibold text-foreground">{category} Tools</h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tools.filter(t => t.category === category).map((tool) => {
                      const Icon = tool.icon;
                      return (
                        <Card 
                          key={tool.id}
                          className="cursor-pointer hover:border-primary hover:shadow-lg transition-all"
                          onClick={() => setActiveTool(tool.id)}
                        >
                          <CardHeader>
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <Icon className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">{tool.label}</CardTitle>
                                <CardDescription className="mt-1">{tool.description}</CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Disclaimer */}
          <div className="max-w-4xl mx-auto">
            <div className="p-6 rounded-lg bg-muted/50 text-center">
              <h3 className="font-semibold text-foreground mb-2">Disclaimer</h3>
              <p className="text-sm text-muted-foreground">
                These tools provide estimates for informational purposes only. 
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
