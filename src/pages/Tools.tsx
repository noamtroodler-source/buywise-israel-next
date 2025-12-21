import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calculator, Wallet, Scale, TrendingUp, Receipt, Compass, 
  MapPinned, Clock, Hammer, ClipboardList, ArrowRight, ArrowLeft 
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
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

interface Tool {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
}

const tools: Tool[] = [
  { id: 'workshop', label: 'Find Your Place Workshop', description: 'Discover what truly matters for your Israel home before you start searching', icon: Compass, category: 'Discovery Tools' },
  { id: 'neighborhood', label: 'Neighborhood Match', description: 'Find the perfect Israeli neighborhood based on your lifestyle preferences', icon: MapPinned, category: 'Discovery Tools' },
  { id: 'affordability', label: 'Affordability Calculator', description: 'Calculate your maximum affordable home price based on income, savings, and Israeli mortgage rules', icon: Wallet, category: 'Financial Calculators' },
  { id: 'investment', label: 'Investment Return Calculator', description: 'Calculate potential returns, cash flow, and ROI on investment properties in Israel', icon: TrendingUp, category: 'Financial Calculators' },
  { id: 'mortgage', label: 'Mortgage Calculator', description: 'Calculate monthly payments, total interest, and view detailed amortization schedules', icon: Calculator, category: 'Financial Calculators' },
  { id: 'totalcost', label: 'Total Cost Calculator', description: 'Calculate all one-time and monthly costs for buying property in Israel including taxes, fees, and mortgage', icon: Receipt, category: 'Financial Calculators' },
  { id: 'rentvsbuy', label: 'Rent vs Buy Calculator', description: 'Compare the true cost of renting versus buying property in Israel over time', icon: Scale, category: 'Analysis Tools' },
  { id: 'timemachine', label: 'Real Estate Time Machine', description: 'Explore how Israeli real estate has historically performed by area and time', icon: Clock, category: 'Analysis Tools' },
  { id: 'renovation', label: 'Renovation Cost Estimator', description: 'Estimate renovation costs for Israeli properties including materials, labor, and permits', icon: Hammer, category: 'Analysis Tools' },
  { id: 'documents', label: 'Document Checklist & Tracker', description: 'Track all required documents for your Israel property purchase with status updates', icon: ClipboardList, category: 'Planning Tools' },
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

function ToolCard({ tool, onClick }: { tool: Tool; onClick: () => void }) {
  const Icon = tool.icon;
  
  return (
    <div 
      className="group bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300 cursor-pointer flex flex-col h-full"
      onClick={onClick}
    >
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {tool.label}
      </h3>
      
      <p className="text-muted-foreground text-sm leading-relaxed flex-1 mb-4">
        {tool.description}
      </p>
      
      <button className="text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all self-end mt-auto">
        Open tool
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function Tools() {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const ActiveComponent = activeTool ? toolComponents[activeTool] : null;
  const categories = [...new Set(tools.map(t => t.category))];

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {activeTool ? (
          <div className="container py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              <Button variant="ghost" onClick={() => setActiveTool(null)} className="gap-2 -ml-2">
                <ArrowLeft className="h-4 w-4" />
                Back to all tools
              </Button>
              {ActiveComponent && <ActiveComponent />}
            </motion.div>
          </div>
        ) : (
          <>
            {/* Hero Header */}
            <div className="py-16 md:py-20">
              <div className="container">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center max-w-3xl mx-auto"
                >
                  <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                    Property Tools & Calculators
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Powerful tools to help you make informed decisions about your property purchase in Israel
                  </p>
                </motion.div>
              </div>
            </div>

            {/* Tools Grid */}
            <div className="container pb-20">
              <div className="space-y-16">
                {categories.map((category, catIndex) => {
                  const categoryTools = tools.filter(t => t.category === category);
                  
                  return (
                    <motion.section 
                      key={category}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: catIndex * 0.1 }}
                    >
                      <h2 className="text-2xl font-semibold text-foreground mb-6 pb-2 border-b border-border">
                        {category}
                      </h2>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {categoryTools.map((tool, index) => (
                          <motion.div
                            key={tool.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: catIndex * 0.1 + index * 0.05 }}
                          >
                            <ToolCard 
                              tool={tool} 
                              onClick={() => setActiveTool(tool.id)} 
                            />
                          </motion.div>
                        ))}
                      </div>
                    </motion.section>
                  );
                })}
              </div>

              {/* Disclaimer */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-16 max-w-3xl mx-auto"
              >
                <div className="p-6 rounded-2xl bg-muted/50 text-center">
                  <h3 className="font-semibold text-foreground mb-2">Disclaimer</h3>
                  <p className="text-sm text-muted-foreground">
                    These tools provide estimates for informational purposes only. 
                    Actual costs may vary based on individual circumstances, market conditions, 
                    and lender requirements. Consult with a financial advisor or mortgage 
                    professional for personalized advice.
                  </p>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
